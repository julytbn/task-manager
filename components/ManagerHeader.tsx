"use client"
import { Bell, Search, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function ManagerHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: session } = useSession()

  // Mock notifications
  const notifications = [
    { id: 1, type: 'delay', message: 'Projet "App Mobile" - 3 tâches en retard', time: '2h' },
    { id: 2, type: 'completed', message: 'Julie a complété "Design UI Kit"', time: '1h' },
    { id: 3, type: 'alert', message: 'Budget dépassé sur "Infrastructure"', time: '30m' },
  ]

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher projet, tâche, employé..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6 ml-8">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="notifications"
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-3 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications récentes</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b hover:bg-blue-50 cursor-pointer transition">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {notif.type === 'delay' && <AlertCircle size={20} className="text-red-500" />}
                          {notif.type === 'completed' && <CheckCircle2 size={20} className="text-green-500" />}
                          {notif.type === 'alert' && <AlertCircle size={20} className="text-orange-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium leading-snug">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-gray-50 text-center border-t hover:bg-blue-50 transition">
                  <Link href="/notifications" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Voir toutes les notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-900">{session?.user?.prenom || 'Manager'}</div>
              <div className="text-xs text-gray-500 font-medium">Manager</div>
            </div>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-sm flex items-center justify-center hover:shadow-lg hover:from-blue-500 hover:to-blue-700 transition">
              {session?.user?.prenom?.[0] || 'U'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
