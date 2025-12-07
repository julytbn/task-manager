"use client"
import { Search, Plus, Filter, ChevronDown, AlertTriangle, ArrowUp, ArrowDown, Minus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '../../components/MainLayout'
import { NouvelleTacheModal } from '@/components/NouvelleTacheModal'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'paid'
type Priority = 'high' | 'medium' | 'low' | 'urgent'

interface Task {
  id: string
  title: string
  project?: string
  client?: string
  assignee?: string
  status: TaskStatus
  priority?: Priority
  dueDate?: string
  amount?: number
}

const statusMap: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'À faire', color: 'bg-gray-200 text-gray-800' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  review: { label: 'En révision', color: 'bg-yellow-100 text-yellow-800' },
  done: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
  paid: { label: 'Payé', color: 'bg-purple-100 text-purple-800' }
}

const priorityMap = {
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800', icon: <AlertTriangle size={14} /> },
  high: { label: 'Haute', color: 'bg-orange-100 text-orange-800', icon: <ArrowUp size={14} /> },
  medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800', icon: <Minus size={14} /> },
  low: { label: 'Basse', color: 'bg-blue-100 text-blue-800', icon: <ArrowDown size={14} /> }
}

export default function KanbanPage() {
  const [activeTab, setActiveTab] = useState('tous')
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [viewingTask, setViewingTask] = useState<any | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  const mapStatus = (statut?: string): TaskStatus => {
    switch (statut) {
      case 'A_FAIRE': return 'todo'
      case 'EN_COURS': return 'in_progress'
      case 'EN_REVISION': return 'review'
      case 'TERMINE': return 'done'
      default: return 'todo'
    }
  }

  const mapPriority = (p?: string): Priority | undefined => {
    switch (p) {
      case 'HAUTE': return 'high'
      case 'MOYENNE': return 'medium'
      case 'BASSE': return 'low'
      case 'URGENTE': return 'urgent'
      default: return undefined
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/taches')
      if (!res.ok) throw new Error('Erreur récupération tâches')
      const data = await res.json()
      const mapped: Task[] = data.map((t: any) => ({
        id: t.id,
        title: t.titre || t.title || 'Sans titre',
        project: t.projet?.titre || t.projet || undefined,
        client: t.client || undefined,
        assignee: t.assigneA ? `${t.assigneA.prenom || ''} ${t.assigneA.nom || ''}`.trim() : undefined,
        status: mapStatus(t.statut),
        priority: mapPriority(t.priorite),
        dueDate: t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString() : undefined,
        amount: t.montant ?? undefined
      }))
      setTasks(mapped)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTasks() }, [])

  const stats = useMemo(() => [
    { label: 'À faire', value: String(tasks.filter(t => t.status === 'todo').length), color: 'bg-gray-200' },
    { label: 'En cours', value: String(tasks.filter(t => t.status === 'in_progress').length), color: 'bg-blue-500' },
    { label: 'En révision', value: String(tasks.filter(t => t.status === 'review').length), color: 'bg-yellow-500' },
    { label: 'Terminées', value: String(tasks.filter(t => t.status === 'done').length), color: 'bg-green-500' },
    { label: 'Payées', value: String(tasks.filter(t => t.status === 'paid').length), color: 'bg-purple-500' },
  ], [tasks])

  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    // Filtrer par statut
    if (activeTab === 'à faire') {
      result = result.filter(t => t.status === 'todo')
    } else if (activeTab === 'en cours') {
      result = result.filter(t => t.status === 'in_progress')
    } else if (activeTab === 'terminées') {
      result = result.filter(t => t.status === 'done')
    }

    // Filtrer par priorité
    if (selectedPriority && selectedPriority !== 'toutes') {
      const priorityMap: { [key: string]: Priority } = {
        'urgente': 'urgent',
        'haute': 'high',
        'moyenne': 'medium',
        'basse': 'low'
      }
      result = result.filter(t => t.priority === priorityMap[selectedPriority.toLowerCase()])
    }

    // Filtrer par recherche (titre, projet, client, assigné, id)
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(t => {
        return (
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.project && t.project.toLowerCase().includes(q)) ||
          (t.client && t.client.toLowerCase().includes(q)) ||
          (t.assignee && t.assignee.toLowerCase().includes(q)) ||
          String(t.id).toLowerCase().includes(q)
        )
      })
    }

    return result
  }, [tasks, activeTab, selectedPriority, searchQuery])

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text">Gestion des Tâches</h1>
            <p className="text-[var(--color-anthracite)]">Suivez et gérez toutes vos tâches en un seul endroit</p>
          </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une tâche..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
            <div className="flex items-center">
            <button onClick={() => { setEditingTask(null); setIsModalOpen(true) }} className="bg-[var(--color-gold)] hover:brightness-95 text-[var(--color-black-deep)] px-4 py-2 rounded-lg flex items-center font-semibold">
              <Plus size={16} className="mr-2" />
              Nouvelle Tâche
            </button>
          </div>
          
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[var(--color-offwhite)] p-4 rounded-xl shadow-sm border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
              <span className="text-[var(--color-anthracite)] text-sm">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-[var(--color-black-deep)]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-offwhite)] p-4 rounded-xl shadow-sm border border-[var(--color-border)] mb-6">
        <div className="flex flex-wrap gap-2">
          {['Tous', 'À faire', 'En cours', 'Terminées'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 text-sm rounded-lg ${activeTab === tab.toLowerCase() ? 'bg-[var(--color-gold)] text-[var(--color-black-deep)]' : 'hover:bg-[var(--color-border)]'}`}
            >
              {tab}
            </button>
          ))}
          
          <div className="relative ml-2 group">
            <button className="flex items-center px-4 py-2 text-sm rounded-lg bg-[var(--color-border)] hover:brightness-95">
              {selectedPriority ? selectedPriority : 'Toutes priorités'}
              <ChevronDown size={16} className="ml-2" />
            </button>
            <div className="hidden group-hover:block absolute left-0 mt-0 w-40 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-10">
              {['Toutes', 'Urgente', 'Haute', 'Moyenne', 'Basse'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setSelectedPriority(priority === 'Toutes' ? null : priority)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-border)] ${selectedPriority === priority || (priority === 'Toutes' && selectedPriority === null) ? 'bg-[var(--color-gold)] text-[var(--color-black-deep)]' : 'text-[var(--color-anthracite)]'}`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-offwhite)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  TÂCHE
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  PROJET / CLIENT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  EMPLOYÉ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  STATUT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  PRIORITÉ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  ÉCHÉANCE
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  MONTANT
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--color-border)]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-[var(--color-anthracite)]">
                    Aucune tâche ne correspond à vos critères de filtrage
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const status = statusMap[task.status]
                  const priority = priorityMap[task.priority ?? 'medium']

                  return (
                    <tr key={task.id} className="hover:bg-[var(--color-border)] border-b border-[var(--color-border)]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-black-deep)]">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-[var(--color-border)] rounded-md flex items-center justify-center mr-3">
                            <span className="text-[var(--color-anthracite)]">
                              {status.label.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-[var(--color-anthracite)]">#{task.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[var(--color-black-deep)]">{task.project}</div>
                        <div className="text-xs text-[var(--color-anthracite)]">{task.client}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-black-deep)] font-medium text-sm mr-2">
                            {task.assignee ? task.assignee.split(' ').map(n => n[0]).join('') : ''}
                          </div>
                          <span className="text-sm text-[var(--color-black-deep)]">{task.assignee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color} py-1`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                            {priority.icon}
                            <span className="ml-1">{priority.label}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.dueDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-black-deep)]">
                        {typeof task.amount === 'number' ? task.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => {
                              setViewingTask(task);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-blue-600"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/taches')
                                if (!res.ok) throw new Error('Erreur récupération tâche')
                                const data = await res.json()
                                const found = data.find((d: any) => d.id === task.id)
                                if (!found) throw new Error('Tâche introuvable')
                                setEditingTask(found)
                                setIsModalOpen(true)
                              } catch (err) {
                                console.error(err)
                                alert('Impossible de charger la tâche pour édition')
                              }
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-red-600"
                            onClick={async () => {
                              if (!confirm('Supprimer cette tâche ?')) return
                              try {
                                const res = await fetch('/api/taches', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: task.id })
                                })
                                const b = await res.json().catch(() => null)
                                if (!res.ok) {
                                  console.error('Delete failed', res.status, b)
                                  alert(b?.error || `Impossible de supprimer la tâche (status ${res.status})`)
                                  return
                                }
                                router.refresh()
                              } catch (err: any) {
                                console.error('Delete error:', err)
                                alert(err?.message || 'Impossible de supprimer la tâche')
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-offwhite)]">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-anthracite)] bg-[var(--color-offwhite)] hover:bg-[var(--color-border)]">
              Précédent
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-anthracite)] bg-[var(--color-offwhite)] hover:bg-[var(--color-border)]">
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[var(--color-anthracite)]">
                Affichage de <span className="font-medium">1</span> à <span className="font-medium">{Math.min(10, filteredTasks.length)}</span> sur{' '}
                <span className="font-medium">{filteredTasks.length}</span> résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <a
                  href="#"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[var(--color-border)] bg-[var(--color-offwhite)] text-sm font-medium text-[var(--color-anthracite)] hover:bg-[var(--color-border)]"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeft size={16} />
                </a>
                <a
                  href="#"
                  aria-current="page"
                  className="z-10 bg-[var(--color-gold)] border-[var(--color-gold)] text-[var(--color-black-deep)] relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  1
                </a>
                <a
                  href="#"
                  className="bg-white border-[var(--color-border)] text-[var(--color-anthracite)] hover:bg-[var(--color-border)] relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  2
                </a>
                <a
                  href="#"
                  className="bg-white border-[var(--color-border)] text-[var(--color-anthracite)] hover:bg-[var(--color-border)] relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  3
                </a>
                <a
                  href="#"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[var(--color-border)] bg-[var(--color-offwhite)] text-sm font-medium text-[var(--color-anthracite)] hover:bg-[var(--color-border)]"
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRight size={16} />
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modal nouvelle tâche */}
      {/* Modal de détails de tâche - Style Dashboard */}
      {isViewModalOpen && viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-black-deep)]">{viewingTask.title}</h2>
                <p className="text-sm text-[var(--color-anthracite)] mt-1">ID: #{viewingTask.id}</p>
              </div>
              <button
                onClick={() => { setIsViewModalOpen(false); setViewingTask(null); }}
                className="text-[var(--color-anthracite)] hover:text-[var(--color-black-deep)] text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Tableau des détails */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-[var(--color-border)]">
                  <tr className="hover:bg-[var(--color-offwhite)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-anthracite)] bg-[var(--color-offwhite)] w-32">Projet</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-black-deep)]">{viewingTask.project || '—'}</td>
                  </tr>
                  <tr className="hover:bg-[var(--color-offwhite)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-anthracite)] bg-[var(--color-offwhite)]">Client</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-black-deep)]">{viewingTask.client || '—'}</td>
                  </tr>
                  <tr className="hover:bg-[var(--color-offwhite)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-anthracite)] bg-[var(--color-offwhite)]">Assigné à</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-black-deep)]">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-black-deep)] font-medium text-sm mr-2">
                          {viewingTask.assignee ? viewingTask.assignee.split(' ').map((n: string) => n[0]).join('') : ''}
                        </div>
                        <span>{viewingTask.assignee || '—'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--color-offwhite)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-anthracite)] bg-[var(--color-offwhite)]">Statut</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-black-deep)]">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMap[viewingTask.status as TaskStatus]?.color || 'bg-gray-100'}`}>
                        {statusMap[viewingTask.status as TaskStatus]?.label || viewingTask.status}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--color-offwhite)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-anthracite)] bg-[var(--color-offwhite)]">Priorité</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-black-deep)]">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityMap[(viewingTask.priority ?? 'medium') as Priority]?.color}`}>
                        {priorityMap[(viewingTask.priority ?? 'medium') as Priority]?.icon}
                        <span className="ml-1">{priorityMap[(viewingTask.priority ?? 'medium') as Priority]?.label}</span>
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--color-offwhite)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-anthracite)] bg-[var(--color-offwhite)]">Date limite</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-black-deep)]">{viewingTask.dueDate || '—'}</td>
                  </tr>
                  <tr className="hover:bg-[var(--color-offwhite)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-anthracite)] bg-[var(--color-offwhite)]">Montant</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-gold)]">
                      {typeof viewingTask.amount === 'number' ? viewingTask.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pied de page */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-[var(--color-anthracite)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-offwhite)]"
                onClick={() => { setIsViewModalOpen(false); setViewingTask(null); }}
              >
                Fermer
              </button>
              <button
                className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg hover:brightness-95 font-semibold"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/taches')
                    if (!res.ok) throw new Error('Erreur récupération tâche')
                    const data = await res.json()
                    const found = data.find((d: any) => d.id === viewingTask.id)
                    if (!found) throw new Error('Tâche introuvable')
                    setEditingTask(found)
                    setIsViewModalOpen(false)
                    setIsModalOpen(true)
                  } catch (err) {
                    console.error(err)
                    alert('Impossible de charger la tâche pour édition')
                  }
                }}
              >
                Éditer
              </button>
            </div>
          </div>
        </div>
      )}
      <NouvelleTacheModal
        isOpen={isModalOpen}
        initial={editingTask || undefined}
        onClose={() => { setIsModalOpen(false); setEditingTask(null) }}
        onSave={async (data: any) => {
          try {
            if (editingTask) {
              // update
              const response = await fetch('/api/taches', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingTask.id, ...data }),
              })
              const body = await response.json().catch(() => null)
              if (!response.ok) throw new Error(body?.error || 'Erreur lors de la mise à jour')
            } else {
              const response = await fetch('/api/taches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })
              const body = await response.json().catch(() => null)
              if (!response.ok) throw new Error(body?.error || 'Erreur lors de la création de la tâche')
            }

            setIsModalOpen(false)
            setEditingTask(null)
            router.refresh()
          } catch (error) {
            console.error('Erreur:', error)
            alert((error as any).message || 'Une erreur est survenue lors de la sauvegarde')
          }
        }}
      />
      </div>
    </MainLayout>
  )
}
