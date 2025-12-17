"use client"
import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/layouts/MainLayout'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Trophy, Clock, CheckCircle, Activity, Zap } from 'lucide-react'

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

export default function EmployeePerformancePage() {
  const [tasks, setTasks] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/taches')
        if (!res.ok) throw new Error('Erreur récupération tâches')
        const data = await res.json()
        if (mounted) setTasks(data)
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
    if (metrics.total === 0) return 0
    return Math.round((metrics.completed / metrics.total) * 10 * 10) / 10 // out of 10
  }, [metrics])

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
    <MainLayout>
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
            <div className="text-3xl font-bold text-[#0A2342]">{performanceScore} / 10</div>
            <div className="text-sm text-gray-500">Basé sur le ratio tâches complétées / assignées</div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div className="h-3 bg-indigo-600" style={{ width: `${Math.min(100, Math.round((metrics.completed/(Math.max(1,10)))*100))}%` }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Objectif du mois: terminer 10 tâches — Progression: {metrics.completed} / 10</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold mb-2">Commentaire du manager</h4>
          <div className="text-sm text-gray-700">Aucun commentaire disponible.</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold mb-2">Objectifs</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• Terminer 10 tâches ce mois</li>
            <li>• Réduire les tâches en retard</li>
            <li>• Améliorer le temps moyen d'exécution</li>
          </ul>
        </div>
      </div>
      </div>
    </MainLayout>
  )
}
