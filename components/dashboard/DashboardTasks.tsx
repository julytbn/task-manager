"use client"
import { Search, CheckCircle2, AlertCircle, Clock, MoreHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, Badge, Section, Button } from '@/components/ui'

type Tache = {
  id: string
  titre: string
  priorite?: string
  dateEcheance?: string | null
  statut?: string
  estPayee?: boolean
}

export default function DashboardTasks() {
  const [tasks, setTasks] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)

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

  const statusVariant = (stat?: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const s = (stat || '').toLowerCase()
    if (s.includes('termine') || s.includes('terminé') || s.includes('done')) return 'success'
    if (s.includes('en cours') || s.includes('in_progress') || s.includes('encours')) return 'info'
    if (s.includes('en attente') || s.includes('pending')) return 'danger'
    return 'default'
  }

  const statusLabel = (stat?: string) => {
    const s = (stat || '').toLowerCase()
    if (s.includes('termine') || s.includes('terminé') || s.includes('done')) return 'Terminée'
    if (s.includes('en cours') || s.includes('in_progress') || s.includes('encours')) return 'En cours'
    if (s.includes('en attente') || s.includes('pending')) return 'En attente'
    return stat || 'Non défini'
  }

  const getStatusIcon = (stat?: string) => {
    const s = (stat || '').toLowerCase()
    if (s.includes('termine') || s.includes('terminé') || s.includes('done')) return <CheckCircle2 size={16} />
    if (s.includes('en attente') || s.includes('pending')) return <AlertCircle size={16} />
    return <Clock size={16} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold text-lg text-[#1E1E1E]">Tâches assignées</h3>
          <p className="text-sm text-[#5A6A80]">Priorisez et soumettez vos tâches terminées</p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          className="whitespace-nowrap"
        >
          Nouvelle tâche
        </Button>
      </div>

      {loading ? (
        <Card className="p-6 flex items-center justify-center h-32">
          <p className="text-[#5A6A80]">Chargement…</p>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="p-6 flex flex-col items-center justify-center h-40 gap-2">
          <AlertCircle size={24} className="text-[#DCE3EB]" />
          <p className="text-[#5A6A80]">Aucune tâche assignée pour le moment</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((t: any) => {
            const isDone = (t.statut || '').toString().toLowerCase().includes('termine') || (t.statut || '').toString().toLowerCase().includes('terminé')
            const statusBadgeVariant = statusVariant(t.statut)
            const statusLabelText = statusLabel(t.statut)
            const icon = getStatusIcon(t.statut)
            
            return (
              <Card 
                key={t.id}
                className={`p-4 hover:shadow-lg transition-all group cursor-pointer ${isDone ? 'border-l-4 border-l-[#2ECC71]' : ''}`}
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#1E1E1E] truncate group-hover:text-[#0A66C2]">
                      {t.titre}
                    </h4>
                    {t.description && (
                      <p className="text-xs text-[#5A6A80] line-clamp-2 mt-1">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusBadgeVariant} className="flex items-center gap-1 whitespace-nowrap">
                    {icon}
                    {statusLabelText}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-4 pb-4 border-b border-[#DCE3EB]">
                  <div>
                    <p className="text-[#5A6A80]">Projet</p>
                    <p className="font-medium text-[#1E1E1E] truncate">
                      {t.projet?.nom || t.service?.nom || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#5A6A80]">Deadline</p>
                    <p className="font-medium text-[#1E1E1E]">
                      {t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString('fr-FR', {
                        month: 'short',
                        day: 'numeric'
                      }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#5A6A80]">Paiement</p>
                    <Badge 
                      variant={t.estPayee ? 'success' : 'warning'} 
                      className="text-xs"
                    >
                      {t.estPayee ? 'Payé' : 'En attente'}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-1"
                  >
                    Voir détails
                  </Button>
                  {!isDone && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="flex-1"
                    >
                      Terminer
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
