"use client"
import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, Clock, DollarSign, TrendingUp, MoreHorizontal, ListChecks } from 'lucide-react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import DashboardAgenda from '@/components/dashboard/DashboardAgenda'
import DashboardTasks from '@/components/dashboard/DashboardTasks'
import DashboardPayments from '@/components/dashboard/DashboardPayments'
import DashboardPerformance from '@/components/dashboard/DashboardPerformance'
import { useProjectsStatistics } from '@/lib/useProjectsStatistics'
import { StatCard } from '@/components/ui'

ChartJS.register(ArcElement, Tooltip, Legend)

const colors = ['#4F46E5', '#3B82F6', '#F59E0B', '#10B981']


export default function ManagerDashboard() {
  const { data: projStats, loading: projLoading, error: projError } = useProjectsStatistics()

  const totalProjects = projStats?.totalProjets ?? 0
  const projetsEnCours = projStats?.projetsEnCours ?? 0
  const budgetTotalFormatted = projStats?.budgetTotalFormatted ?? '0 FCFA'

  const [tasks, setTasks] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsTotals, setPaymentsTotals] = useState<{ total: number; paid: number; pending: number }>({ total: 0, paid: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [tRes, pRes] = await Promise.all([fetch('/api/taches'), fetch('/api/paiements?all=true')])
        const tData = tRes.ok ? await tRes.json() : []
        const pData = pRes.ok ? await pRes.json() : { payments: [], totals: { total: 0, paid: 0, pending: 0 } }
        if (!mounted) return
        setTasks(tData || [])
        setPayments(pData.payments || [])
        setPaymentsTotals(pData.totals || { total: 0, paid: 0, pending: 0 })
      } catch (err) {
        console.error('Erreur récupération dashboard:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const totalTasks = tasks.length
  const tasksInProgress = tasks.filter(t => (t.statut || '').toString().toUpperCase().includes('EN_COURS') || (t.statut || '').toString().toUpperCase().includes('A_FAIRE')).length
  const tasksPaid = payments.filter((p: any) => p.statut === 'CONFIRME').length
  const totalAmount = paymentsTotals.total || 0

  // Note: removed hardcoded 'change' values — show only DB-derived metrics here.
  const stats = [
    { title: 'Total des tâches', value: totalTasks, icon: <ListChecks className="h-6 w-6 text-white" />, color: 'bg-indigo-600' },
    { title: 'Tâches en cours', value: tasksInProgress, icon: <Clock className="h-6 w-6 text-white" />, color: 'bg-blue-500' },
    { title: 'Tâches payées', value: tasksPaid, icon: <DollarSign className="h-6 w-6 text-white" />, color: 'bg-emerald-500' },
    { title: 'Montant total', value: `${totalAmount.toLocaleString()} FCFA`, icon: <TrendingUp className="h-6 w-6 text-white" />, color: 'bg-purple-500' }
  ]

  const taskCounts = useMemo(() => {
    const counts = { todo: 0, inProgress: 0, review: 0, done: 0 }
    tasks.forEach(t => {
      const s = (t.statut || '').toString().toUpperCase()
      if (s.includes('TERMINE')) counts.done++
      else if (s.includes('EN_COURS')) counts.inProgress++
      else if (s.includes('REVISION') || s.includes('EN_REV')) counts.review++
      else counts.todo++
    })
    return counts
  }, [tasks])

  const taskDistributionData = useMemo(() => ({
    labels: ['À faire', 'En cours', 'En révision', 'Terminées'],
    datasets: [{ data: [taskCounts.todo, taskCounts.inProgress, taskCounts.review, taskCounts.done], backgroundColor: colors, borderWidth: 0 }]
  }), [taskCounts])

  const paymentStatusData = useMemo(() => {
    const paid = payments.filter(p => p.statut === 'CONFIRME').length
    const pending = payments.filter(p => p.statut === 'EN_ATTENTE').length
    const other = payments.length - paid - pending
    return { labels: ['Payées', 'En attente', 'Autres'], datasets: [{ data: [paid, pending, other], backgroundColor: ['#10B981', '#F59E0B', '#EF4444'], borderWidth: 0 }] }
  }, [payments])

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Bienvenue sur votre espace de gestion</p>
      </div>

      {/* Project stats summary (using shared StatCard) */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Projets totaux" value={projLoading ? '...' : totalProjects} description={projError ? 'Erreur' : undefined} />
        <StatCard label="Projets en cours" value={projLoading ? '...' : projetsEnCours} />
        <StatCard label="Budget total" value={projLoading ? '...' : budgetTotalFormatted} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between border border-gray-100 hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color} inline-block flex-shrink-0`}>{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Répartition des tâches</h2>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
              <div className="h-64">
                <Doughnut data={taskDistributionData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '70%', maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">État des paiements</h2>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
              <div className="h-64">
                <Doughnut data={paymentStatusData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '70%', maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <DashboardTasks compact={true} />
            <DashboardPayments />
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <DashboardAgenda />
          <DashboardPerformance />
        </aside>
      </div>
    </div>
  )
}
