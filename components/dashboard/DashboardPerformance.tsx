"use client"
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { useEffect, useState } from 'react'
import { Card, Section } from '@/components/ui'
import { TrendingUp, Clock, DollarSign } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function DashboardPerformance() {
  const [labels, setLabels] = useState<string[]>([])
  const [dataPoints, setDataPoints] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<{ productivity?: number; avgTime?: number; paymentsTotal?: number }>({})

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/taches')
        if (!res.ok) throw new Error('Erreur récupération tâches')
        const tasks = await res.json()

        // compute completed tasks per month for the last 6 months
        const now = new Date()
        const months: { label: string; start: Date; end: Date }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const start = new Date(d.getFullYear(), d.getMonth(), 1)
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
          months.push({ label: start.toLocaleString('default', { month: 'short', year: 'numeric' }), start, end })
        }

        const counts = months.map(m => {
          return tasks.filter((t: any) => {
            // consider task completed if statut indicates TERMINE or "TERMINE"
            const isDone = (t.statut || '').toString().toUpperCase().includes('TERMINE')
            if (!isDone) return false
            const date = t.dateModification || t.dateEcheance || t.dateCreation
            if (!date) return false
            const dt = new Date(date)
            return dt >= m.start && dt < m.end
          }).length
        })

        // compute productivity and avg completion time
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => (t.statut || '').toString().toUpperCase().includes('TERMINE'))
        const productivity = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0
        const times: number[] = completedTasks.map((t: any) => {
          const created = t.dateCreation ? new Date(t.dateCreation) : (t.createdAt ? new Date(t.createdAt) : null)
          const ended = t.dateModification ? new Date(t.dateModification) : (t.dateEcheance ? new Date(t.dateEcheance) : null)
          if (!created || !ended) return 0
          const diff = (ended.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          return diff
        }).filter(Boolean)
        const avgTime = times.length ? Math.round(times.reduce((a,b) => a+b,0)/times.length) : 0

        // try to fetch payments totals
        let paymentsTotal = 0
        try {
          const pRes = await fetch('/api/paiements')
          if (pRes.ok) {
            const pdata = await pRes.json()
            if (pdata?.totals?.total) paymentsTotal = pdata.totals.total
          }
        } catch (e) {
          // ignore
        }

        if (mounted) {
          setLabels(months.map(m => m.label))
          setDataPoints(counts)
          setKpis(prev => ({ ...prev, productivity, avgTime, paymentsTotal }))
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

  const chartData = {
    labels,
    datasets: [
      {
        label: "Tâches terminées",
        data: dataPoints,
        borderColor: '#0A66C2',
        backgroundColor: 'rgba(10, 102, 194, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#0A66C2',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      }
    ]
  }

  const chartOptions = {
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E1E1E',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#DCE3EB',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F0F4F8',
          drawBorder: false,
        },
        ticks: {
          color: '#5A6A80',
          font: { size: 12 },
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#5A6A80',
          font: { size: 12 },
        }
      }
    },
    maintainAspectRatio: false
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-lg text-[#1E1E1E]">Performance</h3>
        <p className="text-sm text-[#5A6A80]">Tâches terminées (6 derniers mois)</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#5A6A80] font-medium">Productivité</p>
              <p className="text-2xl font-bold text-[#1E1E1E] mt-2">{kpis.productivity ?? '—'}%</p>
              <p className="text-xs text-[#2ECC71] mt-2">↑ 12% vs mois dernier</p>
            </div>
            <div className="p-2 bg-[#F0F4F8] rounded-lg">
              <TrendingUp size={20} className="text-[#0A66C2]" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#5A6A80] font-medium">Temps moyen</p>
              <p className="text-2xl font-bold text-[#1E1E1E] mt-2">{kpis.avgTime ?? '—'} j</p>
              <p className="text-xs text-[#E74C3C] mt-2">↑ 2 jours vs cible</p>
            </div>
            <div className="p-2 bg-[#F0F4F8] rounded-lg">
              <Clock size={20} className="text-[#F1C40F]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#2ECC71]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#5A6A80] font-medium">Paiements cumulés</p>
              <p className="text-2xl font-bold text-[#2ECC71] mt-2">
                {kpis.paymentsTotal ? `€${kpis.paymentsTotal.toFixed(2)}` : '—'}
              </p>
              <p className="text-xs text-[#2ECC71] mt-2">↑ 25% vs mois dernier</p>
            </div>
            <div className="p-2 bg-[#F0FDF4] rounded-lg">
              <DollarSign size={20} className="text-[#2ECC71]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="h-56">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#5A6A80]">Chargement…</p>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </Card>
    </div>
  )
}
