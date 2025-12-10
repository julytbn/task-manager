'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

interface Task {
  id: string
  titre: string
  description?: string
  statut?: string
  priorite?: string
  dateEcheance?: string
  assigneA?: {
    prenom?: string
    nom?: string
  }
  montant?: number
}

interface Employe {
  id: string
  nom: string
  prenom: string
}

interface Service {
  id: string
  nom: string
}

interface ProjectTasksModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

function getStatutColor(statut?: string) {
  switch ((statut || '').toLowerCase()) {
    case 'terminée':
    case 'termine':
      return 'bg-green-100 text-green-800'
    case 'en_cours':
    case 'en cours':
      return 'bg-blue-100 text-blue-800'
    case 'en_retard':
    case 'en retard':
      return 'bg-red-100 text-red-800'
    case 'a_faire':
    case 'à faire':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPrioriteColor(priorite?: string) {
  switch ((priorite || '').toLowerCase()) {
    case 'haute':
      return 'bg-red-100 text-red-800'
    case 'moyenne':
      return 'bg-yellow-100 text-yellow-800'
    case 'basse':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(d?: string | Date | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR')
  } catch (e) {
    return '—'
  }
}

export default function ProjectTasksModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ProjectTasksModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [employes, setEmployes] = useState<Employe[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    assigneAId: '',
    serviceId: '',
    statut: 'A_FAIRE',
    priorite: 'MOYENNE',
    dateEcheance: '',
    montant: '',
    heuresEstimees: '',
    facturable: true
  })

  useEffect(() => {
    if (isOpen && projectId) {
      fetchTasks()
      if (showCreateForm) {
        fetchEmployesAndServices()
      }
    }
  }, [isOpen, projectId])

  useEffect(() => {
    if (showCreateForm) {
      fetchEmployesAndServices()
    }
  }, [showCreateForm])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projets/${projectId}/taches`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tâches')
      }
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployesAndServices = async () => {
    try {
      const [employesRes, servicesRes] = await Promise.all([
        fetch('/api/utilisateurs').then(res => res.json()),
        fetch('/api/services').then(res => res.json())
      ])
      setEmployes(employesRes.filter((u: any) => u.role === 'EMPLOYE'))
      setServices(servicesRes)
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.titre.trim()) {
      alert('Le titre de la tâche est requis')
      return
    }

    try {
      const payload = {
        titre: formData.titre,
        description: formData.description || null,
        projetId: projectId,
        assigneAId: formData.assigneAId || null,
        serviceId: formData.serviceId || null,
        statut: formData.statut,
        priorite: formData.priorite,
        dateEcheance: formData.dateEcheance || null,
        montant: formData.montant ? parseFloat(formData.montant) : null,
        heuresEstimees: formData.heuresEstimees ? parseFloat(formData.heuresEstimees) : null,
        facturable: formData.facturable
      }

      const response = await fetch(`/api/projets/${projectId}/taches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur lors de la création de la tâche')
      }

      // Réinitialiser le formulaire et rafraîchir la liste
      setFormData({
        titre: '',
        description: '',
        assigneAId: '',
        serviceId: '',
        statut: 'A_FAIRE',
        priorite: 'MOYENNE',
        dateEcheance: '',
        montant: '',
        heuresEstimees: '',
        facturable: true
      })
      setShowCreateForm(false)
      await fetchTasks()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création de la tâche')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Tâches du projet</h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Bouton pour créer une nouvelle tâche */}
          {!showCreateForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                <Plus size={16} />
                Nouvelle tâche
              </button>
            </div>
          )}

          {/* Formulaire de création */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Créer une nouvelle tâche</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Titre de la tâche"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description optionnelle"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
                    <select
                      name="assigneAId"
                      value={formData.assigneAId}
                      onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Non assigné</option>
                      {employes.map(employe => (
                        <option key={employe.id} value={employe.id}>
                          {employe.prenom} {employe.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service (optionnel)</label>
                    <select
                      name="serviceId"
                      value={formData.serviceId}
                      onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Aucun</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      name="statut"
                      value={formData.statut}
                      onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="A_FAIRE">À faire</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TERMINE">Terminée</option>
                      <option value="EN_RETARD">En retard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      name="priorite"
                      value={formData.priorite}
                      onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="BASSE">Basse</option>
                      <option value="MOYENNE">Moyenne</option>
                      <option value="HAUTE">Haute</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                    <input
                      type="date"
                      name="dateEcheance"
                      value={formData.dateEcheance}
                      onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                    <input
                      type="number"
                      name="montant"
                      value={formData.montant}
                      onChange={handleFormChange}
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heures estimées</label>
                    <input
                      type="number"
                      name="heuresEstimees"
                      value={formData.heuresEstimees}
                      onChange={handleFormChange}
                      step="0.5"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="facturable"
                    id="facturable"
                    checked={formData.facturable}
                    onChange={handleFormChange}
                    className="rounded"
                  />
                  <label htmlFor="facturable" className="text-sm font-medium text-gray-700">Facturable</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Créer la tâche
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des tâches */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Chargement des tâches...</div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && tasks.length === 0 && (
            <div className="py-12 text-center text-gray-600">
              Aucune tâche trouvée pour ce projet.
            </div>
          )}

          {!loading && !error && tasks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">TITRE</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">STATUT</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">PRIORITÉ</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">ASSIGNÉ À</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">DATE ÉCHÉANCE</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">MONTANT</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => (
                    <tr key={task.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="py-3 px-4 font-medium text-slate-800">{task.titre}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatutColor(task.statut)}`}>
                          {task.statut || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPrioriteColor(task.priorite)}`}>
                          {task.priorite || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {task.assigneA
                          ? `${task.assigneA.prenom || ''} ${task.assigneA.nom || ''}`.trim() || '—'
                          : '—'}
                      </td>
                      <td className="py-3 px-4">{formatDate(task.dateEcheance)}</td>
                      <td className="py-3 px-4 font-semibold">
                        {task.montant ? `${Number(task.montant).toLocaleString('fr-FR')} FCFA` : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={task.description}>
                        {task.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
