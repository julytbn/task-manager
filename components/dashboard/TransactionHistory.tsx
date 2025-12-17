"use client"
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layouts/MainLayout'
import { TrendingUp, Download, Filter } from 'lucide-react'
import { useUserSession } from '@/hooks/useSession'

type Paiement = {
  id: string
  montant: number
  statut: string
  moyenPaiement?: string
  datePaiement?: string | null
  tache?: { id?: string; titre?: string }
  reference?: string
}

export default function TransactionHistory(){
  const { user, isLoading: isSessionLoading } = useUserSession()
  const [items, setItems] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if (isSessionLoading) return
    
    let mounted = true
    ;(async ()=>{
      try{
        const paymentsUrl = user?.id ? `/api/paiements?userId=${user.id}&all=true` : '/api/paiements?all=true'
        const res = await fetch(paymentsUrl)
        const json = await res.json()
        if(!mounted) return
        setItems(json.payments || [])
      }catch(e){ console.error(e) }
      finally{ if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[isSessionLoading, user])

  if (isSessionLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-4xl font-bold gold-gradient-text">Historique des transactions</h1>
          <p className="text-[var(--color-anthracite)]/70 mt-2">Tous les mouvements financiers liés à votre compte</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="card">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--color-anthracite)]/60">Aucune transaction trouvée</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((p, idx) => (
                    <div key={p.id} className="flex gap-4">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 ${p.statut === 'CONFIRME' ? 'bg-green-500 border-green-200' : 'bg-yellow-500 border-yellow-200'}`}></div>
                        {idx < items.length - 1 && <div className="w-0.5 h-12 bg-[var(--color-border)] my-2"></div>}
                      </div>
                      
                      {/* Transaction Info */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-anthracite)]">{p.datePaiement ? new Date(p.datePaiement).toLocaleString('fr-FR') : '—'}</p>
                            <p className="text-xs text-[var(--color-anthracite)]/60 mt-1">Tâche: {p.tache?.titre || '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold gold-gradient-text text-lg">{p.montant?.toLocaleString()} FCFA</p>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                              p.statut === 'CONFIRME'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {p.statut === 'CONFIRME' ? '✓ Payé' : '⏳ En attente'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border)]">
                          <span className="text-xs text-[var(--color-anthracite)]/60">💳 {p.moyenPaiement || 'Non spécifié'}</span>
                          <span className="text-xs text-[var(--color-anthracite)]/60">📌 {p.reference || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Filters */}
          <aside className="card">
            <div className="flex items-center gap-2 mb-6">
              <Filter size={20} className="text-[var(--color-gold)]" />
              <h3 className="text-lg font-bold text-[var(--color-black-deep)]">Filtres</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Période</label>
                <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
                  <option>7 derniers jours</option>
                  <option>30 derniers jours</option>
                  <option>Trimestre</option>
                  <option>Année</option>
                  <option>Personnalisé</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Montant min (FCFA)</label>
                <input type="number" placeholder="0" className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Montant max (FCFA)</label>
                <input type="number" placeholder="999999999" className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Méthode de paiement</label>
                <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
                  <option value="">Tous</option>
                  <option>Flooz</option>
                  <option>TMoney</option>
                  <option>Virement bancaire</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Statut</label>
                <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
                  <option value="">Tous</option>
                  <option>Payé</option>
                  <option>En attente</option>
                </select>
              </div>

              <button className="w-full px-4 py-2 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-6">
                <Download size={16} />
                Exporter PDF
              </button>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}
