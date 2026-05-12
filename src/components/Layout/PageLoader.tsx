'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#080810]/95 backdrop-blur-md">
      <div className="pointer-events-none absolute -left-20 top-20 h-56 w-56 rounded-full bg-[#f5c14a]/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[-2rem] top-28 h-64 w-64 rounded-full bg-[#b388ff]/12 blur-3xl" />
      <div className="rounded-3xl border border-white/10 bg-[#12121f]/90 p-10 shadow-2xl shadow-black/40 transition-all duration-300 sm:p-12">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}
