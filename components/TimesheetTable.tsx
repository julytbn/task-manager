'use client'
import { CheckCircle, XCircle, Clock, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'

export interface TimesheetRowData {
  id: string
  date: string
  dateSubmission?: string
  employee: {
    id: string
    prenom: string
    nom: string
  }
  project?: {
    id: string
    titre: string
  }
  task?: {
    id: string
    titre: string
  }
  hours: number
  type: 'normal' | 'overtime'
  description: string
  status: 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'REJECTED' | 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' | 'CORRIGEE'
  period?: string
  regularHrs?: number
  overtimeHrs?: number | null
  sickHrs?: number | null
  vacationHrs?: number | null
}

interface TimesheetTableProps {
  data: TimesheetRowData[]
  onView: (item: TimesheetRowData) => void
  onValidate: (item: TimesheetRowData) => void
  onReject: (item: TimesheetRowData) => void
  onDelete: (item: TimesheetRowData) => void
  loading?: boolean
}

const statusConfig = {
  DRAFT: { label: '🟠 Brouillon', color: 'bg-orange-100 text-orange-800' },
  SUBMITTED: { label: '🟡 Soumis', color: 'bg-yellow-100 text-yellow-800' },
  VALIDATED: { label: '🟢 Validé', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: '🔴 Rejeté', color: 'bg-red-100 text-red-800' },
  EN_ATTENTE: { label: '🟡 En attente', color: 'bg-yellow-100 text-yellow-800' },
  VALIDEE: { label: '🟢 Validée', color: 'bg-green-100 text-green-800' },
  REJETEE: { label: '🔴 Rejetée', color: 'bg-red-100 text-red-800' },
  CORRIGEE: { label: '🔵 À corriger', color: 'bg-blue-100 text-blue-800' }
}

export default function TimesheetTable({
  data,
  onView,
  onValidate,
  onReject,
  onDelete,
  loading = false
}: TimesheetTableProps) {
  if (loading) {
    return (
      <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
        Chargement des feuilles de temps...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg border border-gray-200 text-center text-gray-500">
        Aucune feuille de temps trouvée
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Employé</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Période</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Projet</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Total heures</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Statut</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Date soumission</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">
                  {row.employee.prenom} {row.employee.nom}
                </td>
                <td className="px-6 py-4 text-sm">
                  {row.period || new Date(row.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4">{row.project?.titre || '—'}</td>
                <td className="px-6 py-4 font-semibold text-blue-600">{row.hours}h</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusConfig[row.status]?.color || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusConfig[row.status]?.label || row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {row.dateSubmission 
                    ? new Date(row.dateSubmission).toLocaleDateString('fr-FR')
                    : new Date(row.date).toLocaleDateString('fr-FR')
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(row)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Voir détail"
                    >
                      <Eye size={16} />
                    </button>
                    {(row.status === 'SUBMITTED' || row.status === 'EN_ATTENTE') && (
                      <>
                        <button
                          onClick={() => onValidate(row)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Valider"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => onReject(row)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Rejeter"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDelete(row)}
                      className="text-gray-600 hover:text-red-800 p-1"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
