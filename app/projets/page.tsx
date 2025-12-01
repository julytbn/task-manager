 'use client'

import Link from "next/link"
import { Plus, Clock, CheckCircle, AlertCircle, Users, Search } from "lucide-react"
import { NouvelleTacheModal } from '@/components/NouvelleTacheModal'
import { useEffect, useState } from "react"
import ProjectModal from "@/components/ProjectModal"; // Import the modal
import { useProjectsStatistics } from '@/lib/useProjectsStatistics'

type Project = {
  id: number
  title: string
  client: {
    id: number
    nom: string
    email?: string
    telephone?: string
  } | null
  status: 'en_cours' | 'termine' | 'en_retard'
  progress: number
  team: Array<{
    id: number
    name: string
    avatar: string | null
    email: string
  }>
  dateDebut: string | Date
  dateFin: string | Date
  budget: number
  tasks: Array<{
    id: number
    title: string
    status: string
    createdAt: string
    updatedAt: string
  }>
  createdAt: string
  updatedAt: string
  service?: {
    id: number
    nom: string
  } | null
}

const statusConfig = {
  en_cours: { 
    color: 'bg-blue-500', 
    label: 'En cours',
    badge: 'bg-blue-100 text-blue-800'
  },
  termine: { 
    color: 'bg-green-500', 
    label: 'Terminé',
    badge: 'bg-green-100 text-green-800'
  },
  en_retard: { 
    color: 'bg-red-500', 
    label: 'En retard',
    badge: 'bg-red-100 text-red-800'
  },
}

const getStatusIcon = (status: 'en_cours' | 'termine' | 'en_retard') => {
  switch(status) {
    case 'en_cours': return <Clock size={14} />
    case 'termine': return <CheckCircle size={14} />
    case 'en_retard': return <AlertCircle size={14} />
    default: return <Clock size={14} />
  }
}

const filterConfig = {
  tous: 'Tous',
  propositions: 'Propositions',
  en_cours: 'En cours',
  termine: 'Terminés',
}

