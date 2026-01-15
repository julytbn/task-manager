import { ReactNode } from 'react';
import ManagerSidebar from '../ManagerSidebar';
import ManagerHeader from '../ManagerHeader';
import LogoHeader from '../LogoHeader';

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
    <div className="flex flex-col min-h-screen bg-[var(--color-offwhite)]">
      {/* Logo Header - Fixed width 250px */}
      {showSidebar && <LogoHeader />}
      
      {/* Navbar - Adjusted for 250px sidebar */}
      {showHeader && <ManagerHeader />}
      
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar - Fixed positioned, not in flex */}
        {showSidebar && <ManagerSidebar />}
        
        {/* Content - Adjusted margin */}
        <main 
          className={`flex-1 overflow-y-auto bg-gradient-to-br from-[var(--color-offwhite)] via-white to-[var(--color-offwhite)] transition-all duration-200 ${
            showSidebar ? 'ml-[250px]' : 'ml-0'
          }`}
        >
          <div className={`p-6 ${showSidebar ? '' : 'max-w-7xl mx-auto'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
