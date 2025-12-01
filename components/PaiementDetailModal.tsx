"use client"
import { useState } from 'react'
import { X, Download, Check, Edit2, Plus } from 'lucide-react'

interface PaiementDetailProps {
  paiement: {
    id: string
    client: string
    service: string
    projet: string
    echeance: string
    montantTotal: number
    montantPayé: number
    soldeRestant: number
    methodePaiement: string
    statut: 'payé' | 'partiel' | 'impayé'
    preuvePaiement?: string
  }
  isOpen: boolean
  onClose: () => void
}

export default function PaiementDetailModal({ paiement, isOpen, onClose }: PaiementDetailProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  if (!isOpen) return null

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'payé':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">🟢 Payé</span>
      case 'partiel':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">🟡 Partiel</span>
      case 'impayé':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">🔴 Impayé</span>
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Détail du Paiement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Nom du Client</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{paiement.client}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Statut</label>
              <div className="mt-1">{getStatutBadge(paiement.statut)}</div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Service Concerné</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{paiement.service}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Projet Lié</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{paiement.projet}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Échéance du Paiement</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{paiement.echeance}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Méthode de Paiement</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{paiement.methodePaiement}</p>
            </div>
          </div>

          {/* Montants */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-600">Montant Total</label>
                <p className="text-2xl font-bold text-gray-900 mt-2">{paiement.montantTotal.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-green-600">Montant Payé</label>
                <p className="text-2xl font-bold text-green-600 mt-2">{paiement.montantPayé.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-red-600">Solde Restant</label>
                <p className="text-2xl font-bold text-red-600 mt-2">{paiement.soldeRestant.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
          </div>

          {/* Preuve de paiement */}
          {paiement.preuvePaiement && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <label className="text-sm font-semibold text-gray-600">Preuve du Paiement</label>
              <div className="mt-3 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-700">{paiement.preuvePaiement}</span>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <Download size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Progression */}
          <div>
            <label className="text-sm font-semibold text-gray-600">Progression du Paiement</label>
            <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all"
                style={{ width: `${(paiement.montantPayé / paiement.montantTotal) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {Math.round((paiement.montantPayé / paiement.montantTotal) * 100)}% complété
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0">
          {paiement.statut !== 'payé' && (
            <button
              onClick={() => setIsMarkingPaid(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              <Check size={18} />
              Marquer comme payé
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            <Edit2 size={18} />
            Modifier le paiement
          </button>
          {paiement.soldeRestant > 0 && (
            <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
              <Plus size={18} />
              Ajouter paiement partiel
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium ml-auto">
            <Download size={18} />
            Télécharger facture
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
