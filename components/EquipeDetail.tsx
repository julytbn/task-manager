"use client"
import { useEffect, useState } from 'react'

export default function EquipeDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [equipe, setEquipe] = useState<any | null>(null)
  const [metrics, setMetrics] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/equipes/${id}`).then(r=>r.json()).then(setEquipe).catch(()=>{})
    fetch(`/api/equipes/${id}/metrics`).then(r=>r.json()).then(setMetrics).catch(()=>{})
  }, [id])

  if (!equipe) return <div className="bg-white p-6 rounded shadow">Chargement…</div>

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">{equipe.nom}</h2>
          <p className="text-sm text-gray-500">{equipe.description}</p>
        </div>
        <div>
          <button onClick={onBack} className="px-3 py-1 border rounded">Retour</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Chef d'équipe</div>
          <div className="font-medium">{equipe.lead ? `${equipe.lead.nom} ${equipe.lead.prenom}` : '—'}</div>
          <div className="text-xs text-gray-500">{equipe.lead?.email}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Membres</div>
          <div className="text-sm">{equipe.membres?.map((m:any)=> m.utilisateur.nom + ' ' + m.utilisateur.prenom).join(', ')}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Avancement</div>
          <div className="text-lg font-semibold">{metrics ? `${metrics.percentComplete}%` : '—'}</div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Tâches attribuées</h3>
        <div className="text-sm text-gray-600">(liste simplifiée)</div>
        {/* For brevity, link to tasks listing could be added here */}
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Commentaires internes</h3>
        <div className="text-sm text-gray-600">Chat / commentaires non implémentés (placeholder)</div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Paiement du projet</h3>
        <div className="text-sm text-gray-600">Statut des paiements: implémentation via factures et paiements lié au projet.</div>
      </div>
    </div>
  )
}
