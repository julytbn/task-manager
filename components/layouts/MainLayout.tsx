import { ReactNode } from 'react';
import ManagerSidebar from '../ManagerSidebar';
import ManagerHeader from '../ManagerHeader';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
}

export default function MainLayout({ 
  children, 
  showSidebar = true, 
  showHeader = true 
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      {showSidebar && <ManagerSidebar />}
      <div className={`${showSidebar ? 'ml-[250px]' : 'w-full'} flex-1 flex flex-col h-screen`}>
        {showHeader && <ManagerHeader />}
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-offwhite)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
