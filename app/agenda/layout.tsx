import ManagerSidebar from '../../components/ManagerSidebar'
import ManagerHeader from '../../components/ManagerHeader'

export default function AgendaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <ManagerSidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <ManagerHeader />
        <main className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
