"use client"
import { useEffect, useMemo, useState } from 'react'
import { Clock, DollarSign, TrendingUp, ListChecks, CheckCircle2 } from 'lucide-react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import MainLayout from '@/components/MainLayout'
import StatCard from '@/components/StatCard'
import DataTable from '@/components/DataTable'
import DashboardAgenda from '@/components/dashboard/DashboardAgenda'
import DashboardTasks from '@/components/dashboard/DashboardTasks'
import DashboardPayments from '@/components/dashboard/DashboardPayments'
import DashboardPerformance from '@/components/dashboard/DashboardPerformance'
import DashboardPriorityDistribution from '@/components/dashboard/DashboardPriorityDistribution'
import DashboardTeamPerformance from '@/components/dashboard/DashboardTeamPerformance'
import DashboardLateIndicators from '@/components/dashboard/DashboardLateIndicators'
import DashboardPaymentTimeline from '@/components/dashboard/DashboardPaymentTimeline'
import { useProjectsStatistics } from '@/lib/useProjectsStatistics'
import { useUserSession } from '@/hooks/useSession'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
)

export default function ManagerDashboard() {
  const { user, isLoading: isSessionLoading } = useUserSession()
  const { data: projStats, loading: projLoading, error: projError } = useProjectsStatistics(user?.id)
  
  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (isSessionLoading) {
    return <div>Chargement de la session...</div>
  }

  // Filtrer les statistiques en fonction des rôles
  const totalProjects = user?.role === 'ADMIN' 
    ? projStats?.totalProjets ?? 0
    : projStats?.userProjects?.total ?? 0
    
  const projetsEnCours = user?.role === 'ADMIN'
    ? projStats?.projetsEnCours ?? 0
    : projStats?.userProjects?.enCours ?? 0
    
  const budgetTotalFormatted = user?.role === 'ADMIN'
    ? projStats?.budgetTotalFormatted ?? '0 FCFA'
    : projStats?.userProjects?.budgetTotalFormatted ?? '0 FCFA'

  const [tasks, setTasks] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsTotals, setPaymentsTotals] = useState<{ total: number; paid: number; pending: number }>({ total: 0, paid: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSessionLoading) return
    
    let mounted = true
    ;(async () => {
      try {
        // Si l'utilisateur n'est pas admin, on filtre les tâches et paiements par son ID
        const tasksUrl = user?.role === 'ADMIN' 
          ? '/api/taches' 
          : `/api/taches?userId=${user?.id}`
          
        const paymentsUrl = user?.role === 'ADMIN'
          ? '/api/paiements?all=true'
          : `/api/paiements?userId=${user?.id}`
        
        const [tRes, pRes] = await Promise.all([
          fetch(tasksUrl),
          fetch(paymentsUrl)
        ])
        
        const tData = tRes.ok ? await tRes.json() : []
        const pData = pRes.ok 
          ? await pRes.json() 
          : { payments: [], totals: { total: 0, paid: 0, pending: 0 } }
            
        if (!mounted) return
        
        setTasks(tData || [])
        setPayments(pData.payments || [])
        
        // Si l'utilisateur n'est pas admin, on ajuste les totaux
        if (user?.role !== 'ADMIN') {
          const userPayments = pData.payments || []
          const paid = userPayments
            .filter((p: any) => p.statut?.toUpperCase().includes('CONFIRME'))
            .reduce((sum: number, p: any) => sum + (p.montant || 0), 0)
            
          const pending = userPayments
            .filter((p: any) => !p.statut?.toUpperCase().includes('CONFIRME'))
            .reduce((sum: number, p: any) => sum + (p.montant || 0), 0)
            
          setPaymentsTotals({
            total: paid + pending,
            paid,
            pending
          })
        } else {
          setPaymentsTotals(pData.totals || { total: 0, paid: 0, pending: 0 })
        }
      } catch (err) {
        console.error('Erreur récupération dashboard:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [isSessionLoading, user])

  // Calcul des statistiques basées sur les tâches et paiements déjà filtrés
  const totalTasks = tasks.length
  const tasksInProgress = tasks.filter(t => {
    const s = (t.statut || '').toString().toUpperCase()
    return s.includes('EN_COURS')
  }).length
  
  const tasksInProgressOrTodo = tasks.filter(t => {
    const s = (t.statut || '').toString().toUpperCase()
    return s.includes('EN_COURS') || s.includes('A_FAIRE') || s.includes('TODO')
  }).length
  
  const tasksPaid = payments.filter((p: any) => p.statut && p.statut.toUpperCase().includes('CONFIRME')).length
  const totalAmount = paymentsTotals.total || 0
  const tasksDone = tasks.filter(t => (t.statut || '').toString().toUpperCase().includes('TERMINE')).length

  const taskCounts = useMemo(() => {
    const counts = { todo: 0, inProgress: 0, review: 0, done: 0 }
    // Les tâches sont déjà filtrées par utilisateur si nécessaire
    tasks.forEach(t => {
      const s = (t.statut || '').toString().toUpperCase()
      if (s.includes('TERMINE')) counts.done++
      else if (s.includes('EN_COURS')) counts.inProgress++
      else if (s.includes('REVISION') || s.includes('EN_REV')) counts.review++
      else counts.todo++
    })
    return counts
  }, [tasks])

  // Graphique linéaire des revenus mensuels (données réelles)
  const revenueChartData = useMemo(() => {
    // Calculer les revenus par mois à partir des paiements confirmés
    const monthlyRevenue: { [key: string]: number } = {}
    const now = new Date()
    const last12Months: string[] = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = date.toLocaleString('default', { month: 'short' })
      last12Months.push(monthLabel)
      monthlyRevenue[monthLabel] = 0
    }

    // Accumuler les paiements confirmés par mois
    payments.forEach((p: any) => {
      if (p.statut === 'CONFIRME' && p.datePaiement) {
        const pDate = new Date(p.datePaiement)
        const monthLabel = pDate.toLocaleString('default', { month: 'short' })
        if (monthlyRevenue.hasOwnProperty(monthLabel)) {
          monthlyRevenue[monthLabel] += p.montant || 0
        }
      }
    })

    return {
      labels: last12Months,
      datasets: [
        {
          label: 'Revenus (FCFA)',
          data: last12Months.map(m => monthlyRevenue[m]),
          borderColor: 'var(--color-gold)',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'var(--color-gold)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    }
  }, [payments])

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'var(--color-anthracite)',
          font: { size: 12 },
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'var(--color-anthracite)', font: { size: 12 } },
        grid: { color: 'rgba(212, 175, 55, 0.1)' },
      },
      x: {
        ticks: { color: 'var(--color-anthracite)', font: { size: 12 } },
        grid: { display: false },
      },
    },
  }

  const taskDistributionData = useMemo(() => ({
    labels: ['À faire', 'En cours', 'En révision', 'Terminées'],
    datasets: [{
      data: [taskCounts.todo, taskCounts.inProgress, taskCounts.review, taskCounts.done],
      backgroundColor: ['#E0E0E0', '#FFD700', '#F59E0B', '#10B981'],
      borderWidth: 0,
    }],
  }), [taskCounts])

  const paymentStatusData = useMemo(() => {
    const paid = payments.filter(p => p.statut === 'CONFIRME').length
    const pending = payments.filter(p => p.statut === 'EN_ATTENTE').length
    const other = payments.length - paid - pending
    return {
      labels: ['Payées', 'En attente', 'Autres'],
      datasets: [{
        data: [paid, pending, other],
        backgroundColor: ['#10B981', '#FFD700', '#EF4444'],
        borderWidth: 0,
      }],
    }
  }, [payments])

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-4xl font-bold gold-gradient-text">Tableau de bord</h1>
          <p className="text-[var(--color-anthracite)]/70 mt-2">Bienvenue sur votre espace de gestion Kekeli Group</p>
        </div>

        {/* Stats Cards Grid - Responsive: 4 desktop, 2 tablet, 1 mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={ListChecks}
            title="Total tâches"
            value={totalTasks}
            trend={{ value: totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0, direction: 'up' }}
          />
          <StatCard
            icon={Clock}
            title="En cours"
            value={tasksInProgress}
            trend={{ value: totalTasks > 0 ? Math.round((tasksInProgress / totalTasks) * 100) : 0, direction: 'up' }}
          />
          <StatCard
            icon={CheckCircle2}
            title="Terminées"
            value={tasksDone}
            trend={{ value: totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0, direction: 'up' }}
          />
          <StatCard
            icon={DollarSign}
            title="Revenus"
            value={`${(totalAmount / 1000).toFixed(0)}K FCFA`}
            trend={{ value: payments.length > 0 ? Math.round((payments.filter((p: any) => p.statut && p.statut.toUpperCase().includes('CONFIRME')).length / payments.length) * 100) : 0, direction: 'up' }}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart - Full width on mobile/tablet */}
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-bold text-[var(--color-black-deep)] mb-6">
              Revenus mensuels
            </h2>
            <div style={{ height: 300 }}>
              <Line data={revenueChartData} options={revenueChartOptions} />
            </div>
          </div>

          {/* Task Distribution */}
          <div className="card">
            <h2 className="text-xl font-bold text-[var(--color-black-deep)] mb-6">
              Répartition des tâches
            </h2>
            <div style={{ height: 300 }}>
              <Doughnut
                data={taskDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } },
                  cutout: '70%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Status */}
          <div className="card">
            <h2 className="text-xl font-bold text-[var(--color-black-deep)] mb-6">
              État des paiements
            </h2>
            <div style={{ height: 300 }}>
              <Doughnut
                data={paymentStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } },
                  cutout: '70%',
                }}
              />
            </div>
          </div>

          {/* Recent Tasks Table */}
          <div className="card">
            <h2 className="text-xl font-bold text-[var(--color-black-deep)] mb-6">
              Tâches récentes
            </h2>
            <DataTable
              columns={[
                { key: 'titre', label: 'Titre', width: '50%' },
                { key: 'statut', label: 'Statut', width: '25%' },
                { key: 'priorite', label: 'Priorité', width: '25%' },
              ]}
              data={tasks.slice(0, 5).map(t => ({
                titre: t.titre || 'Sans titre',
                statut: t.statut || 'N/A',
                priorite: t.priorite || 'Normale',
              }))}
              hasActions={false}
            />
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardPriorityDistribution />
          <DashboardLateIndicators />
        </div>

        {/* Teams and Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardTeamPerformance />
          <DashboardPaymentTimeline />
        </div>

        {/* Extended Insights */}
        <div className="grid grid-cols-1 gap-6">
          <DashboardPerformance />
        </div>
      </div>
    </MainLayout>
  )
}
