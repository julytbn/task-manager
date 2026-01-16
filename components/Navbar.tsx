"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Bell, Menu, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import KekeliLogo from './KekeliLogo'

type NavbarProps = {
  onMenuClick?: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    let mounted = true

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        const unread = Array.isArray(data) ? data.filter((n: any) => !n.lu).length : 0
        setNotificationCount(unread)
      } catch (err) {
        console.error('Erreur récupération notifications (navbar):', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      // TODO: implement search functionality
      console.log('Search for:', searchValue)
    }
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 transition-all duration-300 lg:left-[var(--sidebar-width)]"
      style={{
        height: '4rem',
        width: 'calc(100% - var(--sidebar-width))',
        left: 'var(--sidebar-width)',
      }}
    >
      {/* Navbar background with glass effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[var(--color-black-deep)] to-[var(--color-black-900)]/90 backdrop-blur-lg border-b border-[var(--color-gold)]/30 opacity-98 shadow-lg" />

      {/* Navbar content */}
      <div className="relative h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-2">
        {/* Left section: Logo + Hamburger (mobile) + Page title */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 z-10 min-w-0">
          <div className="flex-shrink-0">
            <KekeliLogo className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <button
            onClick={onMenuClick}
            className="lg:hidden text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] hover:scale-110 transition-all duration-300 p-1.5 sm:p-2 rounded-lg hover:bg-[var(--color-black-900)]/50 flex-shrink-0"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold gold-gradient-text hidden md:block drop-shadow-lg truncate">Dashboard</h1>
        </div>

        {/* Center section: Search bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center flex-1 max-w-sm mx-2 lg:mx-auto"
        >
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-gold)]/70 flex-shrink-0"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 text-sm sm:text-base rounded-lg bg-[var(--color-offwhite)]/95 text-[var(--color-black-deep)] border border-[var(--color-gold)]/40 focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/30 transition-all duration-200 placeholder:text-[var(--color-anthracite)]/80 font-medium"
            />
          </div>
        </form>

        {/* Right section: Notifications + Avatar */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Notifications */}
          <button className="relative text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] hover:scale-110 transition-all duration-300 p-1.5 sm:p-2 rounded-lg hover:bg-[var(--color-black-900)]/50 group flex-shrink-0">
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-shadow)] text-[var(--color-black-deep)] text-xs font-bold rounded-full shadow-lg animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Avatar with dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-[var(--color-black-900)]/50 transition-all duration-300 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-shadow)] flex items-center justify-center text-[var(--color-black-deep)] font-bold text-xs sm:text-sm shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                {(session?.user?.nom?.charAt(0) || 'U')?.toUpperCase()}
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[var(--color-offwhite)] group-hover:text-[var(--color-gold)] transition-colors truncate">
                  {session?.user?.prenom && session?.user?.nom 
                    ? `${session.user.prenom} ${session.user.nom}` 
                    : session?.user?.nom 
                    ? session.user.nom 
                    : 'Utilisateur'}
                </p>
                <p className="text-xs text-[var(--color-gold)]/80">{session?.user?.role || 'Utilisateur'}</p>
              </div>
            </button>

            {/* Dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gradient-to-b from-[var(--color-black-900)] to-[#1a1a1a] border border-[var(--color-gold)]/40 rounded-lg shadow-2xl overflow-hidden animate-in fade-in-50 duration-300 z-50">
                <Link
                  href="/parametres"
                  className="flex items-center gap-3 px-4 py-3 text-[var(--color-offwhite)] hover:bg-[var(--color-gold)]/20 hover:text-[var(--color-gold)] transition-all duration-300 text-sm group"
                >
                  <User size={16} />
                  <span>Profil</span>
                </Link>
                <button
                  onClick={() => {
                    signOut()
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[var(--color-offwhite)] hover:bg-[var(--color-gold)]/20 hover:text-[var(--color-gold)] transition-all duration-300 text-sm border-t border-[var(--color-gold)]/20 group"
                >
                  <LogOut size={16} />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gold separator line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-60" />
    </header>
  )
}
