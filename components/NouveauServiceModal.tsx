'use client'

import { useState, FormEvent } from 'react'
import { X } from 'lucide-react'

type NouveauServiceModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  selectedCategory?: string
}

// Les catégories de l'enum
const CATEGORIES = [
  { value: 'COMPTABILITE', label: 'Comptabilité' },
  { value: 'AUDIT_FISCALITE', label: 'Audit & Fiscalité' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'REDACTION_GESTION_PROJET', label: 'Rédaction & Gestion de Projet' },
  { value: 'DEMARRAGE_ADMINISTRATIF', label: 'Démarrage Administratif' },
  { value: 'FORMATION', label: 'Formation' },
  { value: 'COACHING', label: 'Coaching' },
  { value: 'ETUDE_MARCHE', label: 'Étude de Marché' },
  { value: 'CONCEPTION_IMPRESSION', label: 'Conception & Impression' },
  { value: 'IMMOBILIER', label: 'Immobilier' }
]

export default function NouveauServiceModal({ isOpen, onClose, onSave, selectedCategory }: NouveauServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const data = {
      nom: formData.get('nom') as string,
      description: formData.get('description') as string,
      categorie: formData.get('categorie') as string,
      prix: formData.get('prix') ? parseFloat(formData.get('prix') as string) : undefined,
      dureeEstimee: formData.get('dureeEstimee') ? parseInt(formData.get('dureeEstimee') as string) : undefined,
    }

    try {
      await onSave(data)
      ;(event.currentTarget as HTMLFormElement).reset()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[var(--color-offwhite)] rounded-lg shadow-lg border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouveau Service</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
          {error && <div className="text-red-700 bg-red-100 p-2 rounded text-sm">{error}</div>}

          <div className="text-sm text-[var(--color-anthracite)] mb-2">Les champs avec * sont obligatoires</div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Nom du service *</label>
            <input 
              type="text" 
              name="nom" 
              required 
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" 
              placeholder="Ex: Audit comptable annuel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Description</label>
            <textarea 
              name="description" 
              rows={2} 
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" 
              placeholder="Description du service..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Catégorie *</label>
            <select 
              name="categorie" 
              required 
              defaultValue={selectedCategory || ''}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Prix (FCFA) (optionnel)</label>
            <input 
              type="number" 
              name="prix" 
              step="0.01"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" 
              placeholder="5000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Durée estimée (jours) (optionnel)</label>
            <input 
              type="number" 
              name="dureeEstimee" 
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" 
              placeholder="5"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold"
            >
              {isSubmitting ? 'Création...' : 'Créer le service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
