"use client"
import React, { useEffect, useState } from 'react'
import { CheckCircle2, Clock, AlertTriangle, Filter, Search } from 'lucide-react'

interface Task {
  id: string
  titre: string
  description?: string
  statut: string
  priorite: string
  dateEcheance?: string | null
  projetTitre?: string
  projetId?: string
}

interface Project {
  id: string
  titre: string
  taches: Task[]
}

export default function EmployeeProjectTasks() {
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        // Fetch user data with team and projects
        const userRes = await fetch('/api/me')
        if (!userRes.ok) throw new Error('Failed to fetch user')
        
        const userData = await userRes.json()
        
        // Get projects from user's team
        const projects: Project[] = userData.equipe?.projets?.map((p: any) => ({
          id: p.id,
          titre: p.titre,
          taches: p.taches || []
        })) || []

        // Get all tasks from user's team projects and format them
        const relevantTasks: Task[] = []
        projects.forEach(proj => {
          proj.taches.forEach((t: any) => {
            relevantTasks.push({
              id: t.id,
              titre: t.titre,
              description: t.description,
              statut: t.statut,
              priorite: t.priorite,
              dateEcheance: t.dateEcheance,
              projetTitre: proj.titre,
              projetId: proj.id
            })
          })
        })

        if (mounted) {
          setUserProjects(projects)
          setMyTasks(relevantTasks)
          setError(null)
        }
      } catch (err) {
        console.error('Erreur chargement tasks', err)
        if (mounted) setError('Erreur lors du chargement des données')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Filter tasks
  const filteredTasks = myTasks.filter(task => {
    if (filterStatus && !task.statut?.toUpperCase().includes(filterStatus.toUpperCase())) return false
    if (filterPriority && !task.priorite?.toUpperCase().includes(filterPriority.toUpperCase())) return false
    if (selectedProject && task.projetId !== selectedProject) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!task.titre.toLowerCase().includes(search) && !task.description?.toLowerCase().includes(search)) return false
    }
    return true
  })

  const getStatusColor = (statut: string): string => {
    const s = statut?.toUpperCase() || ''
    if (s.includes('TERMINE')) return 'bg-green-100 text-green-700 border-green-300'
    if (s.includes('EN_COURS')) return 'bg-blue-100 text-blue-700 border-blue-300'
    if (s.includes('EN_REVISION')) return 'bg-purple-100 text-purple-700 border-purple-300'
    if (s.includes('A_FAIRE')) return 'bg-gray-100 text-gray-700 border-gray-300'
    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getPriorityColor = (priorite: string): string => {
    const p = priorite?.toUpperCase() || ''
    if (p.includes('URGENT')) return 'text-red-600 bg-red-50'
    if (p.includes('HAUTE')) return 'text-orange-600 bg-orange-50'
    if (p.includes('MOYENNE')) return 'text-yellow-600 bg-yellow-50'
    return 'text-blue-600 bg-blue-50'
  }

  const getStatusIcon = (statut: string) => {
    const s = statut?.toUpperCase() || ''
    if (s.includes('TERMINE')) return <CheckCircle2 size={18} className="text-green-600" />
    if (s.includes('EN_COURS')) return <Clock size={18} className="text-blue-600" />
    if (s.includes('EN_REVISION')) return <AlertTriangle size={18} className="text-purple-600" />
    return <Clock size={18} className="text-gray-400" />
  }

  const isOverdue = (dateEcheance?: string | null) => {
    if (!dateEcheance) return false
    return new Date(dateEcheance) < new Date()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement de vos tâches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    )
  }

  const stats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.statut?.toUpperCase().includes('TERMINE')).length,
    inProgress: filteredTasks.filter(t => t.statut?.toUpperCase().includes('EN_COURS')).length,
    overdue: filteredTasks.filter(t => t.dateEcheance && isOverdue(t.dateEcheance) && !t.statut?.toUpperCase().includes('TERMINE')).length
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-semibold">TOTAL</div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-semibold">TERMINÉES</div>
          <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-semibold">EN COURS</div>
          <div className="text-3xl font-bold text-purple-900">{stats.inProgress}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 font-semibold">EN RETARD</div>
          <div className="text-3xl font-bold text-red-900">{stats.overdue}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2 border border-gray-300">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
          >
            <option value="">Tous les projets</option>
            {userProjects.map(p => (
              <option key={p.id} value={p.id}>{p.titre}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="TERMINE">Terminée</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_REVISION">En révision</option>
            <option value="A_FAIRE">À faire</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
          >
            <option value="">Toutes les priorités</option>
            <option value="URGENTE">Urgente</option>
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="BASSE">Basse</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredTasks.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(task.statut)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 text-sm md:text-base">{task.titre}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded border font-medium ${getStatusColor(task.statut)}`}>
                          {task.statut}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(task.priorite)}`}>
                          {task.priorite}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      {task.projetTitre && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                          📁 {task.projetTitre}
                        </span>
                      )}
                      {task.dateEcheance && (
                        <span className={`px-2 py-1 rounded border ${
                          isOverdue(task.dateEcheance) && !task.statut?.toUpperCase().includes('TERMINE')
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          📅 {new Date(task.dateEcheance).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Filter size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">Aucune tâche ne correspond aux critères</p>
            <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>
    </div>
  )
}
