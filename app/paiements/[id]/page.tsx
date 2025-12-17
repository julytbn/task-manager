"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import MainLayout from '@/components/layouts/MainLayout'
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

  if (loading) return <MainLayout><div className="text-center py-8">Chargement...</div></MainLayout>
  if (error) return <MainLayout><div className="bg-red-50 text-red-700 p-4 rounded">{error}</div></MainLayout>
  if (!paiement) return <MainLayout><div className="text-center py-8 text-gray-500">Paiement non trouvé</div></MainLayout>

  // Calculs liés à la facture associée (montant TTC et restant)
  const montantFacture = paiement.facture?.montantTotal ?? paiement.facture?.montant ?? 0
  const totalFacturePayes = (paiement.facture?.paiements || []).reduce((s: number, p: any) => s + (p?.montant || 0), 0)
  const restant = Math.max(montantFacture - totalFacturePayes, 0)

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/paiements" className="text-[var(--color-gold)] hover:underline">
          ← Retour aux paiements
        </Link>
      </div>

      <div className="bg-[var(--color-offwhite)] border border-[var(--color-border)] rounded shadow p-8 max-w-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text">Détail paiement</h1>
            <p className="text-sm text-[var(--color-anthracite)] mt-1">ID: {paiement.id}</p>
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

        <div className="space-y-4 mb-8 pb-8 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-anthracite)] uppercase mb-1">Tâche</h3>
            <p className="text-lg text-[var(--color-black-deep)]">{paiement.tache?.titre || '—'}</p>
          </div>
          {paiement.projet && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-anthracite)] uppercase mb-1">Projet</h3>
              <p className="text-lg text-[var(--color-black-deep)]">{paiement.projet.titre}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8 pb-8 border-b border-[var(--color-border)]">
          <div className="flex justify-between">
            <span className="text-[var(--color-anthracite)]">Montant</span>
            <span className="font-bold text-xl text-[var(--color-gold)]">{paiement.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-anthracite)]">Moyen de paiement</span>
            <span className="font-medium">{paiement.moyenPaiement || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-anthracite)]">Date de paiement</span>
            <span className="font-medium">{paiement.datePaiement ? new Date(paiement.datePaiement).toLocaleDateString('fr-FR') : '—'}</span>
          </div>

          {paiement.facture && (
            <>
              <div className="flex justify-between">
                <span className="text-[var(--color-anthracite)]">Montant facture (TTC)</span>
                <span className="font-medium">{montantFacture.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-anthracite)]">Total payé (facture)</span>
                <span className="font-medium">{totalFacturePayes.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-anthracite)]">Reste à payer</span>
                <span className="font-bold text-xl text-[var(--color-gold)]">{restant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button className="px-6 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] font-semibold rounded hover:brightness-95">
            Éditer
          </button>
          <button className="px-6 py-2 border border-[var(--color-border)] text-[var(--color-anthracite)] rounded hover:bg-[var(--color-offwhite)]">
            Supprimer
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
