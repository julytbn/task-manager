'use client'
import { Button } from '@/components/ui'
import { Calendar, User, Folder, Filter, X } from 'lucide-react'

interface TimesheetFiltersProps {
  onDateChange: (start: string, end: string) => void
  onEmployeeChange: (employeeId: string) => void
  onProjectChange: (projectId: string) => void
  onStatusChange: (status: string) => void
  onReset: () => void
  employees?: { id: string; nom: string; prenom: string }[]
  projects?: { id: string; titre: string }[]
}

export default function TimesheetFilters({
  onDateChange,
  onEmployeeChange,
  onProjectChange,
  onStatusChange,
  onReset,
  employees = [],
  projects = []
}: TimesheetFiltersProps) {
  const statuses = [
    { value: 'EN_ATTENTE', label: '🟡 En attente de validation' },
    { value: 'VALIDEE', label: '✅ Validées' },
    { value: 'REJETEE', label: '❌ Rejetées' },
    { value: 'CORRIGEE', label: '🔵 À corriger' },
    { value: 'all', label: 'Tous les statuts' }
  ]

  const periods = [
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'all', label: 'Tous' }
  ]

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtres avancés</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
          Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Statut - en premier pour les managers */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Par statut
          </label>
          <select
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            defaultValue="EN_ATTENTE"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Employé */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User size={16} className="inline mr-1" />
            Par employé
          </label>
          <select
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les employés</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.prenom} {emp.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Projet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Folder size={16} className="inline mr-1" />
            Par projet
          </label>
          <select
            onChange={(e) => onProjectChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les projets</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.titre}
              </option>
            ))}
          </select>
        </div>

        {/* Période */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={16} className="inline mr-1" />
            Par période
          </label>
          <select
            onChange={(e) => {
              const now = new Date()
              let start = ''
              let end = now.toISOString().split('T')[0]

              switch (e.target.value) {
                case 'today':
                  start = end
                  break
                case 'week':
                  const weekStart = new Date(now)
                  weekStart.setDate(now.getDate() - now.getDay())
                  start = weekStart.toISOString().split('T')[0]
                  break
                case 'month':
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                  start = monthStart.toISOString().split('T')[0]
                  break
              }

              if (e.target.value !== 'all') onDateChange(start, end)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
