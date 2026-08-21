import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, Key, User, CheckCircle2, AlertTriangle, X, Lock, MessageSquare, UserPlus } from 'lucide-react';
import { WhatsAppPinResetModal } from './WhatsAppPinResetModal.tsx';
import type { AppUserRole } from '../types/index.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, signUp, currentUser, role } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppResetOpen, setIsWhatsAppResetOpen] = useState(false);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmpId, setSignupEmpId] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDesignation, setSignupDesignation] = useState('MTS / Track Maintainer');
  const [signupRole, setSignupRole] = useState<AppUserRole>('MTS');
  const [signupPin, setSignupPin] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Please enter your Official Mobile No., Employee ID, or Email.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your 6-digit Security PIN or password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier.trim(), pin.trim());
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Login failed. Invalid ID, PIN or Password.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccessMsg(null);
    if (!signupName.trim()) {
      setSignupError('Please enter Staff Full Name.');
      return;
    }
    if (!signupPhone.trim() && !signupEmpId.trim() && !signupEmail.trim()) {
      setSignupError('Please enter Mobile Number or Employee ID.');
      return;
    }
    if (!signupPin.trim() || signupPin.trim().length < 4) {
      setSignupError('Please create a 6-digit Security PIN or password (min 4 characters).');
      return;
    }

    setIsSigningUp(true);
    try {
      const res = await signUp({
        name: signupName.trim(),
        employeeId: signupEmpId.trim() || undefined,
        phone: signupPhone.trim(),
        email: signupEmail.trim() || undefined,
        designation: signupDesignation,
        role: signupRole,
        pin: signupPin.trim()
      });

      if (res.success) {
        setSignupSuccessMsg(res.message || 'Registration successful!');
        setIdentifier(signupEmpId || signupPhone || signupEmail);
        setPin(signupPin);
        setTimeout(() => {
          setAuthMode('signin');
        }, 1500);
      } else {
        setSignupError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setSignupError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">DFCCIL IMSD Authentication</h2>
              <p className="text-xs text-slate-400">Role-Based Access Control Gate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        {currentUser && (
          <div className="bg-slate-950/60 px-5 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-400">Active Profile:</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                role === 'SUPER_ADMIN' ? 'bg-purple-400' : role === 'OFFICER' ? 'bg-blue-400' : 'bg-emerald-400'
              }`} />
              {currentUser.name} ({role})
            </span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="px-6 pt-4 pb-0 shrink-0">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                authMode === 'signin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setSignupError(null); setSignupSuccessMsg(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
                authMode === 'signup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up (New Staff)</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* 1. SIGN IN TAB */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-fadeIn">
              {error && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="whitespace-pre-line leading-relaxed">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Mobile No. / Employee ID / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Official Mobile No. / Employee ID / Email"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    6-Digit Security PIN or Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsWhatsAppResetOpen(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline font-medium flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Generate / Change PIN</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="Enter 6-Digit PIN or Password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
              </button>
            </form>
          )}

          {/* 2. SIGN UP TAB */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5 animate-fadeIn">
              {signupError && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="whitespace-pre-line leading-relaxed">{signupError}</div>
                </div>
              )}
              {signupSuccessMsg && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{signupSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Staff Full Name <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile No. <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit Mobile"
                    value={signupPhone}
                    onChange={e => setSignupPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Emp / AWPO ID:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 105960"
                    value={signupEmpId}
                    onChange={e => setSignupEmpId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Official Email (Optional):
                </label>
                <input
                  type="email"
                  placeholder="e.g. staff@dfcc.co.in"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Role Applied For:
                  </label>
                  <select
                    value={signupRole}
                    onChange={e => setSignupRole(e.target.value as AppUserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="MTS">MTS / Gang Maintainer</option>
                    <option value="Clerk">Clerk (Attendance)</option>
                    <option value="StoreKeeper">Store Keeper (Depot)</option>
                    <option value="Sectional">Sectional Executive</option>
                    <option value="Guest">Guest / Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Designation:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Track Maintainer"
                    value={signupDesignation}
                    onChange={e => setSignupDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Create 6-Digit PIN or Password <span className="text-red-400">*</span>:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Set 6-Digit PIN or Password"
                  value={signupPin}
                  onChange={e => setSignupPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black rounded-xl transition shadow-lg disabled:opacity-50"
              >
                {isSigningUp ? 'Creating Account...' : 'Register & Create Account'}
              </button>
            </form>
          )}

          <WhatsAppPinResetModal
            isOpen={isWhatsAppResetOpen}
            onClose={() => setIsWhatsAppResetOpen(false)}
            initialUserIdOrPhone={identifier}
          />
        </div>
      </div>
    </div>
  );
};
