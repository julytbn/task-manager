"use client"
import { LogOut, Menu, Bell, Search as SearchIcon, User, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic import to avoid SSR issues for the sidebar overlay
const ManagerSidebar = dynamic(() => import('@/components/ManagerSidebar'), { ssr: false })

export default function TopNavbar() {
  const [openMobileMenu, setOpenMobileMenu] = useState(false)
  const [openProfileMenu, setOpenProfileMenu] = useState(false)
  const [userInfo, setUserInfo] = useState<{ nom: string; prenom: string; email: string; role: string } | null>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  // Charger les infos utilisateur
  useEffect(() => {
    if (session?.user) {
      setUserInfo({
        nom: (session.user as any).nom || 'Utilisateur',
        prenom: (session.user as any).prenom || '',
        email: session.user.email || '',
        role: (session.user as any).role || 'EMPLOYE'
      })
    }
  }, [session])

  // Fermer le menu profil quand on clique dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setOpenProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/connexion' })
  }

  const displayName = userInfo ? `${userInfo.prenom || ''} ${userInfo.nom || ''}`.trim() || 'Utilisateur' : 'Utilisateur'
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]" style={{ 
      height: '4rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    }}>
      <div className="h-full flex items-center px-4 md:px-6 lg:px-8" style={{ marginLeft: '250px' }}>
        {/* Mobile menu button */}
        <button
          aria-label="open menu"
          className="mr-3 md:hidden text-[var(--color-gold)] hover:opacity-80 transition-opacity"
          onClick={() => setOpenMobileMenu(true)}
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center mr-6">
          <img src="/kekeli-logo-or.svg" alt="Kekeli Group" className="w-9 h-9 object-contain" />
          <div className="ml-3 hidden sm:block">
            <div className="text-sm font-semibold text-[var(--color-gold)]">Kekeli Group</div>
          </div>
        </div>

        {/* Middle: search (desktop) */}
        <div className="hidden md:flex items-center flex-1 justify-center px-4">
          <div className="relative w-full max-w-lg">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              aria-label="search"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-[var(--color-offwhite)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Notifications */}
          <button aria-label="notifications" className="relative p-2 rounded-md hover:bg-white hover:bg-opacity-10 text-[var(--color-gold)] transition-colors">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[var(--color-black-900)]" />
          </button>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setOpenProfileMenu(!openProfileMenu)}
              className="flex items-center space-x-3 border-l border-white border-opacity-20 pl-4 ml-2 hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition-colors"
              aria-label="profil"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-[var(--color-offwhite)]">{displayName}</div>
                <div className="text-xs text-gray-400">{userInfo?.role === 'MANAGER' ? 'Manager' : userInfo?.role === 'ADMIN' ? 'Admin' : 'Employé'}</div>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-black-deep)] font-medium text-sm bg-[var(--color-gold)]">
                {initials}
              </div>
              <ChevronDown size={16} className={`text-[var(--color-gold)] transition-transform ${openProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {openProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--color-black-deep)] font-semibold text-lg bg-[var(--color-gold)]">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--color-gold)]">{displayName}</div>
                      <div className="text-sm text-gray-300">{userInfo?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Infos Personnelles */}
                <div className="border-t border-gray-200">
                  <div className="px-4 py-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Informations Personnelles</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Nom :</span>
                        <span className="font-medium text-gray-900 ml-2">{userInfo?.nom || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Prénom :</span>
                        <span className="font-medium text-gray-900 ml-2">{userInfo?.prenom || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email :</span>
                        <span className="font-medium text-gray-900 ml-2">{userInfo?.email || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rôle :</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {userInfo?.role === 'MANAGER' ? 'Manager' : userInfo?.role === 'ADMIN' ? 'Admin' : 'Employé'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-2 space-y-1">
                  <Link
                    href="/parametres"
                    className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-sm"
                    onClick={() => setOpenProfileMenu(false)}
                  >
                    <User size={16} />
                    <span>Éditer le profil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
                  >
                    <LogOut size={16} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
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
