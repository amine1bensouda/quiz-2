'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_NAME } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth-client';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const [currentUser, adminStatus] = await Promise.all([
        getCurrentUser(),
        fetch('/api/admin/auth/status', { credentials: 'include' })
          .then(async (res) => {
            if (!res.ok) return false;
            const data = await res.json().catch(() => ({}));
            return Boolean(data?.authenticated);
          })
          .catch(() => false),
      ]);
      setUser(currentUser);
      setIsAdminSession(adminStatus);
    }
    loadUser();
  }, [pathname]); // Re-vérifier après navigation (ex. retour de /login)

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-[#080810]/95 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
      {isAdminSession && !pathname?.startsWith('/admin') && (
        <div className="bg-gradient-to-r from-indigo-700 to-violet-700 text-white border-b border-indigo-400/40">
          <div className="container mx-auto px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between gap-3">
            <span className="font-semibold tracking-wide">Admin mode active</span>
            <Link
              href="/admin"
              className="inline-flex items-center rounded-md bg-white/15 px-3 py-1 font-medium hover:bg-white/25 transition-colors"
            >
              Open Admin Panel
            </Link>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-3 group animate-fade-in ml-1"
          >
            <span className="text-xl font-semibold tracking-[1px] text-[#eeeaf4]">
              <span className="text-[#f5c14a]">CRACK</span>
              <span className="text-[rgba(238,234,244,0.45)] mx-1">×</span>
              <span>THECURVE</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/quiz"
              className={`px-5 py-2.5 text-sm font-medium text-[rgba(238,234,244,0.55)] transition-colors relative ${
                isActive('/quiz')
                  ? 'text-[#eeeaf4]' 
                  : 'hover:text-[#eeeaf4]'
              }`}
            >
              QBanks
              {isActive('/quiz') && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-[#f5c14a] rounded-full"></span>
              )}
            </Link>
            <Link
              href="/#how"
              className={`px-5 py-2.5 text-sm font-medium text-[rgba(238,234,244,0.55)] transition-colors relative ${
                pathname === '/' 
                  ? 'text-[#eeeaf4]' 
                  : 'hover:text-[#eeeaf4]'
              }`}
            >
              How it works
              {pathname === '/' && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-[#f5c14a] rounded-full"></span>
              )}
            </Link>
            <Link
              href="/#qbanks"
              className={`px-5 py-2.5 text-sm font-medium text-[rgba(238,234,244,0.55)] transition-colors relative ${
                pathname === '/'
                  ? 'text-[#eeeaf4]' 
                  : 'hover:text-[#eeeaf4]'
              }`}
            >
              Pricing
              {pathname === '/' && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-[#f5c14a] rounded-full"></span>
              )}
            </Link>
            <Link
              href="/blogs"
              className={`px-5 py-2.5 text-sm font-medium text-[rgba(238,234,244,0.55)] transition-colors relative ${
                isActive('/blogs') 
                  ? 'text-[#eeeaf4]' 
                  : 'hover:text-[#eeeaf4]'
              }`}
            >
              Blog
              {isActive('/blogs') && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-[#f5c14a] rounded-full"></span>
              )}
            </Link>
          </nav>

          {/* User menu */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive('/dashboard') 
                    ? 'bg-[#f5c14a] text-[#0c0a00]' 
                    : 'bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a]'
                }`}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-full text-[rgba(238,234,244,0.65)] hover:text-[#eeeaf4] text-sm font-semibold transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a]"
                >
                  Free trial →
                </Link>
              </>
            )}
          </div>

          {/* Menu mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[rgba(238,234,244,0.8)] hover:text-[#eeeaf4] rounded-xl hover:bg-white/5 transition-all duration-200 border border-white/10 hover:border-white/20"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 animate-slide-in border-t border-white/10 pt-4">
            <div className="flex flex-col gap-1">
              <Link
                href="/quiz"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 font-medium text-[rgba(238,234,244,0.75)] transition-colors rounded-lg ${
                  isActive('/quiz') 
                    ? 'bg-white/10 text-[#eeeaf4]' 
                    : 'hover:bg-white/5'
                }`}
              >
                QBanks
              </Link>
              <Link
                href="/#how"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 font-medium text-[rgba(238,234,244,0.75)] transition-colors rounded-lg ${
                  pathname === '/'
                    ? 'bg-white/10 text-[#eeeaf4]' 
                    : 'hover:bg-white/5'
                }`}
              >
                How it works
              </Link>
              <Link
                href="/#qbanks"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 font-medium text-[rgba(238,234,244,0.75)] transition-colors rounded-lg ${
                  pathname === '/'
                    ? 'bg-white/10 text-[#eeeaf4]' 
                    : 'hover:bg-white/5'
                }`}
              >
                Pricing
              </Link>
              <Link
                href="/blogs"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 font-medium text-[rgba(238,234,244,0.75)] transition-colors rounded-lg ${
                  isActive('/blogs') 
                    ? 'bg-white/10 text-[#eeeaf4]' 
                    : 'hover:bg-white/5'
                }`}
              >
                Blog
              </Link>
              <div className="border-t border-white/10 my-2"></div>
              <div className="px-4 py-2">
                <ThemeToggle />
              </div>
              <div className="border-t border-white/10 my-2"></div>
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 font-medium text-[rgba(238,234,244,0.75)] hover:bg-white/5 transition-colors rounded-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 font-medium text-[rgba(238,234,244,0.75)] hover:bg-white/5 transition-colors rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 font-medium bg-[#f5c14a] text-[#0c0a00] hover:bg-[#f9d06a] transition-colors rounded-lg"
                  >
                    Free trial →
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

