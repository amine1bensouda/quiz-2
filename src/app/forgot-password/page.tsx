'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0e0e1a] text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:ring-2 focus:ring-[#f5c14a]/20 outline-none transition-all';
  const labelClass = 'block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setDevResetUrl(null);
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);
      setSent(true);
      setInfo(result.message);
      if (result.devResetUrl) {
        setDevResetUrl(result.devResetUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] text-[#eeeaf4] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-[#f5c14a]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-2rem] bottom-12 h-64 w-64 rounded-full bg-[#b388ff]/10 blur-3xl" />
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg bg-[#12121f] border border-white/10">
              <span className="text-[#f5c14a] font-bold text-2xl">M</span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-[#eeeaf4] mb-2">Forgot Password</h1>
          <p className="text-[rgba(238,234,244,0.65)]">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="bg-[#12121f]/95 rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-sm">
          {sent ? (
            <div className="space-y-4">
              <div className="bg-emerald-900/20 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl">
                {info}
              </div>
              {devResetUrl && (
                <div className="bg-amber-900/20 border border-amber-500/40 text-amber-100 px-4 py-3 rounded-xl text-sm break-all">
                  <p className="font-semibold mb-2">Dev reset link:</p>
                  <a href={devResetUrl} className="text-[#f5c14a] hover:underline">
                    {devResetUrl}
                  </a>
                </div>
              )}
              <Link
                href="/login"
                className="block w-full text-center rounded-xl py-4 text-lg font-semibold bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-4 text-lg font-semibold bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-[rgba(238,234,244,0.65)]">
              Remember your password?{' '}
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
