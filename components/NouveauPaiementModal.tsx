"use client"
import { useState, useEffect } from 'react'
import { X, AlertCircle, Check } from 'lucide-react'
import { generateTransactionReference, formatMontant } from '@/lib/paiementUtils'

interface PaiementFacture {
  id: string
  montant: number
  datePaiement: string
  statut: string
}

interface Facture {
  id: string
  numero: string
  montantTotal: number
  montantRestant?: number
  client: { id: string; nom: string }
  statut: string
  paiements?: PaiementFacture[]
}

interface NouveauPaiementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (paiement: any) => void
  prefilledFacture?: Facture
  clientName?: string
  projets?: any[]
}

export default function NouveauPaiementModal({
  isOpen,
  onClose,
  onSave,
  prefilledFacture,
  clientName,
  projets,
}: NouveauPaiementModalProps) {
  const [formData, setFormData] = useState({
    factureId: '',
    montant: '',
    moyenPaiement: 'VIREMENT_BANCAIRE',
    datePaiement: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  })
  
  // État pour stocker le montant restant de la facture
  const [montantRestant, setMontantRestant] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [factures, setFactures] = useState<Facture[]>([])
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null)
  const [isLoadingFactures, setIsLoadingFactures] = useState(false)

  // Charger les factures en attente avec le montant restant
  useEffect(() => {
    if (!isOpen) return

    const loadFactures = async () => {
      setIsLoadingFactures(true)
      setError('')
      try {
        const response = await fetch('/api/factures?status=EN_ATTENTE,PARTIELLEMENT_PAYEE&includePaiements=true')
        if (!response.ok) throw new Error('Erreur chargement factures')
        const data = await response.json()
        
        // Calculer le montant restant pour chaque facture
        const facturesAvecMontantRestant = data.map((facture: any) => {
          const totalPaiements = facture.paiements?.reduce((sum: number, p: any) => sum + (p.montant || 0), 0) || 0
          const montantRestant = (facture.montantTotal || 0) - totalPaiements
          return {
            ...facture,
            montantRestant: Math.max(0, montantRestant) // S'assurer que le montant n'est pas négatif
          }
        })
        
        setFactures(facturesAvecMontantRestant || [])

        // Pré-remplir si facture fournie
        if (prefilledFacture) {
          const factureSelectionnee = facturesAvecMontantRestant.find((f: any) => f.id === prefilledFacture.id) || prefilledFacture
          setFormData((prev) => ({
            ...prev,
            factureId: factureSelectionnee.id,
            montant: String(Math.max(0, factureSelectionnee.montantRestant || factureSelectionnee.montantTotal || 0)),
            reference: generateTransactionReference(),
          }))
          setSelectedFacture(factureSelectionnee)
          setMontantRestant(Math.max(0, factureSelectionnee.montantRestant || factureSelectionnee.montantTotal || 0))
        }
      } catch (err) {
        console.error('Erreur chargement factures:', err)
        setError('Impossible de charger les factures')
      } finally {
        setIsLoadingFactures(false)
      }
    }

    loadFactures()
  }, [isOpen, prefilledFacture])

  const handleFactureChange = async (factureId: string) => {
    const facture = factures.find((f) => f.id === factureId)
    setSelectedFacture(facture || null)
    
    // Récupérer le montant restant
    if (factureId) {
      try {
        const response = await fetch(`/api/factures/${factureId}/montant-restant`)
        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({
            ...prev,
            factureId,
            montant: data.montantRestant > 0 ? String(data.montantRestant) : ''
          }))
          return
        }
      } catch (error) {
        console.error('Erreur récupération montant restant:', error)
      }
    }
    
    // Si pas de facture ou erreur
    setFormData(prev => ({
      ...prev,
      factureId,
      montant: ''
    }))
    setSelectedFacture(facture || null)
    setMontantRestant(0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleGenerateReference = () => {
    setFormData((prev) => ({
      ...prev,
      reference: generateTransactionReference(),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation: factureId OBLIGATOIRE
    if (!formData.factureId) {
      setError('Veuillez sélectionner une facture')
      return
    }

    if (!formData.montant) {
      setError('Veuillez entrer un montant')
      return
    }

    const montant = parseFloat(String(formData.montant))
    
    // Récupérer le montant restant actuel
    try {
      const response = await fetch(`/api/factures/${formData.factureId}/montant-restant`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la vérification du montant restant')
      }
      
      const { montantRestant } = await response.json()
      
      if (isNaN(montant) || montant <= 0) {
        setError('Le montant doit être un nombre supérieur à 0 FCFA')
        return
      }

      if (montant > montantRestant) {
        setError(`Le montant ne peut pas dépasser ${formatMontant(montantRestant)} (montant restant de la facture)`)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification du montant')
      return
    }

    setLoading(true)

    try {
      // Récupérer les détails de la facture pour obtenir le clientId
      const factureResponse = await fetch(`/api/factures/${formData.factureId}`)
      if (!factureResponse.ok) {
        throw new Error('Impossible de récupérer les détails de la facture')
      }
      const factureData = await factureResponse.json()
      
      if (!factureData.clientId) {
        throw new Error('Aucun client associé à cette facture')
      }

      const response = await fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factureId: formData.factureId,
          clientId: factureData.clientId, // Ajout du clientId obligatoire
          montant: montant,
          moyenPaiement: formData.moyenPaiement,
          datePaiement: formData.datePaiement,
          reference: formData.reference,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      const result = await response.json()

      // Reset et callback
      onSave({
        id: result.paiement?.id,
        factureId: formData.factureId,
        montant: montant,
        moyenPaiement: formData.moyenPaiement,
        statut: result.paiement?.statut || 'EN_ATTENTE',
      })

      // Reset form
      setFormData({
        factureId: '',
        montant: '',
        moyenPaiement: 'VIREMENT_BANCAIRE',
        datePaiement: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
      })
      setSelectedFacture(null)

      onClose()
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la création du paiement')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-y-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh', maxWidth: 'calc(100vw - 24px)' }}>
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouveau Paiement</h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>

          {/* ✅ SEUL CHAMP CRITIQUE: Facture */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-2">Facture à payer *</label>
            {isLoadingFactures ? (
              <div className="text-sm text-gray-500">Chargement des factures...</div>
            ) : factures.length === 0 ? (
              <div className="text-sm text-red-600">❌ Aucune facture en attente</div>
            ) : (
              <select
                name="factureId"
                value={formData.factureId}
                onChange={(e) => handleFactureChange(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="">-- Sélectionner une facture --</option>
                {factures.map((f) => (
                  <option key={f.id} value={f.id}>
                    FAC-{f.numero} | {f.client.nom} | {f.montantTotal}€ | {f.statut}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Affichage informatif de la facture sélectionnée */}
          {selectedFacture && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Check size={18} className="text-blue-600" />
                <p className="font-semibold text-blue-900">Facture sélectionnée</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <p><strong>Numéro:</strong> FAC-{selectedFacture.numero}</p>
                <p><strong>Client:</strong> {selectedFacture.client.nom}</p>
                <p><strong>Montant TTC:</strong> {selectedFacture.montantTotal}€</p>
                <p><strong>Statut:</strong> {selectedFacture.statut}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Montant du paiement */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Montant du paiement *</label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                max={selectedFacture?.montantTotal || undefined}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              />
              {selectedFacture && (
                <p className="text-xs text-gray-500 mt-1">Max: {selectedFacture.montantTotal}€</p>
              )}
            </div>

            {/* Moyen de paiement */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Moyen de paiement *</label>
              <select
                name="moyenPaiement"
                value={formData.moyenPaiement}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="VIREMENT_BANCAIRE">Virement bancaire</option>
                <option value="CHEQUE">Chèque</option>
                <option value="ESPECES">Espèces</option>
                <option value="CARTE_CREDIT">Carte crédit</option>
                <option value="MOBILE_MONEY">Mobile money</option>
              </select>
            </div>
          </div>

          {/* Date du paiement */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date du paiement *</label>
            <input
              type="date"
              name="datePaiement"
              value={formData.datePaiement}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              required
            />
          </div>

          {/* Référence de transaction */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Référence de transaction</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Numéro de transaction"
                className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
              <button
                type="button"
                onClick={handleGenerateReference}
                className="px-3 py-2 border border-[var(--color-border)] rounded bg-white hover:bg-gray-50 transition text-[var(--color-anthracite)]"
                title="Générer une référence"
              >
                ↻
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Format: PAI-YYYYMMDD-SEQUENCE-RANDOM
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Notes (optionnel)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Remarques supplémentaires..."
              rows={2}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)] hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFacture}
              className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
