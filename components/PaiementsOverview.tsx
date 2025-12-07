"use client"
import { DollarSign, TrendingDown, CheckCircle2, Clock } from 'lucide-react'

type Paiement = {
  id: string
  client?: string
  projet?: string
  montantTotal?: number
  montantPayé?: number
  soldeRestant?: number
  methodePaiement?: string
  statut: 'payé' | 'partiel' | 'impayé'
  date?: string
  montant?: number
  factureId?: string
  facture?: { numero?: string; client?: { nom?: string } }
}

interface PaiementsOverviewProps {
  paiements: Paiement[]
}

export default function PaiementsOverview({
  paiements,
}: PaiementsOverviewProps) {
  // Calculate totals from paiements array
  const totalEncaisse = paiements.reduce((sum, p) => sum + (p.montantPayé || 0), 0)
  const totalRestant = paiements.reduce((sum, p) => sum + (p.soldeRestant || 0), 0)
  const nombreConfirmes = paiements.filter(p => p.statut === 'payé').length
  const nombreEnAttente = paiements.filter(p => p.statut === 'impayé').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total encaissé */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Total encaissé ce mois</h3>
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign size={20} className="text-green-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {(totalEncaisse || 0).toLocaleString('fr-FR')} FCFA
        </div>
        <p className="text-xs text-green-600 font-medium">↑ +12% ce mois</p>
      </div>

      {/* Restant à percevoir */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Restant à percevoir</h3>
          <div className="p-3 bg-orange-100 rounded-lg">
            <TrendingDown size={20} className="text-orange-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {(totalRestant || 0).toLocaleString('fr-FR')} FCFA
        </div>
        <p className="text-xs text-orange-600 font-medium">À suivre</p>
      </div>

      {/* Paiements confirmés */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Paiements confirmés</h3>
          <div className="p-3 bg-blue-100 rounded-lg">
            <CheckCircle2 size={20} className="text-blue-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {nombreConfirmes}
        </div>
        <p className="text-xs text-blue-600 font-medium">{nombreConfirmes * 100}% complétés</p>
      </div>

      {/* Paiements en attente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">En attente</h3>
          <div className="p-3 bg-red-100 rounded-lg">
            <Clock size={20} className="text-red-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {nombreEnAttente}
        </div>
        <p className="text-xs text-red-600 font-medium">À traiter</p>
      </div>
    </div>
  )
}
