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
  const isAdminLogin = pathname === '/admin/login';
  const isEnConstruction = pathname === '/en-construction';
  const isMaintenance = pathname === '/maintenance';

  // Pas de Header/Footer : login admin, pages temporaires, mode maintenance global
  if (isAdminLogin || isEnConstruction || isMaintenance) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#080810] text-[#eeeaf4]">{children}</div>
      <Footer />
    </>
  );
}
