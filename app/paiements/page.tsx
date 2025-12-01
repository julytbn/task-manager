"use client"
import { useState } from 'react'
import PaiementsOverview from '@/components/PaiementsOverview'
import PaiementsTable from '@/components/PaiementsTable'
import PaiementDetailModal from '@/components/PaiementDetailModal'
import PaiementEditModal from '@/components/PaiementEditModal'
import { Plus } from 'lucide-react'

// Mock data - à remplacer par des vraies données depuis l'API
const mockPaiements = [
  {
    id: '1',
    client: 'Entreprise ABC',
    projet: 'App Mobile',
    montantTotal: 5000000,
    montantPayé: 3000000,
    soldeRestant: 2000000,
    methodePaiement: 'Transfert bancaire',
    statut: 'partiel' as const,
    date: '2025-11-27',
  },
  {
    id: '2',
    client: 'Dupont Jean',
    projet: 'Infrastructure',
    montantTotal: 3000000,
    montantPayé: 3000000,
    soldeRestant: 0,
    methodePaiement: 'Mobile money',
    statut: 'payé' as const,
    date: '2025-11-20',
  },
  {
    id: '3',
    client: 'Garnier Hervé',
    projet: 'Design UI Kit',
    montantTotal: 2000000,
    montantPayé: 0,
    soldeRestant: 2000000,
    methodePaiement: 'Chèque',
    statut: 'impayé' as const,
    date: '2025-11-15',
  },
]

export default function PaiementsPage() {
  const [selectedPaiementId, setSelectedPaiementId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [paiements, setPaiements] = useState(mockPaiements)

  const handleViewDetails = (id: string) => {
    setSelectedPaiementId(id)
    setIsDetailOpen(true)
  }

  const handleEdit = (id: string) => {
    setSelectedPaiementId(id)
    setIsEditOpen(true)
  }

  const handleSaveEdit = (updatedPaiement: any) => {
    setPaiements(
      paiements.map((p) => (p.id === updatedPaiement.id ? updatedPaiement : p))
    )
    setIsEditOpen(false)
    alert('Paiement modifié avec succès')
  }

  const handleDelete = (id: string) => {
    const paiement = paiements.find((p) => p.id === id)
    
    // Règles de suppression selon le statut
    if (paiement?.statut === 'payé') {
      alert('❌ Impossible de supprimer un paiement confirmé. Veuillez le marquer comme remboursé à la place.')
      return
    }

    if (paiement?.statut === 'partiel') {
      const confirmDelete = window.confirm(
        '⚠️ Êtes-vous sûr de vouloir supprimer ce paiement partiel ?\n\nCette action ne peut pas être annulée.'
      )
      if (!confirmDelete) return
    }

    // Suppression autorisée
    setPaiements(paiements.filter((p) => p.id !== id))
    alert('✅ Paiement supprimé avec succès')
  }

  const selectedPaiement = paiements.find((p) => p.id === selectedPaiementId)

  // Calculer les statistiques
  const stats = {
    totalEncaisse: paiements
      .filter((p) => p.statut === 'payé' || p.statut === 'partiel')
      .reduce((sum, p) => sum + p.montantPayé, 0),
    totalRestant: paiements.reduce((sum, p) => sum + p.soldeRestant, 0),
    nombreConfirmes: paiements.filter((p) => p.statut === 'payé').length,
    nombreEnAttente: paiements.filter((p) => p.statut === 'impayé').length,
  }

  const detailPaiement = selectedPaiement
    ? {
        id: selectedPaiement.id,
        client: selectedPaiement.client,
        service: 'Service de développement',
        projet: selectedPaiement.projet,
        echeance: '2025-12-31',
        montantTotal: selectedPaiement.montantTotal,
        montantPayé: selectedPaiement.montantPayé,
        soldeRestant: selectedPaiement.soldeRestant,
        methodePaiement: selectedPaiement.methodePaiement,
        statut: selectedPaiement.statut,
        preuvePaiement: selectedPaiement.statut === 'payé' ? 'Facture_Projet_001.pdf' : undefined,
      }
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💵 Paiements</h1>
          <p className="text-gray-600 mt-2">Gérez et suivez tous les paiements de vos projets</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg">
          <Plus size={20} />
          Nouveau Paiement
        </button>
      </div>

      {/* Overview Statistics */}
      <PaiementsOverview {...stats} />

      {/* Payments Table */}
      <PaiementsTable 
        paiements={paiements} 
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Detail Modal */}
      {detailPaiement && (
        <PaiementDetailModal
          paiement={detailPaiement}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {selectedPaiement && (
        <PaiementEditModal
          paiement={selectedPaiement}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}
