'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Démarrer le loader lors du changement de route
    setLoading(true);

    // Simuler un délai minimum pour éviter le flash
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo animé */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-gray-900 rounded-2xl animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <div className="absolute inset-0 border-4 border-gray-900 border-t-transparent rounded-2xl animate-spin"></div>
        </div>
        
        {/* Texte de chargement */}
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg mb-2">Loading...</p>
          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
