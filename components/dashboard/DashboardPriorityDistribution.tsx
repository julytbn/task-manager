"use client"
import { useEffect, useState, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Card, Section } from '@/components/ui'
import { AlertCircle, Zap, Hourglass } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Tache = {
  id: string
  priorite?: string
}

export default function DashboardPriorityDistribution() {
  const [tasks, setTasks] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/taches')
        if (!res.ok) throw new Error('Erreur récupération tâches')
        const data = await res.json()
        if (mounted) setTasks(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const priorityCount = useMemo(() => {
    const counts = { haute: 0, moyenne: 0, basse: 0 }
    tasks.forEach(t => {
      const p = (t.priorite || '').toLowerCase()
      // Gérer les variantes possibles
      if (p.includes('haute') || p === 'high' || p === 'urgent') counts.haute++
      else if (p.includes('basse') || p === 'low') counts.basse++
      else if (t.priorite) counts.moyenne++ // Si une priorité est définie mais n'est pas haute/basse
    })
    return counts
  }, [tasks])

  const chartData = useMemo(() => ({
    labels: ['Haute', 'Moyenne', 'Basse'],
    datasets: [{
      label: 'Nombre de tâches',
      data: [priorityCount.haute, priorityCount.moyenne, priorityCount.basse],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  }), [priorityCount])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: 'var(--color-anthracite)',
          font: { size: 12 },
          padding: 15,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--color-anthracite)', font: { size: 12 } },
        grid: { color: 'rgba(212, 175, 55, 0.1)' },
      },
      y: {
        ticks: { color: 'var(--color-anthracite)', font: { size: 12 } },
        grid: { display: false },
      },
    },
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-black-deep)]">
            Distribution des priorités
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Répartition des {tasks.length} tâches par niveau de priorité
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm font-semibold">{priorityCount.haute}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <span className="text-sm font-semibold">{priorityCount.moyenne}</span>
          </div>
          <div className="flex items-center gap-2">
            <Hourglass size={16} className="text-green-500" />
            <span className="text-sm font-semibold">{priorityCount.basse}</span>
          </div>
        </div>
      </div>
      {!loading && tasks.length > 0 && (
        <div style={{ height: 250 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
      {loading && <div className="h-64 flex items-center justify-center text-gray-500">Chargement...</div>}
      {!loading && tasks.length === 0 && <div className="h-64 flex items-center justify-center text-gray-500">Aucune tâche</div>}
    </div>
  )
}
