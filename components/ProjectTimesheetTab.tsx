'use client'

import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

type TimeSheet = {
  id: string
  date: string
  regularHrs: number
  overtimeHrs: number | null
  sickHrs: number | null
  vacationHrs: number | null
  employee: {
    nom: string
    prenom: string
  }
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' | 'CORRIGEE'
}

type Props = {
  projectId: string
}

export default function ProjectTimesheetTab({ projectId }: Props) {
  const [timesheets, setTimesheets] = useState<TimeSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [totalHours, setTotalHours] = useState(0)

  useEffect(() => {
    fetchTimesheets()
  }, [projectId])

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/timesheets?projectId=${projectId}`)
      const data = await res.json()

      if (data.success) {
        setTimesheets(data.data)
        const total = data.data.reduce((sum: number, ts: TimeSheet) => {
          return sum + ((ts.regularHrs || 0) + (ts.overtimeHrs || 0) + (ts.sickHrs || 0) + (ts.vacationHrs || 0))
        }, 0)
        setTotalHours(total)
      }
    } catch (error) {
      console.error('Erreur chargement timesheets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatutColor = (statut: string) => {
    const colors: { [key: string]: string } = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      VALIDEE: 'bg-green-100 text-green-800',
      REJETEE: 'bg-red-100 text-red-800',
      CORRIGEE: 'bg-blue-100 text-blue-800',
    }
    return colors[statut] || 'bg-gray-100 text-gray-800'
  }

  const tsTotal = (ts: TimeSheet) => {
    return (ts.regularHrs || 0) + (ts.overtimeHrs || 0) + (ts.sickHrs || 0) + (ts.vacationHrs || 0)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800">Total TimeSheets</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">{timesheets.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-800">TimeSheets validés</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {timesheets.filter(ts => ts.statut === 'VALIDEE').length}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-800">Heures totales</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">{totalHours}h</div>
        </div>
      </div>

      {/* TimeSheets Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Chargement...</div>
      ) : timesheets.length === 0 ? (
        <div className="p-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucun timesheet pour ce projet</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Heures</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((ts) => (
                <tr key={ts.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(ts.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ts.employee.prenom} {ts.employee.nom}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {tsTotal(ts)}h
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(ts.statut)}`}>
                      {ts.statut === 'EN_ATTENTE' && 'En attente'}
                      {ts.statut === 'VALIDEE' && 'Validée'}
                      {ts.statut === 'REJETEE' && 'Rejetée'}
                      {ts.statut === 'CORRIGEE' && 'Corrigée'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
