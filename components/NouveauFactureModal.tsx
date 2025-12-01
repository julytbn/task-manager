"use client"
import { useState, useEffect } from 'react'
import { X, Download, Eye, Plus, RefreshCw } from 'lucide-react'
import { downloadFacturePDF, previewFacturePDF } from '@/lib/factureGenerator'
import { generateFactureNumber } from '@/lib/paiementUtils'

interface FactureData {
  id: string
  numero: string
  dateEmission: string
  dateEcheance?: string
  statut: string
  montant: number
  montantTotal: number
  tauxTVA?: number
  client: {
    id: string
    nom: string
    prenom?: string
    email?: string
    telephone?: string
    adresse?: string
  }
  projet?: {
    id: string
    titre: string
    description?: string
  }
  taches?: Array<{
    id: string
    titre: string
    montant?: number
    heuresReelles?: number
  }>
  notes?: string
}

interface NouveauFactureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (facture: any) => void
}

export default function NouveauFactureModal({
  isOpen,
  onClose,
  onSave,
}: NouveauFactureModalProps) {
  const [formData, setFormData] = useState({
    numero: '',
    client: '',
    projet: '',
    montant: '',
    tauxTVA: 18,
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    statut: 'EN_ATTENTE',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Générer le numéro de facture à l'ouverture du modal
  useEffect(() => {
    if (isOpen && !formData.numero) {
      const newNumber = generateFactureNumber()
      setFormData((prev) => ({
        ...prev,
        numero: newNumber,
      }))
    }
  }, [isOpen])

  const handleGenerateNumber = () => {
    const newNumber = generateFactureNumber()
    setFormData((prev) => ({
      ...prev,
      numero: newNumber,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'montant' || name === 'tauxTVA' ? parseFloat(value) || '' : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.numero || !formData.client || !formData.montant) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      const tauxTVA = formData.tauxTVA || 18
      const montantSansTVA = parseFloat(String(formData.montant))
      const montantTVA = montantSansTVA * (tauxTVA / 100)
      const montantTotal = montantSansTVA + montantTVA

      const newFacture = {
        id: Math.random().toString(36).substr(2, 9),
        numero: formData.numero,
        client: { id: '1', nom: formData.client },
        projet: formData.projet ? { id: '1', titre: formData.projet } : undefined,
        montant: montantSansTVA,
        montantTotal,
        tauxTVA,
        dateEmission: formData.dateEmission,
        dateEcheance: formData.dateEcheance || undefined,
        statut: formData.statut,
        notes: formData.notes || undefined,
      }

      onSave(newFacture)
      
      // Réinitialiser le formulaire
      setFormData({
        numero: '',
        client: '',
        projet: '',
        montant: '',
        tauxTVA: 18,
        dateEmission: new Date().toISOString().split('T')[0],
        dateEcheance: '',
        statut: 'EN_ATTENTE',
        notes: '',
      })
    } catch (err) {
      setError('Erreur lors de la création de la facture')
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
          <h2 className="text-xl font-semibold text-gray-900">Créer une nouvelle facture</h2>
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

          {/* Section 1: Numéro et Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informations principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de facture *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    placeholder="Généré automatiquement"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateNumber}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-gray-700"
                    title="Générer un nouveau numéro"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: FAC-YYYYMMDD-SEQUENCE (Ex: FAC-20251201-001)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'émission *
                </label>
                <input
                  type="date"
                  name="dateEmission"
                  value={formData.dateEmission}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance
              </label>
              <input
                type="date"
                name="dateEcheance"
                value={formData.dateEcheance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Client et Projet */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Client et Projet</h3>
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
                  Projet
                </label>
                <input
                  type="text"
                  name="projet"
                  value={formData.projet}
                  onChange={handleChange}
                  placeholder="Ex: App Mobile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Montants */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Montants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant HT *
                </label>
                <input
                  type="number"
                  name="montant"
                  value={formData.montant}
                  onChange={handleChange}
                  placeholder="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux TVA (%)
                </label>
                <input
                  type="number"
                  name="tauxTVA"
                  value={formData.tauxTVA}
                  onChange={handleChange}
                  placeholder="18"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {formData.montant && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Montant TTC:</strong> {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0,
                  }).format(parseFloat(String(formData.montant)) * (1 + (formData.tauxTVA || 18) / 100))}
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Statut et Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Statut et Notes</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EN_ATTENTE">En attente</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Remarques ou conditions de paiement..."
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
              {loading ? 'Création en cours...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Composant pour afficher les actions de facture (télécharger, aperçu)
 */
export function FactureActions({ facture }: { facture: FactureData }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => previewFacturePDF(facture)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm"
        title="Aperçu"
      >
        <Eye size={16} />
        Aperçu
      </button>
      <button
        onClick={() => downloadFacturePDF(facture)}
        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition text-sm"
        title="Télécharger"
      >
        <Download size={16} />
        Télécharger
      </button>
    </div>
  )
}
