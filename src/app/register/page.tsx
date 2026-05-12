'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/auth-client';
import { SITE_NAME } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      await register(email, password, name);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <h1 className="text-4xl font-bold text-[#eeeaf4] mb-2">Create Account</h1>
          <p className="text-[rgba(238,234,244,0.65)]">Join {SITE_NAME} and start your learning journey</p>
        </div>

        <div className="bg-[#12121f]/95 rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0e0e1a] text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:ring-2 focus:ring-[#f5c14a]/20 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0e0e1a] text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:ring-2 focus:ring-[#f5c14a]/20 outline-none transition-all"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0e0e1a] text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:ring-2 focus:ring-[#f5c14a]/20 outline-none transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0e0e1a] text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:ring-2 focus:ring-[#f5c14a]/20 outline-none transition-all"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-4 text-lg font-semibold bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

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






