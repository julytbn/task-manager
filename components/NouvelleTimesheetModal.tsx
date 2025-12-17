'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { X } from 'lucide-react'

type Timesheet = {
  id: string
  date: string
  heures: number
  description: string
  projetId?: string
  tacheId?: string
  projet?: { id: string; titre: string }
  tache?: { id: string; titre: string }
  statut?: string
}

interface NouvelleTimesheetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (newSheet: Timesheet) => void
}

interface Project {
  id: string
  titre: string
}

interface Task {
  id: string
  titre: string
  projetId: string
  projet?: { id: string; titre: string }
}

export default function NouvelleTimesheetModal({ isOpen, onClose, onSubmit }: NouvelleTimesheetModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    heures: 8,
    description: '',
    projetId: '',
    tacheId: '',
  })
  
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Charger les projets et tâches de l'employé
  useEffect(() => {
    if (!isOpen) return

    const loadData = async () => {
      try {
        setLoading(true)
        // Utiliser les endpoints corrects pour les projets et tâches de l'employé
        const [projectRes, taskRes] = await Promise.all([
          fetch('/api/projets/my-projects'),
          fetch('/api/taches/mes-taches')
        ])

        if (projectRes.ok) {
          const projectData = await projectRes.json()
          // Gérer le format de la réponse
          if (projectData.success && projectData.data) {
            setProjects(projectData.data)
          } else if (Array.isArray(projectData)) {
            setProjects(projectData)
          }
        }

        if (taskRes.ok) {
          const taskData = await taskRes.json()
          // Gérer le format de la réponse
          if (taskData.success && taskData.data) {
            setTasks(taskData.data)
            setFilteredTasks(taskData.data)
          } else if (Array.isArray(taskData)) {
            setTasks(taskData)
            setFilteredTasks(taskData)
          }
        }
      } catch (err) {
        console.error('Erreur chargement projets/tâches:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen])

  // Filtrer les tâches selon le projet sélectionné
  useEffect(() => {
    if (formData.projetId) {
      const filtered = tasks.filter(t => t.projetId === formData.projetId)
      setFilteredTasks(filtered)
      // Réinitialiser la sélection de tâche si elle n'est pas dans le projet
      if (formData.tacheId && !filtered.find(t => t.id === formData.tacheId)) {
        setFormData(prev => ({ ...prev, tacheId: '' }))
      }
    } else {
      setFilteredTasks(tasks)
    }
  }, [formData.projetId, tasks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Récupérer les informations du projet et tâche sélectionnés
      const projet = projects.find(p => p.id === formData.projetId)
      const tache = tasks.find(t => t.id === formData.tacheId)

      const payload: any = {
        date: formData.date,
        heures: formData.heures,
        description: formData.description,
        projetId: formData.projetId || undefined,
        tacheId: formData.tacheId || undefined
      }

      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Erreur lors de la création')
      const newSheet = await res.json()
      
      // Enrichir les données retournées avec les infos du projet/tâche
      const enrichedSheet: Timesheet = {
        ...newSheet,
        projet: projet ? { id: projet.id, titre: projet.titre } : undefined,
        tache: tache ? { id: tache.id, titre: tache.titre } : undefined
      }

      onSubmit(enrichedSheet)
      
      // Réinitialiser le formulaire
      setFormData({
        date: new Date().toISOString().split('T')[0],
        heures: 8,
        description: '',
        projetId: '',
        tacheId: '',
      })
      onClose()
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la création de la feuille de temps')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Nouvelle feuille de temps</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Projet */}
          <div>
            <label className="block text-sm font-medium mb-1">Projet (optionnel)</label>
            <select
              value={formData.projetId}
              onChange={(e) => setFormData({ ...formData, projetId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={loading}
            >
              <option value="">Sélectionner un projet...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Tâche */}
          <div>
            <label className="block text-sm font-medium mb-1">Tâche (optionnel)</label>
            <select
              value={formData.tacheId}
              onChange={(e) => setFormData({ ...formData, tacheId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={loading || filteredTasks.length === 0}
            >
              <option value="">
                {formData.projetId 
                  ? 'Sélectionner une tâche...' 
                  : 'Sélectionner d\'abord un projet'}
              </option>
              {filteredTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Heures */}
          <div>
            <label className="block text-sm font-medium mb-1">Heures</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={formData.heures}
              onChange={(e) => setFormData({ ...formData, heures: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le travail effectué..."
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
