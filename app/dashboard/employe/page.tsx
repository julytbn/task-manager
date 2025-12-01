"use client"
import { useEffect, useState } from 'react'
import { Grid, Stat, Section, Card } from '@/components/ui'
import DashboardAgenda from '@/components/dashboard/DashboardAgenda'
import DashboardPayments from '@/components/dashboard/DashboardPayments'
import DashboardPerformance from '@/components/dashboard/DashboardPerformance'
import EmployeeTeamInfo from '@/components/dashboard/EmployeeTeamInfo'
import EmployeeProjectTasks from '@/components/dashboard/EmployeeProjectTasks'
import { TrendingUp, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

type Tache = {
  id: string
  titre: string
  statut?: string
  dateEcheance?: string | null
  estPayee?: boolean
}

export default function EmployeeDashboardPage() {
  const [tasks, setTasks] = useState<Tache[]>([])
  const [paymentsSummary, setPaymentsSummary] = useState<{ total: number; paid: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [tRes, pRes] = await Promise.all([fetch('/api/taches'), fetch('/api/paiements')])
        const tData = tRes.ok ? await tRes.json() : []
        const pData = pRes.ok ? await pRes.json() : null
        if (mounted) {
          setTasks(tData || [])
          if (pData?.totals) setPaymentsSummary({ total: pData.totals.total, paid: pData.totals.paid })
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

  const inProgress = tasks.filter(t => (t.statut || '').toString().toUpperCase().includes('EN_COURS') || (t.statut || '').toString().toUpperCase().includes('A_FAIRE')).length
  const done = tasks.filter(t => (t.statut || '').toString().toUpperCase().includes('TERMINE')).length
  const overdue = tasks.filter(t => {
    if (!t.dateEcheance) return false
    const d = new Date(t.dateEcheance)
    return d < new Date() && !(t.statut || '').toString().toUpperCase().includes('TERMINE')
  }).length

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-text">Bienvenue, Julie 👋</h1>
              <p className="text-muted mt-2">Votre tableau de bord personnel — gérez vos tâches et suivez vos performances</p>
            </div>
            <div className="text-sm text-muted">Dernière connexion : il y a 2 heures</div>
          </div>
        </div>

        {/* KPI Cards - Modern Grid */}
        <div className="mb-8">
          <Grid cols={4}>
            <Stat
              label="Tâches en cours"
              value={inProgress}
              icon="🚀"
              trend={inProgress > 0 ? 'up' : 'down'}
              trendValue={`${inProgress} actives`}
            />
            <Stat
              label="Tâches terminées"
              value={done}
              icon="✨"
              trend="up"
              trendValue={`+${Math.floor(done * 1.2)}`}
            />
            <Stat
              label="Tâches en retard"
              value={overdue}
              icon="⚠️"
              trend={overdue > 0 ? 'down' : 'up'}
              trendValue={overdue > 0 ? 'À rattraper' : 'Nickel !'}
            />
            <Stat
              label="Paiements ce mois"
              value={paymentsSummary?.paid || 0}
              icon="💰"
              trend="up"
              trendValue="En cours"
            />
          </Grid>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="animate-fade-in">
              <EmployeeTeamInfo />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="animate-fade-in">
              <DashboardPayments />
            </div>
            <div className="animate-fade-in">
              <DashboardPerformance />
            </div>
            <div className="animate-fade-in">
              <DashboardAgenda />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
