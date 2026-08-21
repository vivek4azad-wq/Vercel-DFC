/**
 * Navigation Sidebar & Mobile Bottom Navigation
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AboutModal } from './AboutModal.tsx';
import {
  BarChart3,
  Search,
  MapPin,
  AlertTriangle,
  Users,
  ShieldCheck,
  QrCode,
  Layers,
  Sparkles,
  Grid,
  Compass,
  UserCheck,
  Info,
  CalendarCheck,
  HardHat,
  Package,
  Key,
  ShieldAlert,
  Activity
} from 'lucide-react';

import { DGRStaffFinderModal } from './DGRStaffFinderModal.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { role, currentAppRole } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDgrFinderOpen, setIsDgrFinderOpen] = useState(false);
  const isSuperAdmin = role === 'SUPER_ADMIN' || (currentAppRole as string) === 'APM' || currentAppRole === 'Admin';

  const navItems = useMemo(() => {
    const masterNavItems = [
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      shortLabel: 'Analytics',
      icon: BarChart3,
      badge: 'Visual'
    },
    {
      id: 'linear',
      label: 'Linear Track Diagram',
      shortLabel: 'Linear',
      icon: Layers,
      badge: 'Schematic'
    },
    {
      id: 'categories',
      label: 'Assets Categories',
      shortLabel: 'Categories',
      icon: Grid,
      badge: '8 Groups'
    },
    {
      id: 'kmfinder',
      label: 'Km Quick Finder',
      shortLabel: 'Km Finder',
      icon: Search,
      badge: '88.68 Km'
    },
    {
      id: 'gpsmap',
      label: 'GPS Bridges Map',
      shortLabel: 'Bridges',
      icon: Compass,
      badge: '144 GPS'
    },
    {
      id: 'pway_work',
      label: 'P-Way Work & 1+15 Gang',
      shortLabel: 'P-Way Work',
      icon: HardHat,
      badge: '1+15 Gang'
    },
    {
      id: 'store',
      label: 'Store & Tool Depot',
      shortLabel: 'Store ERP',
      icon: Package,
      badge: 'Depot'
    },
    {
      id: 'attendance',
      label: 'Daily Attendance & Absentee',
      shortLabel: 'Attendance',
      icon: CalendarCheck,
      badge: 'ERP Roster'
    },
    {
      id: 'staff',
      label: 'Staff & Personnel ERP',
      shortLabel: 'Staff ERP',
      icon: Users,
      badge: '82 Staff'
    },
    {
      id: 'defects',
      label: 'Track Defects Logs',
      shortLabel: 'Defects',
      icon: AlertTriangle,
      badge: '48 Logs'
    },
    {
      id: 'login_profile',
      label: 'Login & User Profile',
      shortLabel: 'Profile',
      icon: UserCheck,
      badge: 'RBAC'
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'staff_logins',
            label: 'Staff Logins & Roles',
            shortLabel: 'User Roles',
            icon: Key,
            badge: 'Supabase'
          },
          {
            id: 'admin',
            label: 'Super Admin Panel',
            shortLabel: 'Admin Panel',
            icon: ShieldAlert,
            badge: 'Master'
          }
        ]
      : [])
  ];

    if (isSuperAdmin) {
      // 👑 Super Admin / APM: Full unrestricted access to ALL master modules (Store, Analytics, Assets, etc.)
      return masterNavItems;
    }

    if (currentAppRole === 'Clerk') {
      // 🔒 Clerk: Only able to see absentee statement & mark present/absent accordingly
      return [
        {
          id: 'attendance',
          label: 'Staff Attendance & Roster',
          shortLabel: 'Attendance',
          icon: CalendarCheck,
          badge: 'Daily'
        },
        {
          id: 'staff',
          label: 'Staff Directory',
          shortLabel: 'Staff',
          icon: Users,
          badge: '82'
        },
        {
          id: 'kmfinder',
          label: 'Km Quick Finder',
          shortLabel: 'Km Finder',
          icon: Search,
          badge: 'Quick'
        }
      ];
    }

    if (currentAppRole === 'MTS' || role === 'STAFF') {
      // 🔒 MTS: Quick search, linear diagram, and P.way gang entry
      return [
        {
          id: 'kmfinder',
          label: 'Km Quick Finder',
          shortLabel: 'Km Finder',
          icon: Search,
          badge: 'Quick'
        },
        {
          id: 'diagram',
          label: 'Track Schematic Diagram',
          shortLabel: 'Linear View',
          icon: Activity,
          badge: '88.6Km'
        },
        {
          id: 'pway_work',
          label: 'P.Way Work (1+15 Gang)',
          shortLabel: 'P.Way',
          icon: HardHat,
          badge: 'Field'
        },
        {
          id: 'attendance',
          label: 'My Daily Attendance',
          shortLabel: 'Attendance',
          icon: CalendarCheck,
          badge: 'Own'
        }
      ];
    }

    if (currentAppRole === 'StoreKeeper' || role === 'STORE_KEEPER') {
      // 🔒 Store Keeper: only able to see the store related services
      return [
        {
          id: 'store',
          label: 'Store & Tool Depot',
          shortLabel: 'Store ERP',
          icon: Package,
          badge: 'Stock'
        },
        {
          id: 'kmfinder',
          label: 'Km Quick Finder',
          shortLabel: 'Km Finder',
          icon: Search,
          badge: 'Finder'
        }
      ];
    }

    if (currentAppRole === 'Guest') {
      // 🔒 Guest: View-only guest mode
      return [
        {
          id: 'kmfinder',
          label: 'Km Quick Finder',
          shortLabel: 'Km Finder',
          icon: Search,
          badge: 'Quick'
        },
        {
          id: 'diagram',
          label: 'Track Schematic Diagram',
          shortLabel: 'Linear View',
          icon: Activity,
          badge: '88.6Km'
        },
        {
          id: 'staff',
          label: 'Staff Directory',
          shortLabel: 'Staff',
          icon: Users,
          badge: '82'
        }
      ];
    }

    if (currentAppRole === 'Sectional' || currentAppRole === 'Executive') {
      // 🔒 Sectional: no edits to assets/staff, can see and modify work of Clerk and MTS
      return [
        {
          id: 'kmfinder',
          label: 'Km Quick Finder',
          shortLabel: 'Km Finder',
          icon: Search,
          badge: 'Quick'
        },
        {
          id: 'diagram',
          label: 'Track Schematic Diagram',
          shortLabel: 'Linear View',
          icon: Activity,
          badge: '88.6Km'
        },
        {
          id: 'pway_work',
          label: 'P.Way Work (1+15 Gang)',
          shortLabel: 'P.Way',
          icon: HardHat,
          badge: 'Review'
        },
        {
          id: 'attendance',
          label: 'Staff Attendance & Roster',
          shortLabel: 'Attendance',
          icon: CalendarCheck,
          badge: 'Review'
        },
        {
          id: 'staff',
          label: 'Staff Directory (View)',
          shortLabel: 'Staff',
          icon: Users,
          badge: '82'
        },
        {
          id: 'defects',
          label: 'Track Defects Logs',
          shortLabel: 'Defects',
          icon: AlertTriangle,
          badge: 'Logs'
        }
      ];
    }

    return masterNavItems;
  }, [currentAppRole, role, isSuperAdmin]);

  return (
    <>
      {/* Desktop & Tablet Sidebar (Sticky Frozen) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 space-y-6 transition-colors duration-200 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto z-30">
        <div>
          {/* 📁 DGR Staff Directory & Finder Trigger */}
          <button
            type="button"
            onClick={() => setIsDgrFinderOpen(true)}
            className="w-full mb-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition active:scale-95 cursor-pointer border border-white/20"
            title="Search all other staff contacts, AWPO ID, mobile and email from DGR repository"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-200" />
              <span>DGR Staff Finder</span>
            </div>
            <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">70 DGR</span>
          </button>

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8] px-3 mb-2">
            Operations &amp; Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-[#7dd3fc] border border-blue-200 dark:border-blue-500/50 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#bae6fd] hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700 dark:text-[#38bdf8]' : 'text-slate-500 dark:text-[#94a3b8]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive
                          ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-[#7dd3fc] font-bold border border-transparent dark:border-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-[#94a3b8]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section Range Info Card */}
        <div className="mt-auto space-y-2">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-[#7dd3fc]">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-[#38bdf8]" />
              <span>IMSD SMUN Unit</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 dark:text-[#94a3b8]">
              <div className="flex justify-between">
                <span>Main Line:</span>
                <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">1167.210 – 1249.720</span>
              </div>
              <div className="flex justify-between">
                <span>Link Line:</span>
                <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">6.169 Km</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Total Span:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">88.679 Km</span>
              </div>
            </div>
          </div>

          {/* About App Developer Link */}
          <button
            onClick={() => setIsAboutOpen(true)}
            className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-xl text-[11px] text-slate-700 dark:text-[#94a3b8] hover:text-blue-700 dark:hover:text-[#7dd3fc] transition flex items-center justify-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-[#38bdf8]" />
            <span>About App &amp; Developer</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center justify-start gap-1.5 min-w-max px-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-[#38bdf8] font-bold border border-blue-200 dark:border-blue-500/40 shadow-sm'
                    : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-blue-700 dark:text-[#38bdf8]' : 'text-slate-500 dark:text-[#94a3b8]'}`} />
                <span className="whitespace-nowrap">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* DGR Staff Finder Modal */}
      <DGRStaffFinderModal isOpen={isDgrFinderOpen} onClose={() => setIsDgrFinderOpen(false)} />
    </>
  );
};
