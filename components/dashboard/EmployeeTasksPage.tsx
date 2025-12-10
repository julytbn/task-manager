"use client"
import { useEffect, useMemo, useState } from 'react'
import TaskDetailsModal from '@/components/dashboard/TaskDetailsModal'
import KanbanBoard from '@/components/dashboard/KanbanBoard'
import { Card, Badge, Button, Stat } from '@/components/ui'
import { Search, Filter, CheckCircle2, Clock, AlertCircle, DollarSign, Kanban, List } from 'lucide-react'

type Tache = {
  id: string
  titre: string
  description?: string
  projet?: { id?: string; titre?: string; nom?: string }
  priorite?: string
  dateEcheance?: string | null
  statut?: string
  estPayee?: boolean
  paiementPartiel?: boolean
  tempsPasse?: string
  service?: string
}

const getStatusBadge = (statut?: string): 'default' | 'success' | 'info' | 'warning' | 'danger' => {
  const s = (statut || '').toLowerCase()
  if (s.includes('termine') || s.includes('termin') || s.includes('done')) return 'success'
  if (s.includes('en cours') || s.includes('encours') || s.includes('progress')) return 'info'
  if (s.includes('révision') || s.includes('revision') || s.includes('review')) return 'warning'
  if (s.includes('annul') || s.includes('cancel')) return 'danger'
  return 'default'
}

const isTaskRecentlyUpdated = (taskId: string, lastUpdateTime: Record<string, number>): boolean => {
  const updateTime = lastUpdateTime[taskId]
  if (!updateTime) return false
  // Afficher l'animation pendant 3 secondes après le changement
  return Date.now() - updateTime < 3000
}

