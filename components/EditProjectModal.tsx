"use client"

import { useState, useEffect, FormEvent } from 'react'
import { X } from 'lucide-react'

type Client = { id: number; nom: string }
type Service = { id: number; nom: string }
type Project = {
  id: number
  titre: string
  description?: string
  clientId?: number
  serviceId?: number
  statut: string
  progress?: number
  budget: number
  dateDebut: string
  dateFin: string
  equipeId?: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Project>) => Promise<void> | void
  project?: Project | null
}

export default function EditProjectModal({ isOpen, onClose, onSave, project }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Project>>({
    titre: '',
    description: '',
    clientId: undefined,
    serviceId: undefined,
    statut: 'PROPOSITION',
    progress: 0,
    budget: 0,
    dateDebut: '',
    dateFin: '',
    equipeId: undefined,
  })

  useEffect(() => {
    if (project) {
      // utilitaire local pour formater une valeur de date vers 'YYYY-MM-DD' en entrée
      const formatDateForInput = (val?: string | null) => {
        if (!val) return ''
        // si la valeur commence déjà par YYYY-MM-DD, on la retourne
        const m = String(val).match(/^(\d{4}-\d{2}-\d{2})/)
        if (m) return m[1]
        const d = new Date(val)
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
        return ''
      }

      setForm({
        id: project.id,
        titre: project.titre || '',
        description: project.description || '',
        clientId: project.clientId,
        serviceId: project.serviceId,
        statut: project.statut || 'PROPOSITION',
        progress: project.progress || 0,
        budget: project.budget || 0,
        dateDebut: formatDateForInput(project.dateDebut),
        dateFin: formatDateForInput(project.dateFin),
        equipeId: project.equipeId,
      })
    }
  }, [project])

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsRes, servicesRes, teamsRes] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/services'),
            fetch('/api/equipes'),
          ])
          if (!clientsRes.ok || !servicesRes.ok || !teamsRes.ok) throw new Error('Failed to fetch')
          const clientsData = await clientsRes.json()
          const servicesData = await servicesRes.json()
          const teamsData = await teamsRes.json()
          setClients(clientsData)
          setServices(servicesData)
          setTeams(teamsData)
        } catch (err) {
          setError('Impossible de charger les données')
        }
      }
      fetchData()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90 sticky top-0">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Modifier le projet</h3>
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
              <input
                type="text"
                required
                value={form.titre || ''}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Client *</label>
              <select
                required
                value={form.clientId || ''}
                onChange={(e) => setForm({ ...form, clientId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Service *</label>
              <select
                required
                value={form.serviceId || ''}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              >
                <option value="">Sélectionner un service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Statut *</label>
              <select
                required
                value={form.statut || ''}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              >
                <option value="PROPOSITION">Proposition</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Budget (FCFA) *</label>
              <input
                type="number"
                required
                value={form.budget || 0}
                onChange={(e) => setForm({ ...form, budget: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date de début *</label>
              <input
                type="date"
                required
                value={form.dateDebut || ''}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date de fin *</label>
              <input
                type="date"
                required
                value={form.dateFin || ''}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Équipe</label>
              <select
                value={form.equipeId || ''}
                onChange={(e) => setForm({ ...form, equipeId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              >
                <option value="">Aucune</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name || team.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold">
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