export default function ProjetsPage() {
  const { data: statsData, loading: statsLoading, error: statsError, refreshStatistics } = useProjectsStatistics()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState('tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskProjectId, setTaskProjectId] = useState<number | null>(null)

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/projets')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des projets')
      }
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les projets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Filtrer les projets selon le filtre et la recherche
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (project.client && project.client.nom.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (selectedFilter === 'tous') return matchesSearch
    if (selectedFilter === 'en_cours') return matchesSearch && project.status === 'en_cours'
    if (selectedFilter === 'termine') return matchesSearch && project.status === 'termine'
    if (selectedFilter === 'propositions') return matchesSearch && project.status === 'en_retard'
    
    return matchesSearch
  })

  // Utiliser les statistiques du hook si disponibles, sinon calculer localement
  const stats = statsData ? {
    total: statsData.totalProjets,
    enCours: statsData.projetsEnCours,
    termines: statsData.projetsTermines,
    budgetTotal: statsData.budgetTotal,
    budgetFormatted: statsData.budgetTotalFormatted
  } : {
    total: projects.length,
    enCours: projects.filter(p => p.status === 'en_cours').length,
    termines: projects.filter(p => p.status === 'termine').length,
    budgetTotal: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    budgetFormatted: `${(projects.reduce((sum, p) => sum + (p.budget || 0), 0) / 1000000).toFixed(0)}M FCFA`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Projets</h1>
          <p className="text-gray-600 mt-1">Suivez tous vos projets et leur progression</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard 
          label="Total Projets" 
          value={stats.total}
          icon="📁"
        />
        <KpiCard 
          label="En Cours" 
          value={stats.enCours}
          icon="⚙️"
          color="blue"
        />
        <KpiCard 
          label="Terminés" 
          value={stats.termines}
          icon="✓"
          color="green"
        />
        <KpiCard 
          label="Budget Total" 
          value={stats.budgetFormatted || `${(stats.budgetTotal / 1000000).toFixed(0)}M FCFA`}
          icon="💰"
          color="orange"
        />
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={() => {
          fetchProjects() // Refresh projects list
        }}
      />

      {/* Nouvelle Tâche Modal (création d'une tâche liée à un projet) */}
      <NouvelleTacheModal
        isOpen={isTaskModalOpen}
        initial={{ projetId: taskProjectId ?? undefined }}
        onClose={() => { setIsTaskModalOpen(false); setTaskProjectId(null); }}
        onSave={async (payload: any) => {
          try {
            const res = await fetch('/api/taches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

            const body = await res.json().catch(() => null)

            if (!res.ok) {
              // Provide user-facing feedback when creation fails (403 = permission)
              const message = body?.message || body?.error || `Erreur lors de la création (${res.status})`
              window.alert(message)
              console.error('Erreur création tâche:', body || res.status)
              return
            }

            // Success: notify user, refresh and close modal
            window.alert('Tâche créée avec succès')
            setIsTaskModalOpen(false)
            setTaskProjectId(null)
            fetchProjects()
            if (typeof refreshStatistics === 'function') refreshStatistics()
          } catch (e) {
            console.error('Erreur lors de la création de la tâche', e)
            window.alert('Une erreur réseau est survenue lors de la création de la tâche')
          }
        }}
      />

      {/* Projects Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          {/* Search and Filter */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Rechercher un projet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b">
              {Object.entries(filterConfig).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedFilter(key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedFilter === key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onCreateTask={(id: number) => { setTaskProjectId(id); setIsTaskModalOpen(true); }} />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun projet trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant KpiCard
function KpiCard({ label, value, icon, color = 'gray' }: { label: string; value: string | number; icon: string; color?: string }) {
  const colorClass = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
  }[color]

  return (
    <div className={`border rounded-lg p-6 ${colorClass}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

// Composant ProjectCard amélioré
function ProjectCard({ project, onCreateTask }: { project: Project; onCreateTask?: (id: number) => void }) {
  const status = statusConfig[project.status] || statusConfig['en_cours']
  
  const progress = project.tasks?.length > 0 ? 
    (project.tasks.filter(t => t.status === 'TERMINE').length / project.tasks.length) * 100 : 
    project.progress || 0;

  const tasksCompleted = project.tasks?.filter(t => t.status === 'TERMINE').length || 0
  const totalTasks = project.tasks?.length || 0

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header with Status */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{project.client?.nom || 'Sans client'}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.badge}`}>
            {getStatusIcon(project.status)}
            {status.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        {/* Service if available */}
        {project.service && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Service</p>
            <p className="text-sm text-gray-700 font-medium">{project.service.nom}</p>
          </div>
        )}

        {/* Budget */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Budget</p>
          <p className="text-sm text-gray-900 font-semibold">
            {project.budget ? `${(project.budget / 1000000).toFixed(1)}M FCFA` : 'N/A'}
          </p>
        </div>

        {/* Date Period */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Période</p>
          <p className="text-sm text-gray-700">
            {project.dateDebut ? new Date(project.dateDebut).toLocaleDateString('fr-FR') : 'N/A'} - {project.dateFin ? new Date(project.dateFin).toLocaleDateString('fr-FR') : 'N/A'}
          </p>
        </div>

        {/* Tasks */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tâches</p>
          <p className="text-sm text-gray-700 font-medium">
            {tasksCompleted} / {totalTasks}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Progression</span>
            <span className="text-xs font-semibold text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all ${status.color}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Team Members */}
        {project.team && project.team.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Équipe</span>
              <div className="flex -space-x-2">
                {project.team.slice(0, 3).map((member, index) => (
                  <div 
                    key={index}
                    className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-medium border-2 border-white text-white flex-shrink-0"
                  >
                    {member.avatar || member.name?.charAt(0) || '?'}
                  </div>
                ))}
                {project.team.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium border-2 border-white text-gray-700">
                    +{project.team.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t text-right flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onCreateTask && onCreateTask(project.id)}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Nouvelle tâche
        </button>
        <Link 
          href={`/projets/${project.id}`}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 gap-1"
        >
          Voir détails
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}