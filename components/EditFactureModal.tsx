"use client"
import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
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

interface EditFactureModalProps {
  isOpen: boolean
  facture?: FactureData | null
  onClose: () => void
  onSave: (facture: any) => void
}

export default function EditFactureModal({
  isOpen,
  facture,
  onClose,
  onSave,
}: EditFactureModalProps) {
  const [formData, setFormData] = useState<any>({
    id: '',
    numero: '',
    client: '',
    projet: '',
    montant: '',
    tauxTVA: 18,
    description: '',
    conditionsPaiement: '',
    reference: '',
    montantEnLettres: '',
    signatureUrl: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    statut: 'EN_ATTENTE',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && facture) {
      setFormData({
        id: facture.id,
        numero: facture.numero,
        client: facture.client?.nom || '',
        projet: facture.projet?.titre || '',
        montant: facture.montant || facture.montantTotal || '',
        tauxTVA: facture.tauxTVA || 18,
        description: (facture as any).description || '',
        conditionsPaiement: (facture as any).conditionsPaiement || '',
        reference: (facture as any).reference || '',
        montantEnLettres: (facture as any).montantEnLettres || '',
        signatureUrl: (facture as any).signatureUrl || '',
        dateEmission: facture.dateEmission ? facture.dateEmission.split('T')[0] : new Date().toISOString().split('T')[0],
        dateEcheance: facture.dateEcheance || '',
        statut: facture.statut || 'EN_ATTENTE',
        notes: facture.notes || '',
      })
    }
  }, [isOpen, facture])

  const handleGenerateNumber = () => {
    const newNumber = generateFactureNumber()
    setFormData((prev: any) => ({ ...prev, numero: newNumber }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === 'montant' || name === 'tauxTVA' ? parseFloat(value) || '' : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.numero || !formData.client || !formData.montant) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      // Construction des données à envoyer à l'API
      const tauxTVA = formData.tauxTVA || 18
      const montant = parseFloat(String(formData.montant))
      const payload = {
        numero: formData.numero,
        montant,
        tauxTVA,
        description: formData.description || null,
        conditionsPaiement: formData.conditionsPaiement || null,
        reference: formData.reference || null,
        montantEnLettres: formData.montantEnLettres || null,
        signatureUrl: formData.signatureUrl || null,
        dateEmission: formData.dateEmission,
        dateEcheance: formData.dateEcheance || null,
        statut: formData.statut,
        notes: formData.notes || '',
      }

      const res = await fetch(`/api/factures/${formData.id || facture?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        setError(errData.error || 'Erreur lors de la mise à jour de la facture')
        return
      }

      const updatedFacture = await res.json()
      onSave(updatedFacture)
      onClose()
    } catch (err) {
      setError('Erreur lors de la mise à jour de la facture')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Modifier la facture</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informations principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de facture *</label>
                <div className="flex gap-2">
                  <input type="text" name="numero" value={formData.numero} onChange={handleChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  <button type="button" onClick={handleGenerateNumber} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-gray-700" title="Générer un nouveau numéro">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'émission *</label>
                <input type="date" name="dateEmission" value={formData.dateEmission} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
              <input type="date" name="dateEcheance" value={formData.dateEcheance} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Client et Projet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <input type="text" name="client" value={formData.client} onChange={handleChange} placeholder="Ex: Entreprise ABC" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                <input type="text" name="projet" value={formData.projet} onChange={handleChange} placeholder="Ex: App Mobile" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Montants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant HT *</label>
                <input type="number" name="montant" value={formData.montant} onChange={handleChange} placeholder="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA (%)</label>
                <input type="number" name="tauxTVA" value={formData.tauxTVA} onChange={handleChange} placeholder="18" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {formData.montant && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700"><strong>Montant TTC:</strong> {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(parseFloat(String(formData.montant)) * (1 + (formData.tauxTVA || 18) / 100))}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Statut et Notes</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select name="statut" value={formData.statut} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EN_ATTENTE">En attente</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Remarques ou conditions de paiement..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium">{loading ? 'Mise à jour...' : 'Enregistrer les modifications'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
