"use client"
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, FolderKanban, ListChecks,
  CreditCard, FileText, Star, Settings, X,
  Calendar, BarChart2, UploadCloud, Clock, ChevronRight
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import React from 'react'

type Props = {
  mobile?: boolean
  onClose?: () => void
}

export default function ManagerSidebar({ mobile, onClose }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isEmployee = session?.user?.role === 'EMPLOYE' || pathname?.startsWith('/dashboard/employe') || pathname?.startsWith('/employe')

  const managerItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: '/clients', icon: Users, label: 'Clients' },
    { href: '/equipes', icon: Users, label: 'Équipes' },
    { href: '/projets', icon: FolderKanban, label: 'Projets' },
    { href: '/kanban', icon: ListChecks, label: 'Tâches' },
    { href: '/timesheets', icon: Clock, label: 'Feuilles de temps' },
    { href: '/accounting/charges', icon: CreditCard, label: 'Charges' },
    { href: '/paiements', icon: CreditCard, label: 'Paiements' },
    { href: '/factures', icon: FileText, label: 'Factures' },
    { href: '/abonnements', icon: Star, label: 'Abonnements' },
    { href: '/parametres', icon: Settings, label: 'Paramètres' },
  ]

  const employeeItems = [
    { href: '/dashboard/employe', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/employe/mes-taches', icon: ListChecks, label: 'Mes tâches' },
    { href: '/timesheets/my-timesheets', icon: Clock, label: 'Mes feuilles de temps' },
    { href: '/dashboard/employe/calendrier', icon: Calendar, label: 'Calendrier' },
    { href: '/dashboard/employe/performance', icon: BarChart2, label: 'Performance personnelle' },
    { href: '/dashboard/employe/soumettre', icon: UploadCloud, label: 'Soumettre une tâche terminée' },
    { href: '/parametres', icon: Settings, label: 'Paramètres' },
  ]

  const navItems = isEmployee ? employeeItems : managerItems

  const sidebarContent = (
    <div
      className="fixed left-0 bg-gradient-to-b from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-[var(--color-offwhite)] shadow-2xl z-40 transition-all duration-300 flex flex-col border-r border-[var(--color-gold)]/15 overflow-hidden"
      style={{ width: '250px', top: '64px', bottom: 0 }}
    >
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--color-gold)]/30">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const Icon = item.icon as any
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (mobile && onClose) onClose() }}
              className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl group ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--color-gold)]/25 to-[var(--color-gold)]/10 text-[var(--color-gold)] shadow-lg shadow-[var(--color-gold)]/15 border-l-2 border-[var(--color-gold)]'
                  : 'text-[var(--color-offwhite)]/80 hover:text-[var(--color-gold)] hover:bg-[var(--color-black-900)]/40'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="flex items-center justify-center w-5 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={18} className={isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-offwhite)]/60 group-hover:text-[var(--color-gold)]'} />
                </span>
                <span className={`text-sm whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {item.label}
                </span>
              </div>
              {isActive && <ChevronRight size={16} className="text-[var(--color-gold)]" />}
            </Link>
          )
        })}
      </nav>
      
      {/* Footer info */}
      <div className="px-4 py-3 border-t border-[var(--color-gold)]/10">
        <p className="text-xs text-[var(--color-offwhite)]/50 text-center">© 2025 KEKELI GROUP</p>
      </div>
    </div>
  )

  // Responsive sidebar: mobile overlay, tablet collapsed, desktop full
  if (mobile) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="absolute left-0 top-0 bottom-0">
          <div className="h-full bg-gradient-to-b from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] shadow-2xl flex flex-col" style={{ width: '250px' }}>
            <div className="p-4 border-b border-[var(--color-gold)]/20 flex items-center justify-between bg-[var(--color-black-900)]/50">
              <h2 className="text-lg font-semibold gold-gradient-text">Menu</h2>
              <button onClick={onClose} className="text-[var(--color-offwhite)] hover:text-[var(--color-gold)] hover:scale-110 transition-all duration-300 p-1 rounded-lg hover:bg-[var(--color-gold)]/10"><X size={20} /></button>
            </div>
            {sidebarContent}
          </div>
        </div>
      </div>
    )
  }

  return (
    <aside
      className="h-screen fixed left-0 top-0 z-40 transition-all duration-300"
      style={{ width: '250px' }}
    >
      {sidebarContent}
    </aside>
  )
}