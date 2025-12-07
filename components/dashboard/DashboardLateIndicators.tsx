"use client"
import { useEffect, useState, useMemo } from 'react'
import { Card, Badge } from '@/components/ui'
import { AlertTriangle, Clock, Zap } from 'lucide-react'

type Tache = {
  id: string
  titre: string
  dateEcheance?: string | null
  statut?: string
  priorite?: string
}

export default function DashboardLateIndicators() {
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

  const lateStats = useMemo(() => {
    const now = new Date()
    const notDone = tasks.filter(t => !(t.statut || '').toUpperCase().includes('TERMINE'))
    
    const overdue = notDone.filter(t => {
      if (!t.dateEcheance) return false
      const deadline = new Date(t.dateEcheance)
      return deadline < now
    })

    const dueSoon = notDone.filter(t => {
      if (!t.dateEcheance) return false
      const diff = new Date(t.dateEcheance).getTime() - now.getTime()
      const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return daysUntil >= 0 && daysUntil <= 3
    })

    const highPriorityLate = overdue.filter(t => {
      const p = (t.priorite || '').toLowerCase()
      return p.includes('haute') || p === 'high' || p === 'urgent'
    })

    return {
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      highPriorityLate: highPriorityLate.length,
      lateTasks: overdue.slice(0, 5),
    }
  }, [tasks])

  if (loading) return <div className="card h-48 flex items-center justify-center text-gray-500">Chargement...</div>

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-black-deep)]">
          Alertes de retard
        </h2>
        <p className="text-sm text-gray-500 mt-1">Tâches en retard ou à risque ({tasks.length} tâches total)</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">En retard</p>
              <p className="text-2xl font-bold text-red-600">{lateStats.overdue}</p>
            </div>
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Due dans 3j</p>
              <p className="text-2xl font-bold text-amber-600">{lateStats.dueSoon}</p>
            </div>
            <Clock size={24} className="text-amber-500" />
          </div>
        </div>

        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Haute priorité</p>
              <p className="text-2xl font-bold text-orange-600">{lateStats.highPriorityLate}</p>
            </div>
            <Zap size={24} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Late Tasks List */}
      {lateStats.lateTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Tâches en retard</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {lateStats.lateTasks.map(task => (
              <div key={task.id} className="p-2 bg-red-50 rounded border border-red-100 text-sm">
                <p className="font-medium text-red-900 truncate">{task.titre}</p>
                <p className="text-xs text-red-700 mt-1">
                  {task.dateEcheance ? new Date(task.dateEcheance).toLocaleDateString('fr-FR') : 'Pas de deadline'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {lateStats.overdue === 0 && lateStats.dueSoon === 0 && (
        <p className="text-center text-gray-500 py-8">✅ Aucune tâche en retard</p>
      )}
    </div>
  )
}
