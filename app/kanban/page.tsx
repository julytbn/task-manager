"use client"
import { Search, Plus, Filter, ChevronDown, AlertTriangle, ArrowUp, ArrowDown, Minus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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

const statusMap = {
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
  const [activeTab, setActiveTab] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Tâches</h1>
          <p className="text-gray-500">Suivez et gérez toutes vos tâches en un seul endroit</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
            <div className="flex items-center">
            <button onClick={() => { setEditingTask(null); setIsModalOpen(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <Plus size={16} className="mr-2" />
              Nouvelle Tâche
            </button>
          </div>
          
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
              <span className="text-gray-500 text-sm">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex flex-wrap gap-2">
          {['Tous', 'À faire', 'En cours', 'Terminées'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 text-sm rounded-lg ${activeTab === tab.toLowerCase() ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
          
          <div className="relative ml-2">
            <button className="flex items-center px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">
              Toutes priorités
              <ChevronDown size={16} className="ml-2" />
            </button>
          </div>
          
          <button className="flex items-center px-4 py-2 text-sm rounded-lg text-gray-500 hover:bg-gray-50 ml-auto">
            <Filter size={16} className="mr-2" />
            Filtres
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TÂCHE
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PROJET / CLIENT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMPLOYÉ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRIORITÉ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ÉCHÉANCE
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MONTANT
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => {
                const status = statusMap[task.status]
                const priority = priorityMap[task.priority ?? 'medium']
                
                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                          <span className="text-gray-500">
                            {status.label.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-gray-500">#{task.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{task.project}</div>
                      <div className="text-xs text-gray-500">{task.client}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-2">
                          {task.assignee ? task.assignee.split(' ').map(n => n[0]).join('') : ''}
                        </div>
                        <span className="text-sm text-gray-900">{task.assignee}</span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {typeof task.amount === 'number' ? task.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
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
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Précédent
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">1</span> à <span className="font-medium">10</span> sur{' '}
                <span className="font-medium">24</span> résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <a
                  href="#"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeft size={16} />
                </a>
                <a
                  href="#"
                  aria-current="page"
                  className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  1
                </a>
                <a
                  href="#"
                  className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  2
                </a>
                <a
                  href="#"
                  className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  3
                </a>
                <a
                  href="#"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
  )
}
