'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-client';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isAdminArea = pathname?.startsWith('/admin') ?? false;
  const isDashboardArea = pathname?.startsWith('/dashboard') ?? false;
  const isEnConstruction = pathname === '/en-construction';
  const isMaintenance = pathname === '/maintenance';

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) setIsLoggedIn(!!user);
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Pas de Header/Footer : admin, dashboard, ou utilisateur connecté
  if (isAdminArea || isDashboardArea || isEnConstruction || isMaintenance || isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#080810] dark:text-[#eeeaf4]">
        {children}
      </div>
      <Footer />
    </>
  );
}
