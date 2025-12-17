'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Clock, X, FileText } from 'lucide-react'
import MainLayout from '@/components/layouts/MainLayout'
import Link from 'next/link'
import { useUserSession } from '@/hooks/useSession'

type TimeSheet = {
  id: string
  date: string
  regularHrs: number
  overtimeHrs: number | null
  sickHrs: number | null
  vacationHrs: number | null
  description: string | null
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' | 'CORRIGEE'
  employee: {
    id: string
    nom: string
    prenom: string
    email: string | null
  }
  task: {
    id: string
    titre: string
  }
  project: {
    id: string
    titre: string
  }
  valideParUser: {
    id: string
    nom: string
    prenom: string
  } | null
}

type Stats = {
  total: number
  enAttente: number
  validee: number
  rejetee: number
  totalHours: number
}

type Project = {
  id: string
  titre: string
}

type Task = {
  id: string
  titre: string
}

type FormData = {
  date: string
  projectId: string
  taskId: string
  regularHrs: number
  overtimeHrs: number
  sickHrs: number
  vacationHrs: number
  description: string
}

export default function MyTimesheetsPage() {
  const { user, isLoading: isSessionLoading } = useUserSession()
  const [timesheets, setTimesheets] = useState<TimeSheet[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatut, setSelectedStatut] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingModal, setLoadingModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    taskId: '',
    regularHrs: 8,
    overtimeHrs: 0,
    sickHrs: 0,
    vacationHrs: 0,
    description: '',
  })

  useEffect(() => {
    fetchTimesheets()
  }, [selectedStatut])

  const openModal = async () => {
    try {
      setLoadingModal(true)
      const [projRes, tasksRes] = await Promise.all([
        fetch('/api/projets/my-projects'),
        fetch('/api/taches/mes-taches'),
      ])

      const projData = await projRes.json()
      const tasksData = await tasksRes.json()

      if (projData.success) {
        setProjects(projData.data)
      }
      if (tasksData.success) {
        setTasks(tasksData.data)
      }
    } catch (error) {
      console.error('Erreur chargement des données:', error)
      alert('Erreur lors du chargement des projets et tâches')
    } finally {
      setLoadingModal(false)
      setIsModalOpen(true)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Hrs') || name.includes('description') ? (name.includes('Hrs') ? parseFloat(value) || 0 : value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.projectId || !formData.taskId || !formData.date) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!user?.id) {
      setError('Erreur: Utilisateur non authentifié. Veuillez vous reconnecter.')
      return
    }

    try {
      setLoadingModal(true)
      setError(null)
      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          date: new Date(formData.date).toISOString(),
          projectId: formData.projectId,
          taskId: formData.taskId,
          regularHrs: formData.regularHrs,
          overtimeHrs: formData.overtimeHrs,
          sickHrs: formData.sickHrs,
          vacationHrs: formData.vacationHrs,
          description: formData.description,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert('TimeSheet créé avec succès')
        setIsModalOpen(false)
        setError(null)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          projectId: '',
          taskId: '',
          regularHrs: 8,
          overtimeHrs: 0,
          sickHrs: 0,
          vacationHrs: 0,
          description: '',
        })
        fetchTimesheets()
      } else {
        setError(data.message || 'Erreur lors de la création du timesheet')
      }
    } catch (err) {
      console.error('Erreur création timesheet:', err)
      setError(`Erreur: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoadingModal(false)
    }
  }

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (selectedStatut) query.append('statut', selectedStatut)

      const res = await fetch(`/api/timesheets/my-timesheets?${query.toString()}`)
      const data = await res.json()

      if (data.success) {
        setTimesheets(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur chargement timesheets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatutBadge = (statut: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      EN_ATTENTE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      VALIDEE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Validée' },
      REJETEE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejetée' },
      CORRIGEE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Corrigée' },
    }
    const badge = badges[statut]
    return badge ? (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    ) : null
  }

  const totalHours = (ts: TimeSheet) => {
    return (ts.regularHrs || 0) + (ts.overtimeHrs || 0) + (ts.sickHrs || 0) + (ts.vacationHrs || 0)
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold gold-gradient-text">Mes Timesheets</h1>
            <p className="text-[var(--color-anthracite)] mt-2">Enregistrez et suivez vos heures de travail</p>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Link
              href="/timesheets/monthly-report"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Rapport Mensuel
            </Link>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:bg-[var(--color-gold-accent)] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau TimeSheet
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600">Total Timesheets</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm font-medium text-yellow-800">En attente</div>
              <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.enAttente}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-medium text-green-800">Validées</div>
              <div className="text-3xl font-bold text-green-900 mt-2">{stats.validee}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm font-medium text-red-800">Rejetées</div>
              <div className="text-3xl font-bold text-red-900 mt-2">{stats.rejetee}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800">Heures totales</div>
              <div className="text-3xl font-bold text-blue-900 mt-2">{stats.totalHours}h</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="VALIDEE">Validées</option>
              <option value="REJETEE">Rejetées</option>
              <option value="CORRIGEE">Corrigées</option>
            </select>
          </div>
        </div>

        {/* Timesheets Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : timesheets.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Aucun timesheet</p>
              <p className="text-gray-500 text-sm mt-1">Commencez en créant votre premier timesheet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Projet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tâche</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Heures</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Validé par</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((ts) => (
                    <tr key={ts.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(ts.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-medium text-gray-900">{ts.project.titre}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{ts.task.titre}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1 text-xs">
                          {ts.regularHrs > 0 && <div>Normal: {ts.regularHrs}h</div>}
                          {ts.overtimeHrs && ts.overtimeHrs > 0 && <div className="text-orange-600">Supp: {ts.overtimeHrs}h</div>}
                          {ts.sickHrs && ts.sickHrs > 0 && <div className="text-red-600">Maladie: {ts.sickHrs}h</div>}
                          {ts.vacationHrs && ts.vacationHrs > 0 && <div className="text-blue-600">Congé: {ts.vacationHrs}h</div>}
                          <div className="font-semibold text-gray-900">Total: {totalHours(ts)}h</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{getStatutBadge(ts.statut)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ts.valideParUser ? `${ts.valideParUser.prenom} ${ts.valideParUser.nom}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouveau TimeSheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Nouveau TimeSheet</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={loadingModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">❌ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                  disabled={loadingModal}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                />
              </div>

              {/* Projet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Projet *</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleFormChange}
                  required
                  disabled={loadingModal}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                >
                  <option value="">Sélectionner un projet...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.titre}</option>
                  ))}
                </select>
              </div>

              {/* Tâche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tâche *</label>
                <select
                  name="taskId"
                  value={formData.taskId}
                  onChange={handleFormChange}
                  required
                  disabled={loadingModal}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                >
                  <option value="">Sélectionner une tâche...</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.titre}</option>
                  ))}
                </select>
              </div>

              {/* Hours Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heures normales</label>
                  <input
                    type="number"
                    name="regularHrs"
                    value={formData.regularHrs}
                    onChange={handleFormChange}
                    min="0"
                    step="0.5"
                    disabled={loadingModal}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heures supplémentaires</label>
                  <input
                    type="number"
                    name="overtimeHrs"
                    value={formData.overtimeHrs}
                    onChange={handleFormChange}
                    min="0"
                    step="0.5"
                    disabled={loadingModal}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heures maladie</label>
                  <input
                    type="number"
                    name="sickHrs"
                    value={formData.sickHrs}
                    onChange={handleFormChange}
                    min="0"
                    step="0.5"
                    disabled={loadingModal}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heures congés</label>
                  <input
                    type="number"
                    name="vacationHrs"
                    value={formData.vacationHrs}
                    onChange={handleFormChange}
                    min="0"
                    step="0.5"
                    disabled={loadingModal}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  />
                </div>
              </div>

              {/* Total Hours Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Total heures: <span className="font-bold text-lg">{formData.regularHrs + formData.overtimeHrs + formData.sickHrs + formData.vacationHrs}h</span>
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  disabled={loadingModal}
                  rows={3}
                  placeholder="Détails supplémentaires sur votre journée..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loadingModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingModal}
                  className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:bg-[var(--color-gold-accent)] transition-colors disabled:opacity-50"
                >
                  {loadingModal ? 'Création en cours...' : 'Créer TimeSheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
