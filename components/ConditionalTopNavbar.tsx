'use client'

import { usePathname } from 'next/navigation'
import TopNavbar from './TopNavbar'

export default function ConditionalTopNavbar() {
  const pathname = usePathname() || ''

  // Hide the global top navbar on manager pages (they have their own headers in their layouts)
  if (
    pathname.startsWith('/connexion') ||
    pathname.startsWith('/inscription') ||
    pathname.startsWith('/dashboard/employe') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projets') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/kanban') ||
    pathname.startsWith('/paiements') ||
    pathname.startsWith('/factures') ||
    pathname.startsWith('/utilisateurs') ||
    pathname.startsWith('/taches') ||
    pathname.startsWith('/agenda') ||
    pathname.startsWith('/parametres')
  )
    return null

  return <TopNavbar />
}
