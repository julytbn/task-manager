'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Projet {
  id: string
  titre: string
}

interface Service {
  id: string
  nom: string
}

interface Employe {
  id: string
  nom: string
  prenom: string
}

interface NouvelleTacheModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initial?: any
  readOnly?: boolean
}
export function NouvelleTacheModal({ isOpen, onClose, onSave, initial }: NouvelleTacheModalProps) {
  const [projets, setProjets] = useState<Projet[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    projetId: '',
    serviceId: '',
    assigneAId: '',
    statut: 'A_FAIRE',
    priorite: 'MOYENNE',
    dateEcheance: '',
    montant: '',
    heuresEstimees: '',
    facturable: true
  })

  // When editing, prefill form with `initial` data
  useEffect(() => {
    if (isOpen && initial) {
      setFormData({
        titre: initial.titre || '',
        description: initial.description || '',
        projetId: initial.projetId || initial.projet?.id || '',
        serviceId: initial.serviceId || initial.service?.id || '',
        assigneAId: initial.assigneAId || initial.assigneA?.id || '',
        statut: initial.statut || 'A_FAIRE',
        priorite: initial.priorite || 'MOYENNE',
        dateEcheance: initial.dateEcheance ? new Date(initial.dateEcheance).toISOString().slice(0,10) : '',
        montant: initial.montant ?? '',
        heuresEstimees: initial.heuresEstimees ?? '',
        facturable: initial.facturable ?? true
      })
    } else if (!isOpen) {
      // reset when closing
      setFormData({
        titre: '',
        description: '',
        projetId: '',
        serviceId: '',
        assigneAId: '',
        statut: 'A_FAIRE',
        priorite: 'MOYENNE',
        dateEcheance: '',
        montant: '',
        heuresEstimees: '',
        facturable: true
      })
    }
  }, [isOpen, initial])

  // Charger les projets et employés
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projetsRes, servicesRes, employesRes] = await Promise.all([
          fetch('/api/projets').then(res => res.json()),
          fetch('/api/services').then(res => res.json()),
          fetch('/api/utilisateurs').then(res => res.json())
        ])
        
        // Normaliser les projets reçus (certaines API renvoient `title` au lieu de `titre`)
        setProjets(
          projetsRes.map((p: any) => ({ id: p.id, titre: p.titre || p.title || p.nom || '' }))
        )
        setServices(servicesRes)
        setEmployes(employesRes.filter((u: any) => u.role === 'EMPLOYE'))
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // If readOnly, do nothing
    if ((initial as any)?.readOnly) return

    // Convertir les chaînes vides en null pour les champs optionnels
      const payload = {
        titre: formData.titre,
        description: formData.description || null,
        projet: formData.projetId,
        service: formData.serviceId || undefined,
        assigneA: formData.assigneAId || undefined,
        statut: formData.statut,
        priorite: formData.priorite,
        dateEcheance: formData.dateEcheance || null,
        montant: formData.montant ? parseFloat(String(formData.montant)) : null,
        heuresEstimees: formData.heuresEstimees ? parseFloat(String(formData.heuresEstimees)) : null,
        facturable: !!formData.facturable
      }

    onSave(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouvelle Tâche</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Titre *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Projet *</label>
              <select
                name="projetId"
                value={formData.projetId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="">Sélectionner un projet</option>
                {projets.map(projet => (
                  <option key={projet.id} value={projet.id}>
                    {projet.titre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Service (optionnel)</label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              >
                <option value="">Aucun</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Assigné à</label>
            <select
              name="assigneAId"
              value={formData.assigneAId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
            >
              <option value="">Non assigné</option>
              {employes.map(employe => (
                <option key={employe.id} value={employe.id}>
                  {employe.prenom} {employe.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Statut *</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="A_FAIRE">À faire</option>
                <option value="EN_COURS">En cours</option>
                <option value="EN_REVISION">En révision</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Priorité *</label>
              <select
                name="priorite"
                value={formData.priorite}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="BASSE">Basse</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date d'échéance</label>
              <input
                type="date"
                name="dateEcheance"
                value={formData.dateEcheance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Temps estimé (heures)</label>
              <input
                type="number"
                name="heuresEstimees"
                value={formData.heuresEstimees}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Montant (FCFA)</label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                step="1"
                min="0"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="facturable"
                  name="facturable"
                  checked={formData.facturable}
                  onChange={handleChange}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="facturable" className="ml-2 block text-sm text-[var(--color-anthracite)]">
                  Facturable
                </label>
              </div>
            </div>
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
              className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}