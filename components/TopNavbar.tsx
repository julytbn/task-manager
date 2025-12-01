"use client"
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues for the sidebar overlay
const ManagerSidebar = dynamic(() => import('@/components/ManagerSidebar'), { ssr: false })

export default function TopNavbar() {
  const [openMobileMenu, setOpenMobileMenu] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-white shadow-sm z-40">
       <div className="h-full flex items-center px-4 md:px-6 lg:px-8 md:ml-[var(--sidebar-width)]">
        {/* Mobile menu button */}
        <button
          aria-label="open menu"
          className="mr-3 md:hidden text-[#0A2342] hover:opacity-80"
          onClick={() => setOpenMobileMenu(true)}
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center mr-6">
          <div className="w-9 h-9 bg-[#0A2342] text-white rounded flex items-center justify-center font-bold">TF</div>
          <div className="ml-3 hidden sm:block">
            <div className="text-sm font-semibold text-[#0A2342]">Company TaskFlow</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Avatar */}
          <div className="flex items-center space-x-3 border-l pl-4 ml-2">
            <div className="text-right">
              <div className="text-sm font-medium text-[#0A2342]">Julie</div>
              <div className="text-xs text-gray-500">julie@exemple.com</div>
            </div>
            <button aria-label="logout" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-[#0A2342]">
              <span className="font-medium">J</span>
            </button>
          </div>
        </div>
      </div>

      {openMobileMenu && (
        // Render mobile sidebar overlay
        <ManagerSidebar mobile onClose={() => setOpenMobileMenu(false)} />
      )}
    </header>
  )
}
