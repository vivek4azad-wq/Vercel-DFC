import React, { useState, useMemo } from 'react';
import { TABLE_CONFIGS, TableKey, SupabaseRow } from '../types';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Code,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database,
  MapPin,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface TableViewerProps {
  tableKey: TableKey;
  onSelectTable: (key: TableKey) => void;
  rows: SupabaseRow[];
  isLoading: boolean;
  onViewRecord: (row: SupabaseRow) => void;
  onEditRecord: (row: SupabaseRow) => void;
  onDeleteRecord: (id: string) => void;
  onAddNew: () => void;
}

export const TableViewer: React.FC<TableViewerProps> = ({
  tableKey,
  onSelectTable,
  rows,
  isLoading,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  onAddNew
}) => {
  const config = TABLE_CONFIGS[tableKey] || TABLE_CONFIGS.bridges;
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [sortField, setSortField] = useState<string>('chainage_km');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Extract unique categories and sections for dropdown filters
  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [rows]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => {
      if (r.section) set.add(r.section);
      if (r.station) set.add(r.station);
    });
    return Array.from(set).sort();
  }, [rows]);

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      // Search query match
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesCode = r.code?.toLowerCase().includes(q);
        const matchesCat = r.category?.toLowerCase().includes(q);
        const matchesSec = r.section?.toLowerCase().includes(q);
        const matchesKm = String(r.chainage_km || '').includes(q);
        if (!matchesName && !matchesCode && !matchesCat && !matchesSec && !matchesKm) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
        return false;
      }

      // Section filter
      if (selectedSection !== 'ALL' && r.section !== selectedSection && r.station !== selectedSection) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = (a as any)[sortField];
      let valB = (b as any)[sortField];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [rows, filterQuery, selectedCategory, selectedSection, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Table Selector Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Object.keys(TABLE_CONFIGS) as TableKey[]).map(key => {
          const cfg = TABLE_CONFIGS[key];
          const isSelected = key === tableKey;
          return (
            <button
              key={key}
              onClick={() => {
                onSelectTable(key);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
        {/* Table Header Controls */}
        <div className="p-4 md:p-6 border-b border-slate-800/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shadow-inner">
                {config.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">{config.label}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                    {config.tableName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
              </div>
            </div>

            {/* Add Record & Total Count */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                Found <strong className="text-indigo-400">{filteredRows.length}</strong> / {rows.length} records
              </span>
              <button
                onClick={onAddNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Filter Query Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${config.label}...`}
                value={filterQuery}
                onChange={e => {
                  setFilterQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Category Dropdown */}
            {categories.length > 0 && (
              <div>
                <select
                  value={selectedCategory}
                  onChange={e => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="ALL">All Types / Categories ({categories.length})</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Section Dropdown */}
            {sections.length > 0 && (
              <div>
                <select
                  value={selectedSection}
                  onChange={e => {
                    setSelectedSection(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="ALL">All Sections / Stations ({sections.length})</option>
                  {sections.map(sec => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filters */}
            {(filterQuery || selectedCategory !== 'ALL' || selectedSection !== 'ALL') && (
              <button
                onClick={() => {
                  setFilterQuery('');
                  setSelectedCategory('ALL');
                  setSelectedSection('ALL');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
              <p>Fetching live rows from Supabase PostgreSQL...</p>
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No records found matching your query</p>
              <p className="text-slate-500">Try adjusting your search terms or filter criteria</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  {config.columns.map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={`py-3 px-4 cursor-pointer hover:text-white transition-colors ${col.width || ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedRows.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-slate-500">{globalIdx}</td>

                      {config.columns.map(col => {
                        const val = (row as any)[col.key];

                        if (col.isTag) {
                          return (
                            <td key={col.key} className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700 truncate max-w-[120px]">
                                {val || '—'}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === 'chainage_km') {
                          return (
                            <td key={col.key} className="py-3 px-4 font-semibold text-emerald-400">
                              {typeof val === 'number' ? `Km ${val.toFixed(3)}` : val ? `Km ${val}` : '—'}
                            </td>
                          );
                        }

                        if (col.key === 'code') {
                          return (
                            <td key={col.key} className="py-3 px-4 font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {val || '—'}
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className="py-3 px-4 text-slate-300 max-w-xs truncate">
                            {val || '—'}
                          </td>
                        );
                      })}

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onViewRecord(row)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 transition-colors"
                            title="Inspect JSONB Payload"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditRecord(row)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete record '${row.code || row.name || row.id}' from Supabase?`)) {
                                onDeleteRecord(row.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
