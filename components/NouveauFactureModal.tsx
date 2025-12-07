"use client"
import { useState, useEffect } from 'react'
import { X, Download, Eye, Plus, RefreshCw } from 'lucide-react'
import { downloadFacturePDF, previewFacturePDF } from '@/lib/factureGenerator'
import { generateFactureNumber } from '@/lib/paiementUtils'

// Fonction pour calculer la date d'échéance basée sur la fréquence de paiement
function calculateDueDate(frequencePaiement: string): string {
  const today = new Date()
  const dueDate = new Date(today)

  switch (frequencePaiement) {
    case 'PONCTUEL':
      // 30 jours pour les paiements ponctuels
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case 'MENSUEL':
      // 15 jours pour les paiements mensuels
      dueDate.setDate(dueDate.getDate() + 15)
      break
    case 'TRIMESTRIEL':
      // 30 jours pour les paiements trimestriels
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case 'SEMESTRIEL':
      // 45 jours pour les paiements semestriels
      dueDate.setDate(dueDate.getDate() + 45)
      break
    case 'ANNUEL':
      // 60 jours pour les paiements annuels
      dueDate.setDate(dueDate.getDate() + 60)
      break
    default:
      // Par défaut 30 jours
      dueDate.setDate(dueDate.getDate() + 30)
  }

  return dueDate.toISOString().split('T')[0]
}

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
  clientId?: string
  clientName?: string
  clientProjets?: any[]
}

export default function NouveauFactureModal({
  isOpen,
  onClose,
  onSave,
  clientId,
  clientName,
  clientProjets,
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
        client: clientName || prev.client,
      }))
    }
  }, [isOpen, clientName])

  const handleGenerateNumber = () => {
    const newNumber = generateFactureNumber()
    setFormData((prev) => ({
      ...prev,
      numero: newNumber,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Si le projet change, calculer automatiquement la date d'échéance
    if (name === 'projet' && value) {
      const selectedProjet = clientProjets?.find((p) => p.id === value)
      const newDueDate = calculateDueDate(selectedProjet?.frequencePaiement || 'PONCTUEL')
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        dateEcheance: newDueDate,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'montant' || name === 'tauxTVA' ? parseFloat(value) || '' : value,
      }))
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouvelle Facture</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]" disabled={loading}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-700 bg-red-100 p-2 rounded">{error}</div>}

          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Numéro de facture *</label>
              <div className="flex gap-2">
                <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Généré automatiquement" className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded bg-white" readOnly required />
                <button type="button" onClick={handleGenerateNumber} className="px-3 py-2 border border-[var(--color-border)] rounded bg-white hover:bg-gray-50 transition flex items-center gap-2 text-[var(--color-anthracite)]" title="Générer un nouveau numéro">↻</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Format: FAC-YYYYMMDD-SEQUENCE (Ex: FAC-20251201-001)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date d'émission *</label>
              <input type="date" name="dateEmission" value={formData.dateEmission} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date d'échéance</label>
            <input type="date" name="dateEcheance" value={formData.dateEcheance} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Client *</label>
              <input type="text" name="client" value={formData.client} onChange={handleChange} placeholder="Ex: Entreprise ABC" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" readOnly={!!clientName} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Projet</label>
              {clientProjets && clientProjets.length > 0 ? (
                <select name="projet" value={formData.projet} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                  <option value="">Sélectionner un projet</option>
                  {clientProjets.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom || p.titre || 'Projet sans titre'}</option>
                  ))}
                </select>
              ) : (
                <input type="text" name="projet" value={formData.projet} onChange={handleChange} placeholder="Ex: App Mobile" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Montant HT *</label>
              <input type="number" name="montant" value={formData.montant} onChange={handleChange} placeholder="0" step="1000" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Taux TVA (%)</label>
              <input type="number" name="tauxTVA" value={formData.tauxTVA} onChange={handleChange} placeholder="18" step="0.01" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>
          {formData.montant && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700"><strong>Montant TTC:</strong> {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(parseFloat(String(formData.montant)) * (1 + (formData.tauxTVA || 18) / 100))}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Statut</label>
              <select name="statut" value={formData.statut} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                <option value="EN_ATTENTE">En attente</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Remarques ou conditions de paiement..." rows={3} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold">{loading ? 'Création en cours...' : 'Créer la facture'}</button>
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
