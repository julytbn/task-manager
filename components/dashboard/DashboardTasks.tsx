"use client"
import { Search, CheckCircle2, AlertCircle, Clock, MoreHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, Badge, Section, Button, Modal } from '@/components/ui'
import { useUserSession } from '@/hooks/useSession'

const [rejectModalOpen, setRejectModalOpen] = useState<string|null>(null)

type Tache = {
  id: string
  titre: string
  description?: string
  priorite?: string
  dateEcheance?: string | null
  statut?: string
  estPayee?: boolean
  projet?: { 
    id?: string
    nom?: string 
    titre?: string
  }
  service?: { 
    id?: string
    nom?: string 
  }
  collaborateur?: { 
    id?: string
    nom?: string 
    prenom?: string 
    email?: string
  }
  assigneA?: {
    id?: string
    nom?: string
    prenom?: string
    email?: string
  }
  documents?: { id: string, nom: string, url: string }[]
}

export default function DashboardTasks({ compact = false }: { compact?: boolean }) {
  const { user, isLoading: isSessionLoading } = useUserSession()
  const [tasks, setTasks] = useState<Tache[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSessionLoading) {
      console.log(' [DashboardTasks] Chargement de la session en cours...')
      return
    }
    
    console.log(' [DashboardTasks] Session chargée:', {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      isAuthenticated: !!user
    })
    
    let mounted = true
    const load = async () => {
      try {
        console.log(' [DashboardTasks] Récupération des tâches...')
        const res = await fetch('/api/taches')
        if (!res.ok) throw new Error('Erreur récupération tâches')
        const data = await res.json()
        
        console.log(' [DashboardTasks] Tâches récupérées:', {
          totalTasks: data.length,
          sampleTasks: data.slice(0, 3).map((t: any) => ({
            id: t.id,
            titre: t.titre,
            statut: t.statut,
            collaborateur: t.assigneA || t.collaborateur
          }))
        })
        
        if (mounted) {
          setTasks(data)
          // Filtrer les tâches pour ne montrer que celles de l'utilisateur connecté
          if (user?.role !== 'ADMIN') {
            const userTasks = data.filter((task: Tache) => {
              const assigneAId = task.assigneA?.id || task.collaborateur?.id
              const assigneAEmail = task.assigneA?.email || task.collaborateur?.email
              
              return (
                assigneAId === user?.id || 
                assigneAEmail === user?.email
              )
            })
            
            console.log(' [DashboardTasks] Tâches filtrées pour l\'utilisateur:', {
              userId: user?.id,
              userEmail: user?.email,
              totalTasks: data.length,
              userTasksCount: userTasks.length,
              userTasks: userTasks.map((t: Tache) => ({
                id: t.id,
                titre: t.titre,
                statut: t.statut,
                assigneA: t.assigneA || t.collaborateur
              }))
            })
            
            setFilteredTasks(userTasks)
          } else {
            console.log(' [DashboardTasks] Mode ADMIN - Affichage de toutes les tâches:', data.length)
            setFilteredTasks(data)
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des tâches:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [isSessionLoading, user])

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
      ) : compact ? (
        <div className="space-y-2">
          {filteredTasks.slice(0, 8).map((t: any) => {
            const statusBadgeVariant = statusVariant(t.statut)
            const statusLabelText = statusLabel(t.statut)
            return (
              <div key={t.id} className="bg-white border border-border rounded-md p-2 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1E1E1E] truncate">{t.titre}</div>
                    <div className="text-xs text-[#5A6A80] truncate">{t.projet?.nom || '—'} · {t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString('fr-FR') : 'N/A'}</div>
                  </div>
                </div>
                <Badge variant={statusBadgeVariant} className="text-xs whitespace-nowrap ml-2">{statusLabelText}</Badge>
              </div>
            )
          })}
          {tasks.length > 8 && <p className="text-xs text-[#5A6A80] px-2 py-1">+{tasks.length - 8} autres...</p>}
        </div>
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

                <div className="grid grid-cols-4 gap-2 text-xs mb-4 pb-4 border-b border-[#DCE3EB]">
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
                    <p className="text-[#5A6A80]">Collaborateur</p>
                    <p className="font-medium text-[#1E1E1E]">
                      {t.collaborateur ? `${t.collaborateur.prenom || ''} ${t.collaborateur.nom || ''}`.trim() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#5A6A80]">Fichiers</p>
                    <div className="flex flex-wrap gap-1">
                      {t.documents && t.documents.length > 0 ? t.documents.map((doc: { id: string, nom: string, url: string }) => (
                        <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{doc.nom}</a>
                      )) : <span>—</span>}
                    </div>
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
                      onClick={async () => {
                        await fetch(`/api/taches`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: t.id, statut: 'VALIDEE' })
                        })
                        window.location.reload()
                      }}
                    >
                      Valider
                    </Button>
                  )}
                  {!isDone && (
                    <>
                      <Button 
                        variant="danger" 
                        size="sm"
                        className="flex-1"
                        onClick={() => setRejectModalOpen(t.id)}
                      >
                        Rejeter
                      </Button>
                      {rejectModalOpen === t.id && (
                        <Modal isOpen={true} onClose={() => setRejectModalOpen(null)} title="Motif du rejet">
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;
                              if (comment) {
                                fetch(`/api/taches`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: t.id, statut: 'REJETEE', commentaire: comment })
                                }).then(() => window.location.reload());
                              }
                            }}
                          >
                            <textarea name="comment" required placeholder="Motif du rejet" className="w-full border rounded p-2 mb-4" />
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setRejectModalOpen(null)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Rejeter</button>
                            </div>
                          </form>
                        </Modal>
                      )}
                    </>
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
