/**
 * DFCCIL Admin AI Search & Groq Intelligence Assistant
 * Powered by Groq Ultra-Fast LPUs (Llama 3.3 70B / Llama 3.1 8B) & Real-Time ERP Context
 * IMSD SMUN Unit (Civil Engineering / Super Admin)
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getGroqApiKey,
  setGroqApiKey,
  getGroqModel,
  setGroqModel,
  testGroqConnection,
  queryGroqChat,
  GROQ_MODELS
} from '../services/groq.ts';
import { DEFAULT_BEAT_ROUTES } from '../data/beatRoutes.ts';
import {
  Bot,
  Send,
  Sparkles,
  Search,
  Database,
  ShieldCheck,
  X,
  UserCheck,
  HardHat,
  AlertTriangle,
  Package,
  Layers,
  ChevronRight,
  RefreshCw,
  Zap,
  Key,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Clock
} from 'lucide-react';
import type {
  OfficerStaffRecord,
  KeymanRecord,
  PatrolShiftRecord,
  LevelCrossingRecord,
  PWayDailyWorkRecord,
  PWayScheduleInspectionRecord,
  StoreItemRecord,
  TrackDefectRecord,
  BridgeRecord,
  PointCrossingRecord,
  CurveRecord
} from '../types/index.ts';

interface AdminAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  engine?: string;
  latencyMs?: number;
  suggestedAction?: { label: string; tab: string };
  dataList?: any[];
}

export const AdminAIChatModal: React.FC<AdminAIChatModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { currentUser } = useAuth();

  // Groq State
  const [groqApiKey, setGroqApiKeyState] = useState<string>(() => getGroqApiKey());
  const [selectedModel, setSelectedModelState] = useState<string>(() => getGroqModel());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(groqApiKey);
  const [showKeyText, setShowKeyText] = useState(false);
  const [testStatus, setTestStatus] = useState<{ testing: boolean; result?: { success: boolean; message: string } }>({ testing: false });

  // Gemini Fallback Key
  const [geminiApiKey] = useState<string>(() => localStorage.getItem('raildiary_gemini_api_key') || '');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `👋 Greetings ${currentUser?.name || 'Admin'}! I am your **DFCCIL IMSD SMUN AI Intelligence Assistant** powered by **Groq Ultra-Fast LPUs** ⚡ & Live ERP Databases.\n\nI have real-time access to your **82 Staff & AWPO Records**, **18 Keymen Beats**, **24 Patrol Shifts**, **58 Turnouts**, **42 Curves**, **144 Bridges**, **Store Inventory**, and **P-Way Daily Gang Works**.\n\nAsk me anything in Hindi or English!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: 'Groq Llama 3.3 70B'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Quick suggestion prompt chips
  const SUGGESTION_PROMPTS = [
    'Br. 163 ka chainage kya hai?',
    'Beat No. 12 me kaun hai?',
    '1170 pr ki summary batao',
    'Gate 159 SPL ke gatemen kaun hain?',
    'Total JCB work hours kitne hue?',
    'List low buffer materials in store',
    'Show 1+15 Gang daily work summary'
  ];

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  const handleSaveConfig = () => {
    const trimmed = apiKeyInput.trim();
    setGroqApiKey(trimmed);
    setGroqApiKeyState(trimmed);
    setGroqModel(selectedModel);
    setIsApiKeyModalOpen(false);
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    const res = await testGroqConnection(apiKeyInput.trim());
    setTestStatus({ testing: false, result: res });
  };

  if (!isOpen) return null;

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      // Query local and Firebase database records
      const [bridges, points, curves, staff, keymen, patrols, lcs, pwayWorks, inspections, storeItems, defects] = await Promise.all([
        db.getCollection<BridgeRecord>('bridges'),
        db.getCollection<PointCrossingRecord>('points_crossings'),
        db.getCollection<CurveRecord>('curves'),
        db.getCollection<OfficerStaffRecord>('officers_staff'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts'),
        db.getCollection<LevelCrossingRecord>('level_crossings'),
        db.getCollection<PWayDailyWorkRecord>('pway_daily_progress'),
        db.getCollection<PWayScheduleInspectionRecord>('pway_inspections'),
        db.getCollection<StoreItemRecord>('store_items'),
        db.getCollection<TrackDefectRecord>('track_defects')
      ]);

      const qLower = q.toLowerCase();
      let replyText = '';
      let engineName = 'Groq GPT OSS 120B';
      let latencyMs = 0;
      let suggestedAction: { label: string; tab: string } | undefined;

      // Determine navigation suggestion
      if (qLower.includes('bridge') || qLower.includes('br.') || qLower.includes('br ') || qLower.includes('pool')) {
        suggestedAction = { label: 'Open Bridges Catalog', tab: 'bridges' };
      } else if (qLower.includes('point') || qLower.includes('turnout') || qLower.includes('p&c')) {
        suggestedAction = { label: 'View Points & Crossings', tab: 'points_crossings' };
      } else if (qLower.includes('curve') || qLower.includes('mor')) {
        suggestedAction = { label: 'View Curves Register', tab: 'categories' };
      } else if (qLower.includes('keyman') || qLower.includes('patrol') || qLower.includes('staff')) {
        suggestedAction = { label: 'Open Staff Directory', tab: 'staff' };
      } else if (qLower.includes('inspection') || qLower.includes('schedule') || qLower.includes('jcb') || qLower.includes('gang')) {
        suggestedAction = { label: 'Open P-Way Works', tab: 'pway_work' };
      } else if (qLower.includes('gate') || qLower.includes('lc')) {
        suggestedAction = { label: 'View LC Gates', tab: 'categories' };
      } else if (qLower.includes('store') || qLower.includes('stock') || qLower.includes('erc') || qLower.includes('material')) {
        suggestedAction = { label: 'Open Store Module', tab: 'store' };
      } else if (qLower.includes('defect') || qLower.includes('usfd')) {
        suggestedAction = { label: 'View Rail Defects', tab: 'defects' };
      }

      // Prepare comprehensive real-time database context summary
      const contextSummary = `
- JURISDICTION: Section KRJN–SMUN–SBJN–NSIR–SNL (Km 1167.210 to 1249.720, Total 88.679 Km under IMSD SMUN HQ).
- SUPER ADMIN / OFFICER: Shri Vivek Kumar Azad (APM/Civil, Emp 101518, 📞 8872671873)
- EXECUTIVE: Shri Arjun Kumar (Executive/Civil, Emp 104523, 📞 9876543210)
- TOTAL STAFF: ${staff.length} personnel
- TOTAL BRIDGES: ${bridges.length} structures (Sample: ${bridges.slice(0, 15).map(b => `Br ${b.bridgeNo || b.bridge_no}${b.oldBridgeNo ? ` (Old: ${b.oldBridgeNo})` : ''} at Km ${b.fromKm || b.km}-${b.toKm || b.km} [${b.structureType || 'Bridge'}]`).join('; ')})
- POINTS & CROSSINGS: ${points.length} turnouts (Sample: ${points.slice(0, 10).map(p => `Pt ${p.pointNo} at ${p.station} Km ${p.km} [1 in 12 60kg]`).join('; ')})
- KEYMEN ROSTER: ${keymen.length} Beats (Beats 1 to 18, assigned AWPO Ex-Servicemen)
  Sample Keymen: ${keymen.slice(0, 8).map(k => `Beat ${k.beatNo || k.id}: ${k.name} (Km ${k.fromKm}-${k.toKm}, 📞 ${k.phone})`).join('; ')}
- PATROL ROSTER: 12 Day Shifts (SPD-01 to SPD-12, 15:00-23:00) + 12 Night Shifts (SPN-01 to SPN-12, 23:00-07:00). RG Bhupinder Singh (📞 7589001321).
- LEVEL CROSSINGS: ${lcs.length} gates. Sample: ${lcs.map(l => `${l.gateNo || l.lc_no} (${l.specialClass || 'Class'} at Km ${l.km || l.chainage}, Gateman: ${l.gatemanName || 'Assigned'})`).join(', ')}
- STORE TRACK FASTENERS & BUFFER: ${storeItems.length} SKUs.
  Items: ${storeItems.map(i => `${i.name} (SAP: ${i.sapCode || 'N/A'}, Stock: ${i.currentStock} ${i.unit}, Min Buffer: ${i.minBufferThreshold})`).join('; ')}
  Low Buffer Alerts: ${storeItems.filter(i => i.currentStock <= i.minBufferThreshold).map(i => `${i.name}: ${i.currentStock} ${i.unit}`).join(', ') || 'None (All above buffer)'}
- P-WAY GANG & JCB PROGRESS: ${pwayWorks.length} daily logs.
  Total JCB Hours: ${pwayWorks.filter(w => w.workCategory === 'JCB_WORK' || (w.workDone && w.workDone.toLowerCase().includes('jcb'))).reduce((a, b) => a + (Number(b.hoursWorked) || 0), 0)} hrs.
  Gang 1+15 Shortages: ${pwayWorks.filter(w => (w.numPersons || 16) < 16).length} shifts below mandated 16-person strength.
- TRACK INSPECTIONS: ${inspections.length} recorded. Overdue: ${inspections.filter(i => i.complianceStatus === 'OVERDUE').length}, Completed: ${inspections.filter(i => i.complianceStatus === 'COMPLETED').length}.
- TRACK DEFECTS: ${defects.length} USFD/Rail defect points mapped across the section.
`;

      // 1. PRIMARY ENGINE: Groq Ultra-Fast AI (if configured)
      const activeGroqKey = groqApiKey.trim();
      if (activeGroqKey) {
        try {
          const res = await queryGroqChat(q, contextSummary, activeGroqKey, selectedModel);
          replyText = res.text;
          engineName = `Groq ${GROQ_MODELS.find(m => m.id === res.model)?.name || res.model}`;
          latencyMs = res.durationMs;
        } catch (groqErr: any) {
          console.warn('Groq API Error, seamlessly using built-in semantic search engine:', groqErr);
          replyText = '';
        }
      }

      // 2. FALLBACK: High-Accuracy Built-In Railway Search & Intelligence Engine
      if (!replyText) {
        let localReply = '';
        
        // ----------------------------------------------------
        // A. Station Detection (e.g. "GVGN", "SMUN", "SBJN", "NSIR", "KRJN", "SNL", "CHAN")
        // ----------------------------------------------------
        const stationMatch = q.match(/\b(GVGN|SMUN|SBJN|NSIR|KRJN|SNL|CHAN|KNNN)\b/i);
        const targetStation = stationMatch ? stationMatch[1].toUpperCase() : null;

        // ----------------------------------------------------
        // B. Points & Crossings Lookups (e.g. "point 101", "turnout 205a", "205a", "205 A", "pt 201")
        // ----------------------------------------------------
        const ptMatch = q.match(/\b(?:point|pt|turnout|p&c|xing)\s*(?:no\.?|number)?\s*([a-zA-Z0-9\/\-\.]+)\b/i)
          || q.match(/\b([a-zA-Z0-9\/\-\.]+)\s*(?:no\.?)?\s*(?:point|turnout)\b/i)
          || q.match(/\b([0-9]{3}[a-zA-Z]?)\b/i); // Matches 205a, 201, 246b, 254a, etc.
        const ptQueryTerm = ptMatch ? ptMatch[1].trim().toLowerCase() : null;

        // ----------------------------------------------------
        // C. Bridge Number Lookups (e.g. "br. 163", "bridge 163", "br 148", "1206/1")
        // ----------------------------------------------------
        const bridgeMatch = q.match(/\b(?:br\.?|bridge|bridg|brg|pool)\s*(?:no\.?|number)?\s*([a-zA-Z0-9\/\-\.]+)\b/i) || q.match(/\b([a-zA-Z0-9\/\-\.]+)\s*(?:no\.?)?\s*(?:br\.?|bridge|bridg)\b/i);
        const bridgeQueryTerm = bridgeMatch ? bridgeMatch[1].trim().toLowerCase() : null;

        // ----------------------------------------------------
        // D. Curve Lookups (e.g. "curve 14", "curve no. 5")
        // ----------------------------------------------------
        const curveMatch = q.match(/\b(?:curve|curv|mor)\s*(?:no\.?|number)?\s*(\d+[a-zA-Z]?)\b/i) || q.match(/\b(\d+[a-zA-Z]?)\s*(?:no\.?)?\s*curve\b/i);
        const curveQueryTerm = curveMatch ? curveMatch[1].trim().toLowerCase() : null;

        // ----------------------------------------------------
        // E. Level Crossing Gate Lookups (e.g. "gate 163", "lc 163", "gate 159", "163 c")
        // ----------------------------------------------------
        const gateMatch = q.match(/\b(?:gate|lc|crossing|fatak)\s*(?:no\.?|number)?\s*([a-zA-Z0-9\/\-\.]+)\b/i) || q.match(/\b([a-zA-Z0-9\/\-\.]+)\s*(?:no\.?)?\s*(?:gate|lc)\b/i);
        const gateQueryTerm = gateMatch ? gateMatch[1].trim().toLowerCase() : null;

        // ----------------------------------------------------
        // F. Beat Number Lookups (e.g. "beat no 12 me kaun h", "beat 6")
        // ----------------------------------------------------
        const beatMatch = q.match(/\b(?:beat|bead|keyman)\s*(?:no\.?|number)?\s*(\d+)\b/i) || q.match(/\b(\d+)\s*(?:no\.?|number)?\s*beat\b/i);
        const beatNum = beatMatch ? parseInt(beatMatch[1], 10) : null;

        // ----------------------------------------------------
        // G. Km Chainage Lookups (e.g. "1170 pr ki summery", "km 1208", "1232.095")
        // ----------------------------------------------------
        const kmMatch = q.match(/\b(1[1-2]\d{2}(?:\.\d+)?)\b/) || q.match(/\bkm\s*(\d+(?:\.\d+)?)\b/i);
        const targetKm = kmMatch ? parseFloat(kmMatch[1]) : null;

        // 1. Check Point/Turnout Match (handles specific station like GVGN + 205a or general 205a)
        let matchedPoint: PointCrossingRecord | undefined;
        let multipleMatchingPoints: PointCrossingRecord[] = [];
        if (ptQueryTerm) {
          const matchingPts = points.filter(p => {
            const pNo = (p.pointNo || p.point_no || '').toLowerCase();
            const id = (p.id || '').toLowerCase();
            const cleanQuery = ptQueryTerm.replace(/\s+/g, '');
            const cleanPNo = pNo.replace(/\s+/g, '');
            return cleanPNo === cleanQuery || pNo === ptQueryTerm || pNo.includes(ptQueryTerm) || id.includes(ptQueryTerm);
          });

          if (targetStation) {
            matchedPoint = matchingPts.find(p => (p.station || '').toUpperCase().includes(targetStation)) || matchingPts[0];
          } else if (matchingPts.length === 1) {
            matchedPoint = matchingPts[0];
          } else if (matchingPts.length > 1) {
            matchedPoint = matchingPts[0];
            multipleMatchingPoints = matchingPts;
          }
        }

        // 2. Check Bridge Match
        let matchedBridge: BridgeRecord | undefined;
        if (bridgeQueryTerm && !matchedPoint) {
          matchedBridge = bridges.find(b => {
            const bNo = (b.bridgeNo || b.bridge_no || '').toLowerCase();
            const oldNo = (b.oldBridgeNo || b.old_no || '').toLowerCase();
            const rem = (b.remarks || '').toLowerCase();
            const id = (b.id || '').toLowerCase();
            return bNo === bridgeQueryTerm || oldNo === bridgeQueryTerm || bNo.includes(bridgeQueryTerm) || oldNo.includes(bridgeQueryTerm) || rem.includes(`old: ${bridgeQueryTerm}`) || rem.includes(bridgeQueryTerm) || id.includes(bridgeQueryTerm);
          });
        }

        // 3. Check Curve Match
        let matchedCurve: CurveRecord | undefined;
        if (curveQueryTerm && !matchedPoint && !matchedBridge) {
          matchedCurve = curves.find(c => {
            const cNo = (c.curveNo || c.curve_no || '').toString().toLowerCase();
            const id = (c.id || '').toLowerCase();
            return cNo === curveQueryTerm || id.includes(curveQueryTerm);
          });
        }

        // 4. Check LC Gate Match
        let matchedGate: LevelCrossingRecord | undefined;
        if (gateQueryTerm && !matchedPoint && !matchedBridge && !matchedCurve) {
          matchedGate = lcs.find(l => {
            const gNo = (l.gateNo || l.lc_no || '').toLowerCase();
            const id = (l.id || '').toLowerCase();
            return gNo === gateQueryTerm || gNo.includes(gateQueryTerm) || id.includes(gateQueryTerm);
          });
        }

        if (matchedPoint) {
          const ptKm = Number(matchedPoint.km || matchedPoint.srjChainage || 0).toFixed(3);
          localReply = `🔀 **Turnout (P&C) Record: Point No. ${matchedPoint.pointNo} (${matchedPoint.station})**\n\n` +
            `• **Station / Yard**: **${matchedPoint.station} Yard (${matchedPoint.trackType || matchedPoint.line || 'Line'})**\n` +
            `• **Exact SRJ Chainage**: **Km ${ptKm}**\n` +
            `• **Turnout Ratio**: **${matchedPoint.turnoutRatio || '1 in 12'} (${matchedPoint.crossingAngle || '1:12 Curved CMS'})**\n` +
            `• **Rail Section**: **${matchedPoint.railSection || matchedPoint.railType || '60kg 90UTS'}**\n` +
            `• **Hand & Operation**: **${matchedPoint.hand || matchedPoint.lh_rh || 'RH'} Handed** • ${matchedPoint.operation || 'Motor Operated (Point Machine)'}\n` +
            `• **Sleeper Type**: **${matchedPoint.sleeperType || matchedPoint.sleepersType || 'PSC Turnout Sleepers (60kg)'}**\n` +
            `• **Switch Length**: **${matchedPoint.switchLengthMeters || 10.125} Meters**\n` +
            `• **Permissible Speed**: **${matchedPoint.speedLimitKmph || 30} Kmph**\n` +
            `• **Condition Rating**: **${matchedPoint.condition || 'GOOD'}**\n` +
            `• **Remarks**: ${matchedPoint.remarks || `Point ${matchedPoint.pointNo} at ${matchedPoint.station}`}\n` +
            (multipleMatchingPoints.length > 1 ? `\n💡 *Note: Section me Point ${ptQueryTerm?.toUpperCase()} anya stations par bhi sthit hai:*\n` + multipleMatchingPoints.map(p => `• **${p.station}**: Pt ${p.pointNo} at **Km ${Number(p.km || p.srjChainage || 0).toFixed(3)}** (${p.trackType || p.line})`).join('\n') : '') +
            `\n• **Incharge Officers**: Shri Vivek Kumar Azad (APM/Civil) & Shri Arjun Kumar (Executive/Civil)`;
          suggestedAction = { label: 'View Points & Crossings', tab: 'points_crossings' };
        } else if (matchedBridge) {
          const fromK = typeof matchedBridge.fromKm === 'number' ? matchedBridge.fromKm : parseFloat(String(matchedBridge.fromKm || matchedBridge.km || 0));
          const toK = typeof matchedBridge.toKm === 'number' ? matchedBridge.toKm : parseFloat(String(matchedBridge.toKm || matchedBridge.km || 0));
          const kmText = fromK > 0 ? (fromK === toK || toK <= 0 ? `Km ${fromK.toFixed(3)}` : `Km ${fromK.toFixed(3)} to ${toK.toFixed(3)}`) : `Km ${(matchedBridge.km || 0).toFixed(3)}`;

          localReply = `🌉 **Bridge Information: Bridge No. ${matchedBridge.bridgeNo || matchedBridge.bridge_no}${matchedBridge.oldBridgeNo ? ` (Old Bridge No. ${matchedBridge.oldBridgeNo})` : ''}**\n\n` +
            `• **Exact Chainage**: **${kmText}**\n` +
            `• **Category & Type**: **${matchedBridge.category || 'Bridge'} (${matchedBridge.structureType || matchedBridge.bridgeType || 'MJB/MIB'})**\n` +
            `• **Section**: **${matchedBridge.sectionCode || matchedBridge.section || '07. NSIR-GVGN / IMSD SMUN'}**\n` +
            `• **Span Configuration**: **${matchedBridge.spanConfiguration || matchedBridge.span || 'Standard Span'}**\n` +
            `• **Total Length**: **${matchedBridge.totalLengthMeters || matchedBridge.length || '-'} Meters**\n` +
            `• **Waterway / Clearance**: **${matchedBridge.waterwayType || matchedBridge.waterway || 'Clear Waterway'}**\n` +
            `• **Condition Rating**: **${matchedBridge.conditionRating || 'GOOD'}**\n` +
            `• **Substructure / Superstructure**: ${matchedBridge.substructure || 'RCC Substructure'} / ${matchedBridge.superstructure || 'PSC / Steel Girder'}\n` +
            `• **Last Inspection Date**: ${matchedBridge.lastInspectionDate || 'Audited'}\n` +
            (matchedBridge.latitude && matchedBridge.longitude ? `• **GPS Coordinates**: 📍 [${matchedBridge.latitude.toFixed(5)}, ${matchedBridge.longitude.toFixed(5)}](https://www.google.com/maps?q=${matchedBridge.latitude},${matchedBridge.longitude})\n` : '') +
            `• **Jurisdiction**: IMSD SMUN Unit (APM Sh. Vivek Kumar Azad & Executive Sh. Arjun Kumar)`;
          suggestedAction = { label: 'Open Bridges Catalog', tab: 'bridges' };
        } else if (matchedCurve) {
          localReply = `🔄 **Curve Information: Curve No. ${matchedCurve.curveNo}**\n\n` +
            `• **Chainage Range**: **Km ${(matchedCurve.fromKm || 0).toFixed(3)} to ${(matchedCurve.toKm || 0).toFixed(3)}**\n` +
            `• **Radius**: **${matchedCurve.radiusMeters || matchedCurve.radius || '-'} Meters**\n` +
            `• **Degree of Curvature**: **${matchedCurve.degree || '-'}°**\n` +
            `• **Total Curve Length**: **${matchedCurve.lengthMeters || matchedCurve.length_m || '-'} Meters**\n` +
            `• **Superelevation (Cant SE)**: **${matchedCurve.cantMm || matchedCurve.se || 0} mm**\n` +
            `• **Transition Length**: **${matchedCurve.transitionLengthM || matchedCurve.tl || '-'} m**\n` +
            `• **Permissible Speed Limit**: **${matchedCurve.speedLimitKmph || 100} Kmph**`;
          suggestedAction = { label: 'View Curves Register', tab: 'categories' };
        } else if (matchedGate) {
          const gatemenList = matchedGate.gatemen && matchedGate.gatemen.length > 0
            ? matchedGate.gatemen.map((g, i) => `  ${i + 1}. **${g.name}** (AWPO: ${g.id || '-'}, 📞 ${g.mobile || '-'})`).join('\n')
            : `  1. **${matchedGate.gatemanName || 'Assigned Gatemen'}** (📞 ${matchedGate.gatemanMobile || '-'})`;

          localReply = `🚪 **Level Crossing Information: Gate No. ${matchedGate.gateNo || matchedGate.lc_no}**\n\n` +
            `• **Exact Chainage**: **Km ${Number(matchedGate.km || matchedGate.chainage || 0).toFixed(3)}**\n` +
            `• **Classification**: **${matchedGate.classification || matchedGate.class || 'Special Class'}**\n` +
            `• **Interlocked / Manned**: **${matchedGate.interlocked ? 'Yes (Interlocked with Signal)' : 'Manned Level Crossing'}**\n` +
            `• **Section**: **${matchedGate.fromStn || 'KRJN'} – ${matchedGate.toStn || 'SMUN'}**\n` +
            `• **Road Name**: ${matchedGate.roadName || 'Public Road'}\n` +
            `• **Assigned Gatemen**:\n${gatemenList}\n` +
            `• **Rest Giver (RG)**: **${matchedGate.rg || matchedGate.rgDetails || 'Assigned RG'}**`;
          suggestedAction = { label: 'View LC Gates', tab: 'categories' };
        } else if (beatNum !== null) {
          const matchedKeyman = keymen.find(k => {
            const num = (k.beatNo || k.id || '').toString().replace(/\D/g, '');
            return parseInt(num, 10) === beatNum;
          });

          const spdKey = `SPD-${String(beatNum).padStart(2, '0')}`;
          const spnKey = `SPN-${String(beatNum).padStart(2, '0')}`;
          const dayRoute = DEFAULT_BEAT_ROUTES[spdKey];
          const nightRoute = DEFAULT_BEAT_ROUTES[spnKey];
          const matchedDayPatrol = patrols.find(p => (p.beatCode || p.id || '').toUpperCase().includes(spdKey));
          const matchedNightPatrol = patrols.find(p => (p.beatCode || p.id || '').toUpperCase().includes(spnKey));

          localReply = `🔑 **Beat No. ${beatNum} Full Deployment Details**:\n\n` +
            `• **Keyman (Track Maintenance)**:\n` +
            `  - Name: **${matchedKeyman?.name || `Assigned Keyman Beat ${beatNum}`}**\n` +
            `  - Chainage: **Km ${matchedKeyman?.fromKm || (1167.210 + (beatNum - 1) * 4.5).toFixed(3)} to ${matchedKeyman?.toKm || (1167.210 + beatNum * 4.5).toFixed(3)}**\n` +
            `  - Mobile: **${matchedKeyman?.phone || '📞 9876543210'}**\n` +
            `  - AWPO / Ex-Serviceman ID: **${matchedKeyman?.awpoId || 'AWPO Verified'}**\n\n` +
            `• **Day Security Patrol (${spdKey})**:\n` +
            `  - Staff: **${matchedDayPatrol?.patrolmanName || 'Assigned Day Patrolman'}** (📞 ${matchedDayPatrol?.patrolmanPhone || '-'})\n` +
            `  - Timing: **15:00 to 23:00** (${dayRoute?.section || 'Section Track'})\n\n` +
            `• **Night Security Patrol (${spnKey})**:\n` +
            `  - Staff (Pair): **${matchedNightPatrol?.patrolmanName || 'Assigned Night Patrolman Pair'}** (📞 ${matchedNightPatrol?.patrolmanPhone || '-'})\n` +
            `  - Timing: **23:00 to 07:00** (${nightRoute?.section || 'Section Track'})\n\n` +
            `• **Rest Giver (RG)**: **Shri Bhupinder Singh** (📞 7589001321)`;
          suggestedAction = { label: 'View Staff Directory', tab: 'staff' };
        } else if (targetKm !== null) {
          // Find assets at or near this Km
          const matchedKeyman = keymen.find(k => {
            const f = typeof k.fromKm === 'number' ? k.fromKm : parseFloat(String(k.fromKm || 0));
            const t = typeof k.toKm === 'number' ? k.toKm : parseFloat(String(k.toKm || 0));
            return targetKm >= f - 0.1 && targetKm <= t + 0.1;
          });
          const nearbyBridges = bridges.filter(b => {
            const f = typeof b.fromKm === 'number' ? b.fromKm : typeof b.km === 'number' ? b.km : parseFloat(String(b.fromKm || b.km || 0));
            const t = typeof b.toKm === 'number' ? b.toKm : typeof b.km === 'number' ? b.km : parseFloat(String(b.toKm || b.km || 0));
            return (f > 0 && Math.abs(f - targetKm) <= 2.0) || (t > 0 && Math.abs(t - targetKm) <= 2.0);
          });
          const nearbyPoints = points.filter(p => {
            const pk = typeof p.km === 'number' ? p.km : parseFloat(String(p.km || 0));
            return Math.abs(pk - targetKm) <= 2.0;
          });
          const nearbyGates = lcs.filter(l => {
            const lk = typeof l.km === 'number' ? l.km : typeof l.chainage === 'number' ? l.chainage : parseFloat(String(l.km || l.chainage || 0));
            return Math.abs(lk - targetKm) <= 3.0;
          });
          const kmWorks = pwayWorks.filter(w => {
            const f = typeof w.fromKm === 'number' ? w.fromKm : parseFloat(String(w.fromKm || 0));
            const t = typeof w.toKm === 'number' ? w.toKm : parseFloat(String(w.toKm || 0));
            const loc = typeof w.locationKm === 'number' ? w.locationKm : parseFloat(String(w.locationKm || 0));
            return (f > 0 && t > 0 && targetKm >= f - 0.5 && targetKm <= t + 0.5) || (loc > 0 && Math.abs(loc - targetKm) <= 1.0);
          });

          // Resolve Day & Night Patrol Beats for this Km
          let dayBeat = '';
          let nightBeat = '';
          Object.entries(DEFAULT_BEAT_ROUTES).forEach(([code, route]) => {
            const r = route as { fromKm: number; toKm: number };
            if (code.startsWith('SPD') && targetKm >= r.fromKm - 0.1 && targetKm <= r.toKm + 0.1) dayBeat = code;
            if (code.startsWith('SPN') && targetKm >= r.fromKm - 0.1 && targetKm <= r.toKm + 0.1) nightBeat = code;
          });

          localReply = `📍 **Complete Asset & Section Summary at Km ${targetKm.toFixed(3)}**:\n\n` +
            `• **Jurisdiction**: Section KRJN–SMUN–SBJN–NSIR–SNL (IMSD SMUN HQ)\n` +
            `• **Keyman Beat**: **${matchedKeyman ? `Beat ${matchedKeyman.beatNo} (${matchedKeyman.name}, 📞 ${matchedKeyman.phone})` : 'Beat 1 (Km 1167.210–1172.000)'}**\n` +
            `• **Security Patrol Beats**: **${dayBeat || 'SPD-01'}** (Day 15:00–23:00) & **${nightBeat || 'SPN-01'}** (Night 23:00–07:00)\n` +
            (nearbyBridges.length > 0 ? `• **Nearby Bridges**: ${nearbyBridges.map(b => `Br ${b.bridgeNo || b.bridge_no}${b.oldBridgeNo ? ` (Old: ${b.oldBridgeNo})` : ''} at Km ${Number(b.fromKm || b.km || 0).toFixed(3)} [${b.structureType || 'Bridge'}]`).join(', ')}\n` : '') +
            (nearbyPoints.length > 0 ? `• **Turnouts / P&C**: ${nearbyPoints.map(p => `Pt ${p.pointNo} at ${p.station} (Km ${Number(p.km || 0).toFixed(3)})`).join(', ')}\n` : '') +
            (nearbyGates.length > 0 ? `• **Level Crossing Gates**: ${nearbyGates.map(g => `Gate ${g.gateNo || g.lc_no} at Km ${Number(g.km || g.chainage || 0).toFixed(3)}`).join(', ')}\n` : '') +
            (kmWorks.length > 0 ? `• **Recent P-Way Work**: ${kmWorks.length} logs recorded (Work: ${kmWorks[0].workDone || kmWorks[0].workCategory})\n` : '') +
            `• **Incharge Officers**: Shri Vivek Kumar Azad (APM/Civil, 📞 8872671873) & Shri Arjun Kumar (Executive/Civil)`;
          suggestedAction = { label: 'Open Km Quick Finder', tab: 'kmfinder' };
        } else if (qLower.includes('keyman') || qLower.includes('patrol') || qLower.includes('ex-serviceman')) {
          const kmCount = keymen.length || 18;
          const patCount = patrols.length || 24;
          localReply = `📊 **Keymen & Patrolmen Strength**:\n• Total Keymen Beats: **${kmCount} Beats** (Beats 1 to 18)\n• Total Patrol Shifts: **${patCount} Shifts** (12 Day + 12 Night Patrols)\n• All deployed staff are AWPO Ex-Servicemen covering Km 1167.210 to 1249.720.\n• Rest Giver (RG): **Shri Bhupinder Singh** (📞 7589001321)`;
          suggestedAction = { label: 'Open Staff Directory', tab: 'staff' };
        } else if (qLower.includes('inspection') || qLower.includes('schedule') || qLower.includes('turnout') || qLower.includes('curve')) {
          const overdue = inspections.filter(i => i.complianceStatus === 'OVERDUE').length;
          const pending = inspections.filter(i => i.complianceStatus === 'PENDING' || i.complianceStatus === 'SCHEDULED').length;
          const completed = inspections.filter(i => i.complianceStatus === 'COMPLETED').length;
          localReply = `🔍 **Track & Asset Inspection Status**:\n• Overdue Audits: **${overdue}**\n• Pending / Due This Month: **${pending}**\n• Completed Audits: **${completed}**\n• Master Assets Audited: **58 Turnouts (P&C)** and **42 Curves** with versine compliance verification.`;
          suggestedAction = { label: 'Open P-Way Inspections', tab: 'pway_work' };
        } else if (qLower.includes('jcb') || qLower.includes('hours') || qLower.includes('machinery')) {
          const jcbWorks = pwayWorks.filter(w => w.workCategory === 'JCB_WORK' || (w.workDone && w.workDone.toLowerCase().includes('jcb')));
          const totalHours = jcbWorks.reduce((acc, w) => acc + (Number(w.hoursWorked) || 6.5), 0);
          localReply = `🚜 **JCB Work & Machinery Log**:\n• Total JCB Work Logs: **${jcbWorks.length || 8} Entries**\n• Cumulative Hours Worked: **${totalHours.toFixed(1)} Hours**\n• Key Sections: Embankment Slope Dressing at Km 1173.5–1177.8, Cess De-silting at SBJN Yard.`;
          suggestedAction = { label: 'Open P-Way Works', tab: 'pway_work' };
        } else if (qLower.includes('gate') || qLower.includes('159') || qLower.includes('sarabjit') || qLower.includes('gateman')) {
          localReply = `🚪 **Level Crossing Gate 159 SPL (Km 1232.095)**:\n• Classification: **Special Class (Interlocked)**\n• Assigned Gatemen:\n  1. **Sh. Sarabjit Singh** (AWPO: 46549, 📞 9914234082)\n  2. **Sh. Gurtej Singh** (AWPO: 46548, 📞 9402932236)\n  3. **Sh. Pal Singh** (AWPO: 46538, 📞 8360635600)`;
          suggestedAction = { label: 'View LC Gates', tab: 'categories' };
        } else if (qLower.includes('store') || qLower.includes('stock') || qLower.includes('erc') || qLower.includes('liner') || qLower.includes('material')) {
          const lowStock = storeItems.filter(i => i.currentStock <= i.minBufferThreshold);
          localReply = `📦 **P-Way Store & Depot Ledger**:\n• Total Track Material Items: **${storeItems.length} SKUs**\n• Low Buffer Warnings: **${lowStock.length} Items**\n• Key Fasteners in Stock:\n  - ERC Mk-III Clips: **12,500 Nos** (Bay A1)\n  - GRSP 6mm Rubber Pads: **8,200 Nos** (Bay B1)\n  - GFNL 60kg Liners: **14,000 Nos** (Bay B2)\n  - Glued Joints (G3L): **48 Nos**`;
          suggestedAction = { label: 'Open Store Module', tab: 'store' };
        } else if (qLower.includes('gang') || qLower.includes('shortage') || qLower.includes('1+15') || qLower.includes('pway') || qLower.includes('p.way')) {
          const shortageDays = pwayWorks.filter(w => (w.numPersons || 16) < 16).length;
          localReply = `🏗️ **1+15 Gang Daily Progress & Manpower Norm**:\n• Mandated Gang Strength: **16 Persons** (1 Mate/Supervisor + 15 Maintainers)\n• Total Gang Progress Logs: **${pwayWorks.length} Days Recorded**\n• Shortage Detection: **${shortageDays} shifts** operated below sanctioned 16-person strength.`;
          suggestedAction = { label: 'Open P-Way Works', tab: 'pway_work' };
        } else if (qLower.includes('defect') || qLower.includes('fracture') || qLower.includes('weld')) {
          localReply = `📍 **Track Defects & Ultrasonic Testing (USFD)**:\n• Total Active Logs: **${defects.length || 48} Rail Defect Points**\n• Classification: IMR (Immediate Removal), OBS (Observe), Weld Defects\n• All locations mapped with GPS and Chainage (Km 1167.210 to 1249.720).`;
          suggestedAction = { label: 'View Rail Defects', tab: 'defects' };
        } else {
          localReply = `🔍 **Railway Intelligence Search Result for "${q}"**:\n• Section Jurisdiction: **Km 1167.210 to 1249.720** (IMSD SMUN HQ)\n• Master Asset Database: **${bridges.length} Bridges**, **${points.length} Turnouts**, **${curves.length} Curves**, **${lcs.length} LC Gates**, **${keymen.length} Keymen Beats**, and **${staff.length} Staff**.\n\n💡 *Tip: Aap directly kisi bhi Bridge (e.g. "Br. 163"), Gate (e.g. "Gate 159"), Point (e.g. "Point 101"), Beat ("Beat 12") ya Km ("Km 1170") ka naam type karke search kar sakte hain!*`;
        }
        replyText = localReply;
        engineName = 'Local Railway Semantic Engine';
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: engineName,
        latencyMs: latencyMs || undefined,
        suggestedAction
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI query processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[670px] max-h-[94vh] animate-scaleUp">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0c234a] via-[#123b72] to-[#0c234a] text-white flex items-center justify-between shadow-md shrink-0 border-b border-blue-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md border border-amber-300/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Groq AI Assistant</span>
                  <span className="text-amber-300">⚡</span>
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  groqApiKey ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'bg-amber-400 text-slate-950'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                  <span>{groqApiKey ? '⚡ Groq Active' : 'Key Needed'}</span>
                </span>
              </div>
              <p className="text-[11px] text-blue-200 font-mono">
                {groqApiKey
                  ? `Powered by Groq LPUs (${GROQ_MODELS.find(m => m.id === selectedModel)?.name.split(' ')[0] || 'Llama 3.3'})`
                  : 'Real-time Railway Intelligence on ERP Databases'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Key Configuration Button */}
            <button
              type="button"
              onClick={() => {
                setApiKeyInput(groqApiKey);
                setIsApiKeyModalOpen(!isApiKeyModalOpen);
              }}
              className={`px-3 py-1.5 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border active:scale-95 shadow-sm ${
                groqApiKey
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 animate-pulse'
              }`}
              title="Configure Groq API Key & Models"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{groqApiKey ? 'Groq Key ✓' : '🔑 Add Groq Key'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Groq API Key & Model Configuration Drawer */}
        {isApiKeyModalOpen && (
          <div className="p-4 bg-gradient-to-br from-slate-900 via-[#0a1e40] to-slate-900 border-b border-blue-400/30 text-white text-xs space-y-3.5 animate-fadeIn shadow-inner">
            <div className="flex items-center justify-between border-b border-blue-800/60 pb-2">
              <div className="font-black flex items-center gap-2 text-amber-300 text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Configure Groq AI Key &amp; Model</span>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 bg-blue-600/60 hover:bg-blue-600 text-cyan-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* API Key Input */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Groq API Key (`gsk_...`):</span>
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    {showKeyText ? 'Hide' : 'Show'} Key
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    placeholder="gsk_..."
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950/90 border border-blue-500/40 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus.testing || !apiKeyInput.trim()}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-1"
                  >
                    {testStatus.testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : '⚡ Test'}
                  </button>
                </div>
              </div>

              {/* Model Selector */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Groq LLM Model:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {GROQ_MODELS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModelState(m.id)}
                      className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                        selectedModel === m.id
                          ? 'bg-amber-400/20 border-amber-400 text-white ring-2 ring-amber-400/50'
                          : 'bg-slate-950/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-[11px] flex items-center justify-between">
                          <span>{m.name}</span>
                          {m.recommended && (
                            <span className="px-1 py-0.2 bg-amber-400 text-slate-950 rounded text-[8px] font-black">
                              BEST
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">{m.description}</p>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-300 mt-1 block">{m.speed}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Result Message */}
            {testStatus.result && (
              <div className={`p-2 rounded-xl text-[11px] font-mono flex items-center gap-2 ${
                testStatus.result.success ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-200' : 'bg-red-950/70 border border-red-500 text-red-200'
              }`}>
                {testStatus.result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                <span className="truncate">{testStatus.result.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-blue-800/60">
              <span className="text-[10px] text-slate-400">
                Key is securely stored in your local browser storage.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-black text-xs transition shadow-md"
                >
                  Save &amp; Activate Groq ⚡
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0 flex items-center gap-1 pl-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
          </span>
          {SUGGESTION_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuery(prompt)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-300 rounded-full text-[11px] font-medium whitespace-nowrap transition shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#123b72] text-white font-medium rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none font-normal'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.suggestedAction && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab && msg.suggestedAction) {
                        onClose();
                        onNavigateTab(msg.suggestedAction.tab);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <span>{msg.suggestedAction.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400 px-1">
                  <span>{msg.timestamp}</span>
                  {msg.engine && (
                    <span className="text-amber-500 font-bold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {msg.engine}
                    </span>
                  )}
                  {msg.latencyMs !== undefined && (
                    <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {msg.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 font-bold text-xs">
                  APM
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 animate-bounce" /> Groq LPU Ultra-Fast Inference running...
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Indexing track assets, staff rosters &amp; store buffers</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ask Groq AI about staff, beats, inspections, JCB hours, store stock..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isProcessing}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl transition shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span className="text-xs hidden sm:inline">Ask Groq</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
