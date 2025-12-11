import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MainLayout from '@/components/layouts/MainLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isManager = session?.user?.role === 'MANAGER';

  return (
    <MainLayout 
      showSidebar={isManager}
      showHeader={isManager}
    >
      {children}
    </MainLayout>
  );
}