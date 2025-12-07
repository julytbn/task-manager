import ManagerSidebar from '@/components/ManagerSidebar'
import ManagerHeader from '@/components/ManagerHeader'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function ParametresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const isManager = session?.user?.role === 'MANAGER'

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      {isManager && <ManagerSidebar />}
      <div className={`${isManager ? 'ml-[250px]' : 'w-full'} flex-1 flex flex-col h-screen`}>
        {isManager && <ManagerHeader />}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
