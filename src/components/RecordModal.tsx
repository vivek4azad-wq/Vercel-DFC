import React, { useState, useEffect } from 'react';
import { SupabaseRow, TableKey, TABLE_CONFIGS } from '../types';
import {
  X,
  Code,
  Save,
  Trash2,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableKey: TableKey;
  record: SupabaseRow | null;
  mode: 'VIEW' | 'EDIT' | 'ADD';
  onSave: (tableKey: TableKey, row: Partial<SupabaseRow>) => Promise<boolean>;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  tableKey,
  record,
  mode,
  onSave
}) => {
  if (!isOpen) return null;

  const config = TABLE_CONFIGS[tableKey] || TABLE_CONFIGS.bridges;
  const [formData, setFormData] = useState<Partial<SupabaseRow>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [jsonViewTab, setJsonViewTab] = useState<'FORM' | 'JSON'>('FORM');

  useEffect(() => {
    if (mode === 'ADD') {
      setFormData({
        id: `${config.key}_${Date.now()}`,
        name: '',
        code: '',
        category: '',
        section: 'SMUN-CHAN',
        station: 'SMUN',
        chainage_km: 1170.000,
        status: 'ACTIVE',
        payload: {}
      });
    } else if (record) {
      setFormData({ ...record });
    }
  }, [record, mode, config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const ok = await onSave(tableKey, formData);
      if (ok) {
        onClose();
      } else {
        setSaveError('Failed to save record to Supabase. Please check table permissions.');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error saving record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
              {config.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {mode === 'ADD' ? 'Add New Record' : mode === 'EDIT' ? 'Edit Record' : 'Record Details'}
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-indigo-400 border border-slate-700">
                  {config.tableName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {formData.code || formData.name || formData.id || 'Supabase PostgreSQL Table Row'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setJsonViewTab('FORM')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded ${
                  jsonViewTab === 'FORM' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Form
              </button>
              <button
                type="button"
                onClick={() => setJsonViewTab('JSON')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded ${
                  jsonViewTab === 'JSON' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {saveError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{saveError}</span>
            </div>
          )}

          {jsonViewTab === 'JSON' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>PostgreSQL JSONB Payload</span>
                <span>ID: {formData.id}</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono overflow-x-auto max-h-96">
                {JSON.stringify(formData.payload || formData, null, 2)}
              </pre>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="record-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Code / Asset No / Item Code
                  </label>
                  <input
                    type="text"
                    disabled={mode === 'VIEW'}
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Name / Description / Title
                  </label>
                  <input
                    type="text"
                    disabled={mode === 'VIEW'}
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Category / Type / Designation
                  </label>
                  <input
                    type="text"
                    disabled={mode === 'VIEW'}
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Km Location (Chainage)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    disabled={mode === 'VIEW'}
                    value={formData.chainage_km ?? ''}
                    onChange={e => setFormData({ ...formData, chainage_km: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Section / Block Section
                  </label>
                  <input
                    type="text"
                    disabled={mode === 'VIEW'}
                    value={formData.section || ''}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Station / Duty Unit
                  </label>
                  <input
                    type="text"
                    disabled={mode === 'VIEW'}
                    value={formData.station || ''}
                    onChange={e => setFormData({ ...formData, station: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Status
                </label>
                <select
                  disabled={mode === 'VIEW'}
                  value={formData.status || 'ACTIVE'}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="MONITORED">MONITORED</option>
                </select>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            {formData.id ? `Record ID: ${formData.id}` : ''}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
            {mode !== 'VIEW' && (
              <button
                type="submit"
                form="record-form"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving to Supabase...' : 'Save to Supabase'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
