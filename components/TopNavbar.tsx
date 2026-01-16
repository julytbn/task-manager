"use client"
import { LogOut, Menu, Bell, Search as SearchIcon, User, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import KekeliLogo from './KekeliLogo'

// Dynamic import to avoid SSR issues for the sidebar overlay
const ManagerSidebar = dynamic(() => import('@/components/ManagerSidebar'), { ssr: false })

interface TopNavbarProps {
  onMenuClick?: () => void
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
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
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      <div className="h-full flex items-center px-3 sm:px-4 md:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          aria-label="open menu"
          className="mr-1 sm:mr-2 md:hidden text-[var(--color-gold)] hover:opacity-80 transition-opacity flex-shrink-0 p-1"
          onClick={() => onMenuClick?.()}
        >
          <Menu size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 mr-2 sm:mr-4 md:mr-6 flex-shrink-0">
          <KekeliLogo size={36} />
          <div className="hidden sm:block">
            <div className="text-xs md:text-sm lg:text-base font-bold text-[var(--color-gold)]">KEKELI</div>
            <div className="text-xs text-white opacity-80 -mt-0.5">GROUP</div>
          </div>
        </div>

        {/* Middle: search (desktop) */}
        <div className="hidden md:flex items-center flex-1 justify-center px-2 md:px-4">
          <div className="relative w-full max-w-xs lg:max-w-sm">
            <SearchIcon size={14} className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0" />
            <input
              aria-label="search"
              placeholder="Rechercher..."
              className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 text-sm bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-[var(--color-offwhite)] placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 ml-auto flex-shrink-0">
          {/* Notifications */}
          <button aria-label="notifications" className="relative p-1.5 md:p-2 rounded-md hover:bg-white hover:bg-opacity-10 text-[var(--color-gold)] transition-colors flex-shrink-0">
            <Bell size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-[var(--color-black-900)]" />
          </button>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setOpenProfileMenu(!openProfileMenu)}
              className="flex items-center space-x-1.5 md:space-x-3 border-l border-white border-opacity-20 pl-2 md:pl-3 lg:pl-4 ml-1 md:ml-2 hover:bg-white hover:bg-opacity-10 px-2 md:px-3 py-1 md:py-2 rounded-lg transition-colors flex-shrink-0"
              aria-label="profil"
            >
              <div className="text-right hidden md:block">
                <div className="text-xs md:text-sm font-medium text-[var(--color-offwhite)]">{displayName}</div>
                <div className="text-xs text-gray-400">{userInfo?.role === 'MANAGER' ? 'Manager' : userInfo?.role === 'ADMIN' ? 'Admin' : 'Employé'}</div>
              </div>
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[var(--color-black-deep)] font-medium text-xs md:text-sm bg-[var(--color-gold)] flex-shrink-0">
                {initials}
              </div>
              <ChevronDown size={14} className={`text-[var(--color-gold)] transition-transform hidden md:block flex-shrink-0 ${openProfileMenu ? 'rotate-180' : ''}`} />
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
