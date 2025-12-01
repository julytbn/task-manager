'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X } from 'lucide-react'
import NouveauClientModal from './NouveauClientModal'

type Client = {
  id: number
  nom: string
}

type Service = {
  id: number
  nom: string
}

type ProjectModalProps = {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: () => void
}

export default function ProjectModal({ isOpen, onClose, onProjectCreated }: ProjectModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsRes, servicesRes, teamsRes] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/services'), // Assuming you have a services API endpoint
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
        } catch (err) {
          setError('Impossible de charger les clients, services ou équipes.')
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Nouveau Projet</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={24} className="text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
          
          <div className="mb-4">
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1">Titre du projet *</label>
            <input type="text" id="titre" name="titre" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Développement site e-commerce" />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" name="description" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Description détaillée du projet..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <div className="flex items-center gap-2">
                <select id="clientId" name="clientId" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.nom}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setIsClientModalOpen(true)} className="text-sm text-blue-600 px-3 py-2 border border-transparent hover:underline">Nouveau</button>
              </div>
            </div>
            <div>
              <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
              <select id="serviceId" name="serviceId" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="">Sélectionner un service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="equipeId" className="block text-sm font-medium text-gray-700 mb-1">Équipe (optionnel)</label>
            <select id="equipeId" name="equipeId" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="">Aucune</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">Budget (FCFA) *</label>
              <input type="number" id="budget" name="budget" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="5000000" />
            </div>
            <div>
              <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
              <select id="statut" name="statut" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="PROPOSITION">Proposition</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
              <input type="date" id="dateDebut" name="dateDebut" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
              <input type="date" id="dateFin" name="dateFin" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
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
            // Recharger la liste des clients
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
    </div>
  )
}