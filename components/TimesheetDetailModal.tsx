'use client'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { TimesheetRowData } from './TimesheetTable'

interface TimesheetDetailModalProps {
  isOpen: boolean
  data?: TimesheetRowData
  onClose: () => void
  onValidate: (id: string) => void
  onReject: (id: string, reason: string) => void
}

export default function TimesheetDetailModal({
  isOpen,
  data,
  onClose,
  onValidate,
  onReject
}: TimesheetDetailModalProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!isOpen || !data) return null

  // Tableau journalier exemple (simulé - devrait venir du backend)
  const getDailyBreakdown = () => {
    return [
      { day: 'Lun 01', regular: 8, overtime: 0, sick: 0, vacation: 0 },
      { day: 'Mar 02', regular: 8, overtime: 1, sick: 0, vacation: 0 },
      { day: 'Mer 03', regular: 8, overtime: 0, sick: 0, vacation: 0 },
      { day: 'Jeu 04', regular: 8, overtime: 0, sick: 0, vacation: 0 },
      { day: 'Ven 05', regular: 8, overtime: 0, sick: 2, vacation: 0 },
    ]
  }

  const dailyData = getDailyBreakdown()
  const totalRegular = dailyData.reduce((sum, d) => sum + d.regular, 0)
  const totalOvertime = dailyData.reduce((sum, d) => sum + d.overtime, 0)
  const totalSick = dailyData.reduce((sum, d) => sum + d.sick, 0)
  const totalVacation = dailyData.reduce((sum, d) => sum + d.vacation, 0)
  const totalHours = totalRegular + totalOvertime + totalSick + totalVacation

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Détail de la feuille de temps</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Infos employé */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">Employé</p>
                <p className="text-lg font-bold">
                  {data.employee.prenom} {data.employee.nom}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Mois</p>
                <p className="text-lg font-bold">
                  {new Date(data.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Projet</p>
                <p className="text-lg font-bold">{data.project?.titre || '—'}</p>
              </div>
            </div>
          </div>

          {/* Tableau journalier */}
          <div>
            <h3 className="text-lg font-bold mb-3">Détail par jour</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Jour</th>
                    <th className="px-4 py-3 text-center font-semibold">Régulières</th>
                    <th className="px-4 py-3 text-center font-semibold">Supplémentaires</th>
                    <th className="px-4 py-3 text-center font-semibold">Maladie</th>
                    <th className="px-4 py-3 text-center font-semibold">Congés</th>
                    <th className="px-4 py-3 text-center font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dailyData.map((day, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{day.day}</td>
                      <td className="px-4 py-3 text-center">{day.regular}h</td>
                      <td className="px-4 py-3 text-center text-orange-600 font-semibold">{day.overtime}h</td>
                      <td className="px-4 py-3 text-center text-red-600 font-semibold">{day.sick}h</td>
                      <td className="px-4 py-3 text-center text-blue-600 font-semibold">{day.vacation}h</td>
                      <td className="px-4 py-3 text-center font-bold">
                        {day.regular + day.overtime + day.sick + day.vacation}h
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50 border-t-2 border-gray-300">
                  <tr className="font-bold">
                    <td className="px-4 py-3">TOTAL</td>
                    <td className="px-4 py-3 text-center">{totalRegular}h</td>
                    <td className="px-4 py-3 text-center text-orange-600">{totalOvertime}h</td>
                    <td className="px-4 py-3 text-center text-red-600">{totalSick}h</td>
                    <td className="px-4 py-3 text-center text-blue-600">{totalVacation}h</td>
                    <td className="px-4 py-3 text-center text-2xl text-blue-700">{totalHours}h</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Résumé des totaux */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600">Heures régulières</p>
              <p className="text-2xl font-bold text-blue-700">{totalRegular}h</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-xs text-gray-600">Heures supplémentaires</p>
              <p className="text-2xl font-bold text-orange-700">{totalOvertime}h</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-xs text-gray-600">Maladie</p>
              <p className="text-2xl font-bold text-red-700">{totalSick}h</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <p className="text-xs text-gray-600">Congés</p>
              <p className="text-2xl font-bold text-indigo-700">{totalVacation}h</p>
            </div>
          </div>

          {/* Statut */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Statut actuel</p>
            <div className="flex items-center gap-2">
              {(data.status === 'VALIDATED' || data.status === 'VALIDEE') && (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-green-700">✅ Validée</span>
                </>
              )}
              {(data.status === 'SUBMITTED' || data.status === 'EN_ATTENTE') && (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold text-yellow-700">🟡 En attente de validation</span>
                </>
              )}
              {data.status === 'DRAFT' && (
                <>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-semibold text-orange-700">🟠 Brouillon</span>
                </>
              )}
              {(data.status === 'REJECTED' || data.status === 'REJETEE') && (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-red-700">❌ Rejetée</span>
                </>
              )}
              {data.status === 'CORRIGEE' && (
                <>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-blue-700">🔵 À corriger</span>
                </>
              )}
            </div>
          </div>

          {/* Formulaire de rejet avec validation */}
          {showRejectForm && (
            <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg">
              <div className="flex gap-2 mb-3 text-red-700">
                <AlertCircle size={18} />
                <p className="text-sm font-semibold">Le commentaire est obligatoire pour rejeter</p>
              </div>
              <p className="text-sm font-semibold mb-2">Motif du rejet</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez précisément pourquoi cette feuille de temps est rejetée..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-red-500"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-6 flex gap-3 justify-end sticky bottom-0 bg-white">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>

          {(data.status === 'SUBMITTED' || data.status === 'EN_ATTENTE') && (
            <>
              {!showRejectForm ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => onValidate(data.id)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={16} />
                    ✅ Valider
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={16} />
                    ❌ Rejeter
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectReason('')
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!rejectReason.trim()}
                    onClick={() => {
                      if (rejectReason.trim()) {
                        onReject(data.id, rejectReason)
                        setShowRejectForm(false)
                        setRejectReason('')
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Confirmer le rejet
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
