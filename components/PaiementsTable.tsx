"use client"
import { useState } from 'react'
import { Search, Filter, Eye, Edit2, Trash2 } from 'lucide-react'

interface Paiement {
  id: string
  client?: any
  projet?: any
  montantTotal?: number
  montantPayé?: number
  soldeRestant?: number
  methodePaiement?: string
  statut: 'payé' | 'partiel' | 'impayé'
  date?: string
}

interface PaiementsTableProps {
  paiements: Paiement[]
  onViewDetails: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function PaiementsTable({ 
  paiements, 
  onViewDetails,
  onEdit,
  onDelete
}: PaiementsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'payé' | 'partiel' | 'impayé'>('tous')
  const [filtreProjet, setFiltreProjet] = useState('tous')

  // Helper to convert various client/projet shapes into a searchable/displayable string
  const toText = (val: any) => {
    if (!val) return ''
    if (typeof val === 'string' || typeof val === 'number') return String(val)
    if (typeof val === 'object') return (val.nom ?? val.titre ?? val.name ?? val.label ?? '')
    return String(val)
  }

  const lowerQuery = searchQuery.toLowerCase()
  const paiementsFiltrés = paiements.filter((p) => {
    const clientText = toText(p.client).toLowerCase()
    const projetText = toText(p.projet).toLowerCase()

    const matchSearch = clientText.includes(lowerQuery) || projetText.includes(lowerQuery)
    const matchStatut = filtreStatut === 'tous' || p.statut === filtreStatut
    const matchProjet = filtreProjet === 'tous' || (toText(p.projet) === filtreProjet)

    return matchSearch && matchStatut && matchProjet
  })

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'payé':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            🟢 Payé
          </span>
        )
      case 'partiel':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            🟡 Partiel
          </span>
        )
      case 'impayé':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            🔴 Impayé
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
      {/* Filtres */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher client ou projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Statut :</span>
            </div>
            {['tous', 'payé', 'partiel', 'impayé'].map((statut) => (
              <button
                key={statut}
                onClick={() => setFiltreStatut(statut as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtreStatut === statut
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {statut === 'tous' ? 'Tous' : statut.charAt(0).toUpperCase() + statut.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Projet</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant Total</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant Payé</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Solde Restant</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mode</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paiementsFiltrés.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-blue-50 transition">
                <td className="px-6 py-4 text-sm text-gray-600">{p.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{toText(p.client)}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{toText(p.projet)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {(p.montantTotal || 0).toLocaleString('fr-FR')} FCFA
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">
                  {(p.montantPayé || 0).toLocaleString('fr-FR')} FCFA
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {(p.soldeRestant || 0).toLocaleString('fr-FR')} FCFA
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.methodePaiement}</td>
                <td className="px-6 py-4">{getStatutBadge(p.statut)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails(p.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="Voir détails"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => onEdit?.(p.id)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition" 
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
                          onDelete?.(p.id)
                        }
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition" 
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paiementsFiltrés.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-gray-500 text-sm">Aucun paiement ne correspond à vos critères de recherche.</p>
        </div>
      )}
    </div>
  )
}
