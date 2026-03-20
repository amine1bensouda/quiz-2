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
    <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/80 border border-white/60 p-10 sm:p-12 transition-all duration-300">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}
