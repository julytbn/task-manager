import MainLayout from '@/components/layouts/MainLayout';

export default function EmployeeLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <MainLayout 
      showSidebar={false}
      showHeader={false}
    >
      {children}
    </MainLayout>
  );
}
