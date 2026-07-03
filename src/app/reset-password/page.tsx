'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth-client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0e0e1a] text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:ring-2 focus:ring-[#f5c14a]/20 outline-none transition-all';
  const labelClass = 'block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

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
      await resetPassword(email, token, password);
      router.push('/login?reset=success');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="bg-[#12121f]/95 rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-sm text-center space-y-4">
        <p className="text-red-200">This reset link is invalid or incomplete.</p>
        <Link
          href="/forgot-password"
          className="inline-block rounded-xl py-3 px-6 font-semibold bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#12121f]/95 rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className={labelClass}>
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
            placeholder="Enter your new password"
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
            placeholder="Confirm your new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-4 text-lg font-semibold bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-4xl font-bold text-[#eeeaf4] mb-2">Reset Password</h1>
          <p className="text-[rgba(238,234,244,0.65)]">Choose a new password for your account</p>
        </div>

        <Suspense
          fallback={
            <div className="bg-[#12121f]/95 rounded-2xl p-8 border border-white/10 text-center">
              Loading...
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[rgba(238,234,244,0.65)] hover:text-[#eeeaf4] text-sm">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
