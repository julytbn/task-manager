'use client'

import React, { useState, useEffect } from 'react'
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import MainLayout from '@/components/layouts/MainLayout'

type TimeSheet = {
  id: string
  date: string
  regularHrs: number
  overtimeHrs: number | null
  sickHrs: number | null
  vacationHrs: number | null
  description: string | null
  statut: string
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

type MonthlyData = {
  [day: number]: {
    date: string
    dayName: string
    regularHrs: number
    overtimeHrs: number
    sickHrs: number
    vacationHrs: number
    description: string
    totalHrs: number
  }
}

export default function MonthlyReportPage() {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [timesheets, setTimesheets] = useState<TimeSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState<any>(null)
  const [supervisor, setSupervisor] = useState<any>(null)

  useEffect(() => {
    fetchMonthlyTimesheets()
  }, [month, year])

  const fetchMonthlyTimesheets = async () => {
    try {
      setLoading(true)
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

      const res = await fetch(
        `/api/timesheets/my-timesheets?startDate=${startDate}&endDate=${endDate}`
      )
      const data = await res.json()

      if (data.success) {
        setTimesheets(data.data)
        if (data.data.length > 0) {
          setEmployee(data.data[0].employee)
          // Chercher le superviseur (manager qui a validé)
          const validatedTs = data.data.find((ts: TimeSheet) => ts.valideParUser)
          if (validatedTs && validatedTs.valideParUser) {
            setSupervisor(validatedTs.valideParUser)
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement rapport:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupTimesheetsByDay = (): MonthlyData => {
    const grouped: MonthlyData = {}

    timesheets.forEach(ts => {
      const date = new Date(ts.date)
      const day = date.getDate()
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })

      if (!grouped[day]) {
        grouped[day] = {
          date: ts.date,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          regularHrs: 0,
          overtimeHrs: 0,
          sickHrs: 0,
          vacationHrs: 0,
          description: '',
          totalHrs: 0,
        }
      }

      grouped[day].regularHrs += ts.regularHrs || 0
      grouped[day].overtimeHrs += ts.overtimeHrs || 0
      grouped[day].sickHrs += ts.sickHrs || 0
      grouped[day].vacationHrs += ts.vacationHrs || 0
      grouped[day].description += (grouped[day].description ? ' ; ' : '') + (ts.description || ts.task.titre)
      grouped[day].totalHrs = grouped[day].regularHrs + grouped[day].overtimeHrs + grouped[day].sickHrs + grouped[day].vacationHrs
    })

    return grouped
  }

  const calculateTotals = () => {
    const grouped = groupTimesheetsByDay()
    const totals = {
      regularHrs: 0,
      overtimeHrs: 0,
      sickHrs: 0,
      vacationHrs: 0,
      totalHrs: 0,
    }

    Object.values(grouped).forEach(day => {
      totals.regularHrs += day.regularHrs
      totals.overtimeHrs += day.overtimeHrs
      totals.sickHrs += day.sickHrs
      totals.vacationHrs += day.vacationHrs
      totals.totalHrs += day.totalHrs
    })

    return totals
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // Utiliser l'impression du navigateur pour générer un PDF
    window.print()
  }

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const grouped = groupTimesheetsByDay()
  const totals = calculateTotals()
  const monthName = new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text">Rapport Mensuel</h1>
            <p className="text-gray-600 mt-2 capitalize">{monthName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Imprimer / PDF
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold min-w-[200px] text-center capitalize">{monthName}</span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Report */}
        <div id="monthly-report" className="bg-white border border-gray-300 p-8 print:p-0 print:border-0">
          {/* Header */}
          <div className="text-center border-b-2 border-teal-600 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">FEUILLE DE TEMPS MENSUELLE</h2>
            <p className="text-gray-600 mt-2">Monthly Time Sheet</p>
          </div>

          {/* Company Info */}
          <div className="mb-6 pb-6 border-b border-gray-300">
            <p className="text-sm text-gray-700 font-semibold mb-4">Entreprise / Organisation</p>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 font-medium">Employé:</label>
                <p className="text-gray-900 font-semibold">
                  {employee?.prenom} {employee?.nom}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Email:</label>
                <p className="text-gray-900">{employee?.email || '—'}</p>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 font-medium">Superviseur:</label>
                <p className="text-gray-900 font-semibold">
                  {supervisor ? `${supervisor.prenom} ${supervisor.nom}` : '—'}
                </p>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 font-medium">Période:</label>
                <p className="text-gray-900 font-semibold">
                  {startDate.toLocaleDateString('fr-FR')} - {endDate.toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Timesheets Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun timesheet pour ce mois</div>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border border-gray-300">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Jour</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Heures Normales</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Heures Supplémentaires</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Maladie</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Congés</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Total</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Description des Activités</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([day, data]) => (
                    <tr key={day} className="border border-gray-300 hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{data.dayName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
                        {new Date(data.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
                        {data.regularHrs > 0 ? data.regularHrs : ''}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
                        {data.overtimeHrs > 0 ? data.overtimeHrs : ''}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
                        {data.sickHrs > 0 ? data.sickHrs : ''}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">
                        {data.vacationHrs > 0 ? data.vacationHrs : ''}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                        {data.totalHrs > 0 ? data.totalHrs : ''}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">
                        {data.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border border-gray-300 font-semibold">
                    <td colSpan={2} className="border border-gray-300 px-4 py-3 text-sm">TOTAL</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">{totals.regularHrs}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">{totals.overtimeHrs}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">{totals.sickHrs}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">{totals.vacationHrs}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm">{totals.totalHrs}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Signature Lines */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 h-12"></div>
              <p className="text-xs text-gray-600 font-medium">Signature Employé</p>
              <p className="text-xs text-gray-500">{employee?.prenom} {employee?.nom}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 h-12"></div>
              <p className="text-xs text-gray-600 font-medium">Signature Superviseur</p>
              <p className="text-xs text-gray-500">{supervisor ? `${supervisor.prenom} ${supervisor.nom}` : '—'}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 h-12"></div>
              <p className="text-xs text-gray-600 font-medium">Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          #monthly-report {
            max-width: 100%;
            margin: 0;
            padding: 20mm;
            box-shadow: none;
            border: none;
            background: white;
          }
          
          button, .flex.items-center.justify-between, .flex.flex-col.sm\\:flex-row {
            display: none;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </MainLayout>
  )
}
