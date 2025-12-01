"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import UiLayout from '../../../components/UiLayout'
import { useParams } from 'next/navigation'

export default function FactureDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [facture, setFacture] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/factures/${id}`)
        if (!res.ok) throw new Error('Facture introuvable')
        const data = await res.json()
        if (mounted) setFacture(data)
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
  if (!facture) return <UiLayout><div className="text-center py-8 text-gray-500">Facture non trouvée</div></UiLayout>

  const montantHT = facture.montant
  const tva = montantHT * facture.tauxTVA
  const montantTTC = facture.montantTotal

  return (
    <UiLayout>
      <div className="mb-6">
        <Link href="/factures" className="text-blue-600 hover:underline">
          ← Retour aux factures
        </Link>
      </div>

      <div className="bg-white rounded shadow p-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facture {facture.numero}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Émise le {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex px-4 py-2 rounded-lg font-semibold text-sm ${
              facture.statut === 'PAYEE' ? 'bg-green-100 text-green-800' :
              facture.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {facture.statut === 'EN_ATTENTE' ? 'En attente' :
               facture.statut === 'PAYEE' ? 'Payée' :
               facture.statut}
            </span>
          </div>
        </div>

        {/* Client & Projet */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Client</h3>
            <p className="text-lg font-medium text-gray-900">{facture.client?.nom}</p>
          </div>
          {facture.projet && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Projet</h3>
              <p className="text-lg font-medium text-gray-900">{facture.projet.titre}</p>
            </div>
          )}
        </div>

        {/* Tâches */}
        {facture.taches && facture.taches.length > 0 && (
          <div className="mb-8 pb-8 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâches</h3>
            <div className="space-y-2">
              {facture.taches.map((tache: any) => (
                <div key={tache.id} className="flex justify-between text-sm py-2">
                  <span className="text-gray-700">{tache.titre}</span>
                  <span className="text-gray-600">{tache.montant?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Montants */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between">
            <span className="text-gray-700">Montant HT</span>
            <span className="font-medium">{montantHT.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">TVA ({(facture.tauxTVA * 100).toFixed(0)}%)</span>
            <span className="font-medium">{tva.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
          </div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold">
            <span className="text-gray-900">Montant TTC</span>
            <span className="text-blue-600">{montantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
          </div>
        </div>

        {/* Notes */}
        {facture.notes && (
          <div className="mb-8 p-4 bg-gray-50 rounded">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Notes</h4>
            <p className="text-gray-700 text-sm">{facture.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Télécharger PDF
          </button>
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
            Éditer
          </button>
        </div>
      </div>
    </UiLayout>
  )
}
