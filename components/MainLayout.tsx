"use client"

import React, { useState } from 'react'
import ManagerSidebar from './ManagerSidebar'

type MainLayoutProps = {
  children: React.ReactNode
  title?: string
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[var(--color-offwhite)] overflow-hidden" style={{ ['--sidebar-width' as any]: '250px' }}>
      {/* Sidebar */}
      <ManagerSidebar
        mobile={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col content-wrapper transition-all duration-300" style={{ minWidth: 0 }}>
        {/* Content Area */}
        <main
          className="flex-1 overflow-y-auto transition-all duration-300 flex items-start justify-center w-full"
          style={{
            paddingTop: '24px',
            paddingBottom: '24px',
            width: '100%',
            boxSizing: 'border-box',
            overflowX: 'hidden',
          }}
        >
        <div className="w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8" style={{boxSizing: 'border-box'}}>
            {children}
          </div>
        </main>
      </div>

      {/* Responsive breakpoint styles and alignment using --sidebar-width */}
      <style>{`
        :root { --sidebar-width: 250px; }

        /* Apply margin-left to the content wrapper so it aligns with the sidebar */
        .content-wrapper {
          margin-left: var(--sidebar-width);
        }

        /* Header should start after sidebar and occupy remaining width */
        header.fixed.top-0.left-0.right-0.z-30 {
          left: var(--sidebar-width);
          width: calc(100% - var(--sidebar-width));
        }

        @media (max-width: 1024px) {
          :root { --sidebar-width: 60px; }
          .content-wrapper { margin-left: var(--sidebar-width) !important; }
          header.fixed.top-0.left-0.right-0.z-30 { left: var(--sidebar-width) !important; width: calc(100% - var(--sidebar-width)) !important; }
        }

        @media (max-width: 768px) {
          :root { --sidebar-width: 0px; }
          .content-wrapper { margin-left: 0 !important; }
          header.fixed.top-0.left-0.right-0.z-30 { left: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
