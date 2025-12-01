"use client"
import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, TrendingDown } from 'lucide-react'
import { Card, Badge } from '@/components/ui'

interface LatePayment {
  id: string
  clientName: string
  montant: number
  daysLate: number
  dueDate: string
  projectName: string
}

interface Props {
  compact?: boolean
  onRefresh?: () => void
}

export default function LatePaymentAlerts({ compact = false, onRefresh }: Props) {
  const [latePayments, setLatePayments] = useState<LatePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLatePayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/paiements/check-late', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des paiements en retard')
      }

      const data = await response.json()
      setLatePayments(data.latePayments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLatePayments()
    const interval = setInterval(fetchLatePayments, 5 * 60 * 1000) // Refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center h-32">
        <p className="text-[#5A6A80]">Vérification des retards...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-l-4 border-l-red-500">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-700">Erreur</h4>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (latePayments.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center h-32 bg-green-50 border-l-4 border-l-green-500">
        <div className="text-center">
          <p className="text-green-700 font-medium">✅ Tous les paiements sont à jour</p>
          <p className="text-sm text-green-600">Aucun retard détecté</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#1E1E1E]">
              {latePayments.length} paiement{latePayments.length > 1 ? 's' : ''} en retard
            </h3>
            <p className="text-sm text-[#5A6A80]">Clients à relancer</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchLatePayments()
            onRefresh?.()
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Rafraîchir"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      {compact ? (
        <div className="space-y-2">
          {latePayments.slice(0, 3).map((payment) => (
            <div
              key={payment.id}
              className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-900 truncate">{payment.clientName}</p>
                <p className="text-xs text-red-700">{payment.projectName}</p>
              </div>
              <Badge variant="danger" className="whitespace-nowrap ml-2">
                {payment.daysLate}j retard
              </Badge>
            </div>
          ))}
          {latePayments.length > 3 && (
            <p className="text-xs text-[#5A6A80] px-3 py-1">
              +{latePayments.length - 3} autre{latePayments.length - 3 > 1 ? 's' : ''}...
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-lg">
          <table className="min-w-full divide-y">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-red-700">Client</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-red-700">Projet</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-red-700">Montant</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-red-700">Retard</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-red-700">Échéance</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-red-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {latePayments.map((payment) => {
                const daysLateClass =
                  payment.daysLate > 30
                    ? 'text-red-700 bg-red-50'
                    : payment.daysLate > 15
                      ? 'text-orange-700 bg-orange-50'
                      : 'text-yellow-700 bg-yellow-50'

                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {payment.clientName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{payment.projectName}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {payment.montant.toLocaleString()} FCFA
                    </td>
                    <td className={`px-4 py-3 text-sm text-center font-bold ${daysLateClass}`}>
                      {payment.daysLate} jours
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <a
                        href={`/dashboard/manager/paiements?search=${encodeURIComponent(payment.clientName)}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Relancer
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="flex items-center gap-2">
          <TrendingDown size={16} />
          <strong>💡 Conseil:</strong> Contactez rapidement les clients en retard pour éviter
          d'autres paiements en retard.
        </p>
      </div>
    </div>
  )
}
