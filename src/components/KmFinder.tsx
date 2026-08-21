import React, { useState, useMemo } from 'react';
import { SupabaseRow, TableKey, TABLE_CONFIGS } from '../types';
import {
  MapPin,
  Search,
  Layers,
  ArrowRight,
  ExternalLink,
  Navigation,
  Compass,
  Zap,
  Filter
} from 'lucide-react';

interface KmFinderProps {
  allRows: Record<TableKey, SupabaseRow[]>;
  onInspectRecord: (row: SupabaseRow) => void;
}

export const KmFinder: React.FC<KmFinderProps> = ({ allRows, onInspectRecord }) => {
  const [fromKmInput, setFromKmInput] = useState<string>('1170.000');
  const [toKmInput, setToKmInput] = useState<string>('1180.000');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>('ALL');

  // Quick corridor preset buttons
  const presets = [
    { label: 'SMUN Yard', from: 1167.210, to: 1172.000 },
    { label: 'SMUN – SBJN', from: 1170.435, to: 1188.575 },
    { label: 'SBJN – NSIR', from: 1188.575, to: 1205.120 },
    { label: 'NSIR – GVGN', from: 1205.120, to: 1218.450 },
    { label: 'GVGN – KNNN', from: 1218.450, to: 1234.800 },
    { label: 'KNNN – CHAN', from: 1234.800, to: 1249.720 },
    { label: 'Link Line RPJ', from: 0.000, to: 10.000 }
  ];

  const searchResults = useMemo(() => {
    const fromKm = parseFloat(fromKmInput);
    const toKm = parseFloat(toKmInput);

    if (isNaN(fromKm) || isNaN(toKm)) return [];

    const minKm = Math.min(fromKm, toKm);
    const maxKm = Math.max(fromKm, toKm);

    const assetKeys: TableKey[] = [
      'bridges',
      'level_crossings',
      'points_crossings',
      'curves',
      'track_defects',
      'lwr',
      'sej',
      'keymen'
    ];

    const matched: { tableKey: TableKey; row: SupabaseRow }[] = [];

    assetKeys.forEach(key => {
      if (selectedAssetFilter !== 'ALL' && key !== selectedAssetFilter) return;

      const rows = allRows[key] || [];
      rows.forEach(r => {
        const km = r.chainage_km;
        if (km !== null && km !== undefined) {
          if (km >= minKm && km <= maxKm) {
            matched.push({ tableKey: key, row: r });
          }
        }
      });
    });

    // Sort ascending by KM
    return matched.sort((a, b) => (a.row.chainage_km || 0) - (b.row.chainage_km || 0));
  }, [allRows, fromKmInput, toKmInput, selectedAssetFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <MapPin className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Kilometer (KM) Quick Boundary Explorer
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Query all track assets, curves, turnouts, bridges, and defects within any kilometer boundary on WDFC.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  setFromKmInput(p.from.toFixed(3));
                  setToKmInput(p.to.toFixed(3));
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              From Km
            </label>
            <input
              type="text"
              value={fromKmInput}
              onChange={e => setFromKmInput(e.target.value)}
              placeholder="e.g. 1170.000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              To Km
            </label>
            <input
              type="text"
              value={toKmInput}
              onChange={e => setToKmInput(e.target.value)}
              placeholder="e.g. 1180.000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Filter Asset Type
            </label>
            <select
              value={selectedAssetFilter}
              onChange={e => setSelectedAssetFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Track Asset Types</option>
              <option value="bridges">🌉 Bridges &amp; Culverts</option>
              <option value="level_crossings">🚧 Level Crossings</option>
              <option value="points_crossings">🔀 Points &amp; Crossings</option>
              <option value="curves">📐 Curves</option>
              <option value="track_defects">⚠️ Track Defects</option>
              <option value="keymen">🛡️ Keymen Beats</option>
              <option value="lwr">📏 LWR Sections</option>
              <option value="sej">🔗 SEJ Joints</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Boundary Assets Found: <span className="text-indigo-400 font-mono">{searchResults.length}</span>
        </h4>
        <span className="text-xs font-mono text-slate-400">
          Range: Km {fromKmInput} → Km {toKmInput}
        </span>
      </div>

      {/* Results Cards List */}
      {searchResults.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No assets found in specified chainage range</p>
          <p className="text-slate-500">Try broadening your search range or switching presets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {searchResults.map(({ tableKey, row }, idx) => {
            const cfg = TABLE_CONFIGS[tableKey];
            const lat = row.payload?.latitude;
            const lng = row.payload?.longitude;

            return (
              <div
                key={row.id || idx}
                onClick={() => onInspectRecord(row)}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-indigo-300 border border-slate-700 flex items-center gap-1">
                      <span>{cfg?.icon}</span>
                      <span>{cfg?.label.split(' ')[0]}</span>
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                      Km {row.chainage_km?.toFixed(3)}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {row.code ? `${row.code} — ` : ''}{row.name || 'Track Asset'}
                  </h5>

                  <div className="mt-2 space-y-1 text-xs text-slate-400 font-mono">
                    {row.category && (
                      <div>Type / Category: <strong className="text-slate-300">{row.category}</strong></div>
                    )}
                    {row.section && (
                      <div>Section / Station: <strong className="text-slate-300">{row.section} {row.station}</strong></div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  {lat && lng ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      GPS Nav
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500">{cfg?.tableName}</span>
                  )}
                  <span className="text-indigo-400 text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
