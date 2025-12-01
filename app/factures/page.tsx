"use client"
import { useEffect, useState } from 'react'
import Link from "next/link"
import UiLayout from "../../components/UiLayout"

type Facture = {
  id: string
  numero: string
  client: { id: string; nom: string }
  projet?: { id: string; titre: string }
  statut: string
  montant: number
  montantTotal: number
  dateEmission: string
  dateEcheance?: string | null
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/factures')
        if (!res.ok) throw new Error('Erreur récupération factures')
        const data = await res.json()
        if (mounted) setFactures(data || [])
      } catch (err) {
        if (mounted) setError((err as any).message || 'Erreur')
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const getStatusBadge = (statut: string) => {
    const colors: Record<string, string> = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      PAYEE: 'bg-green-100 text-green-800',
      REMBOURSEE: 'bg-blue-100 text-blue-800',
      ANNULEE: 'bg-red-100 text-red-800'
    }
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      PAYEE: 'Payée',
      REMBOURSEE: 'Remboursée',
      ANNULEE: 'Annulée'
    }
    return { color: colors[statut] || 'bg-gray-100 text-gray-800', label: labels[statut] || statut }
  }

  return (
    <UiLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Factures</h2>
      </div>

      {loading && <div className="text-center py-8">Chargement...</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

      {!loading && !error && factures.length === 0 && (
        <div className="text-center py-8 text-gray-500">Aucune facture trouvée</div>
      )}

      {!loading && !error && factures.length > 0 && (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Numéro</th>
                <th className="px-6 py-3 text-left">Client</th>
                <th className="px-6 py-3 text-left">Projet</th>
                <th className="px-6 py-3 text-left">Montant</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-left">Date émission</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((facture) => {
                const badge = getStatusBadge(facture.statut)
                return (
                  <tr key={facture.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold">{facture.numero}</td>
                    <td className="px-6 py-3">{facture.client.nom}</td>
                    <td className="px-6 py-3">{facture.projet?.titre || '—'}</td>
                    <td className="px-6 py-3 font-medium">{facture.montantTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3">{new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/factures/${facture.id}`} className="text-blue-600 hover:underline">
                        Voir
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </UiLayout>
  )
}
