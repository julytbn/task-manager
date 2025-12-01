"use client"
import { useEffect, useMemo, useState } from 'react'

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
  const [summary, setSummary] = useState<any>(null)
  const [recent, setRecent] = useState<Paiement[]>([])
  const [all, setAll] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [period, setPeriod] = useState('this_month')

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const res = await fetch('/api/paiements')
        const json = await res.json()
        if(!mounted) return
        setSummary(json.totals || null)
        setRecent(json.recent || [])

        // load all payments for table/history
        const allRes = await fetch('/api/paiements?all=true')
        const allJson = await allRes.json()
        if(!mounted) return
        setAll(allJson.payments || [])
      }catch(e){ console.error(e) }
      finally{ if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[])

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Paiements</h2>
          <p className="text-sm text-gray-500">Suivez vos gains et historiques de paiement.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded">Exporter PDF</button>
          <button className="px-3 py-2 border rounded">Exporter Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border">
          <div className="text-sm text-gray-400">Montant total gagné</div>
          <div className="text-lg font-semibold">{summary ? `${summary.total.toLocaleString()} FCFA` : '—'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border">
          <div className="text-sm text-gray-400">Montant payé</div>
          <div className="text-lg font-semibold text-green-600">{summary ? `${summary.paid.toLocaleString()} FCFA` : '—'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border">
          <div className="text-sm text-gray-400">Montant restant</div>
          <div className="text-lg font-semibold text-red-600">{summary ? `${(summary.total - summary.paid).toLocaleString()} FCFA` : '—'}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow border mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Historique des paiements</h3>
          <div className="flex items-center gap-2">
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Tous statuts</option>
              <option value="all">Tous</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
            </select>
            <select value={period} onChange={e=>setPeriod(e.target.value)} className="border rounded px-2 py-1">
              <option value="this_month">Ce mois</option>
              <option value="quarter">Trimestre</option>
              <option value="year">Année</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="p-3">ID tâche</th>
                <th className="p-3">Libellé</th>
                <th className="p-3">Date d'achèvement</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Date de paiement</th>
                <th className="p-3">Preuve</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{p.tache?.id || '—'}</td>
                  <td className="p-3">{p.tache?.titre || p.projet?.titre || '—'}</td>
                  <td className="p-3">{p.datePaiement ? new Date(p.datePaiement).toLocaleDateString() : '—'}</td>
                  <td className="p-3">{p.montant?.toLocaleString() || '—'} FCFA</td>
                  <td className="p-3">{p.statut === 'CONFIRME' ? 'Payé' : 'En attente'}</td>
                  <td className="p-3">{p.moyenPaiement || '—'}</td>
                  <td className="p-3">{p.datePaiement ? new Date(p.datePaiement).toLocaleString() : '—'}</td>
                  <td className="p-3"><button className="text-indigo-600">Voir / Télécharger</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
