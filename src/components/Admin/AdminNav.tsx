'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '@/components/Layout/ThemeToggle';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/courses', label: 'Courses', icon: '📚' },
    { href: '/admin/modules', label: 'Modules', icon: '📦' },
    { href: '/admin/lessons', label: 'Lessons', icon: '📄' },
    { href: '/admin/quizzes', label: 'Quizzes', icon: '📝' },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
    { href: '/admin/blogs', label: 'Blogs', icon: '📰' },
    { href: '/admin/pages', label: 'Pages', icon: '📄' },
  ];

  const linkBase =
    'whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-all sm:px-4 sm:text-[15px] sm:py-2.5';

  return (
    <nav className="admin-nav sticky top-0 z-[60] border-b border-white/10 bg-[#080810]/98 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="flex shrink-0 items-center justify-between gap-3 lg:justify-start">
            <Link
              href="/admin"
              className="text-lg font-semibold tracking-wide text-[#eeeaf4] sm:text-xl"
            >
              <span className="text-[#f5c14a]">CRACK</span>
              <span className="text-[rgba(238,234,244,0.5)] mx-1">×</span>
              <span className="text-[#eeeaf4]">ADMIN</span>
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle className="admin-theme-toggle" />
              <Link
                href="/"
                className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-[#eeeaf4] sm:text-sm"
              >
                View site
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full bg-[#f5c14a] px-3 py-2 text-xs font-semibold text-[#0c0a00] disabled:opacity-50 sm:text-sm"
              >
                {loggingOut ? '…' : 'Logout'}
              </button>
            </div>
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto lg:order-none">
            <div className="flex w-max min-w-full gap-1 lg:w-auto lg:min-w-0 lg:flex-wrap lg:justify-center">
              {navItems.map((item) => {
                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${linkBase} ${
                      active
                        ? 'bg-[#f5c14a] text-[#0c0a00] shadow-sm'
                        : 'text-[rgba(238,234,244,0.88)] hover:bg-white/10 hover:text-[#eeeaf4]'
                    }`}
                  >
                    <span className="mr-1.5 opacity-90">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex lg:gap-3">
            <ThemeToggle className="admin-theme-toggle" />
            <Link
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full bg-[#f5c14a] px-4 py-2 text-sm font-semibold text-[#0c0a00] shadow-md transition-colors hover:bg-[#f9d06a] disabled:opacity-50"
            >
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
