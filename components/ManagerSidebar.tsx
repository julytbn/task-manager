"use client"
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  LayoutDashboard, Users, FolderKanban, ListChecks, 
  CreditCard, FileText, Star, Settings, Lightbulb, Plus, Clock, X,
  Calendar, BarChart2, UploadCloud
} from 'lucide-react'
import { usePathname } from 'next/navigation'

type Props = {
  mobile?: boolean
  onClose?: () => void
}

export default function ManagerSidebar({ mobile, onClose }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Determine employee view either from session role or from pathname (fallback)
  const isEmployee = session?.user?.role === 'EMPLOYE' || pathname?.startsWith('/dashboard/employe') || pathname?.startsWith('/employe')

  const managerItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
    { href: "/clients", icon: <Users size={18} />, label: "Clients" },
    { href: "/projets", icon: <FolderKanban size={18} />, label: "Projets" },
    { href: "/kanban", icon: <ListChecks size={18} />, label: "Toutes les tâches" },
    
    { href: "/dashboard/manager/equipes", icon: <FolderKanban size={18} />, label: "Équipe" },
    { href: "/paiements", icon: <CreditCard size={18} />, label: "Paiements" },
    { href: "/factures", icon: <FileText size={18} />, label: "Factures" },
    { href: "/souhaits", icon: <Star size={18} />, label: "Souhaits" },
    
    { href: "/historique", icon: <Clock size={18} />, label: "Historique" },
    { href: "/parametres", icon: <Settings size={18} />, label: "Paramètres" },
  ]

  const employeeItems = [
    { href: "/dashboard/employe", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/dashboard/employe/mes-taches", icon: <ListChecks size={18} />, label: "Mes tâches" },
  { href: "/dashboard/employe/paiements", icon: <CreditCard size={18} />, label: "Paiement / Historique" }, 
    { href: "/dashboard/employe/calendrier", icon: <Calendar size={18} />, label: "Calendrier" },
    { href: "/dashboard/employe/performance", icon: <BarChart2 size={18} />, label: "Performance personnelle" },
    { href: "/dashboard/employe/soumettre", icon: <UploadCloud size={18} />, label: "Soumettre une tâche terminée" },
    { href: "/parametres", icon: <Settings size={18} />, label: "Paramètres" },
  ]

  const navItems = isEmployee ? employeeItems : managerItems

  const sidebarContent = (
    <div className="w-[230px] lg:w-[230px] bg-gradient-to-b from-blue-600 to-blue-700 text-white flex flex-col h-full shadow-lg">

      {/* App title / logo above the nav */}
      <div className="px-4 py-4 border-b border-blue-500/20 flex items-center gap-3 bg-white">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">KW</div>
        <div>
          <div className="text-sm font-bold text-gray-900">Kekeli WorkFlow</div>
          <div className="text-xs text-gray-600">TaskManager</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (mobile && onClose) onClose() }}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition duration-200 ${
                isActive 
                  ? 'bg-white/15 text-white shadow-lg border-l-4 border-white' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="flex items-center justify-center w-6">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-blue-500/20">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10">
          <div className="flex items-center text-white mb-2">
            <Lightbulb size={16} className="mr-2" />
            <span className="text-sm font-semibold">Astuce</span>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            Utilisez les filtres pour mieux organiser vos tâches et gagner en productivité.
          </p>
        </div>
      </div>
    </div>
  )

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute left-0 top-0 bottom-0">
          <div className="w-[230px] h-full bg-[#0A2342] shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button onClick={onClose} className="text-white hover:text-gray-200"><X /></button>
            </div>
            {sidebarContent}
          </div>
        </div>
      </div>
    )
  }

  return (
    <aside className="w-[230px] bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col h-screen fixed left-0 top-0 shadow-xl">
      {sidebarContent}
    </aside>
  )
}