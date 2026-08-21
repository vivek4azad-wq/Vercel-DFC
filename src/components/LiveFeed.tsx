import React from 'react';
import { LiveChangeEvent } from '../supabase';
import {
  Radio,
  Clock,
  Database,
  ArrowRight,
  Trash2,
  Edit,
  PlusCircle,
  Zap,
  Layers
} from 'lucide-react';

interface LiveFeedProps {
  events: LiveChangeEvent[];
  onClear: () => void;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ events, onClear }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/20 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              PostgreSQL Change Data Capture (CDC) Real-Time Stream
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Live WebSockets feed capturing every row INSERT, UPDATE, and DELETE across all 13 Supabase tables.
          </p>
        </div>

        {events.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Feed
          </button>
        )}
      </div>

      {/* Events Stream */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm p-4 md:p-6">
        {events.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 space-y-3">
            <Zap className="w-8 h-8 text-purple-500/60 mx-auto animate-bounce mb-2" />
            <p className="text-sm font-bold text-white">Listening for live Supabase database events...</p>
            <p className="text-slate-500 max-w-md mx-auto">
              Any insert, update, or delete triggered by n8n workflows, field mobile apps, WhatsApp bots, or web forms will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt, idx) => {
              const rec = evt.newRecord || evt.oldRecord;
              const isInsert = evt.eventType === 'INSERT';
              const isUpdate = evt.eventType === 'UPDATE';
              const isDelete = evt.eventType === 'DELETE';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        isInsert
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : isUpdate
                          ? 'bg-sky-950 text-sky-400 border border-sky-500/30'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {evt.eventType}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{evt.table}</span>
                        {rec?.code && <span className="text-indigo-400">({rec.code})</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                        {rec?.name || rec?.category || rec?.id || 'Record'}
                        {rec?.chainage_km ? ` • Km ${rec.chainage_km}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
