"use client"
import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface PaiementEditModalProps {
  paiement: {
    id: string
    client: string
    projet: string
    montantTotal: number
    montantPayé: number
    soldeRestant: number
    methodePaiement: string
    statut: 'payé' | 'partiel' | 'impayé'
    date: string
  }
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPaiement: any) => void
}

export default function PaiementEditModal({
  paiement,
  isOpen,
  onClose,
  onSave,
}: PaiementEditModalProps) {
  const [formData, setFormData] = useState(paiement)
  const [error, setError] = useState<string | null>(null)

  // Déterminer quels champs sont modifiables selon le statut
  const canEditAmount = paiement.statut === 'impayé'
  const canEditMethod = paiement.statut !== 'payé'
  const canEditStatus = true // Manager peut toujours changer le statut
  const canDelete = paiement.statut === 'impayé' // Seuls les impayés peuvent être supprimés

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validations
    if (formData.montantTotal <= 0) {
      setError('Le montant doit être supérieur à 0')
      return
    }

    if (formData.montantPayé > formData.montantTotal) {
      setError('Le montant payé ne peut pas dépasser le montant total')
      return
    }

    // Appel du callback
    onSave({
      ...formData,
      soldeRestant: formData.montantTotal - formData.montantPayé,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Modifier le Paiement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Infos non-modifiables */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-semibold text-gray-600">Client</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{formData.client}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Projet</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{formData.projet}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Date</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{formData.date}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Statut Actuel</label>
              <p className="text-lg font-medium mt-1">
                {formData.statut === 'payé' && '🟢 Payé'}
                {formData.statut === 'partiel' && '🟡 Partiel'}
                {formData.statut === 'impayé' && '🔴 Impayé'}
              </p>
            </div>
          </div>

          {/* Champs éditables */}
          <div className="space-y-4">
            {/* Montant Total */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Montant Total {!canEditAmount && '(lecture seule)'}
              </label>
              <input
                type="number"
                disabled={!canEditAmount}
                value={formData.montantTotal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    montantTotal: Number(e.target.value),
                    soldeRestant:
                      Number(e.target.value) - formData.montantPayé,
                  })
                }
                className={`w-full mt-2 px-4 py-2 border rounded-lg focus:outline-none ${
                  canEditAmount
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                }`}
              />
              {!canEditAmount && (
                <p className="text-xs text-gray-500 mt-1">
                  Non modifiable pour les paiements confirmés
                </p>
              )}
            </div>

            {/* Montant Payé */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Montant Payé</label>
              <input
                type="number"
                value={formData.montantPayé}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    montantPayé: Number(e.target.value),
                    soldeRestant:
                      formData.montantTotal - Number(e.target.value),
                  })
                }
                className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Solde Restant (lecture seule) */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Solde Restant (automatique)
              </label>
              <input
                type="number"
                disabled
                value={formData.soldeRestant}
                className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Méthode de Paiement */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Méthode de Paiement {!canEditMethod && '(lecture seule)'}
              </label>
              <select
                disabled={!canEditMethod}
                value={formData.methodePaiement}
                onChange={(e) =>
                  setFormData({ ...formData, methodePaiement: e.target.value })
                }
                className={`w-full mt-2 px-4 py-2 border rounded-lg focus:outline-none ${
                  canEditMethod
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                }`}
              >
                <option>Transfert bancaire</option>
                <option>Mobile money</option>
                <option>Chèque</option>
                <option>Espèces</option>
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Changer le Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statut: e.target.value as any,
                  })
                }
                className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="impayé">🔴 Impayé</option>
                <option value="partiel">🟡 Partiel</option>
                <option value="payé">🟢 Payé</option>
              </select>
            </div>
          </div>

          {/* Avertissement */}
          {paiement.statut === 'payé' && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Paiement Confirmé</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Ce paiement est confirmé. Les modifications seront journalisées.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Enregistrer les modifications
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
