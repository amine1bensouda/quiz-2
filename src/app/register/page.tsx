'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  sendRegistrationCode,
  verifyRegistrationCode,
} from '@/lib/auth-client';
import { SITE_NAME } from '@/lib/constants';

type Step = 'form' | 'verify';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0e0e1a] text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:ring-2 focus:ring-[#f5c14a]/20 outline-none transition-all';
  const labelClass = 'block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2';

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await sendRegistrationCode(email, password, name);
      setEmail(result.email);
      setDevHint(result.devHint || null);
      setStep('verify');
      setInfo(
        `A 6-digit code has been sent to ${result.email}. Enter it below to activate your account.`
      );
      setVerificationCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await verifyRegistrationCode(email, verificationCode);
      router.push(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const result = await sendRegistrationCode(email, password, name);
      setDevHint(result.devHint || null);
      setInfo('A new code has been sent.');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(interval);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] text-[#eeeaf4] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-[#f5c14a]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-2rem] bottom-12 h-64 w-64 rounded-full bg-[#b388ff]/10 blur-3xl" />
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg bg-[#12121f] border border-white/10">
              <span className="text-[#f5c14a] font-bold text-2xl">M</span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-[#eeeaf4] mb-2">Create Account</h1>
          <p className="text-[rgba(238,234,244,0.65)]">
            {step === 'form'
              ? `Join ${SITE_NAME} — email confirmation required`
              : 'Verify your email address'}
          </p>
        </div>

        <div className="bg-[#12121f]/95 rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-sm">
          {step === 'form' ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-4 text-lg font-semibold bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              {info && (
                <div className="bg-[#f5c14a]/10 border border-[#f5c14a]/30 text-[#f5c14a] px-4 py-3 rounded-xl text-sm">
                  {info}
                </div>
              )}
              {devHint && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl text-sm">
                  {devHint}
                </div>
              )}

              <div>
                <label htmlFor="code" className={labelClass}>
                  Verification code (6 digits)
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  required
                  className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
                  placeholder="000000"
                />
                <p className="text-xs text-[rgba(238,234,244,0.45)] mt-2">
                  The code expires in 15 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full rounded-xl py-4 text-lg font-semibold bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Confirm and create account'}
              </button>

              <div className="flex flex-col sm:flex-row gap-3 text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className="flex-1 py-2 rounded-xl border border-white/15 text-[#eeeaf4] hover:border-[#f5c14a]/40 hover:text-[#f5c14a] disabled:opacity-50 transition-colors"
                >
                  {resendCooldown > 0
                    ? `Resend (${resendCooldown}s)`
                    : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                    setInfo('');
                  }}
                  className="flex-1 py-2 text-[rgba(238,234,244,0.65)] hover:text-[#eeeaf4] transition-colors"
                >
                  ← Change email
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-[rgba(238,234,244,0.65)]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#f5c14a] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[rgba(238,234,244,0.65)] hover:text-[#eeeaf4] text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080810] flex items-center justify-center text-[#eeeaf4]">
          Loading...
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
