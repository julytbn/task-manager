"use client"
import { Bell, Search, AlertCircle, CheckCircle2, LogOut, User, ChevronDown } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function ManagerHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: session } = useSession()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Charger les notifications depuis la base (attend la session)
  useEffect(() => {
    let mounted = true

    const fetchNotifications = async () => {
      try {
        if (!session?.user?.email) return
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.lu).length)
      } catch (err) {
        console.error('Erreur chargement notifications (manager):', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [session])

  // Fermer le menu profil quand on clique dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setNotifications(prev => prev.map(n => (n.id === updated.id ? updated : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Erreur marquage notification lu:', err)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/connexion' })
  }

  const displayName = session?.user?.prenom || 'Utilisateur'
  const initials = (session?.user?.prenom?.[0] || 'U') + (session?.user?.nom?.[0] || '')

  return (
    <header className="bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)] border-b border-[var(--color-gold)] border-opacity-20 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Search Bar */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gold)] opacity-70 group-focus-within:opacity-100 transition" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher projet, tâche, employé..."
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg py-2.5 px-4 pl-11 text-sm text-[var(--color-offwhite)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:bg-opacity-15 transition"
              />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6 ml-8">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                // Marquer toutes comme lues quand on ouvre
                if (!showNotifications) {
                  notifications.forEach((notif) => {
                    if (!notif.lu) markAsRead(notif.id)
                  })
                }
              }}
              aria-label="notifications"
              className="relative p-2 text-[var(--color-gold)] hover:opacity-80 rounded-lg transition duration-200"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-3 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)] flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--color-gold)]">Notifications récentes</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${!notif.lu ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          if (notif.lien) window.location.href = notif.lien
                          if (!notif.lu) markAsRead(notif.id)
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {notif.type === 'URGENT' ? (
                              <AlertCircle size={20} className="text-red-500" />
                            ) : (
                              <CheckCircle2 size={20} className="text-green-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 font-medium leading-snug">{notif.titre || notif.message}</p>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">{new Date(notif.dateCreation).toLocaleString()}</span>
                              {!notif.lu && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Nouveau</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">Aucune notification pour le moment</div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 text-center border-t hover:bg-gray-100 transition">
                  <Link href="/notifications" className="text-sm font-semibold text-[var(--color-gold)] hover:opacity-80">
                    Voir toutes les notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 pl-6 border-l border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition"
              aria-label="profil"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-[var(--color-offwhite)]">{displayName}</div>
                <div className="text-xs text-gray-400">Manager</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--color-gold)] text-[var(--color-black-deep)] font-bold text-sm flex items-center justify-center">
                {initials}
              </div>
              <ChevronDown size={16} className={`text-[var(--color-gold)] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                {/* Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--color-black-deep)] font-semibold text-lg bg-[var(--color-gold)]">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--color-gold)]">{displayName}</div>
                      <div className="text-sm text-gray-300">{session?.user?.email}</div>
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
                        <span className="font-medium text-gray-900 ml-2">{session?.user?.nom || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Prénom :</span>
                        <span className="font-medium text-gray-900 ml-2">{session?.user?.prenom || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email :</span>
                        <span className="font-medium text-gray-900 ml-2">{session?.user?.email || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rôle :</span>
                        <span className="font-medium text-gray-900 ml-2">Manager</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-2 space-y-1">
                  <Link
                    href="/parametres"
                    className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-sm"
                    onClick={() => setShowProfileMenu(false)}
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
    </header>
  )
}
