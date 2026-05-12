'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from './AdminNav';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export default function AdminLayoutWrapper({ children, isAuthenticated }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Si on n'est pas authentifié et qu'on n'est pas sur la page de login, rediriger
    if (!isAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoginPage, router]);

  // Si on est sur la page de login, ne pas afficher la navigation admin
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Si authentifié, afficher le layout admin complet
  if (!isAuthenticated) {
    return null; // En attente de redirection
  }

  return (
    <div className="admin-app min-h-screen bg-[#080810] text-[#eeeaf4]">
      <AdminNav />
      <main className="admin-app-main container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
