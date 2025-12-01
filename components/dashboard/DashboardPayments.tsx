"use client"
import { DollarSign, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, Badge, Button, Section } from '@/components/ui'

type Totals = { total: number; paid: number; pending: number; other: number }

export default function DashboardPayments() {
  const [totals, setTotals] = useState<Totals | null>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/paiements')
        if (!res.ok) throw new Error('Erreur récupération paiements')
        const data = await res.json()
        if (mounted) {
          setTotals(data.totals)
          setRecent(data.recent)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-[#1E1E1E]">Paiements</h3>
          <p className="text-sm text-[#5A6A80]">Synthèse des transactions</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="group"
        >
          Tous les paiements
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {loading || !totals ? (
        <Card className="p-6 flex items-center justify-center h-32">
          <p className="text-[#5A6A80]">Chargement paiements…</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#5A6A80] font-medium">Montant total</p>
                  <p className="text-2xl font-bold text-[#1E1E1E] mt-2">
                    €{totals.total.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-[#F0F4F8] rounded-lg">
                  <DollarSign size={20} className="text-[#0A66C2]" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-[#2ECC71]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#5A6A80] font-medium">Confirmés</p>
                  <p className="text-2xl font-bold text-[#2ECC71] mt-2">
                    €{totals.paid.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-[#F0FDF4] rounded-lg">
                  <ArrowUpRight size={20} className="text-[#2ECC71]" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-[#E74C3C]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#5A6A80] font-medium">En attente</p>
                  <p className="text-2xl font-bold text-[#E74C3C] mt-2">
                    €{totals.pending.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-[#FEF2F2] rounded-lg">
                  <ArrowDownLeft size={20} className="text-[#E74C3C]" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Payments */}
          <div>
            <h4 className="font-semibold text-[#1E1E1E] mb-3">Paiements récents</h4>
            
            {recent.length === 0 ? (
              <Card className="p-6 flex items-center justify-center h-24">
                <p className="text-[#5A6A80]">Aucun paiement enregistré</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recent.map((p: any) => {
                  const isPaid = p.statut === 'PAYE' || p.statut === 'PAID' || p.paye
                  const clientInitial = (p.client?.nom || '—').charAt(0).toUpperCase()
                  
                  return (
                    <Card 
                      key={p.id}
                      className="p-4 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#1A91F0] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {clientInitial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#1E1E1E] group-hover:text-[#0A66C2] truncate">
                              {p.client?.nom || '—'}
                            </p>
                            <p className="text-xs text-[#5A6A80] truncate">
                              {p.tache?.titre || p.projet?.titre || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-[#1E1E1E]">€{p.montant.toFixed(2)}</p>
                            <Badge 
                              variant={isPaid ? 'success' : 'warning'}
                              className="text-xs mt-1"
                            >
                              {isPaid ? 'Payé' : 'En attente'}
                            </Badge>
                          </div>
                          <ChevronRight size={18} className="text-[#DCE3EB] group-hover:text-[#0A66C2] transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            <div className="mt-4 text-center">
              <Button 
                variant="primary"
                className="w-full md:w-auto"
              >
                Voir tous les paiements
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
