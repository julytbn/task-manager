"use client"
import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui'
import { ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react'

type Payment = {
  id: string
  montant: number
  statut: string
  dateCreation?: string
  datePaiement?: string
  tache?: { titre?: string }
}

export default function DashboardPaymentTimeline() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/paiements?all=true')
        if (!res.ok) throw new Error('Erreur récupération paiements')
        const data = await res.json()
        if (mounted) setPayments((data.payments || []).slice(0, 15))
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const dateA = new Date(a.datePaiement || a.dateCreation || 0).getTime()
      const dateB = new Date(b.datePaiement || b.dateCreation || 0).getTime()
      return dateB - dateA
    })
  }, [payments])

  const getStatusColor = (statut: string) => {
    const s = (statut || '').toUpperCase()
    if (s.includes('CONFIRME') || s === 'CONFIRMED') return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Confirmé' }
    if (s.includes('EN_ATTENTE') || s.includes('ENCOURS') || s === 'PENDING') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'En attente' }
    if (s.includes('ANNULE') || s.includes('REJETE') || s === 'CANCELLED') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Annulé' }
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', label: statut }
  }

  if (loading) return <div className="card h-64 flex items-center justify-center text-gray-500">Chargement...</div>

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-black-deep)]">
          Timeline des paiements
        </h2>
        <p className="text-sm text-gray-500 mt-1">Historique chronologique des {payments.length} dernières transactions</p>
      </div>

      <div className="space-y-0">
        {sortedPayments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun paiement</p>
        ) : (
          sortedPayments.map((payment, idx) => {
            const statusInfo = getStatusColor(payment.statut)
            const date = new Date(payment.datePaiement || payment.dateCreation || '')
            const isConfirmed = payment.statut.toUpperCase().includes('CONFIRME')

            return (
              <div
                key={payment.id}
                className={`p-4 border-l-4 ${
                  isConfirmed ? 'border-l-green-500 bg-green-50' : 'border-l-gray-300 bg-gray-50'
                } flex items-center justify-between gap-4 ${idx !== sortedPayments.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-1 rounded-full p-2 ${isConfirmed ? 'bg-green-200' : 'bg-gray-300'}`}>
                    {isConfirmed ? (
                      <ArrowDownLeft size={16} className="text-green-700" />
                    ) : (
                      <ArrowUpRight size={16} className="text-gray-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {payment.tache?.titre || 'Paiement sans titre'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      {!isNaN(date.getTime()) ? date.toLocaleDateString('fr-FR') : 'Date invalide'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    {Number(payment.montant).toLocaleString('fr-FR')} FCFA
                  </p>
                  <span className={`inline-block text-xs font-medium mt-1 px-2 py-1 rounded ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text} border`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
