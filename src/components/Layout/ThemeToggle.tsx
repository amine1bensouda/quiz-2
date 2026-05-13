'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ctc-theme';

export function applyCtcTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}

type ThemeToggleProps = {
  /** Classes supplémentaires (ex. contraste sur la nav admin claire) */
  className?: string;
};

function readThemeFromStorage(): Theme | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark') return raw;
  return null;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('dark');

  useLayoutEffect(() => {
    const saved = readThemeFromStorage();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const fromDom = document.documentElement.classList.contains('light')
      ? 'light'
      : document.documentElement.classList.contains('dark')
        ? 'dark'
        : null;
    const initial: Theme = saved ?? fromDom ?? (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    applyCtcTheme(initial);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      if (e.newValue === 'light' || e.newValue === 'dark') {
        applyCtcTheme(e.newValue);
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyCtcTheme(next);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex items-center justify-center rounded-full border border-slate-300/90 bg-slate-100 p-2.5 text-slate-700 transition-colors hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-[rgba(238,234,244,0.85)] dark:hover:bg-white/10 ${className}`.trim()}
    >
      <span className="text-sm" aria-hidden="true">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
