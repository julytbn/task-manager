// En haut du fichier, avec les autres imports
import { Bell, Search, AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// À l'intérieur du composant EmployeeHeader
const [notifications, setNotifications] = useState<any[]>([])
const [unreadCount, setUnreadCount] = useState(0)
const [showNotifications, setShowNotifications] = useState(false)
const { data: session } = useSession()

// Charger les notifications
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.lu).length)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    }
  }

  fetchNotifications()
  const interval = setInterval(fetchNotifications, 60000) // Rafraîchir toutes les minutes
  return () => clearInterval(interval)
}, [])

// Marquer une notification comme lue
const markAsRead = async (notificationId: string) => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId }),
    })

    if (response.ok) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, lu: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error)
  }
}

// Mettre à jour le JSX pour les notifications
<button
  onClick={() => {
    setShowNotifications(!showNotifications)
    // Marquer toutes les notifications comme lues quand on ouvre le menu
    if (!showNotifications) {
      notifications.forEach(notif => {
        if (!notif.lu) markAsRead(notif.id)
      })
    }
  }}
  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
>
  <Bell size={20} />
  {unreadCount > 0 && (
    <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
      {unreadCount}
    </span>
  )}
</button>

{/* Notifications Dropdown */}
{showNotifications && (
  <div className="absolute top-full right-0 mt-3 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-between">
      <h3 className="font-semibold text-gray-900">Notifications récentes</h3>
      <button 
        onClick={() => setShowNotifications(false)} 
        className="text-gray-400 hover:text-gray-600 text-lg"
      >
        ✕
      </button>
    </div>

    <div className="max-h-96 overflow-y-auto">
      {notifications.length > 0 ? (
        notifications.map(notif => (
          <div
            key={notif.id}
            className={`p-4 border-b hover:bg-blue-50 cursor-pointer transition ${
              !notif.lu ? 'bg-blue-50' : ''
            }`}
            onClick={() => {
              if (notif.lien) {
                window.location.href = notif.lien
              }
            }}
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {notif.type === 'URGENT' ? (
                  <AlertCircle size={20} className="text-red-500" />
                ) : (
                  <Mail size={20} className="text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium leading-snug">
                  {notif.titre}
                </p>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(notif.dateCreation).toLocaleString()}
                  </span>
                  {!notif.lu && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      Nouveau
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="p-6 text-center text-gray-500">
          Aucune notification pour le moment
        </div>
      )}
    </div>

    <div className="p-3 border-t bg-gray-50 text-center">
      <a
        href="/notifications"
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Voir toutes les notifications
      </a>
    </div>
  </div>
)}