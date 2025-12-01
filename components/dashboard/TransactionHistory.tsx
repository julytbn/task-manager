"use client"
import { useEffect, useState } from 'react'

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
  const [items, setItems] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const res = await fetch('/api/paiements?all=true')
        const json = await res.json()
        if(!mounted) return
        setItems(json.payments || [])
      }catch(e){ console.error(e) }
      finally{ if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Historique des transactions</h2>
          <p className="text-sm text-gray-500">Tous les mouvements financiers liés à votre compte.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded">Exporter PDF</button>
          <button className="px-3 py-2 border rounded">Exporter Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded shadow border">
            <div className="space-y-6">
              {items.map(p => (
                <div key={p.id} className="flex items-start gap-4">
                  <div className="text-xs text-gray-400 mt-1">{p.datePaiement ? new Date(p.datePaiement).toLocaleString() : '—'}</div>
                  <div className="flex-1 bg-gray-50 p-3 rounded">
                    <div className="font-semibold">{p.montant?.toLocaleString()} FCFA — {p.statut === 'CONFIRME' ? 'Payé' : 'En attente'}</div>
                    <div className="text-sm text-gray-600">Tâche : {p.tache?.titre || '—'}</div>
                    <div className="text-xs text-gray-500">Méthode : {p.moyenPaiement || '—'} • Réf : { (p as any).reference || '—' }</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="bg-white p-4 rounded shadow border">
          <h4 className="font-semibold mb-2">Filtres avancés</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>Intervalle: 7j • 30j • personnalisé (TODO)</div>
            <div>Montant: min / max (TODO)</div>
            <div>Méthode: Flooz, TMoney, Virement (TODO)</div>
            <div>Type: Paiement tâche / Prime / Bonus (TODO)</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
