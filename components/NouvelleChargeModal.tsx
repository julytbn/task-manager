'use client'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { X } from 'lucide-react'

interface NouvelleChargeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function NouvelleChargeModal({ isOpen, onClose, onSubmit }: NouvelleChargeModalProps) {
  const [formData, setFormData] = useState({
    libelle: '',
    montant: '',
    categorie: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    { value: 'SALAIRES_CHARGES_SOCIALES', label: 'Salaires & Charges Sociales' },
    { value: 'LOYER_IMMOBILIER', label: 'Loyer & Immobilier' },
    { value: 'UTILITIES', label: 'Électricité & Gaz' },
    { value: 'MATERIEL_EQUIPEMENT', label: 'Matériel & Équipement' },
    { value: 'TRANSPORT_DEPLACEMENT', label: 'Transport & Déplacement' },
    { value: 'FOURNITURES_BUREAUTIQUE', label: 'Fournitures Bureautiques' },
    { value: 'MARKETING_COMMUNICATION', label: 'Marketing & Communication' },
    { value: 'ASSURANCES', label: 'Assurances' },
    { value: 'TAXES_IMPOTS', label: 'Taxes & Impôts' },
    { value: 'AUTRES_CHARGES', label: 'Autres Charges' }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.libelle || !formData.montant || !formData.categorie) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: parseFloat(formData.montant),
          categorie: formData.categorie,
          description: formData.libelle,
          date: formData.date,
          notes: formData.description
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création')
      }
      const data = await response.json()
      // L'API retourne { success, data, message }
      const chargeData = data.data || data
      onSubmit(chargeData)
      setFormData({ libelle: '', montant: '', categorie: '', date: new Date().toISOString().split('T')[0], description: '' })
      onClose()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la charge')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-gold)]">
          <h2 className="text-2xl font-bold text-[var(--color-black-deep)]">Nouvelle Charge</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-black-deep)] mb-2">Libellé</label>
            <input
              type="text"
              name="libelle"
              value={formData.libelle}
              onChange={handleChange}
              required
              placeholder="Description de la charge..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-black-deep)] mb-2">Montant (€)</label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-black-deep)] mb-2">Catégorie</label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-black-deep)] mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-black-deep)] mb-2">Description (optionnel)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Notes supplémentaires..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 justify-end">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
