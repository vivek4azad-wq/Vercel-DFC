import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Shield,
  User,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Users
} from 'lucide-react';
import dgrStaffData from '../data/dgrStaffData.json';

interface DGRStaffRecord {
  awpo: string;
  name: string;
  father: string;
  beat: string;
  km: string;
  phone: string;
  designation: string;
  address: string;
  district: string;
  emergency: string;
  email: string;
  photo?: string;
  stations?: Array<{
    code: string;
    name: string;
    km: number;
    phone: string;
  }>;
  qr?: string;
}

interface DGRStaffFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DGRStaffFinderModal: React.FC<DGRStaffFinderModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const staffList = (dgrStaffData as DGRStaffRecord[]) || [];

  // Available Designations
  const designations = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach(s => {
      if (s.designation) set.add(s.designation.toUpperCase().trim());
    });
    return Array.from(set);
  }, [staffList]);

  // Filtered staff records
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return staffList.filter(s => {
      // Filter by designation
      if (selectedDesignation !== 'ALL') {
        if ((s.designation || '').toUpperCase().trim() !== selectedDesignation) {
          return false;
        }
      }

      if (!q) return true;

      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const awpoMatch = (s.awpo || '').toLowerCase().includes(q);
      const phoneMatch = (s.phone || '').includes(q);
      const emergMatch = (s.emergency || '').includes(q);
      const beatMatch = (s.beat || '').toLowerCase().includes(q);
      const kmMatch = (s.km || '').toLowerCase().includes(q);
      const desigMatch = (s.designation || '').toLowerCase().includes(q);
      const addrMatch = (s.address || '').toLowerCase().includes(q);
      const emailMatch = (s.email || '').toLowerCase().includes(q);

      return (
        nameMatch ||
        awpoMatch ||
        phoneMatch ||
        emergMatch ||
        beatMatch ||
        kmMatch ||
        desigMatch ||
        addrMatch ||
        emailMatch
      );
    });
  }, [staffList, searchQuery, selectedDesignation]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d3567] via-[#176dbe] to-[#0a2850] p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl border border-white/20 shadow-inner">
              <Users className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  DFCCIL Personnel &amp; DGR Staff Directory Finder
                </h3>
                <span className="px-2 py-0.5 bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 rounded-full text-[10px] font-mono font-bold">
                  {staffList.length} Total Records
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Quick search for any staff contact, AWPO ID, mobile numbers, emergency phones, beats &amp; emails
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition active:scale-95 cursor-pointer"
            title="Close Finder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search staff by Name, AWPO ID, Phone No., Beat, Designation, Address or Email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Designation Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDesignation('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                selectedDesignation === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              All Roles ({staffList.length})
            </button>
            {designations.map(desig => {
              const count = staffList.filter(s => (s.designation || '').toUpperCase().trim() === desig).length;
              return (
                <button
                  key={desig}
                  type="button"
                  onClick={() => setSelectedDesignation(desig)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                    selectedDesignation === desig
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {desig} ({count})
                </button>
              );
            })}
            <div className="ml-auto text-xs text-slate-500 font-mono">
              Showing <span className="font-bold text-blue-600 dark:text-cyan-400">{filteredStaff.length}</span> results
            </div>
          </div>
        </div>

        {/* Staff Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-900/60">
          {filteredStaff.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No matching staff found for "{searchQuery}"
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Try searching with a partial name, 5-digit AWPO ID (e.g. 53863, 46536), or phone number.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDesignation('ALL');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow transition hover:bg-blue-700"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff, idx) => {
                const uniqueKey = `${staff.awpo}-${idx}`;
                const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');
                const cleanEmerg = (staff.emergency || '').replace(/[^0-9]/g, '');

                return (
                  <div
                    key={uniqueKey}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    {/* Top Row: Photo & Main Info */}
                    <div className="flex items-start gap-3">
                      {staff.photo ? (
                        <img
                          src={staff.photo}
                          alt={staff.name}
                          className="w-14 h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shadow-sm shrink-0 bg-slate-100"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-16 rounded-xl bg-blue-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <User className="w-6 h-6 text-blue-400" />
                          <span className="text-[9px] font-bold mt-1">NO PIC</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {staff.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded-md font-bold text-[10px] uppercase font-mono shrink-0">
                            {staff.designation || 'STAFF'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 font-mono">
                          <span>AWPO ID:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{staff.awpo || '-'}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(staff.awpo, `awpo-${uniqueKey}`)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition"
                            title="Copy AWPO ID"
                          >
                            {copiedId === `awpo-${uniqueKey}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {staff.father && (
                          <div className="text-[11px] text-slate-500 truncate">
                            S/o: <span className="font-medium text-slate-700 dark:text-slate-300">{staff.father}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Beat & Jurisdiction details */}
                    {(staff.beat || staff.km) && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs">
                        {staff.beat && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Beat / Assignment:</span>
                            <span className="font-bold text-blue-700 dark:text-cyan-400">{staff.beat}</span>
                          </div>
                        )}
                        {staff.km && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Chainage Range:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{staff.km}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact details */}
                    <div className="space-y-1.5 text-xs">
                      {/* Primary Phone */}
                      {cleanPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>Mobile:</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${cleanPhone}`}
                              className="font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              {staff.phone}
                            </a>
                            <a
                              href={`https://wa.me/91${cleanPhone.replace(/^91/, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 text-[10px] font-bold"
                              title="Chat on WhatsApp"
                            >
                              WA
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Emergency Phone */}
                      {cleanEmerg && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span>Emergency:</span>
                          </span>
                          <a
                            href={`tel:${cleanEmerg}`}
                            className="font-mono font-bold text-red-600 dark:text-red-400 hover:underline"
                          >
                            {staff.emergency}
                          </a>
                        </div>
                      )}

                      {/* Email */}
                      {staff.email && staff.email.trim() && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-blue-500" />
                            <span>Email:</span>
                          </span>
                          <a
                            href={`mailto:${staff.email.trim()}`}
                            className="font-mono text-[11px] text-blue-600 dark:text-cyan-400 hover:underline truncate max-w-[170px]"
                            title={staff.email}
                          >
                            {staff.email.trim()}
                          </a>
                        </div>
                      )}

                      {/* Address */}
                      {staff.address && (
                        <div className="text-[11px] text-slate-500 flex items-start gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate" title={staff.address}>
                            {staff.address.replace(/\n/g, ', ')} {staff.district ? `(${staff.district})` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700/80">
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/91${cleanPhone.replace(/^91/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {staff.email && (
                        <a
                          href={`mailto:${staff.email}`}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 border border-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Data Source: <strong className="text-slate-800 dark:text-slate-200">DGR Staff Repository</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
