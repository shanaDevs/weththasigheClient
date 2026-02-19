'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Stethoscope, ArrowRight, ShieldCheck, User, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';
import api from '@/lib/api/client';

// Staff roles that should be redirected to the admin panel
const ADMIN_ROLES = ['admin', 'super_admin', 'manager', 'staff', 'pharmacist', 'cashier', 'super_cashier'];
const ADMIN_LEVEL_THRESHOLD = 20; // Cashier and above → admin panel; doctors/users (≤10) → store

export default function LoginPage() {
  const router = useRouter();
  const { login, verify2FA, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState<{ isDoctor: boolean; resending: boolean } | null>(null);

  const handleRedirect = () => {
    const { user: loggedInUser } = useAuthStore.getState();
    const roleName = loggedInUser?.role?.name?.toLowerCase() || '';
    const roleLevel = loggedInUser?.role?.level || 0;

    if (roleLevel >= ADMIN_LEVEL_THRESHOLD || ADMIN_ROLES.includes(roleName)) {
      toast.success(`Welcome back! Redirecting to Admin Panel...`);
      router.push('/admin');
    } else {
      toast.success(`Welcome back! Redirecting to Store...`);
      router.push('/');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverified(null);

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your credentials');
      return;
    }

    try {
      const is2FARequired = await login({ identifier: identifier.trim(), password });

      if (is2FARequired) {
        setShow2FA(true);
        toast.info('2FA required. Please check your email for the code.');
        return;
      }

      handleRedirect();
    } catch (err: any) {
      const data = err?.response?.data;
      // Check if the backend returned requiresVerification
      if (data?.requiresVerification) {
        setUnverified({ isDoctor: !!data.isDoctor, resending: false });
        return;
      }
      const msg = data?.message || err?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    }
  };

  const onVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!twoFactorCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    try {
      await verify2FA(twoFactorCode);
      handleRedirect();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid code. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0tNiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-500/40 mb-4"
          >
            <Stethoscope className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MediPharm B2B</h1>
          <p className="text-emerald-300/70 mt-1 text-sm">Pharmaceutical Distribution Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">{show2FA ? 'Two-Factor Authentication' : 'Sign In'}</h2>
            <p className="text-white/50 text-sm mt-1">
              {show2FA ? 'Please enter the 6-digit verification code sent to your email.' : 'Enter your credentials — you\'ll be directed to the right area automatically'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!show2FA ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={onSubmit}
                className="px-8 py-6 space-y-5"
              >
                {/* Identifier */}
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-white/80 text-sm font-medium">
                    Username or Phone Number
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Enter username or phone"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      autoComplete="username"
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Unverified account banner */}
                {unverified && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-4 py-4 text-amber-200 text-sm space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <MailWarning className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-300">Account not verified</p>
                        <p className="text-amber-200/80 text-xs mt-0.5">
                          {unverified.isDoctor
                            ? 'Please check your email and click the doctor verification link to activate your account.'
                            : 'Please check your email and click the verification link to activate your account.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={unverified.resending}
                      onClick={async () => {
                        setUnverified(prev => prev ? { ...prev, resending: true } : prev);
                        try {
                          await api.post('/users/resend-verification', { identifier: identifier.trim(), isDoctor: unverified.isDoctor });
                          toast.success('Verification email resent! Please check your inbox.');
                        } catch (err: any) {
                          toast.error(err?.response?.data?.message || 'Could not resend email. Please contact support.');
                        } finally {
                          setUnverified(prev => prev ? { ...prev, resending: false } : prev);
                        }
                      }}
                      className="w-full text-center text-xs text-amber-300 hover:text-amber-200 underline underline-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {unverified.resending ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 mt-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="2fa-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={onVerify2FA}
                className="px-8 py-6 space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="text-white/80 text-sm font-medium">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="twoFactorCode"
                      type="text"
                      placeholder="6-digit code"
                      value={twoFactorCode}
                      onChange={e => setTwoFactorCode(e.target.value)}
                      maxLength={6}
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl text-center tracking-[0.5em] font-bold text-lg"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg transition-all"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShow2FA(false)}
                    className="text-white/60 hover:text-white hover:bg-white/5"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-8 pb-8 space-y-4">
            {/* Role hint cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-semibold">Doctors</p>
                  <p className="text-white/40 text-[10px] leading-tight mt-0.5">Login with your username to access the store</p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-white/40">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                Sign up
              </Link>
            </div>

            <div className="pt-2">
              <Link href="/register-doctor">
                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Are you a Doctor? Register Here
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © 2026 MediPharm B2B. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
