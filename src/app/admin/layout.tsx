import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminLayoutWrapper from '@/components/Admin/AdminLayoutWrapper';

// Pas de pré-rendu admin au build (évite DATABASE_URL requis)
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();

  return (
    <AdminLayoutWrapper isAuthenticated={authenticated}>
      {children}
    </AdminLayoutWrapper>
  );
}
