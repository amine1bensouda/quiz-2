'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminArea = pathname?.startsWith('/admin') ?? false;
  const isEnConstruction = pathname === '/en-construction';
  const isMaintenance = pathname === '/maintenance';

  // Pas de Header/Footer : tout le panneau admin (évite double barre avec le site public)
  if (isAdminArea || isEnConstruction || isMaintenance) {
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
