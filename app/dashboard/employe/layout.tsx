import React from 'react'
import EmployeeHeader from '../../../components/EmployeeHeader'
import ManagerSidebar from '../../../components/ManagerSidebar'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white shadow-md">
        <ManagerSidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <EmployeeHeader />
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
