'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/Layout/ThemeToggle';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Incorrect password');
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-app relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080810] py-12 px-4">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#f5c14a]/12 blur-[100px]" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#2be4c8]/10 blur-[100px]" aria-hidden />

      <div className="relative z-10 max-w-md w-full space-y-8 rounded-3xl border border-white/10 bg-[#12121f]/95 p-10 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5c14a]/90">
            Crack The Curve
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-[#f5c14a]">Admin</span>
            <span className="text-[#eeeaf4]">istration</span>
          </h2>
          <p className="mt-2 text-sm text-[rgba(238,234,244,0.55)]">Sign in to manage quizzes and content.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-[rgba(238,234,244,0.75)]">
              Admin password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#0e0e1a] px-4 py-3 text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] transition-all focus:border-[#f5c14a]/50 focus:outline-none focus:ring-2 focus:ring-[#f5c14a]/25"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-full border border-[#f5c14a] bg-[#f5c14a] px-4 py-3 text-sm font-semibold text-[#0c0a00] shadow-lg shadow-black/30 transition-all hover:bg-[#f9d06a] focus:outline-none focus:ring-2 focus:ring-[#f5c14a]/40 focus:ring-offset-2 focus:ring-offset-[#12121f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#f5c14a]"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
