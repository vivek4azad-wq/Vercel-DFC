import React, { useState, useEffect } from 'react';
import { supabaseService, type SupabaseConnectionStatus, type SupabaseSyncEvent } from '../services/supabase.ts';
import { db } from '../services/database.ts';
import {
  Database,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  Server,
  Zap,
  Clock,
  Layers,
  X,
  ExternalLink
} from 'lucide-react';

export const SupabaseSyncBanner: React.FC = () => {
  const [status, setStatus] = useState<SupabaseConnectionStatus>('CONNECTING');
  const [statusMsg, setStatusMsg] = useState<string>('Connecting to Supabase...');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [recentEvents, setRecentEvents] = useState<SupabaseSyncEvent[]>([]);

  useEffect(() => {
    // Subscribe to connection status
    const unsubscribeStatus = supabaseService.onStatusChange((newStatus, msg) => {
      setStatus(newStatus);
      if (msg) setStatusMsg(msg);
      setTableCounts(supabaseService.getTableCounts());
    });

    // Subscribe to live CDC events
    const unsubscribeData = supabaseService.onDataChange((event) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 19)]);
      setLastSynced(new Date().toLocaleTimeString());
      setTableCounts(supabaseService.getTableCounts());
    });

    // Initial table count refresh
    supabaseService.refreshTableStatistics().then(counts => {
      setTableCounts(counts);
    }).catch(console.warn);

    return () => {
      unsubscribeStatus();
      unsubscribeData();
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await db.pullAllFromSupabase();
      const counts = await supabaseService.refreshTableStatistics();
      setTableCounts(counts);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalIndexed = Object.values(tableCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Real-time Status Pill Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer shadow-sm hover:scale-105"
        style={{
          backgroundColor:
            status === 'CONNECTED'
              ? 'rgba(16, 185, 129, 0.12)'
              : status === 'CONNECTING'
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
          borderColor:
            status === 'CONNECTED'
              ? 'rgba(16, 185, 129, 0.35)'
              : status === 'CONNECTING'
              ? 'rgba(245, 158, 11, 0.35)'
              : 'rgba(239, 68, 68, 0.35)',
          color:
            status === 'CONNECTED'
              ? '#10b981'
              : status === 'CONNECTING'
              ? '#f59e0b'
              : '#ef4444'
        }}
        title="Click to view Supabase Real-Time sync status"
      >
        <span className="relative flex h-2 w-2">
          {status === 'CONNECTED' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === 'CONNECTED'
                ? 'bg-emerald-500'
                : status === 'CONNECTING'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-red-500'
            }`}
          ></span>
        </span>
        <span className="hidden sm:inline font-mono tracking-tight">
          {status === 'CONNECTED' ? 'Supabase Live' : status === 'CONNECTING' ? 'Connecting...' : 'Offline'}
        </span>
        {totalIndexed > 0 && (
          <span className="hidden md:inline-block px-1.5 py-0.2 bg-emerald-950/40 text-emerald-300 rounded text-[10px] font-mono border border-emerald-500/20">
            {totalIndexed.toLocaleString()}
          </span>
        )}
      </button>

      {/* Supabase Realtime Diagnostics Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Supabase Real-Time Sync Center
                    <span className="px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Postgres CDC
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live bidirectional synchronization with Supabase PostgreSQL cloud database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Connection Status Card */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      status === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : status === 'CONNECTING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        status === 'CONNECTED'
                          ? 'bg-emerald-400 animate-pulse'
                          : status === 'CONNECTING'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      {status === 'CONNECTED' ? 'Live Connected' : status === 'CONNECTING' ? 'Connecting to Cloud...' : 'Disconnected / Offline'}
                      {lastSynced && (
                        <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> Synced: {lastSynced}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate max-w-sm mt-0.5">
                      {statusMsg}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Table Index Counts */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Supabase PostgreSQL Tables
                  </span>
                  <span className="text-emerald-400 font-mono">
                    Total: {totalIndexed.toLocaleString()} records
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(tableCounts).length > 0 ? (
                    Object.entries(tableCounts).map(([tbl, count]) => (
                      <div
                        key={tbl}
                        className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-xs font-mono text-slate-300 truncate" title={tbl}>
                          {tbl.replace('dfc_', '')}
                        </span>
                        <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-4 text-center text-xs text-slate-500">
                      Table statistics will populate once connected.
                    </div>
                  )}
                </div>
              </div>

              {/* Live Real-time Stream of Changes */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  Live Real-Time Activity Feed
                </h4>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 max-h-48 overflow-y-auto space-y-2">
                  {recentEvents.length > 0 ? (
                    recentEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-slate-900/80 border border-slate-800/80"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              evt.eventType === 'INSERT'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : evt.eventType === 'UPDATE'
                                ? 'bg-sky-950 text-sky-400 border border-sky-500/30'
                                : 'bg-red-950 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {evt.eventType}
                          </span>
                          <span className="font-mono text-slate-300 font-semibold">{evt.table}</span>
                          <span className="text-slate-400 truncate">
                            {evt.record?.name || evt.record?.code || evt.record?.id || 'Record'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 ml-2">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                      <Zap className="w-4 h-4 text-slate-600 mb-1" />
                      Listening for real-time Postgres changes...
                      <span className="text-[10px] text-slate-600">
                        Updates made via Supabase, API, or forms will appear here instantly.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                elnvsjeahxjqqtrfytgs.supabase.co
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
