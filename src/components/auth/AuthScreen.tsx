'use client';

import React, { useState } from 'react';
import {
  Scale,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  UserPlus,
  LogIn,
  BadgeCheck,
  Eye,
  EyeOff,
  User,
  Award,
} from 'lucide-react';
import { UserRole, PRESET_USER_PROFILES } from '@/lib/rbac';

interface AuthScreenProps {
  onLoginSuccess: (user: { fullName: string; role: string; email: string }) => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  initialMode = 'LOGIN',
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('TESTING_OFFICER');
  const [regAccreditationId, setRegAccreditationId] = useState('');
  const [regDepartment, setRegDepartment] = useState('Testing & Calibration Division, RRSL');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim()) {
      setError('Please enter your Official Email Address or Employee/Accreditation ID.');
      return;
    }
    if (!loginPassword.trim()) {
      setError('Please enter your security password or PIN.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      onLoginSuccess({
        fullName: data.user.fullName,
        role: data.user.role,
        email: data.user.email,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regFullName.trim() || regFullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@') || !regEmail.includes('.')) {
      setError('Please provide a valid official email address.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          role: regRole,
          accreditationId: regAccreditationId.trim() || undefined,
          department: regDepartment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please check your entries.');
      }

      setSuccessMsg('Account registered successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess({
          fullName: data.user.fullName,
          role: data.user.role,
          email: data.user.email,
        });
      }, 700);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-click preset login for testing & demonstrations
  const handleQuickPresetLogin = async (role: UserRole) => {
    const preset = PRESET_USER_PROFILES[role];
    if (!preset) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: preset.email,
          password: preset.password || 'password123',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess({
          fullName: data.user.fullName,
          role: data.user.role,
          email: data.user.email,
        });
      } else {
        // Fallback to local profile directly
        onLoginSuccess({
          fullName: preset.fullName,
          role: preset.role,
          email: preset.email,
        });
      }
    } catch {
      onLoginSuccess({
        fullName: preset.fullName,
        role: preset.role,
        email: preset.email,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-slate-200 py-10 px-4 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-lg space-y-5">
        {/* Portal Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-800 text-white shadow-md">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 mb-1">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              <span>Ministry of Consumer Affairs &bull; RRSL Legal Metrology</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              NAWI-R76 Laboratory Portal
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-0.5">
              Automated Type Evaluation &amp; TRF Reporting per <strong>OIML R 76-1:2006</strong> and <strong>ISO/IEC 17025:2017</strong>.
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden">
          {/* Sign In vs Register Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/70">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                mode === 'LOGIN'
                  ? 'border-blue-700 text-blue-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Officer Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                mode === 'REGISTER'
                  ? 'border-blue-700 text-blue-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Officer</span>
            </button>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Feedback Messages */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Validation Notice</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Success</strong>
                  <span>{successMsg}</span>
                </div>
              </div>
            )}

            {/* TAB 1: LOGIN FORM */}
            {mode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Email Address or Employee ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 font-mono transition-all"
                      placeholder="e.g. sharma.a@metrology.gov.in"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Security Password or PIN
                    </label>
                    <span className="text-[10px] text-slate-500">Universal demo PIN: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-700">1234</code></span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 transition-all"
                      placeholder="Enter officer security password"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Authenticating Officer...' : 'Authenticate & Enter Laboratory Station'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER NEW OFFICER FORM */}
            {mode === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Officer Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 transition-all"
                      placeholder="e.g. Dr. Rajesh Kumar"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 transition-all"
                        placeholder="rajesh.k@metrology.gov.in"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Statutory Lab Role (ISO 17025) *
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 transition-all cursor-pointer font-medium"
                    >
                      <option value="TESTING_OFFICER">Testing Officer (DAQ &amp; Tests)</option>
                      <option value="TECHNICAL_REVIEWER">Technical Reviewer (Peer Audit)</option>
                      <option value="LEAD_METROLOGIST">Lead Metrologist (Signatory)</option>
                      <option value="LABORATORY_DIRECTOR">Laboratory Director (Legal Head)</option>
                      <option value="AUDITOR_INSPECTOR">Quality Auditor (Compliance)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Accreditation / Employee ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regAccreditationId}
                        onChange={(e) => setRegAccreditationId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 font-mono transition-all"
                        placeholder="e.g. RRSL-MET-2026-45"
                      />
                      <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department / Laboratory Division
                    </label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 transition-all"
                      placeholder="Testing Division, RRSL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 transition-all"
                        placeholder="Min 6 characters"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 transition-all"
                        placeholder="Re-enter password"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering Account...' : 'Create Officer Account & Sign In'}</span>
                </button>
              </form>
            )}

            {/* Quick Demo Officer Switcher */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Quick Testing Accounts:</span>
                <span className="text-[10px] text-slate-400">1-click login</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPresetLogin('LEAD_METROLOGIST')}
                  className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-all cursor-pointer group"
                >
                  <div className="text-[10px] font-bold text-blue-900 group-hover:text-blue-950 truncate">Dr. A. Sharma</div>
                  <div className="text-[9px] text-blue-700 truncate">Lead Metrologist</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetLogin('TESTING_OFFICER')}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-left transition-all cursor-pointer group"
                >
                  <div className="text-[10px] font-bold text-emerald-900 group-hover:text-emerald-950 truncate">Amit Verma</div>
                  <div className="text-[9px] text-emerald-700 truncate">Testing Officer</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetLogin('TECHNICAL_REVIEWER')}
                  className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-left transition-all cursor-pointer group"
                >
                  <div className="text-[10px] font-bold text-purple-900 group-hover:text-purple-950 truncate">Priya Patel</div>
                  <div className="text-[9px] text-purple-700 truncate">Tech Reviewer</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetLogin('LABORATORY_DIRECTOR')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition-all cursor-pointer group"
                >
                  <div className="text-[10px] font-bold text-amber-900 group-hover:text-amber-950 truncate">Dr. V. Roy</div>
                  <div className="text-[9px] text-amber-700 truncate">Lab Director</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Metrology Statutory Footnote */}
        <div className="text-center space-y-1 text-[11px] text-slate-500">
          <p>
            Regional Reference Standard Laboratory (RRSL) &bull; National Physical Laboratory Traceability
          </p>
          <p className="text-slate-400 text-[10px]">
            Strict adherence to ISO/IEC 17025:2017 &bull; Legal Metrology Act, 2009 &bull; Legal Metrology (General) Rules, 2011
          </p>
        </div>
      </div>
    </div>
  );
};
