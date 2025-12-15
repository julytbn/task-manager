'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
import MainLayout from '@/components/MainLayout'

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
}

export default function TimeSheetValidationPage() {
  const [timesheets, setTimesheets] = useState<TimeSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatut, setSelectedStatut] = useState('EN_ATTENTE')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchTimesheets()
  }, [selectedStatut, selectedEmployee, selectedProject])

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      query.append('statut', selectedStatut)
      if (selectedEmployee) query.append('employeeId', selectedEmployee)
      if (selectedProject) query.append('projectId', selectedProject)

      const res = await fetch(`/api/timesheets?${query.toString()}`)
      const data = await res.json()

      if (data.success) {
        setTimesheets(data.data)
      }
    } catch (error) {
      console.error('Erreur chargement timesheets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (id: string) => {
    try {
      const res = await fetch(`/api/timesheets/${id}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          validePar: 'current-user-id' // À remplacer par l'ID utilisateur réel
        })
      })

      if (res.ok) {
        setTimesheets(timesheets.filter(ts => ts.id !== id))
        alert('TimeSheet validé avec succès')
      }
    } catch (error) {
      console.error('Erreur validation:', error)
      alert('Erreur lors de la validation')
    }
  }

  const handleReject = async (id: string) => {
    const reason = rejectionReason[id] || 'Pas de raison fournie'
    
    try {
      const res = await fetch(`/api/timesheets/${id}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          validePar: 'current-user-id',
          comment: reason
        })
      })

      if (res.ok) {
        setTimesheets(timesheets.filter(ts => ts.id !== id))
        setRejectionReason({ ...rejectionReason, [id]: '' })
        alert('TimeSheet rejeté')
      }
    } catch (error) {
      console.error('Erreur rejet:', error)
      alert('Erreur lors du rejet')
    }
  }

  const totalHours = (ts: TimeSheet) => {
    return (ts.regularHrs || 0) + (ts.overtimeHrs || 0) + (ts.sickHrs || 0) + (ts.vacationHrs || 0)
  }

  // Récupérer les employés et projets uniques
  const employees = Array.from(new Set(timesheets.map(ts => `${ts.employee.id}|${ts.employee.prenom} ${ts.employee.nom}`)))
  const projects = Array.from(new Set(timesheets.map(ts => `${ts.project.id}|${ts.project.titre}`)))

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold gold-gradient-text">Validation des TimeSheets</h1>
          <p className="text-[var(--color-anthracite)] mt-2">Validez ou rejetez les feuilles de temps soumises</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="EN_ATTENTE">En attente de validation</option>
              <option value="VALIDEE">Validées</option>
              <option value="REJETEE">Rejetées</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employé</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Tous les employés</option>
              {employees.map((emp) => {
                const [id, name] = emp.split('|')
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Tous les projets</option>
              {projects.map((proj) => {
                const [id, name] = proj.split('|')
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* TimeSheets List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-lg">Chargement...</div>
          ) : timesheets.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Aucun timesheet à valider</p>
            </div>
          ) : (
            timesheets.map((ts) => (
              <div
                key={ts.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => setExpandedId(expandedId === ts.id ? null : ts.id)}
                  className="p-6 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {ts.employee.prenom} {ts.employee.nom}
                      </h3>
                      <span className="text-sm text-gray-500">|</span>
                      <span className="text-sm font-medium text-blue-600">{ts.project.titre}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{ts.task.titre}</span>
                      <span>•</span>
                      <span>{new Date(ts.date).toLocaleDateString('fr-FR')}</span>
                      <span>•</span>
                      <span className="font-semibold text-gray-900">{totalHours(ts)}h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[var(--color-gold)]">{totalHours(ts)}h</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {expandedId === ts.id ? '▲ Moins' : '▼ Plus'}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === ts.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {ts.regularHrs > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase">Heures normales</div>
                          <div className="text-2xl font-bold text-gray-900">{ts.regularHrs}h</div>
                        </div>
                      )}
                      {ts.overtimeHrs && ts.overtimeHrs > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase">Heures supp</div>
                          <div className="text-2xl font-bold text-orange-600">{ts.overtimeHrs}h</div>
                        </div>
                      )}
                      {ts.sickHrs && ts.sickHrs > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase">Maladie</div>
                          <div className="text-2xl font-bold text-red-600">{ts.sickHrs}h</div>
                        </div>
                      )}
                      {ts.vacationHrs && ts.vacationHrs > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 uppercase">Congé</div>
                          <div className="text-2xl font-bold text-blue-600">{ts.vacationHrs}h</div>
                        </div>
                      )}
                    </div>

                    {ts.description && (
                      <div className="mb-6 p-4 bg-white rounded border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Commentaire</div>
                        <div className="text-sm text-gray-600">{ts.description}</div>
                      </div>
                    )}

                    {/* Rejection Reason (si c'est un rejet) */}
                    {selectedStatut === 'EN_ATTENTE' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Raison du rejet (si applicable)
                        </label>
                        <textarea
                          value={rejectionReason[ts.id] || ''}
                          onChange={(e) => setRejectionReason({ ...rejectionReason, [ts.id]: e.target.value })}
                          placeholder="Expliquez pourquoi ce timesheet est rejeté..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    {selectedStatut === 'EN_ATTENTE' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleValidate(ts.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                          Valider
                        </button>
                        <button
                          onClick={() => handleReject(ts.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
