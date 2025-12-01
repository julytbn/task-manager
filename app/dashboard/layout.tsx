import ManagerSidebar from '../../components/ManagerSidebar'
import ManagerHeader from '../../components/ManagerHeader'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch session on the server to determine role
  const session = await getServerSession(authOptions)
  const isManager = session?.user?.role === 'MANAGER'

  return (
    <div>
      {isManager && <ManagerSidebar />}
      <div className={`${isManager ? 'ml-[230px]' : ''} flex flex-col min-h-screen`}>
        {isManager && <ManagerHeader />}
        <main className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}