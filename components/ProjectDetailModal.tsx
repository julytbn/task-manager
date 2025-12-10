"use client"
import React, { useState, useEffect } from 'react'
import { X, Trash2, Edit, Plus, CheckCircle, Circle } from 'lucide-react'
import { NouvelleTacheModal } from './NouvelleTacheModal'

type Task = {
  id: number
  titre: string
  statut: string
  dateCreation?: string | Date
}

type Project = {
  id: number
  titre: string
  description?: string
  client?: { id: number; nom: string; email?: string; telephone?: string } | null
  service?: { id: number; nom: string } | null
  statut: string
  progress: number
  budget: number
  dateDebut: string | Date
  dateFin: string | Date
  equipe?: Array<{ id: number; name?: string; nom?: string }> | null
  taches?: Task[]
}

interface Props {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (project: Project) => void
  onDelete?: (projectId: number) => void
}

export default function ProjectDetailModal({ project, isOpen, onClose, onEdit, onDelete }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    if (isOpen && project) {
      fetchTasks()
    }
  }, [isOpen, project])

  const fetchTasks = async () => {
    if (!project) return
    setLoadingTasks(true)
    try {
      const response = await fetch(`/api/projets/${project.id}/taches`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des tâches:', err)
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !project) return

    try {
      const response = await fetch(`/api/projets/${project.id}/taches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: newTaskTitle })
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks([...tasks, newTask])
        setNewTaskTitle('')
        setShowAddTask(false)
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la tâche:', err)
      alert('Erreur lors de l\'ajout de la tâche')
    }
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks([...tasks, newTask])
        setShowTaskModal(false)
        // Rafraîchir les tâches
        fetchTasks()
      } else {
        alert('Erreur lors de la création de la tâche')
      }
    } catch (err) {
      console.error('Erreur lors de la création de la tâche:', err)
      alert('Erreur lors de la création de la tâche')
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!project) return
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return

    try {
      const response = await fetch(`/api/projets/${project.id}/taches/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskId))
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la tâche:', err)
      alert('Erreur lors de la suppression de la tâche')
    }
  }

  if (!isOpen || !project) return null

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.titre}" ? Cette action est irréversible.`)) {
      onDelete?.(project.id)
      onClose()
    }
  }

  const formatDate = (date: string | Date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000).toFixed(0)}K FCFA`
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'EN_COURS':
        return 'bg-blue-100 text-blue-800'
      case 'TERMINE':
        return 'bg-green-100 text-green-800'
      case 'PROPOSITION':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'TERMINE':
        return 'text-green-600'
      case 'EN_COURS':
        return 'text-blue-600'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--color-offwhite)] w-full max-w-2xl max-h-[80vh] overflow-auto rounded-lg shadow-lg border border-[var(--color-gold)]/20 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90 sticky top-0">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-gold)]">{project.titre}</h3>
            <p className="text-xs text-[var(--color-offwhite)]/70">Détails du projet</p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(project)}
                className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-gold)] transition-colors"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {project.description && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Description</h4>
              <p className="text-sm text-[var(--color-anthracite)]/70">{project.description}</p>
            </div>
          )}

          {/* Client & Service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.client && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Client</h4>
                <div className="bg-white rounded border border-[var(--color-border)] p-3">
                  <p className="text-sm font-semibold text-[var(--color-black-deep)]">{project.client.nom}</p>
                  {project.client.email && <p className="text-xs text-[var(--color-anthracite)]/70">{project.client.email}</p>}
                  {project.client.telephone && <p className="text-xs text-[var(--color-anthracite)]/70">{project.client.telephone}</p>}
                </div>
              </div>
            )}
            {project.service && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Service</h4>
                <div className="bg-white rounded border border-[var(--color-border)] p-3">
                  <p className="text-sm font-semibold text-[var(--color-black-deep)]">{project.service.nom}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Statut</h4>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.statut)}`}>
                {project.statut || 'N/A'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Progression</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[var(--color-border)] rounded-full h-2">
                  <div
                    className="bg-[var(--color-gold)] h-2 rounded-full transition-all"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-[var(--color-anthracite)]">{project.progress || 0}%</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Date de début</h4>
              <p className="text-sm text-[var(--color-anthracite)]/70">{formatDate(project.dateDebut)}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Date de fin</h4>
              <p className="text-sm text-[var(--color-anthracite)]/70">{formatDate(project.dateFin)}</p>
            </div>
          </div>

          {/* Budget */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Budget</h4>
            <p className="text-lg font-bold gold-gradient-text">{formatCurrency(project.budget)}</p>
          </div>

          {/* Team */}
          {project.equipe && project.equipe.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-anthracite)] mb-2">Équipe</h4>
              <div className="bg-white rounded border border-[var(--color-border)]">
                <ul className="divide-y divide-[var(--color-border)]">
                  {project.equipe.map((member) => (
                    <li key={member.id} className="px-3 py-2 text-sm text-[var(--color-anthracite)]">
                      {member.name || member.nom}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--color-anthracite)]">Tâches ({tasks.length})</h4>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded text-xs font-semibold hover:bg-[var(--color-gold-accent)] transition-colors"
              >
                <Plus size={16} />
                Nouvelle tâche
              </button>
            </div>

            {loadingTasks ? (
              <div className="text-center py-4 text-[var(--color-anthracite)]/70">Chargement des tâches...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-6 bg-white rounded border border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-anthracite)]/70">Aucune tâche pour ce projet</p>
              </div>
            ) : (
              <div className="space-y-2 bg-white rounded border border-[var(--color-border)]">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border-b border-[var(--color-border)]/50 last:border-b-0 hover:bg-[var(--color-offwhite)] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {task.statut?.toUpperCase() === 'TERMINE' ? (
                        <CheckCircle size={18} className={getTaskStatusColor(task.statut)} />
                      ) : (
                        <Circle size={18} className={getTaskStatusColor(task.statut)} />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.statut?.toUpperCase() === 'TERMINE' ? 'line-through text-gray-500' : 'text-[var(--color-anthracite)]'}`}>
                          {task.titre}
                        </p>
                        <p className="text-xs text-[var(--color-anthracite)]/50">
                          Statut: <span className={`font-semibold ${getTaskStatusColor(task.statut)}`}>{task.statut || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Supprimer la tâche"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button onClick={onClose} className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)] hover:bg-[var(--color-offwhite)]">
              Fermer
            </button>
          </div>
        </div>

        {/* Modal de création de tâche */}
        <NouvelleTacheModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSave={handleSaveTask}
          initial={{ projetId: project?.id }}
        />
      </div>
    </div>
  )
}
