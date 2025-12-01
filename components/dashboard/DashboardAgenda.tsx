"use client"
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, Badge } from '@/components/ui'

type Tache = {
  id: string
  titre: string
  projet?: { titre?: string }
  dateEcheance?: string | null
  statut?: string
}

export default function DashboardAgenda() {
  const [tasks, setTasks] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/taches')
        if (!res.ok) throw new Error('Erreur récupération tâches')
        const data: Tache[] = await res.json()

        // Keep only tasks with a deadline and sort by date ascending
        const withDeadline = data
          .filter(t => t.dateEcheance)
          .sort((a, b) => (new Date(a.dateEcheance as string).getTime() - new Date(b.dateEcheance as string).getTime()))

        if (mounted) setTasks(withDeadline.slice(0, 6))
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'danger'
    if (daysUntil <= 3) return 'warning'
    if (daysUntil <= 7) return 'info'
    return 'default'
  }

  const getUrgencyLabel = (daysUntil: number) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} j de retard`
    if (daysUntil === 0) return 'Aujourd\'hui'
    if (daysUntil === 1) return 'Demain'
    return `${daysUntil} jours`
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-[#1E1E1E]">Agenda</h3>
          <p className="text-sm text-[#5A6A80]">Prochaines échéances</p>
        </div>
        <div className="p-2 bg-[#F0F4F8] rounded-lg">
          <Calendar size={20} className="text-[#0A66C2]" />
        </div>
      </div>

      {loading ? (
        <Card className="p-6 flex items-center justify-center h-32">
          <p className="text-[#5A6A80]">Chargement…</p>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="p-6 flex flex-col items-center justify-center h-32 gap-2">
          <Calendar size={24} className="text-[#DCE3EB]" />
          <p className="text-[#5A6A80]">Aucune échéance trouvée</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const daysUntil = getDaysUntil(t.dateEcheance || '')
            const urgencyVariant = getUrgencyColor(daysUntil)
            const urgencyLabel = getUrgencyLabel(daysUntil)
            const isOverdue = daysUntil < 0
            const isDone = (t.statut || '').toString().toUpperCase().includes('TERMINE')
            
            return (
              <Card 
                key={t.id}
                className={`p-4 hover:shadow-md transition-all group cursor-pointer ${isOverdue ? 'border-l-4 border-l-[#E74C3C]' : ''} ${isDone ? 'opacity-60 border-l-4 border-l-[#2ECC71]' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">
                      {isDone ? (
                        <CheckCircle2 size={20} className="text-[#2ECC71] flex-shrink-0" />
                      ) : isOverdue ? (
                        <AlertCircle size={20} className="text-[#E74C3C] flex-shrink-0" />
                      ) : (
                        <Clock size={20} className="text-[#0A66C2] flex-shrink-0" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium truncate group-hover:text-[#0A66C2] transition-colors ${isDone ? 'line-through' : ''}`}>
                        {t.titre}
                      </p>
                      <p className="text-xs text-[#5A6A80] truncate mt-1">
                        {t.projet?.titre || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge variant={urgencyVariant} className="text-xs">
                      {urgencyLabel}
                    </Badge>
                    <p className="text-xs text-[#5A6A80]">
                      {t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString('fr-FR', {
                        month: 'short',
                        day: 'numeric'
                      }) : '—'}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
