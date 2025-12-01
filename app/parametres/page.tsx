import ManagerSidebar from '../../components/ManagerSidebar'
import ManagerHeader from '../../components/ManagerHeader'
import EmployeeSettings from '@/components/dashboard/EmployeeSettings'

export default function ParametresPage() {
  return (
    <div>
      <ManagerSidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <ManagerHeader />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <EmployeeSettings />
        </main>
      </div>
    </div>
  )
}
