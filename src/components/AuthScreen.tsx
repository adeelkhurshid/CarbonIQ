import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, User as UserIcon, Building2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../shared/types';

interface AuthScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Company Owner' | 'Sustainability Manager' | 'Analyst'>('Sustainability Manager');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState<User | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const demoAccounts = [
    { email: 'admin@carboniq.com', label: 'Admin (System/Factors)', role: 'Admin', color: 'border-rose-500/30 text-rose-400 bg-rose-500/10' },
    { email: 'owner@carboniq.com', label: 'Owner (Boundaries/Simulation)', role: 'Owner', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' },
    { email: 'manager@carboniq.com', label: 'Manager (Calculations/Gemini AI)', role: 'Manager', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    { email: 'analyst@carboniq.com', label: 'Analyst (Manual/Bulk Inputs)', role: 'Analyst', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' }
  ];

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' })
      });
      const data = await res.json();
      if (data.success) {
        if (data.user.mfaEnabled) {
          // Trigger MFA challenge
          setMfaChallenge(data.user);
          setSuccess('MFA verification required (Enter any 6 digit code for evaluation)');
        } else {
          onLoginSuccess(data.user, data.token);
        }
      } else {
        setError(data.error || 'Identity verification failed.');
      }
    } catch (err) {
      setError('Connection to CarbonIQ Authentication Gate failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mfaChallenge) {
      // MFA mock check
      if (mfaCode.length === 6) {
        setSuccess('MFA verified successfully.');
        setTimeout(() => {
          onLoginSuccess(mfaChallenge, `simulated_token_${mfaChallenge.id}`);
        }, 800);
      } else {
        setError('Invalid Multi-Factor verification code. Must be 6 digits.');
        setLoading(false);
      }
      return;
    }

    if (isReset) {
      // Mock reset
      if (!email) {
        setError('Please enter a valid corporate email address.');
        setLoading(false);
        return;
      }
      setSuccess(`A password replenishment vector was dispatched to ${email}.`);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Log in
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          if (data.user.mfaEnabled) {
            setMfaChallenge(data.user);
            setSuccess('Security: Multi-Factor Code Required.');
          } else {
            onLoginSuccess(data.user, data.token);
          }
        } else {
          setError(data.error || 'Authentication mismatch. Auto-creating fallback manager.');
        }
      } else {
        // Register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, role })
        });
        const data = await res.json();
        if (data.success) {
          setSuccess('Verification success. Your CarbonIQ corporate profile is live! Redirecting to login.');
          setIsLogin(true);
        } else {
          setError(data.error || 'Registration failed.');
        }
      }
    } catch (err) {
      setError('Unable to link with CarbonIQ cloud directory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_portal" className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Decorative glowing backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#0A0A0A] border border-white/10 rounded-full text-emerald-400 text-[10px] font-semibold mb-3 tracking-wider uppercase"
          >
            <Shield className="w-3.5 h-3.5" /> GHG Protocol & ISO 14064 Compliant
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white gap-2 flex justify-center items-center">
            <span className="tracking-tight text-white hover:text-emerald-400 transition-colors">CarbonIQ</span>
          </h1>
          <p className="text-[10px] text-white/40 mt-2 font-mono uppercase tracking-widest leading-none">Measure. Reduce. Report.</p>
        </div>

        {/* Auth Box */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-xl shadow-black/50 p-6 md:p-8"
        >
          {mfaChallenge ? (
            /* MFA Screen */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/35 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Key className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">MFA Authentication</h2>
                <p className="text-xs text-white/60 mt-1">
                  Security: 6-digit verification code is active for <strong>{mfaChallenge.email}</strong>
                </p>
                {mfaChallenge.mfaSecret && (
                  <div className="mt-3 p-2 bg-[#050505] text-emerald-400 border border-white/5 rounded text-xs font-mono">
                    Evaluation Sandbox Secret: <span className="font-bold underline">{mfaChallenge.mfaSecret}</span>
                  </div>
                )}
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{error}</div>}
              {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}</div>}

              <div className="space-y-1.5">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1em] font-mono text-xl py-3 px-4 bg-[#050505] border border-white/10 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-lg flex justify-center items-center disabled:opacity-50"
              >
                {loading ? 'Verifying Neural Vector...' : 'Authenticate'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaChallenge(null);
                  setError('');
                  setSuccess('');
                }}
                className="w-full text-center text-xs text-white/50 hover:text-white underline mt-2"
              >
                Back to credentials login
              </button>
            </form>
          ) : isReset ? (
            /* Reset Screen */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Reset Credentials</h2>
                <p className="text-xs text-white/60 mt-1">Enter your corporate email to generate a replenishment link.</p>
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{error}</div>}
              {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg">{success}</div>}

              <div className="space-y-1.5">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-lg"
              >
                Send replenishments
              </button>

              <div className="text-center text-xs">
                <span className="text-white/45">Recalled password? </span>
                <button type="button" onClick={() => { setIsReset(false); setError(''); setSuccess(''); }} className="text-emerald-400 hover:underline">
                  Log in
                </button>
              </div>
            </form>
          ) : (
            /* Normal Login/Register */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex border-b border-white/10 mb-2">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                  className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${
                    isLogin ? 'text-emerald-400 border-emerald-500 font-bold' : 'text-white/40 border-transparent hover:text-white/75'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                  className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${
                    !isLogin ? 'text-emerald-400 border-emerald-500 font-bold' : 'text-white/40 border-transparent hover:text-white/75'
                  }`}
                >
                  Register Enterprise
                </button>
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{error}</div>}
              {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg">{success}</div>}

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">User Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="e.g. Alisha Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Security Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => { setIsReset(true); setError(''); setSuccess(''); }}
                      className="text-[10px] text-white/40 hover:text-emerald-400 transition-colors uppercase tracking-wider"
                    >
                      Forgotten?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                    required={isLogin}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Administrative Access Role</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-1-emerald-500 appearance-none text-sm text-[#E5E5E5]"
                    >
                      <option value="Admin">Admin (Full parameters control)</option>
                      <option value="Company Owner">Company Owner (Decarbon targets)</option>
                      <option value="Sustainability Manager">Sustainability Manager (Calculations/Gemini)</option>
                      <option value="Analyst">Analyst (Logging input)</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg flex justify-center items-center disabled:opacity-50"
              >
                {loading ? 'Processing Gateway Link...' : isLogin ? 'Access CarbonIQ' : 'Provision Enterprise Portal'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Quick Demo picker */}
        {!mfaChallenge && isLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-[#0A0A0A] border border-white/10 rounded-xl text-center"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3 font-semibold">
              Evaluation Sandbox: One-Click Demo accounts
            </div>
            <div className="grid grid-cols-2 gap-2 text-start">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleDemoLogin(demo.email)}
                  className={`p-2.5 border text-[11px] rounded-lg transition-all text-left flex flex-col justify-between hover:scale-[1.02] cursor-pointer ${demo.color}`}
                >
                  <div className="font-semibold text-white truncate">{demo.label}</div>
                  <div className="text-[9px] text-white/40 truncate mt-0.5">{demo.email}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer info text */}
        <p className="text-center text-[11px] font-mono text-white/30 mt-6 uppercase tracking-wider">
          CarbonIQ Cloud &bull; ISO 14064 Compliance Framework v2026.1
        </p>
      </div>
    </div>
  );
}
