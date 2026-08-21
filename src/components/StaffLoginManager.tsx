/**
 * Staff Login & User Role Management
 * DFCCIL IMSD SMUN Unit
 * Dedicated interface to create, manage, and assign roles for all portal users in Supabase
 */

import React, { useState, useEffect } from 'react';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Mail,
  Building2,
  Trash2,
  Edit,
  CheckCircle2,
  Lock,
  Search,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import type { UserAccount, UserRole, AppUserRole } from '../types/index.ts';

export const StaffLoginManager: React.FC = () => {
  const { role, currentUser } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    pin: '',
    role: 'STAFF' as UserRole,
    appRole: 'FIELD_STAFF' as AppUserRole,
    designation: '',
    department: 'CIVIL',
    unit: 'IMSD SMUN',
    phone: '',
    active: true
  });
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const userList = await db.getCollection<UserAccount>('users');
      setUsers(userList || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      id: `USR-${Date.now().toString().slice(-6)}`,
      name: '',
      email: '',
      pin: '',
      role: 'STAFF' as UserRole,
      appRole: 'MTS' as AppUserRole,
      designation: 'Track Maintainer / MTS',
      department: 'CIVIL',
      unit: 'IMSD SMUN',
      phone: '',
      active: true
    });
    setFormMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      id: user.id || user.userId,
      name: user.name,
      email: user.email || '',
      pin: user.pin || '',
      role: user.role,
      appRole: (user.appRole as AppUserRole) || 'MTS',
      designation: user.designation || '',
      department: user.department || 'CIVIL',
      unit: user.unit || 'IMSD SMUN',
      phone: user.phone || '',
      active: user.isActive ?? user.active ?? true
    });
    setFormMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.pin.trim()) {
      setFormMsg({ type: 'error', text: 'Name, Official Email / User ID, and Security PIN are required.' });
      return;
    }

    if (formData.pin.trim().length !== 6 || !/^\d{6}$/.test(formData.pin.trim())) {
      setFormMsg({ type: 'error', text: 'Security PIN must be exactly 6 numeric digits (e.g. 120199 / 887267).' });
      return;
    }

    // Duplicate check for email / ID
    const duplicate = users.find(
      u => (u.email || '').toLowerCase() === formData.email.trim().toLowerCase() && u.id !== formData.id && u.userId !== formData.id
    );
    if (duplicate) {
      setFormMsg({
        type: 'error',
        text: `⚠️ Duplicate Error: User ID / Email "${formData.email}" is already registered for "${duplicate.name}"!`
      });
      return;
    }

    setIsSaving(true);
    try {
      const userPayload: UserAccount = {
        id: formData.id,
        userId: formData.id,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        pin: formData.pin.trim(),
        role: formData.role,
        appRole: formData.appRole,
        designation: formData.designation.trim() || 'Staff',
        department: formData.department,
        unit: formData.unit,
        phone: formData.phone.trim(),
        isActive: formData.active,
        active: formData.active,
        isLocked: false,
        failedLoginAttempts: 0,
        qrCodeId: `QR-${formData.id}`,
        createdAt: editingUser?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingUser) {
        await db.updateDocument('users', formData.id, userPayload);
      } else {
        await db.addDocument('users', userPayload);
      }

      await loadUsers();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormMsg({ type: 'error', text: `Failed to save user: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockUser = async (user: UserAccount) => {
    if (!window.confirm(`Unlock account for "${user.name}" (${user.userId || user.email}) and reset failed attempts to 0?`)) {
      return;
    }
    try {
      const unlocked: UserAccount = {
        ...user,
        isLocked: false,
        failedLoginAttempts: 0,
        isActive: true,
        active: true,
        updatedAt: new Date().toISOString()
      };
      await db.updateDocument('users', user.id, unlocked);
      await loadUsers();
      alert(`✅ Account "${user.name}" is now UNLOCKED and active!`);
    } catch (err: any) {
      alert(`Failed to unlock user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (user.role === 'SUPER_ADMIN' && users.filter(u => u.role === 'SUPER_ADMIN').length <= 1) {
      alert('Cannot delete the sole Super Admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete login account for "${user.name}" (${user.email})?`)) {
      return;
    }
    try {
      await db.deleteDocument('users', user.id);
      await loadUsers();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-2xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Staff Login &amp; Role Management</span>
              <span className="text-xs px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-mono">
                Supabase dfc_users
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create official login credentials, assign RBAC access roles, and manage PIN codes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Staff Login</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email/user ID, designation..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filter Role:</span>
          <select
            value={selectedRoleFilter}
            onChange={e => setSelectedRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="SUPER_ADMIN">Super Admin (APM)</option>
            <option value="OFFICER">Field Officer (SSE/AXEN)</option>
            <option value="STORE_KEEPER">Store Keeper</option>
            <option value="STAFF">Field Staff / MTS</option>
          </select>
        </div>
      </div>

      {/* Users Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const isUserAdmin = user.role === 'SUPER_ADMIN';
          const isOfficer = user.role === 'OFFICER';
          const isStore = user.role === 'STORE_KEEPER';

          return (
            <div
              key={user.id}
              className={`p-5 rounded-2xl border transition shadow-lg relative flex flex-col justify-between space-y-4 ${
                isUserAdmin
                  ? 'bg-gradient-to-b from-purple-950/30 to-slate-900 border-purple-500/40'
                  : isOfficer
                  ? 'bg-gradient-to-b from-blue-950/30 to-slate-900 border-blue-500/40'
                  : isStore
                  ? 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isUserAdmin
                          ? 'bg-purple-600 text-white'
                          : isOfficer
                          ? 'bg-blue-600 text-white'
                          : isStore
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{user.name}</h3>
                      <p className="text-xs text-slate-400">{user.designation || 'Staff'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {user.isLocked || (user.failedLoginAttempts || 0) >= 10 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500 animate-pulse">
                        🚨 LOCKED ({user.failedLoginAttempts || 10} FAILED)
                      </span>
                    ) : null}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                        isUserAdmin
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : isOfficer
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : isStore
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Login ID / Email:
                    </span>
                    <span className="font-mono text-white select-all">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" /> Security PIN:
                    </span>
                    <span className="font-mono text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                      {user.pin || '••••••'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Unit:
                    </span>
                    <span className="text-slate-300">{user.unit || 'IMSD SMUN'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2 flex-wrap">
                {(user.isLocked || (user.failedLoginAttempts || 0) >= 10) && (
                  <button
                    type="button"
                    onClick={() => handleUnlockUser(user)}
                    className="py-1.5 px-3 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    title="Unlock Account & Reset Failed Attempts to 0"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-300" />
                    <span>🔓 Unlock &amp; Reset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(user)}
                  className="py-1.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Login &amp; Role</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(user)}
                  className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition"
                  title="Delete User"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUser ? 'Edit Staff Login & Role' : 'Create New Staff Login Account'}
                  </h3>
                  <p className="text-xs text-slate-400">Save credentials directly to Supabase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    formMsg.type === 'error'
                      ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  }`}
                >
                  {formMsg.text}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Staff Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Shri Rajesh Sharma / Gurdeep Singh"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Official Email / User ID *</label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rsharma@dfcc.co.in or OFF-002"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Security Login PIN (6 Digits) *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 120199 / 999999"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">RBAC Role *</label>
                  <select
                    value={formData.role}
                    onChange={e => {
                      const r = e.target.value as UserRole;
                      let appRole: AppUserRole = 'MTS';
                      if (r === 'SUPER_ADMIN') appRole = 'APM';
                      else if (r === 'OFFICER') appRole = 'Executive';
                      else if (r === 'STORE_KEEPER') appRole = 'StoreKeeper';
                      setFormData({ ...formData, role: r, appRole });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (APM / Full Access)</option>
                    <option value="OFFICER">FIELD OFFICER (SSE / AXEN)</option>
                    <option value="STORE_KEEPER">STORE KEEPER (Inventory / Tally)</option>
                    <option value="STAFF">FIELD STAFF (Track Maintainer / MTS)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. SSE / P-Way, Patrolman, MTS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Unit / Station</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="IMSD SMUN"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Contact Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="94XXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20"
                >
                  {isSaving ? 'Saving to Supabase...' : editingUser ? 'Update Account' : 'Create Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
