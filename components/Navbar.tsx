"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Bell, Menu, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

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
      className="fixed top-0 left-0 right-0 z-30 transition-all duration-300"
      style={{
        height: '4rem',
        left: 'var(--sidebar-width)',
        width: 'calc(100% - var(--sidebar-width))',
      }}
    >
      {/* Navbar background with glass effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90 backdrop-blur-md border-b border-[var(--color-gold)]/20 opacity-95" />

      {/* Navbar content */}
      <div className="relative h-full flex items-center justify-between px-8 py-4">
        {/* Left section: Hamburger (mobile) + Page title */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] transition-all duration-300 p-2"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-semibold gold-gradient-text hidden md:block">Dashboard</h1>
        </div>

        {/* Center section: Search bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center flex-1 max-w-md mx-auto"
        >
          <div className="relative w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-gold)]/70"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-[var(--color-offwhite)] text-[var(--color-black-deep)] border border-[var(--color-gold)]/30 focus:border-[var(--color-gold)] focus:outline-none transition-all duration-200 placeholder:text-[var(--color-anthracite)]/50"
            />
          </div>
        </form>

        {/* Right section: Notifications + Avatar */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <button className="relative text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] transition-all duration-200 p-2 rounded-lg hover:bg-[var(--color-black-900)]/30">
            <Bell size={22} />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-[var(--color-gold)] text-[var(--color-black-deep)] text-xs font-semibold rounded-full">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Avatar with dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-black-900)]/30 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-shadow)] flex items-center justify-center text-[var(--color-black-deep)] font-semibold text-sm">
                {session?.user?.nom?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[var(--color-offwhite)]">{session?.user?.nom || 'Utilisateur'}</p>
                <p className="text-xs text-[var(--color-gold)]">{session?.user?.role || 'Utilisateur'}</p>
              </div>
            </button>

            {/* Dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-black-900)] border border-[var(--color-gold)]/30 rounded-lg shadow-lg overflow-hidden animate-in fade-in-50 duration-200">
                <Link
                  href="/parametres"
                  className="flex items-center gap-3 px-4 py-3 text-[var(--color-offwhite)] hover:bg-[var(--color-black-deep)] hover:text-[var(--color-gold)] transition-all duration-200 text-sm"
                >
                  <User size={18} />
                  <span>Profil</span>
                </Link>
                <button
                  onClick={() => {
                    signOut()
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[var(--color-offwhite)] hover:bg-[var(--color-black-deep)] hover:text-[var(--color-gold)] transition-all duration-200 text-sm border-t border-[var(--color-gold)]/20"
                >
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gold separator line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-50" />
    </header>
  )
}
