'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X } from 'lucide-react'
import NouveauClientModal from './NouveauClientModal'
import NouveauServiceModal from './NouveauServiceModal'

type Client = {
  id: number
  nom: string
}

type Service = {
  id: number
  nom: string
  categorie?: string
}

type ProjectModalProps = {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: () => void
  initialClientId?: string | number
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

export default function ProjectModal({ isOpen, onClose, onProjectCreated, initialClientId }: ProjectModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [teams, setTeams] = useState<any[]>([])
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtrer les services selon la catégorie sélectionnée
  const filteredServices = selectedCategory
    ? services.filter(s => s.categorie === selectedCategory)
    : services

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsRes, servicesRes, teamsRes] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/services'),
            fetch('/api/equipes')
          ])
          if (!clientsRes.ok || !servicesRes.ok || !teamsRes.ok) {
            throw new Error('Failed to fetch data')
          }
          const clientsData = await clientsRes.json()
          const servicesData = await servicesRes.json()
          const teamsData = await teamsRes.json()
          setClients(clientsData)
          setServices(servicesData)
          setTeams(teamsData)
          setSelectedCategory('')
        } catch (err) {
          setError('Impossible de charger les données.')
        }
      }
      fetchData()
    }
  }, [isOpen])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/projets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Une erreur est survenue.')
      }

      onProjectCreated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouveau Projet</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-700 bg-red-100 p-2 rounded">{error}</div>}

          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Titre du projet *</label>
              <input type="text" name="titre" required className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" placeholder="Ex: Développement site e-commerce" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Client *</label>
              <div className="flex items-center gap-2">
                <select name="clientId" required defaultValue={initialClientId ?? ''} className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.nom}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setIsClientModalOpen(true)} className="text-xs text-[var(--color-gold)] px-2 py-2 font-medium hover:underline">+ Nouveau</button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Description</label>
            <textarea name="description" rows={3} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" placeholder="Description détaillée du projet..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Catégorie de service *</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Service *</label>
              <div className="flex items-center gap-2">
                <select name="serviceId" required className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                  <option value="">Sélectionner un service</option>
                  {filteredServices.map(service => (
                    <option key={service.id} value={service.id}>{service.nom}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setIsServiceModalOpen(true)} className="text-xs text-[var(--color-gold)] px-2 py-2 font-medium hover:underline whitespace-nowrap">+ Nouveau</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Équipe</label>
              <select name="equipeId" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                <option value="">Aucune</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name || t.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Statut *</label>
              <select name="statut" required className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                <option value="PROPOSITION">Proposition</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Budget (FCFA)</label>
              <input type="number" name="budget" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" placeholder="5000000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date de début *</label>
              <input type="date" name="dateDebut" required className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date de fin *</label>
              <input type="date" name="dateFin" required className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold">
              {isSubmitting ? 'Création...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>

      <NouveauClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={async (data: any) => {
          try {
            const res = await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Impossible de créer le client')
            const clientsRes = await fetch('/api/clients')
            if (clientsRes.ok) {
              const clientsData = await clientsRes.json()
              setClients(clientsData)
            }
            setIsClientModalOpen(false)
          } catch (err) {
            console.error(err)
            alert('Impossible de créer le client')
          }
        }}
      />

      <NouveauServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        selectedCategory={selectedCategory}
        onSave={async (data: any) => {
          try {
            const res = await fetch('/api/services', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (!res.ok) {
              const errorData = await res.json()
              throw new Error(errorData.error || 'Impossible de créer le service')
            }
            // Recharger la liste des services
            const servicesRes = await fetch('/api/services')
            if (servicesRes.ok) {
              const servicesData = await servicesRes.json()
              setServices(servicesData)
            }
            setIsServiceModalOpen(false)
          } catch (err: any) {
            console.error(err)
            throw err
          }
        }}
      />
    </div>
  )
}