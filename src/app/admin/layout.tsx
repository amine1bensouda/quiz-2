import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminLayoutWrapper from '@/components/Admin/AdminLayoutWrapper';

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
