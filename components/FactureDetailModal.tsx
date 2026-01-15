'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, Plus, Eye } from 'lucide-react'
import NouveauPaiementModal from './NouveauPaiementModal'

type FactureDetailModalProps = {
  factureId: string
  isOpen: boolean
  onClose: () => void
  onPaiementSuccess?: () => void
}

export default function FactureDetailModal({
  factureId,
  isOpen,
  onClose,
  onPaiementSuccess
}: FactureDetailModalProps) {
  const [facture, setFacture] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPaiementModal, setShowPaiementModal] = useState(false)

  useEffect(() => {
    if (isOpen && factureId) {
      setLoading(true)
      fetch(`/api/factures/${factureId}`)
        .then(res => {
          if (!res.ok) throw new Error('Facture non trouvée')
          return res.json()
        })
        .then(data => {
          setFacture(data)
          setError(null)
        })
        .catch(err => {
          setError((err as any).message)
          console.error(err)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, factureId])

  const handlePaiementSave = async (paiement: any) => {
    try {
      const res = await fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paiement,
          factureId: factureId
        })
      })

      if (!res.ok) throw new Error('Erreur lors de la création du paiement')

      const nouveauMontantPaye = (facture?.montantPaye || 0) + parseFloat(paiement.montant || 0)
      let newStatut = 'EN_ATTENTE'
      if (nouveauMontantPaye >= facture?.montantTotal) {
        newStatut = 'PAYEE'
      } else if (nouveauMontantPaye > 0) {
        newStatut = 'PARTIELLEMENT_PAYEE'
      }

      const updateRes = await fetch(`/api/factures/${factureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: newStatut,
          datePaiement: newStatut === 'PAYEE' ? new Date().toISOString() : undefined
        })
      })

      if (!updateRes.ok) throw new Error('Erreur mise à jour facture')

      const updatedRes = await fetch(`/api/factures/${factureId}`)
      const updatedFacture = await updatedRes.json()
      setFacture(updatedFacture)
      setShowPaiementModal(false)
      onPaiementSuccess?.()
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur: ' + (err as any).message)
    }
  }

  const handleDownloadFacture = async () => {
    try {
      const response = await fetch(`/api/factures/${factureId}/pdf`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${facture?.numero || 'facture'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      alert('Erreur lors du téléchargement du PDF')
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="p-6 text-center">
            <p className="text-[var(--color-anthracite)]">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold text-[var(--color-anthracite)]">Erreur</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!facture) return null

  const montantHT = facture.montant || 0
  const tva = (montantHT * (facture.tauxTVA || 0)) || 0
  const montantTTC = facture.montantTotal || (montantHT + tva) || 0
  const montantRestant = Math.max(0, montantTTC - (facture.montantPaye || 0))
  const pourcentagePaye = (facture.montantPaye || 0) / montantTTC * 100

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{facture.numero}</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Dates et Statut */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-[var(--color-anthracite)]">
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

          {/* Client */}
          <div className="bg-[var(--color-offwhite)] rounded-lg p-4 border border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase mb-2">Client</h3>
            <p className="font-bold text-[var(--color-anthracite)]">{facture.client?.nom}</p>
            {facture.client?.email && <p className="text-sm text-[var(--color-anthracite)]">📧 {facture.client.email}</p>}
            {facture.client?.telephone && <p className="text-sm text-[var(--color-anthracite)]">📞 {facture.client.telephone}</p>}
          </div>

          {/* Service/Projet */}
          {(facture.service || facture.projet) && (
            <div className="bg-[var(--color-offwhite)] rounded-lg p-4 border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase mb-2">Service/Projet</h3>
              {facture.service && <p className="font-bold text-[var(--color-anthracite)]">{facture.service.nom}</p>}
              {facture.projet && <p className="font-bold text-[var(--color-anthracite)]">{facture.projet.nom}</p>}
            </div>
          )}

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-offwhite)] rounded-lg p-4 border border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-gold)] uppercase mb-1">Montant HT</p>
              <p className="text-2xl font-bold text-[var(--color-anthracite)]">
                {montantHT.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <div className="bg-[var(--color-offwhite)] rounded-lg p-4 border border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-gold)] uppercase mb-1">TVA ({facture.tauxTVA || 0}%)</p>
              <p className="text-2xl font-bold text-[var(--color-anthracite)]">
                {tva.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Montant TTC</p>
              <p className="text-2xl font-bold text-blue-900">
                {montantTTC.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs font-semibold text-green-700 uppercase mb-1">Montant Payé</p>
              <p className="text-2xl font-bold text-green-900">
                {(facture.montantPaye || 0).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          {montantTTC > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-[var(--color-anthracite)]">Progression du paiement</p>
                <p className="text-sm font-bold text-[var(--color-gold)]">{pourcentagePaye.toFixed(1)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[var(--color-gold)] h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(pourcentagePaye, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Montant restant */}
          {montantRestant > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm font-semibold text-amber-700 uppercase mb-1">Montant Restant</p>
              <p className="text-2xl font-bold text-amber-900">
                {montantRestant.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          )}

          {/* Description/Notes */}
          {facture.description && (
            <div className="bg-[var(--color-offwhite)] rounded-lg p-4 border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase mb-2">Description</h3>
              <p className="text-[var(--color-anthracite)] whitespace-pre-wrap">{facture.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end p-6 border-t bg-white">
          <button
            onClick={handleDownloadFacture}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <Download size={16} />
            Télécharger
          </button>
          {montantRestant > 0 && (
            <button
              onClick={() => setShowPaiementModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-medium hover:bg-[var(--color-gold-accent)] transition"
            >
              <Plus size={16} />
              Ajouter un paiement
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-medium hover:bg-[var(--color-gold-accent)] transition"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Modal Paiement */}
      {showPaiementModal && facture && (
        <NouveauPaiementModal
          isOpen={showPaiementModal}
          onClose={() => setShowPaiementModal(false)}
          onSave={handlePaiementSave}
          prefilledFacture={facture}
        />
      )}
    </div>
  )
}
