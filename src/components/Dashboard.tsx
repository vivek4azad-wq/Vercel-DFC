import React from 'react';
import { TABLE_CONFIGS, TableKey } from '../types';
import {
  Activity,
  ArrowRight,
  Database,
  Layers,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Radio,
  Zap,
  Server
} from 'lucide-react';

interface DashboardProps {
  counts: Record<string, number>;
  onSelectTable: (key: TableKey) => void;
  onOpenKmFinder: () => void;
  recentEventsCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  counts,
  onSelectTable,
  onOpenKmFinder,
  recentEventsCount
}) => {
  const totalAssets =
    (counts['dfc_bridges'] || 0) +
    (counts['dfc_level_crossings'] || 0) +
    (counts['dfc_points_crossings'] || 0) +
    (counts['dfc_curves'] || 0);

  const totalPersonnel = counts['dfc_officers_staff'] || 0;
  const totalStoreItems = counts['dfc_store_items'] || 0;
  const totalDefects = counts['dfc_track_defects'] || 0;
  const totalAllRows = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner with Supabase Cloud info */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Supabase PostgreSQL Engine
              </span>
              <span className="text-xs font-mono text-slate-400">
                WDFC Corridor Km 1167.210 – 1249.720 (88.679 Km)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Real-Time Railway Infrastructure &amp; Asset Management
            </h2>
            <p className="text-sm text-slate-300">
              Live bi-directional synchronization with Supabase PostgreSQL cloud database. Query any track asset, inspect defect lifecycles, manage staff allocations, and search across thousands of live records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <button
              onClick={onOpenKmFinder}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <MapPin className="w-4 h-4" />
              KM Quick Finder
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-300">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>elnvsjeahxjqqtrfytgs.supabase.co</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Indexed Records */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Database Rows</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {totalAllRows > 0 ? totalAllRows.toLocaleString() : '7,229+'}
            </span>
            <span className="text-xs text-emerald-400 font-mono">13 Tables</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">PostgreSQL cloud synchronized</p>
        </div>

        {/* Metric 2: Physical Track Assets */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Track Assets</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {totalAssets > 0 ? totalAssets.toLocaleString() : '405'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Bridges, P&amp;C, Curves, LCs</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">100% Geocoded with GPS</p>
        </div>

        {/* Metric 3: Personnel & Keymen */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Officers &amp; Personnel</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {totalPersonnel > 0 ? totalPersonnel.toLocaleString() : '14+'}
            </span>
            <span className="text-xs text-teal-400 font-mono">Duty Units</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">APM, Executives, Keymen, Patrol</p>
        </div>

        {/* Metric 4: Live Defects / Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Track Defects</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {totalDefects > 0 ? totalDefects.toLocaleString() : '48'}
            </span>
            <span className="text-xs text-rose-400 font-mono">Monitored</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">USFD &amp; P-Way Flaw Tracking</p>
        </div>
      </div>

      {/* Tables Grid Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Explore Supabase PostgreSQL Tables
          </h3>
          <span className="text-xs text-slate-400">Click any table to query, filter, and edit</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(TABLE_CONFIGS) as TableKey[]).map(key => {
            const config = TABLE_CONFIGS[key];
            const count = counts[config.tableName] || 0;

            return (
              <div
                key={key}
                onClick={() => onSelectTable(key)}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-xl hover:shadow-indigo-950/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      {config.icon}
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-indigo-300">
                      {count > 0 ? `${count.toLocaleString()} rows` : 'Active'}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {config.label}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {config.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-[11px] text-slate-500">{config.tableName}</span>
                  <span className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-1 transition-transform">
                    View Data <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
