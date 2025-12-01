'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { NouvelleTacheModal } from '@/components/NouvelleTacheModal'

interface TacheItem {
  id: string
  titre: string
  description?: string
  projet?: { titre?: string }
  assigneA?: { prenom?: string; nom?: string }
  statut?: string
  priorite?: string
  dateEcheance?: string
  montant?: number
}

export default function TachesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tasks, setTasks] = useState<TacheItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/taches')
      if (!res.ok) throw new Error('Erreur récupération tâches')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleSaveTache = async (data: any) => {
    try {
      const response = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur lors de la création de la tâche')
      }

      await loadTasks()
      setIsModalOpen(false)
    } catch (error:any) {
      console.error('Erreur:', error)
      alert(error.message || 'Une erreur est survenue lors de la création de la tâche')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Toutes les tâches</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Tâche
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-6">Chargement des tâches...</div>
        ) : (
          <div className="p-6 space-y-4">
            {tasks.length === 0 && <div>Aucune tâche trouvée.</div>}
            {tasks.map(task => (
              <div key={task.id} className="p-4 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{task.titre}</div>
                    <div className="text-sm text-gray-500">{task.projet?.titre || ''}</div>
                  </div>
                  <div className="text-sm text-gray-700">{task.statut}</div>
                </div>
                <div className="mt-2 text-sm text-gray-500">Assigné: {task.assigneA ? `${task.assigneA.prenom} ${task.assigneA.nom}` : '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NouvelleTacheModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTache}
      />
    </div>
  )
}