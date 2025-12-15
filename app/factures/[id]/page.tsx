"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import UiLayout from '../../../components/UiLayout'
import { useParams } from 'next/navigation'
import NouveauPaiementModal from '../../../components/NouveauPaiementModal'

export default function FactureDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [facture, setFacture] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaiementModal, setShowPaiementModal] = useState(false)

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

  const handlePaiementSave = async (paiement: any) => {
    try {
      // Créer le paiement
      const res = await fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paiement,
          factureId: id
        })
      })

      if (!res.ok) throw new Error('Erreur lors de la création du paiement')

      // Mettre à jour le statut de la facture
      const nouveauMontantPaye = (facture?.montantPaye || 0) + parseFloat(paiement.montantPayé || 0)
      let newStatut = 'EN_ATTENTE'
      if (nouveauMontantPaye >= facture?.montantTotal) {
        newStatut = 'PAYEE'
      } else if (nouveauMontantPaye > 0) {
        newStatut = 'PARTIELLEMENT_PAYEE'
      }

      const updateRes = await fetch(`/api/factures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: newStatut,
          datePaiement: newStatut === 'PAYEE' ? new Date().toISOString() : undefined
        })
      })

      if (!updateRes.ok) throw new Error('Erreur mise à jour facture')

      // Recharger la facture
      const updatedRes = await fetch(`/api/factures/${id}`)
      const updatedFacture = await updatedRes.json()
      setFacture(updatedFacture)
      setShowPaiementModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const montantRestant = facture ? Math.max(0, facture.montantTotal - (facture.montantPaye || 0)) : 0
  const pourcentagePaye = facture ? ((facture.montantPaye || 0) / facture.montantTotal * 100) : 0

  if (loading) return <UiLayout><div className="text-center py-8 text-[var(--color-anthracite)]">Chargement...</div></UiLayout>
  if (error) return <UiLayout><div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div></UiLayout>
  if (!facture) return <UiLayout><div className="text-center py-8 text-[var(--color-anthracite)]">Facture non trouvée</div></UiLayout>

  const montantHT = facture.montant || 0
  const tva = (montantHT * (facture.tauxTVA || 0)) || 0
  const montantTTC = facture.montantTotal || (montantHT + tva) || 0

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'PAYEE':
        return 'bg-green-100 text-green-800'
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'PARTIELLEMENT_PAYEE':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'PAYEE':
        return '✓ Payée'
      case 'EN_ATTENTE':
        return '⏳ En attente'
      case 'PARTIELLEMENT_PAYEE':
        return '◐ Partiellement payée'
      default:
        return statut
    }
  }

  return (
    <UiLayout>
      <div className="mb-6">
        <Link href="/factures" className="text-[var(--color-gold)] hover:underline font-medium">
          ← Retour aux factures
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold gold-gradient-text">{facture.numero}</h1>
            <p className="text-[var(--color-anthracite)] mt-2">
              Émise le {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
              {facture.dateEcheance && (
                <> • Échéance le {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</>
              )}
            </p>
          </div>
          <span className={`inline-flex px-4 py-2 rounded-lg font-semibold text-sm ${getStatutColor(facture.statut)}`}>
            {getStatutLabel(facture.statut)}
          </span>
        </div>

        {/* Cartes d'information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase mb-3">Client</h3>
            <p className="text-lg font-bold text-[var(--color-anthracite)]">{facture.client?.nom}</p>
            {facture.client?.email && <p className="text-sm text-[var(--color-anthracite)] mt-1">📧 {facture.client.email}</p>}
            {facture.client?.telephone && <p className="text-sm text-[var(--color-anthracite)]">📞 {facture.client.telephone}</p>}
          </div>

          {facture.service && (
            <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase mb-3">Service</h3>
              <p className="text-lg font-bold text-[var(--color-anthracite)]">{facture.service.nom}</p>
            </div>
          )}

          {facture.projet && (
            <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase mb-3">Projet</h3>
              <p className="text-lg font-bold text-[var(--color-anthracite)]">{facture.projet.titre}</p>
            </div>
          )}
        </div>

        {/* Montants */}
        <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-8">
          <h2 className="text-xl font-bold text-[var(--color-anthracite)] mb-6">Détails financiers</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-anthracite)]">Montant HT</span>
              <span className="font-semibold text-[var(--color-anthracite)]">{montantHT.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-anthracite)]">TVA ({(facture.tauxTVA * 100).toFixed(0)}%)</span>
              <span className="font-semibold text-[var(--color-anthracite)]">{tva.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
            </div>
            <div className="flex justify-between items-center pt-4 text-lg">
              <span className="font-bold text-[var(--color-anthracite)]">Montant TTC</span>
              <span className="font-bold text-[var(--color-gold)] text-xl">{montantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
            </div>
          </div>
        </div>

        {/* Progression du paiement */}
        <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-8">
          <h2 className="text-xl font-bold text-[var(--color-anthracite)] mb-6">État du paiement</h2>
          <div className="space-y-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-anthracite)]">Progression</span>
              <span className="text-sm font-bold text-[var(--color-gold)]">{Math.round(pourcentagePaye)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] h-full transition-all rounded-full"
                style={{ width: `${pourcentagePaye}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-white rounded-lg border border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-anthracite)] uppercase font-semibold mb-1">Montant Total</p>
                <p className="text-lg font-bold text-[var(--color-anthracite)]">{montantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-xs text-green-600 uppercase font-semibold mb-1">Montant Payé</p>
                <p className="text-lg font-bold text-green-600">{(facture?.montantPaye || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-red-200">
                <p className="text-xs text-red-600 uppercase font-semibold mb-1">Restant</p>
                <p className="text-lg font-bold text-red-600">{montantRestant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tâches */}
        {facture.taches && facture.taches.length > 0 && (
          <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-8">
            <h2 className="text-xl font-bold text-[var(--color-anthracite)] mb-6">Tâches facturées</h2>
            <div className="space-y-3">
              {facture.taches.map((tache: any) => (
                <div key={tache.id} className="flex justify-between items-center p-4 bg-white rounded-lg border border-[var(--color-border)]">
                  <span className="text-[var(--color-anthracite)] font-medium">{tache.titre}</span>
                  <span className="text-[var(--color-gold)] font-bold">{tache.montant?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {facture.notes && (
          <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-8">
            <h2 className="text-xl font-bold text-[var(--color-anthracite)] mb-4">📋 Notes</h2>
            <p className="text-[var(--color-anthracite)]">{facture.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button className="px-6 py-3 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg hover:bg-[var(--color-gold-accent)] transition font-medium">
            📥 Télécharger PDF
          </button>
          {facture?.statut !== 'PAYEE' && (
            <button
              onClick={() => setShowPaiementModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
            >
              ✓ Enregistrer un paiement
            </button>
          )}
          <button className="px-6 py-3 border-2 border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg hover:bg-[var(--color-gold)]/10 transition font-medium">
            ✏️ Éditer
          </button>
        </div>

        {/* Modal de paiement */}
        <NouveauPaiementModal
          isOpen={showPaiementModal}
          onClose={() => setShowPaiementModal(false)}
          onSave={handlePaiementSave}
          prefilledFacture={facture}
        />
      </div>
    </UiLayout>
  )
}
