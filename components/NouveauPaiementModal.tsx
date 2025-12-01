"use client"
import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { generateTransactionReference } from '@/lib/paiementUtils'

interface NouveauPaiementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (paiement: any) => void
}

export default function NouveauPaiementModal({
  isOpen,
  onClose,
  onSave,
}: NouveauPaiementModalProps) {
  const [formData, setFormData] = useState({
    client: '',
    projet: '',
    montantTotal: '',
    montantPayé: '',
    methodePaiement: 'Transfert bancaire',
    statut: 'impayé' as const,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Générer la référence à l'ouverture du modal
  useEffect(() => {
    if (isOpen && !formData.reference) {
      const newReference = generateTransactionReference()
      setFormData((prev) => ({
        ...prev,
        reference: newReference,
      }))
    }
  }, [isOpen])

  const handleGenerateReference = () => {
    const newReference = generateTransactionReference()
    setFormData((prev) => ({
      ...prev,
      reference: newReference,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'montantTotal' || name === 'montantPayé' ? parseFloat(value) || '' : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.client || !formData.projet || !formData.montantTotal) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (formData.montantPayé && formData.montantPayé > formData.montantTotal) {
      setError('Le montant payé ne peut pas dépasser le montant total')
      return
    }

    setLoading(true)

    try {
      const montantTotal = parseFloat(String(formData.montantTotal))
      const montantPayé = parseFloat(String(formData.montantPayé)) || 0
      const soldeRestant = montantTotal - montantPayé

      // Déterminer le statut en fonction des montants
      let statut = 'impayé'
      if (montantPayé === montantTotal) {
        statut = 'payé'
      } else if (montantPayé > 0) {
        statut = 'partiel'
      }

      const newPaiement = {
        id: Math.random().toString(36).substr(2, 9),
        client: formData.client,
        projet: formData.projet,
        montantTotal,
        montantPayé,
        soldeRestant,
        methodePaiement: formData.methodePaiement,
        statut: statut as 'payé' | 'partiel' | 'impayé',
        date: formData.date,
      }

      // Optionnel : appel API pour sauvegarder en base de données
      // const response = await fetch('/api/paiements', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     clientId: "...",
      //     projetId: "...",
      //     tacheId: "...",
      //     montant: montantPayé,
      //     moyenPaiement: formData.methodePaiement,
      //     statut: 'EN_ATTENTE',
      //     reference: formData.reference,
      //     notes: formData.notes,
      //     datePaiement: new Date(formData.date),
      //   }),
      // })

      onSave(newPaiement)
      setFormData({
        client: '',
        projet: '',
        montantTotal: '',
        montantPayé: '',
        methodePaiement: 'Transfert bancaire',
        statut: 'impayé',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
      })
    } catch (err) {
      setError('Erreur lors de la création du paiement')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Créer un nouveau paiement</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Section 1: Client & Projet */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  placeholder="Ex: Entreprise ABC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projet *
                </label>
                <input
                  type="text"
                  name="projet"
                  value={formData.projet}
                  onChange={handleChange}
                  placeholder="Ex: App Mobile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Montants */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Montants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant total *
                </label>
                <input
                  type="number"
                  name="montantTotal"
                  value={formData.montantTotal}
                  onChange={handleChange}
                  placeholder="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant payé
                </label>
                <input
                  type="number"
                  name="montantPayé"
                  value={formData.montantPayé}
                  onChange={handleChange}
                  placeholder="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mode de paiement */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Détails du paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Méthode de paiement
                </label>
                <select
                  name="methodePaiement"
                  value={formData.methodePaiement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Transfert bancaire">Transfert bancaire</option>
                  <option value="Mobile money">Mobile money</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Carte bancaire">Carte bancaire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date du paiement
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence / N° de transaction
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Généré automatiquement"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
                <button
                  type="button"
                  onClick={handleGenerateReference}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-gray-700"
                  title="Générer une nouvelle référence"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: PAI-YYYYMMDD-SEQUENCE-RANDOM (Ex: PAI-20251201-0001-A7F2)
              </p>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Remarques ou informations supplémentaires..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Création en cours...' : 'Créer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
