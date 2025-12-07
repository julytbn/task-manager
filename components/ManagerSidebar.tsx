"use client"
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, FolderKanban, ListChecks,
  CreditCard, FileText, Star, Settings, X,
  Calendar, BarChart2, UploadCloud, Clock
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

  // store icon components so we can pass className for gold color
  const managerItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: '/clients', icon: Users, label: 'Clients' },
    { href: '/projets', icon: FolderKanban, label: 'Projets' },
    { href: '/kanban', icon: ListChecks, label: 'Toutes les tâches' },
    { href: '/dashboard/manager/equipes', icon: FolderKanban, label: 'Équipe' },
    { href: '/paiements', icon: CreditCard, label: 'Paiements' },
    { href: '/factures', icon: FileText, label: 'Factures' },
    { href: '/abonnements', icon: CreditCard, label: 'Abonnements' },
    { href: '/souhaits', icon: Star, label: 'Souhaits' },
    { href: '/historique', icon: Clock, label: 'Historique' },
    { href: '/parametres', icon: Settings, label: 'Paramètres' },
  ]

  const employeeItems = [
    { href: '/dashboard/employe', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/employe/mes-taches', icon: ListChecks, label: 'Mes tâches' },
    { href: '/dashboard/employe/paiements', icon: CreditCard, label: 'Paiement / Historique' },
    { href: '/dashboard/employe/calendrier', icon: Calendar, label: 'Calendrier' },
    { href: '/dashboard/employe/performance', icon: BarChart2, label: 'Performance personnelle' },
    { href: '/dashboard/employe/soumettre', icon: UploadCloud, label: 'Soumettre une tâche terminée' },
    { href: '/parametres', icon: Settings, label: 'Paramètres' },
  ]

  const navItems = isEmployee ? employeeItems : managerItems

  const sidebarContent = (
    <div
      className="fixed left-0 top-0 bottom-0 bg-gradient-to-b from-[var(--color-black-deep)] to-[var(--color-black-900)] text-[var(--color-offwhite)] shadow-lg z-40 transition-all duration-300 flex flex-col"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo / title */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--color-black-900)]/30 bg-transparent">
        <img src="/kekeli-logo-or.svg" alt="Kekeli Group" className="w-10 h-10 object-contain" />
        <div className="hidden md:hidden lg:block">
          <div className="text-base font-semibold gold-gradient-text tracking-wide">Kekeli Group</div>
          <div className="text-xs text-[var(--color-offwhite)]/80">Cabinet d'expertise</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const Icon = item.icon as any
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (mobile && onClose) onClose() }}
              className={`flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--color-black-900)] text-[var(--color-gold)] border-l-4 border-[var(--color-gold)] hover:bg-[var(--color-black-900)]'
                  : 'text-[var(--color-offwhite)] hover:bg-[var(--color-black-900)]'
              }`}
              style={{ minHeight: 48 }}
            >
              <span className="flex items-center justify-center w-6">
                <Icon size={20} className={isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-offwhite)]/80'} />
              </span>
              <span className={`whitespace-nowrap text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  // Responsive sidebar: mobile overlay, tablet collapsed, desktop full
  if (mobile) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0">
          <div className="h-full bg-gradient-to-b from-[var(--color-black-deep)] to-[var(--color-black-900)] shadow-xl flex flex-col" style={{ width: 'var(--sidebar-width)' }}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold gold-gradient-text">Menu</h2>
              <button onClick={onClose} className="text-[var(--color-offwhite)] hover:text-[var(--color-gold)] transition"><X /></button>
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
      style={{ width: 'var(--sidebar-width)' }}
    >
      {sidebarContent}
    </aside>
  )
}