const getPriorityBadge = (priorite?: string): 'default' | 'success' | 'info' | 'warning' | 'danger' => {
  const p = (priorite || '').toLowerCase()
  if (p.includes('urgent') || p.includes('haute')) return 'danger'
  if (p.includes('moyenne') || p.includes('medium')) return 'warning'
  if (p.includes('basse') || p.includes('low')) return 'info'
  return 'default'
}

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<Tache[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<string, number>>({})

  // Filters
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [mode, setMode] = useState<'table' | 'kanban'>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Tache | null>(null)

  // Fonction pour charger les tâches
  const loadTasks = async () => {
    try {
      const [tRes, pRes] = await Promise.all([fetch('/api/taches'), fetch('/api/projets')])
      const tJson = await tRes.json()
      const pJson = await pRes.json()
      
      const newTasks = Array.isArray(tJson) ? tJson : []
      
      // Détecter les changements de statut
      if (tasks.length > 0) {
        newTasks.forEach((newTask: Tache) => {
          const oldTask = tasks.find(t => t.id === newTask.id)
          if (oldTask && oldTask.statut !== newTask.statut) {
            // Marquer le timestamp du changement pour animation
            setLastUpdateTime(prev => ({
              ...prev,
              [newTask.id]: Date.now()
            }))
            console.log(`📌 Changement détecté: ${newTask.titre} - ${oldTask.statut} → ${newTask.statut}`)
          }
        })
      }
      
      setTasks(newTasks)
      setProjects(Array.isArray(pJson) ? pJson : [])
    } catch (err) {
      console.error('Erreur chargement tâches:', err)
    } finally {
      setLoading(false)
    }
  }

  // Charger les tâches initialement
  useEffect(() => {
    loadTasks()
  }, [])

  // Polling automatique toutes les 5 secondes pour synchroniser les changements
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks()
    }, 5000) // Actualiser toutes les 5 secondes

    return () => clearInterval(interval)
  }, [tasks])

  const services = useMemo(() => {
    const setS = new Set<string>()
    tasks.forEach(t => {
      if ((t as any).service) setS.add((t as any).service)
    })
    return Array.from(setS)
  }, [tasks])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter(t => {
      if (q) {
        const inTitre = (t.titre || '').toLowerCase().includes(q)
        const inProjet = (t.projet?.titre || t.projet?.nom || '').toLowerCase().includes(q)
        if (!inTitre && !inProjet) return false
      }
      if (statusFilter) {
        if (!((t.statut || '').toLowerCase().includes(statusFilter.toLowerCase()))) return false
      }
      if (priorityFilter) {
        if (!((t.priorite || '').toLowerCase().includes(priorityFilter.toLowerCase()))) return false
      }
      if (paymentFilter) {
        if (paymentFilter === 'payee' && !t.estPayee) return false
        if (paymentFilter === 'non' && t.estPayee) return false
        if (paymentFilter === 'partielle' && !t.paiementPartiel) return false
      }
      if (projectFilter) {
        if (t.projet?.id !== projectFilter) return false
      }
      if (serviceFilter) {
        if ((t as any).service !== serviceFilter) return false
      }
      return true
    })
  }, [tasks, query, statusFilter, priorityFilter, paymentFilter, projectFilter, serviceFilter])

  const indicators = useMemo(() => {
    const total = tasks.length
    const inProgress = tasks.filter(t => (t.statut || '').toLowerCase().includes('en cours') || (t.statut || '').toLowerCase().includes('encours')).length
    const review = tasks.filter(t => (t.statut || '').toLowerCase().includes('révision') || (t.statut || '').toLowerCase().includes('revision')).length
    const urgent = tasks.filter(t => (t.priorite || '').toLowerCase().includes('urgent') || (t.priorite || '').toLowerCase().includes('haute')).length
    const completed = tasks.filter(t => (t.statut || '').toLowerCase().includes('termine') || (t.statut || '').toLowerCase().includes('terminé') || (t.statut || '').toLowerCase().includes('done')).length
    const paid = tasks.filter(t => t.estPayee).length
    return { total, inProgress, review, urgent, completed, paid }
  }, [tasks])

  const openDetails = (t: Tache) => setSelectedTask(t)
  const closeDetails = () => setSelectedTask(null)

  const updateTaskLocal = (id: string, patch: Partial<Tache>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
    if (selectedTask && selectedTask.id === id) setSelectedTask({ ...selectedTask, ...patch })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1E1E1E]">Mes Tâches</h1>
          <p className="text-sm text-[#5A6A80] mt-1">Gérez vos missions, paiements et avancement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'table' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('table')}
            className="flex items-center gap-2"
          >
            <List size={16} />
            Table
          </Button>
          <Button
            variant={mode === 'kanban' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('kanban')}
            className="flex items-center gap-2"
          >
            <Kanban size={16} />
            Kanban
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Stat label="Total tâches" value={indicators.total} icon={<CheckCircle2 />} />
        <Stat label="En cours" value={indicators.inProgress} icon={<Clock />} />
        <Stat label="En révision" value={indicators.review} icon={<AlertCircle />} />
        <Stat label="Urgentes" value={indicators.urgent} icon={<AlertCircle />} trend="up" />
        <Stat label="Terminées" value={indicators.completed} icon={<CheckCircle2 />} trend="up" />
        <Stat label="Payées" value={indicators.paid} icon={<DollarSign />} />
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-[#5A6A80]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher tâche, projet, client..."
            className="flex-1 bg-transparent outline-none text-[#1E1E1E] placeholder-[#5A6A80]"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filtres
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#DCE3EB]">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-[#DCE3EB] rounded-lg px-3 py-2 text-[#1E1E1E] bg-white focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none"
            >
              <option value="">Tous statuts</option>
              <option value="à faire">À faire</option>
              <option value="en cours">En cours</option>
              <option value="révision">En révision</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="border border-[#DCE3EB] rounded-lg px-3 py-2 text-[#1E1E1E] bg-white focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none"
            >
              <option value="">Toutes priorités</option>
              <option value="haute">Haute</option>
              <option value="moyenne">Moyenne</option>
              <option value="basse">Basse</option>
              <option value="urgente">Urgente</option>
            </select>

            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="border border-[#DCE3EB] rounded-lg px-3 py-2 text-[#1E1E1E] bg-white focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none"
            >
              <option value="">Tous paiements</option>
              <option value="payee">Payée</option>
              <option value="non">Non payée</option>
              <option value="partielle">Partiellement payée</option>
            </select>

            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="border border-[#DCE3EB] rounded-lg px-3 py-2 text-[#1E1E1E] bg-white focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none"
            >
              <option value="">Tous projets</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.titre || p.title || p.nom}
                </option>
              ))}
            </select>

            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="border border-[#DCE3EB] rounded-lg px-3 py-2 text-[#1E1E1E] bg-white focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none"
            >
              <option value="">Tous services</option>
              {services.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {(query || statusFilter || priorityFilter || paymentFilter || projectFilter || serviceFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setStatusFilter('')
                  setPriorityFilter('')
                  setPaymentFilter('')
                  setProjectFilter('')
                  setServiceFilter('')
                }}
                className="md:col-span-2 lg:col-span-4 text-[#E74C3C]"
              >
                Réinitialiser filtres
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Results */}
      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <p className="text-[#5A6A80]">Chargement des tâches…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center gap-2">
          <AlertCircle size={32} className="text-[#DCE3EB]" />
          <p className="text-[#5A6A80]">Aucune tâche trouvée</p>
        </Card>
      ) : mode === 'table' ? (
        <div className="overflow-x-auto">
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#DCE3EB] bg-[#F4F7FA]">
                  <th className="text-left p-4 font-semibold text-[#1E1E1E]">Tâche</th>
                  <th className="text-left p-4 font-semibold text-[#1E1E1E]">Projet</th>
                  <th className="text-left p-4 font-semibold text-[#1E1E1E]">Priorité</th>
                  <th className="text-left p-4 font-semibold text-[#1E1E1E]">Deadline</th>
                  <th className="text-left p-4 font-semibold text-[#1E1E1E]">Statut</th>
                  <th className="text-left p-4 font-semibold text-[#1E1E1E]">Paiement</th>
                  <th className="text-center p-4 font-semibold text-[#1E1E1E]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const isRecent = isTaskRecentlyUpdated(t.id, lastUpdateTime)
                  return (
                    <tr 
                      key={t.id} 
                      className={`border-b border-[#DCE3EB] hover:bg-[#F4F7FA] transition-all ${
                        isRecent ? 'bg-green-50 animate-pulse' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-medium text-[#1E1E1E]">{t.titre}</div>
                        {t.description && <p className="text-xs text-[#5A6A80] truncate">{t.description}</p>}
                      </td>
                      <td className="p-4 text-[#5A6A80]">{t.projet?.titre || t.projet?.nom || '—'}</td>
                      <td className="p-4">
                        <Badge variant={getPriorityBadge(t.priorite)}>{t.priorite || '—'}</Badge>
                      </td>
                      <td className="p-4 text-[#5A6A80]">
                        {t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadge(t.statut)}>{t.statut || '—'}</Badge>
                          {isRecent && <span className="text-xs font-semibold text-green-600">✓ Mis à jour</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={t.estPayee ? 'success' : t.paiementPartiel ? 'warning' : 'danger'}>
                          {t.estPayee ? 'Payée' : t.paiementPartiel ? 'Partielle' : 'Non payée'}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(t)}>
                          Voir
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <KanbanBoard tasks={filtered} onTaskClick={openDetails} onUpdate={updateTaskLocal} />
      )}

      {selectedTask && (
        <TaskDetailsModal task={selectedTask} onClose={closeDetails} onUpdate={updateTaskLocal} />
      )}
    </div>
  )
}
