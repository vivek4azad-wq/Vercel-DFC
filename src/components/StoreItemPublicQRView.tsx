/**
 * DFCCIL Store Item Live QR Verification View
 * Opened instantly when a mobile phone scans a Store Item QR Code
 * Displays:
 * - Real-time Available Stock
 * - Item Master Details & Category
 * - Complete Inward / Outward Transaction Records (क्या आया, क्या गया)
 * - Departmental Tally Ledger Balance
 */

import React, { useState, useEffect } from 'react';
import { db } from '../services/database.ts';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Share2,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { IMSD_TALLY_GZIP_BASE64 } from '../data/imsdTallyLedgerCompressed.ts';
import type { StoreItemRecord, StoreTransactionRecord } from '../types/index.ts';

const decodeTallyData = async (): Promise<{ items: any[]; transactions: any[] }> => {
  const compressed = Uint8Array.from(atob(IMSD_TALLY_GZIP_BASE64), char => char.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
};

interface StoreItemPublicQRViewProps {
  itemId: string;
  onBackToApp?: () => void;
}

export const StoreItemPublicQRView: React.FC<StoreItemPublicQRViewProps> = ({
  itemId,
  onBackToApp
}) => {
  const [item, setItem] = useState<StoreItemRecord | null>(null);
  const [transactions, setTransactions] = useState<StoreTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadItemData = async () => {
      try {
        setIsLoading(true);
        const [storeItems, storeInv, allTxns] = await Promise.all([
          db.getCollection<StoreItemRecord>('store_items'),
          db.getCollection<StoreItemRecord>('store_inventory'),
          db.getCollection<StoreTransactionRecord>('store_transactions')
        ]);

        let finalItems = storeItems || [];
        let finalTxns = allTxns || [];

        // If items are missing or fresh session, decode authentic 196 tally items
        if (!finalItems || finalItems.length < 150) {
          try {
            const tallyData = await decodeTallyData();
            finalItems = tallyData.items.map((tItem: any, idx: number): StoreItemRecord => {
              const code = tItem.sapMaterial || `IMSD-${tItem.ledgerPage}`;
              const cat = tItem.source === 'C&P Material' ? 'C&P'
                : tItem.source === 'T&P Material' ? 'T&P'
                : tItem.source === 'P.Way Material' ? 'P.way material'
                : tItem.source;

              return {
                id: `STR-IMSD-${idx + 1}`,
                itemCode: code,
                priceListCode: code,
                tallyCodeNo: tItem.ledgerPage,
                accountsFileNo: tItem.ledgerPage,
                name: tItem.itemName,
                category: cat,
                categoryLabel: tItem.source,
                specification: tItem.sapDescription ? `${tItem.sapDescription} (Page: ${tItem.ledgerPage})` : `Ledger Page: ${tItem.ledgerPage} • ${tItem.source}`,
                unit: tItem.sapUom || 'Nos',
                currentStock: tItem.closingBalance ?? 0,
                minBufferThreshold: 5,
                location: 'IMSD SMUN Central Store',
                inwardTotal: tItem.totalReceipt || 0,
                outwardTotal: tItem.totalIssue || 0,
                unitRate: 100,
                lastReceivedDate: '2024-09-18',
                lastIssuedDate: '2024-09-20',
                supplier: 'DFCCIL IMSD Depot',
                remarks: `${tItem.source} (Page ${tItem.ledgerPage}) • SAP: ${tItem.sapMaterial || 'Pending'}`
              };
            });

            if (!finalTxns || finalTxns.length === 0) {
              finalTxns = tallyData.transactions.map((tTxn: any, idx: number): StoreTransactionRecord => {
                const code = tTxn.sapMaterial || `IMSD-${tTxn.ledgerPage}`;
                const isOutward = (tTxn.issue || 0) > 0 || (tTxn.transfer || 0) > 0;
                const qty = (tTxn.receipt || 0) > 0 ? tTxn.receipt! : ((tTxn.issue || 0) > 0 ? tTxn.issue! : (tTxn.transfer || 0));

                return {
                  id: `STXN-${idx + 1}`,
                  date: tTxn.date || '2024-01-01',
                  type: isOutward ? 'OUTWARD' : 'INWARD',
                  itemId: `STR-IMSD-${idx + 1}`,
                  itemCode: code,
                  itemName: tTxn.itemName,
                  quantity: qty,
                  unit: tTxn.sapUom || 'Nos',
                  referenceNo: tTxn.voucher || `VCH-${idx + 1}`,
                  issuedToOrReceivedFrom: tTxn.party || 'IMSD SMUN Section',
                  purposeOrSection: tTxn.purpose || 'Official Railway Maintenance',
                  authorizedBy: 'Store Keeper / APM',
                  receiptQty: tTxn.receipt || undefined,
                  transferQty: tTxn.transfer || undefined,
                  issueQty: tTxn.issue || undefined,
                  balanceQty: tTxn.balance ?? 0,
                  tallyPageNo: tTxn.ledgerPage,
                  createdAt: tTxn.date ? `${tTxn.date}T10:00:00Z` : new Date().toISOString()
                };
              });
            }
          } catch (e) {
            console.error('Error decoding tally data in StoreItemPublicQRView:', e);
          }
        }

        const allInventory = [...finalItems, ...(storeInv || [])];
        const cleanId = decodeURIComponent(String(itemId || '')).trim().toLowerCase();

        let target = allInventory.find(
          i => (i.id && String(i.id).toLowerCase() === cleanId) ||
               (i.itemCode && String(i.itemCode).toLowerCase() === cleanId) ||
               (i.priceListCode != null && String(i.priceListCode).toLowerCase() === cleanId) ||
               (i.tallyCodeNo != null && String(i.tallyCodeNo).toLowerCase() === cleanId) ||
               (i.name && String(i.name).toLowerCase() === cleanId) ||
               (i.name && String(i.name).toLowerCase().includes(cleanId))
        );

        if (target) {
          const relatedTxns = (finalTxns || [])
            .filter(t =>
              t.itemId === target!.id ||
              (t.itemCode && String(t.itemCode).toLowerCase() === String(target!.itemCode).toLowerCase()) ||
              (t.tallyPageNo && String(t.tallyPageNo) === String(target!.tallyCodeNo)) ||
              (t.itemName && String(t.itemName).toLowerCase() === String(target!.name).toLowerCase())
            )
            .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

          let dynamicInward = 0;
          let dynamicOutward = 0;
          relatedTxns.forEach(t => {
            const qty = Number(t.quantity) || 0;
            if (t.type === 'INWARD' || t.receiptQty) dynamicInward += (Number(t.receiptQty) || qty);
            else if (t.type === 'OUTWARD' || t.issueQty || t.transferQty) dynamicOutward += (Number(t.issueQty) || Number(t.transferQty) || qty);
          });

          const liveItem: StoreItemRecord = {
            ...target,
            inwardTotal: target.inwardTotal || dynamicInward,
            outwardTotal: target.outwardTotal || dynamicOutward,
            currentStock: target.currentStock
          };

          setItem(liveItem);
          setTransactions(relatedTxns);
        }
      } catch (err) {
        console.error('Failed to load item verification data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (itemId) {
      loadItemData();
    }

    const unsub = db.subscribe(() => {
      if (itemId) loadItemData();
    });
    return () => unsub();
  }, [itemId]);

  const isLowStock = item ? item.currentStock <= item.minBufferThreshold : false;
  const isOutOfStock = item ? item.currentStock <= 0 : false;

  const handleShare = async () => {
    if (navigator.share && item) {
      try {
        await navigator.share({
          title: `DFCCIL Store: ${item.name} (${item.currentStock} ${item.unit})`,
          text: `Live Store Stock for ${item.name} at IMSD SMUN: ${item.currentStock} ${item.unit} available.`,
          url: window.location.href
        });
      } catch (err) {
        console.warn('Share cancelled', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm text-cyan-200">Verifying DFCCIL Store Item &amp; Ledger...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 bg-red-900/50 text-red-300 rounded-2xl border border-red-700">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
          <h2 className="text-lg font-black">Material SKU Not Found</h2>
          <p className="text-xs text-slate-300 mt-1">
            Item ID <span className="font-mono font-bold text-cyan-300">{itemId}</span> does not exist in IMSD SMUN Store Ledger.
          </p>
        </div>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to ERP Dashboard</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white pb-12 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="bg-[#0f2b5c] text-white px-4 py-3.5 shadow-lg sticky top-0 z-30 flex items-center justify-between border-b border-blue-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
            dfc
          </div>
          <div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-tight block">
              DFCCIL Store Live Ledger
            </span>
            <span className="text-[10px] text-cyan-300 font-medium">
              IMSD-SMUN • P-Way Depot (Ambala Unit)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Share Link"
          >
            <Share2 className="w-4 h-4 text-cyan-300" />
          </button>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Full ERP</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Main Item Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-blue-600/30 space-y-4">
          
          {/* Header Info & Category */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                  {item.priceListCode ? `PL: ${item.priceListCode}` : item.itemCode}
                </span>
                {item.tallyCodeNo && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black font-mono bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    मिलान पत्र: {item.tallyCodeNo}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {item.categoryLabel || item.category}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
                {item.name}
              </h1>
              {item.specification && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {item.specification}
                </p>
              )}
            </div>

            {/* Live Stock Badge */}
            <div className={`px-3 py-1.5 rounded-2xl border text-center shrink-0 ${
              isOutOfStock
                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 text-red-700 dark:text-red-400'
                : isLowStock
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-400'
            }`}>
              <span className="text-[10px] font-black block uppercase tracking-wider">STATUS</span>
              <span className="text-xs font-black flex items-center gap-1">
                {isOutOfStock ? '🔴 OUT OF STOCK' : isLowStock ? '⚠️ LOW BUFFER' : '✅ IN STOCK'}
              </span>
            </div>
          </div>

          {/* KPI Stock Highlight Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f2b5c] to-blue-900 text-white shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-200 block">
                CURRENT AVAILABLE STOCK
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {item.currentStock}
                </span>
                <span className="text-xs font-bold text-cyan-300 uppercase font-mono">
                  {item.unit}
                </span>
              </div>
              <span className="text-[10px] text-blue-200 block mt-1">
                Min Buffer: {item.minBufferThreshold} {item.unit}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                STORAGE LOCATION / BIN
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                {item.location || 'IMSD SMUN Central Depot'}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Rack / Shed Bin
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                TOTAL LOGGED TXNS
              </span>
              <div className="text-lg font-black text-purple-700 dark:text-purple-400 mt-1 font-mono">
                {transactions.length} Vouchers
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Inward + Outward
              </span>
            </div>
          </div>
        </div>

        {/* Complete Transaction & Ledger History (क्या आया, क्या गया) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Complete Movement Records (क्या आया, क्या गया)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {transactions.length} Entries
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No previous vouchers recorded yet for this SKU.
            </div>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((txn, idx) => {
                const isInward = txn.type === 'INWARD';
                return (
                  <div
                    key={txn.id || `txn-${idx}`}
                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isInward
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isInward
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                          }`}
                        >
                          {isInward ? '📥 INWARD (प्राप्ति)' : '📤 OUTWARD (निर्गम)'}
                        </span>

                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-cyan-300">
                          {txn.referenceNo || `VCH-${txn.id.slice(-6)}`}
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {txn.date || new Date(txn.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isInward ? 'From: ' : 'Issued To: '}
                        <span className="text-slate-900 dark:text-white">
                          {txn.issuedToOrReceivedFrom || 'Central Store Depot'}
                        </span>
                      </div>

                      {txn.purposeOrSection && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Purpose / Section: {txn.purposeOrSection}
                        </div>
                      )}
                    </div>

                    {/* Quantity & Balance */}
                    <div className="text-right shrink-0">
                      <div className={`text-base sm:text-lg font-black font-mono ${
                        isInward ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {isInward ? `+${txn.receiptQty || txn.quantity}` : `-${txn.issueQty || txn.quantity}`} {txn.unit || item.unit}
                      </div>

                      {txn.balanceQty != null && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold block">
                          Bal: {txn.balanceQty} {txn.unit || item.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};