'use client';

import { ReactNode, useState, useEffect } from 'react';
import ManagerSidebar from '../ManagerSidebar';
import ManagerHeader from '../ManagerHeader';
import { Menu, X } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-offwhite)]">
      {/* Main Header with Toggle Button */}
      {showHeader && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white">
          <div className="flex items-center gap-2 px-3 sm:px-4 h-16 md:hidden border-b border-gray-200">
            {showSidebar && (
              <button 
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <X size={20} className="text-[var(--color-gold)]" />
                ) : (
                  <Menu size={20} className="text-[var(--color-gold)]" />
                )}
              </button>
            )}
            <span className="text-sm font-semibold text-[var(--color-gold)]">KEKELI</span>
          </div>
          <ManagerHeader />
        </div>
      )}
      
      {/* Main Layout with Sidebar */}
      <div className={`flex flex-1 overflow-hidden ${showHeader ? 'mt-32 md:mt-16' : ''}`}>
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar */}
            <aside 
              className={`fixed left-0 top-0 h-screen w-[250px] z-40 transition-transform duration-300 ease-in-out ${
                isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
              } ${
                showHeader ? (isMobile ? 'mt-32' : 'mt-16') : 'mt-0'
              } overflow-y-auto`}
            >
              <ManagerSidebar 
                mobile={isMobile} 
                onClose={() => setSidebarOpen(false)} 
              />
            </aside>
          </>
        )}
        
        {/* Content */}
        <main 
          className={`flex-1 overflow-y-auto bg-gradient-to-br from-[var(--color-offwhite)] via-white to-[var(--color-offwhite)] ${
            !isMobile && showSidebar ? 'md:ml-[250px]' : 'ml-0'
          }`}
        >
          <div className="p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
