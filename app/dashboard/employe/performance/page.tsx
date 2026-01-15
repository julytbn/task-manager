"use client"
import { useEffect, useMemo, useState } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Trophy, Clock, CheckCircle, Activity, Zap, Edit2, Trash2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

type Tache = {
  id: string
  titre: string
  projet?: { nom?: string }
  priorite?: string
  dateEcheance?: string | null
  dateCreation?: string | null
  dateModification?: string | null
  statut?: string
  estPayee?: boolean
  tempsPasse?: string // ex: "3h20"
}

type Objectif = {
  id: string
  titre: string
  valeurCible: number
  valeurActuelle?: number
  statut?: string
}

export default function EmployeePerformancePage() {
  const [tasks, setTasks] = useState<Tache[]>([])
  const [objectifs, setObjectifs] = useState<Objectif[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [editingObjectif, setEditingObjectif] = useState<Objectif | null>(null)
  const [editFormData, setEditFormData] = useState<{ titre: string; valeurCible: number }>({ titre: '', valeurCible: 0 })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      setSubmitMessage(null)

      // Get employee ID from session if not set
      let userId = employeeId
      if (!userId) {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        userId = session?.user?.id
        if (userId) setEmployeeId(userId)
      }

      const payload = {
        ...data,
        employeId: userId,
        valeurCible: parseInt(data.valeurCible, 10)
      }

      console.log('Submitting objective:', payload)

      const response = await fetch('/api/objectifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la création')
      }

      setSubmitMessage({ type: 'success', text: 'Objectif créé avec succès!' })
      reset()
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error creating objective:', error)
      setSubmitMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la création de l\'objectif' })
      setIsSubmitting(false)
    }
  }

  const handleDeleteObjectif = async (objectifId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif?')) return
    
    try {
      const response = await fetch(`/api/objectifs?id=${objectifId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setObjectifs(objectifs.filter(o => o.id !== objectifId))
        setSubmitMessage({ type: 'success', text: 'Objectif supprimé avec succès!' })
      } else {
        setSubmitMessage({ type: 'error', text: 'Erreur lors de la suppression' })
      }
    } catch (error) {
      console.error('Error deleting objective:', error)
      setSubmitMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  const handleEditObjectif = (objectif: Objectif) => {
    setEditingObjectif(objectif)
    setEditFormData({ titre: objectif.titre, valeurCible: objectif.valeurCible })
  }

  const handleSaveObjectif = async () => {
    if (!editingObjectif) return
    
    try {
      const response = await fetch(`/api/objectifs/${editingObjectif.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: editFormData.titre,
          valeurCible: editFormData.valeurCible
        })
      })
      
      const responseData = await response.json()
      
      if (response.ok) {
        setObjectifs(objectifs.map(o => 
          o.id === editingObjectif.id 
            ? { ...o, titre: editFormData.titre, valeurCible: editFormData.valeurCible }
            : o
        ))
        setEditingObjectif(null)
        setSubmitMessage({ type: 'success', text: 'Objectif modifié avec succès!' })
      } else {
        setSubmitMessage({ type: 'error', text: responseData.error || 'Erreur lors de la modification' })
      }
    } catch (error) {
      console.error('Error updating objective:', error)
      setSubmitMessage({ type: 'error', text: 'Erreur lors de la modification' })
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [tasksRes, objectifsRes] = await Promise.all([
          fetch('/api/taches'),
          fetch('/api/objectifs')
        ])
        
        if (!tasksRes.ok) throw new Error('Erreur récupération tâches')
        if (!objectifsRes.ok) throw new Error('Erreur récupération objectifs')
        
        const tasksData = await tasksRes.json()
        const objectifsData = await objectifsRes.json()
        
        if (mounted) {
          setTasks(tasksData)
          setObjectifs(Array.isArray(objectifsData) ? objectifsData : objectifsData.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const now = new Date()

  const metrics = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => (t.statut||'').toLowerCase().includes('termine') || (t.statut||'').toLowerCase().includes('terminé') || (t.statut||'').toLowerCase().includes('done')).length
    const inProgress = tasks.filter(t => (t.statut||'').toLowerCase().includes('en cours') || (t.statut||'').toLowerCase().includes('encours') || (t.statut||'').toLowerCase().includes('in_progress')).length
    const overdue = tasks.filter(t => {
      if (!t.dateEcheance) return false
      const d = new Date(t.dateEcheance)
      return d < now && !((t.statut||'').toLowerCase().includes('termine'))
    }).length

    // avg execution days: completed tasks difference creation->modification
    const completedTasks = tasks.filter(t => (t.statut||'').toLowerCase().includes('termine') || (t.statut||'').toLowerCase().includes('terminé') || (t.statut||'').toLowerCase().includes('done'))
    const times = completedTasks.map(t => {
      const start = t.dateCreation ? new Date(t.dateCreation) : null
      const end = t.dateModification ? new Date(t.dateModification) : (t.dateEcheance ? new Date(t.dateEcheance) : null)
      if (!start || !end) return 0
      return (end.getTime() - start.getTime()) / (1000*60*60*24)
    }).filter(Boolean)
    const avg = times.length ? Math.round((times.reduce((a,b)=>a+b,0)/times.length) * 10) / 10 : 0

    return { total, completed, inProgress, overdue, avg }
  }, [tasks, now])

  // charts data
  const last6Months = useMemo(() => {
    const now2 = new Date()
    const months: { label: string; start: Date; end: Date }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      months.push({ label: start.toLocaleString('default', { month: 'short', year: 'numeric' }), start, end })
    }
    const counts = months.map(m => tasks.filter((t:any) => {
      const isDone = (t.statut||'').toString().toUpperCase().includes('TERMINE')
      if (!isDone) return false
      const date = t.dateModification || t.dateEcheance || t.dateCreation
      if (!date) return false
      const dt = new Date(date)
      return dt >= m.start && dt < m.end
    }).length)
    return { labels: months.map(m=>m.label), data: counts }
  }, [tasks])

  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = { 'Terminées':0, 'En cours':0, 'En révision':0, 'En retard':0 }
    tasks.forEach(t => {
      const s = (t.statut||'').toLowerCase()
      if (s.includes('termine')) map['Terminées']++
      else if (s.includes('en cours') || s.includes('encours')) map['En cours']++
      else if (s.includes('revision') || s.includes('révision') || s.includes('relecture')) map['En révision']++
      else {
        // fallback: check overdue
        if (t.dateEcheance && new Date(t.dateEcheance) < now && !s.includes('termine')) map['En retard']++
        else map['En révision']++
      }
    })
    return map
  }, [tasks, now])

  const priorityDistribution = useMemo(() => {
    const map: Record<string, number> = { 'Haute':0, 'Moyenne':0, 'Faible':0 }
    tasks.forEach(t => {
      const p = (t.priorite||'').toLowerCase()
      if (p.includes('haute') || p.includes('urgent')) map['Haute']++
      else if (p.includes('moyen') || p.includes('moyenne') || p.includes('medium')) map['Moyenne']++
      else map['Faible']++
    })
    return map
  }, [tasks])

  const sortedTasks = useMemo(() => {
    const copy = [...tasks]
    if (!sortBy) return copy
    copy.sort((a:any,b:any) => {
      const av = (a as any)[sortBy] ?? ''
      const bv = (b as any)[sortBy] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av-bv : bv-av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return copy
  }, [tasks, sortBy, sortDir])

  const toggleSort = (col:string) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const performanceScore = useMemo(() => {
    if (!objectifs.length || objectifs[0].valeurCible === 0) return 0
    // Score based on completed tasks vs objective target (valeurCible)
    const targetValue = objectifs[0].valeurCible
    return Math.round((metrics.completed / targetValue) * targetValue * 10) / 10
  }, [metrics, objectifs])

  // Filter objectives that are not yet achieved
  const activeObjectifs = useMemo(() => {
    return objectifs.filter(obj => {
      // Count completed tasks for this objective
      const completedForObjective = tasks.filter(t => 
        ((t.statut||'').toLowerCase().includes('termine') || (t.statut||'').toLowerCase().includes('terminé') || (t.statut||'').toLowerCase().includes('done'))
      ).length
      // Show only if not achieved (completed < target)
      return completedForObjective < (obj.valeurCible || 0)
    })
  }, [objectifs, tasks])

  const monthlyLine = {
    labels: last6Months.labels,
    datasets: [{ label: 'Tâches terminées', data: last6Months.data, borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.08)', tension: 0.3 }]
  }

  const barData = {
    labels: Object.keys(statusDistribution),
    datasets: [{ data: Object.values(statusDistribution), backgroundColor: ['#10B981','#3B82F6','#F59E0B','#EF4444'] }]
  }

  const doughnutData = {
    labels: Object.keys(priorityDistribution),
    datasets: [{ data: Object.values(priorityDistribution), backgroundColor: ['#EF4444','#F59E0B','#10B981'] }]
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2342]">Performance personnelle</h1>
        <p className="text-sm text-gray-500">Visualisez votre rendement, charge de travail et objectifs.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md bg-indigo-600 text-white flex items-center justify-center mr-3"><Trophy /></div>
            <div>
              <div className="text-xs text-gray-400">Total de tâches</div>
              <div className="text-lg font-semibold text-gray-900">{metrics.total} tâches</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md bg-emerald-500 text-white flex items-center justify-center mr-3"><CheckCircle /></div>
            <div>
              <div className="text-xs text-gray-400">Tâches complétées</div>
              <div className="text-lg font-semibold text-gray-900">{metrics.completed} complétées</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center mr-3"><Activity /></div>
            <div>
              <div className="text-xs text-gray-400">Tâches en cours</div>
              <div className="text-lg font-semibold text-gray-900">{metrics.inProgress} en cours</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md bg-red-500 text-white flex items-center justify-center mr-3"><Zap /></div>
            <div>
              <div className="text-xs text-gray-400">Tâches en retard</div>
              <div className="text-lg font-semibold text-red-600">{metrics.overdue} en retard</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md bg-gray-900 text-white flex items-center justify-center mr-3"><Clock /></div>
            <div>
              <div className="text-xs text-gray-400">Temps moyen d'exécution</div>
              <div className="text-lg font-semibold text-gray-900">⏱ {metrics.avg} jours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Courbe d'évolution mensuelle</h3>
            <div className="text-xs text-gray-400">Tâches terminées par mois</div>
          </div>
          <div className="h-56">
            <Line data={monthlyLine} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h4 className="font-semibold mb-2">Répartition par statut</h4>
            <div className="h-40">
              <Bar data={barData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h4 className="font-semibold mb-2">Priorité des tâches</h4>
            <div className="h-40 flex items-center justify-center">
              <div style={{ width: 180 }}>
                <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Tableau de suivi</h3>
          <div className="text-xs text-gray-400">Cliquez sur les en-têtes pour trier</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="py-3 cursor-pointer" onClick={() => toggleSort('titre')}>Tâche</th>
                <th className="py-3 cursor-pointer" onClick={() => toggleSort('projet')}>Projet</th>
                <th className="py-3 cursor-pointer" onClick={() => toggleSort('priorite')}>Priorité</th>
                <th className="py-3 cursor-pointer" onClick={() => toggleSort('dateEcheance')}>Date limite</th>
                <th className="py-3">Temps passé</th>
                <th className="py-3 cursor-pointer" onClick={() => toggleSort('statut')}>Statut</th>
                <th className="py-3">Paiement</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((t:any) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3">{t.titre}</td>
                  <td className="py-3">{t.projet?.nom || '—'}</td>
                  <td className="py-3">{t.priorite || '—'}</td>
                  <td className="py-3">{t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString() : '—'}</td>
                  <td className="py-3">{t.tempsPasse || '—'}</td>
                  <td className="py-3">{t.statut || '—'}</td>
                  <td className="py-3">{t.estPayee ? 'Payée' : 'En attente'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation & Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold mb-2">Note de performance</h4>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-[#0A2342]">{performanceScore} / {objectifs.length > 0 ? objectifs[0].valeurCible : 10}</div>
            <div className="text-sm text-gray-500">Basé sur les tâches complétées / objectif</div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div className="h-3 bg-indigo-600" style={{ width: `${Math.min(100, Math.round((metrics.completed/(Math.max(1, objectifs.length > 0 ? objectifs[0].valeurCible : 10)))*100))}%` }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Objectif: {objectifs.length > 0 ? objectifs[0].titre : 'Pas d\'objectif défini'} — Progression: {metrics.completed} / {objectifs.length > 0 ? objectifs[0].valeurCible : 10}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold mb-2">Commentaire du manager</h4>
          <div className="text-sm text-gray-700">Aucun commentaire disponible.</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold mb-2">Objectifs</h4>
          {activeObjectifs.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucun objectif actif. Tous vos objectifs ont été atteints! 🎉</p>
          ) : (
            <ul className="text-sm text-gray-700 space-y-3">
              {activeObjectifs.map((obj) => (
                <li key={obj.id} className="flex items-center justify-between bg-gray-50 p-2 rounded group hover:bg-gray-100 transition">
                  <span>• {obj.titre}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleEditObjectif(obj)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteObjectif(obj.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Objective Modal */}
      {editingObjectif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modifier l'objectif</h3>
              <button
                onClick={() => setEditingObjectif(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={editFormData.titre}
                  onChange={(e) => setEditFormData({ ...editFormData, titre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valeur cible</label>
                <input
                  type="number"
                  value={editFormData.valeurCible}
                  onChange={(e) => setEditFormData({ ...editFormData, valeurCible: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingObjectif(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveObjectif}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Objective Creation Form */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h4 className="font-semibold mb-2">Créer un nouvel objectif</h4>
        
        {submitMessage && (
          <div className={`p-3 rounded-md mb-4 text-sm ${submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {submitMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre *</label>
            <input
              {...register('titre', { required: 'Le titre est requis' })}
              type="text"
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.titre ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: Terminer 5 tâches prioritaires"
            />
            {errors.titre && <p className="text-red-600 text-xs mt-1">{typeof errors.titre.message === 'string' ? errors.titre.message : 'Ce champ est requis'}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valeur Cible *</label>
            <input
              {...register('valeurCible', { required: 'La valeur cible est requise', min: { value: 1, message: 'Doit être supérieur à 0' } })}
              type="number"
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.valeurCible ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: 10"
            />
            {errors.valeurCible && <p className="text-red-600 text-xs mt-1">{typeof errors.valeurCible.message === 'string' ? errors.valeurCible.message : 'Ce champ est requis'}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer l\'objectif'}
          </button>
        </form>
      </div>
    </div>
  )
}
