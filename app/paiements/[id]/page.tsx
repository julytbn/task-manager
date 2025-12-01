"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import UiLayout from '../../../components/UiLayout'
import { useParams } from 'next/navigation'

export default function PaiementDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [paiement, setPaiement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    ;(async () => {
      try {
        // Fetch all paiements and find the one with matching ID
        const res = await fetch('/api/paiements?all=true')
        if (!res.ok) throw new Error('Erreur récupération paiements')
        const data = await res.json()
        const found = data.payments?.find((p: any) => p.id === id)
        if (!found) throw new Error('Paiement introuvable')
        if (mounted) setPaiement(found)
      } catch (err) {
        if (mounted) setError((err as any).message || 'Erreur')
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (loading) return <UiLayout><div className="text-center py-8">Chargement...</div></UiLayout>
  if (error) return <UiLayout><div className="bg-red-50 text-red-700 p-4 rounded">{error}</div></UiLayout>
  if (!paiement) return <UiLayout><div className="text-center py-8 text-gray-500">Paiement non trouvé</div></UiLayout>

  return (
    <UiLayout>
      <div className="mb-6">
        <Link href="/paiements" className="text-blue-600 hover:underline">
          ← Retour aux paiements
        </Link>
      </div>

      <div className="bg-white rounded shadow p-8 max-w-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Détail paiement</h1>
            <p className="text-sm text-gray-500 mt-1">ID: {paiement.id}</p>
          </div>
          <span className={`inline-flex px-4 py-2 rounded-lg font-semibold text-sm ${
            paiement.statut === 'CONFIRME' ? 'bg-green-100 text-green-800' :
            paiement.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {paiement.statut === 'CONFIRME' ? 'Confirmé' :
             paiement.statut === 'EN_ATTENTE' ? 'En attente' :
             'Annulé'}
          </span>
        </div>

        <div className="space-y-4 mb-8 pb-8 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-1">Tâche</h3>
            <p className="text-lg text-gray-900">{paiement.tache?.titre || '—'}</p>
          </div>
          {paiement.projet && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-1">Projet</h3>
              <p className="text-lg text-gray-900">{paiement.projet.titre}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8 pb-8 border-b">
          <div className="flex justify-between">
            <span className="text-gray-700">Montant</span>
            <span className="font-bold text-xl text-blue-600">{paiement.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Moyen de paiement</span>
            <span className="font-medium">{paiement.moyenPaiement || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Date de paiement</span>
            <span className="font-medium">{paiement.datePaiement ? new Date(paiement.datePaiement).toLocaleDateString('fr-FR') : '—'}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Éditer
          </button>
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
            Supprimer
          </button>
        </div>
      </div>
    </UiLayout>
  )
}
