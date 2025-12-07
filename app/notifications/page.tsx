"use client"
import { useEffect, useState } from 'react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Erreur récupération notifications')
      const data = await res.json()
      setNotifications(data)
    } catch (err) {
      setError('Impossible de charger les notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      })
      if (!res.ok) throw new Error('Erreur lors du marquage')
      await fetchNotifications()
    } catch (err) {
      alert('Erreur lors du marquage comme lu')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : notifications.length === 0 ? (
        <div>Aucune notification</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map(n => (
            <li key={n.id} className={`border rounded-lg p-4 ${n.lu ? 'bg-gray-100' : 'bg-blue-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{n.titre}</div>
                  <div className="text-sm text-gray-600">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.dateCreation).toLocaleString('fr-FR')}</div>
                </div>
                {!n.lu && (
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    onClick={() => markAsRead(n.id)}
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
