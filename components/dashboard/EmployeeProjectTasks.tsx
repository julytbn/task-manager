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

  const formatStatus = (statut: string): string => {
    const s = statut?.toUpperCase() || ''
    if (s.includes('TERMINE')) return 'Terminé'
    if (s.includes('EN_COURS')) return 'En cours'
    if (s.includes('EN_REVISION')) return 'En révision'
    if (s.includes('A_FAIRE')) return 'À faire'
    return statut || 'Non défini'
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('fr-FR')
    } catch (e) {
      return dateString
    }
  }

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
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 text-sm bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    )
  }

  if (myTasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Aucune tâche à afficher pour le moment.</p>
        <p className="text-sm mt-1">Vos tâches apparaîtront ici.</p>
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
    <div className="space-y-3">
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
      <div className="flex flex-col space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            className="text-sm pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <select
            className="flex-1 min-w-[120px] text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="A_FAIRE">À faire</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
          </select>

          {userProjects.length > 1 && (
            <select
              className="flex-1 min-w-[120px] text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
            >
              <option value="">Tous les projets</option>
              {userProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.titre.length > 15 ? `${project.titre.substring(0, 15)}...` : project.titre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{task.titre}</h4>
                  {task.projetTitre && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {task.projetTitre}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.statut)}`}
                >
                  {formatStatus(task.statut)}
                </span>
              </div>
              
              {task.dateEcheance && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(task.dateEcheance)}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg">
            <p>Aucune tâche ne correspond à vos critères.</p>
          </div>
        )}
      </div>
    </div>
  )
}
