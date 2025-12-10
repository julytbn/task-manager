"use client"
import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { DollarSign, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { useUserSession } from '@/hooks/useSession'

type Paiement = {
  id: string
  montant: number
  statut: string
  moyenPaiement?: string
  datePaiement?: string | null
  tache?: { id?: string; titre?: string }
  projet?: { id?: string; titre?: string }
}

export default function EmployeePayments(){
  const { user, isLoading: isSessionLoading } = useUserSession()
  const [summary, setSummary] = useState<any>(null)
  const [recent, setRecent] = useState<Paiement[]>([])
  const [all, setAll] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [period, setPeriod] = useState('this_month')

  useEffect(()=>{
    if (isSessionLoading) return
    
    let mounted = true
    ;(async ()=>{
      try{
        // Fetch user's payments
        const paymentsUrl = user?.id ? `/api/paiements?userId=${user.id}` : '/api/paiements'
        const res = await fetch(paymentsUrl)
        const json = await res.json()
        if(!mounted) return
        setSummary(json.totals || null)
        setRecent(json.recent || [])

        // load all payments for table/history
        const allRes = await fetch(paymentsUrl + (paymentsUrl.includes('?') ? '&all=true' : '?all=true'))
        const allJson = await allRes.json()
        if(!mounted) return
        setAll(allJson.payments || [])
      }catch(e){ console.error(e) }
      finally{ if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[isSessionLoading, user])

  const filtered = useMemo(()=>{
    return all.filter(p => {
      if (filterStatus && filterStatus !== 'all') {
        if (filterStatus === 'paid' && p.statut !== 'CONFIRME') return false
        if (filterStatus === 'pending' && p.statut !== 'EN_ATTENTE') return false
      }
      // period filtering placeholder
      return true
    })
  },[all, filterStatus])

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
          <h1 className="text-4xl font-bold gold-gradient-text">Paiements</h1>
          <p className="text-[var(--color-anthracite)]/70 mt-2">Suivez vos gains et historiques de paiement</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-shadow)] flex items-center justify-center text-[var(--color-black-deep)]">
                <DollarSign size={28} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <p className="text-sm text-[var(--color-anthracite)] font-medium uppercase tracking-wide">
                Total gagné
              </p>
              <p className="text-3xl font-bold gold-gradient-text">{summary ? `${summary.total.toLocaleString()}` : '—'}</p>
              <p className="text-xs text-[var(--color-anthracite)]/60">FCFA</p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <CheckCircle size={28} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <p className="text-sm text-[var(--color-anthracite)] font-medium uppercase tracking-wide">
                Montant payé
              </p>
              <p className="text-3xl font-bold text-green-600">{summary ? `${summary.paid.toLocaleString()}` : '—'}</p>
              <p className="text-xs text-[var(--color-anthracite)]/60">FCFA</p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <AlertCircle size={28} />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <p className="text-sm text-[var(--color-anthracite)] font-medium uppercase tracking-wide">
                Montant en attente
              </p>
              <p className="text-3xl font-bold text-red-600">{summary ? `${(summary.total - summary.paid).toLocaleString()}` : '—'}</p>
              <p className="text-xs text-[var(--color-anthracite)]/60">FCFA</p>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--color-black-deep)]">Historique des paiements</h2>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="border border-[var(--color-border)] rounded px-3 py-2 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
                <option value="">Tous statuts</option>
                <option value="all">Tous</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
              </select>
              <select value={period} onChange={e=>setPeriod(e.target.value)} className="border border-[var(--color-border)] rounded px-3 py-2 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
                <option value="this_month">Ce mois</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Année</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-offwhite)]">
                  <th className="text-left p-4 font-bold text-[var(--color-black-deep)]">ID Tâche</th>
                  <th className="text-left p-4 font-bold text-[var(--color-black-deep)]">Libellé</th>
                  <th className="text-left p-4 font-bold text-[var(--color-black-deep)]">Date d'achèvement</th>
                  <th className="text-left p-4 font-bold text-[var(--color-black-deep)]">Montant</th>
                  <th className="text-left p-4 font-bold text-[var(--color-black-deep)]">Statut</th>
                  <th className="text-left p-4 font-bold text-[var(--color-black-deep)]">Mode paiement</th>
                  <th className="text-left p-4 font-bold text-[var(--color-black-deep)]">Date de paiement</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-[var(--color-anthracite)]/70">
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-[var(--color-anthracite)]/70">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-offwhite)] transition-colors">
                      <td className="p-4 text-[var(--color-anthracite)]">{p.tache?.id || '—'}</td>
                      <td className="p-4 text-[var(--color-anthracite)] font-medium">{p.tache?.titre || p.projet?.titre || '—'}</td>
                      <td className="p-4 text-[var(--color-anthracite)]">{p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="p-4 font-bold gold-gradient-text">{p.montant?.toLocaleString() || '—'} FCFA</td>
                      <td className="p-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          p.statut === 'CONFIRME'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.statut === 'CONFIRME' ? '✓ Payé' : '⏳ En attente'}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--color-anthracite)]">{p.moyenPaiement || '—'}</td>
                      <td className="p-4 text-[var(--color-anthracite)]">{p.datePaiement ? new Date(p.datePaiement).toLocaleString('fr-FR') : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
