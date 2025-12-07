"use client"
import { useEffect, useState } from 'react'
import PaiementsOverview from '../../components/PaiementsOverview'
import PaiementsTable from '../../components/PaiementsTable'
import PaiementDetailModal from '@/components/PaiementDetailModal'
import PaiementEditModal from '@/components/PaiementEditModal'
import NouveauPaiementModal from '@/components/NouveauPaiementModal'
import { Plus } from 'lucide-react'
import MainLayout from '../../components/MainLayout'

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

export default function PaiementsPage() {
  const [selectedPaiementId, setSelectedPaiementId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ NOUVELLE: Charger depuis API
  useEffect(() => {
    const fetchPaiements = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/paiements')
        if (!res.ok) throw new Error('Erreur API paiements')
        const data = await res.json()
        // API returns either { payments: [...] } or { recent: [...] } or { totals, payments }.
        const list = data?.payments ?? data?.recent ?? data ?? []
        const items = Array.isArray(list) ? list : []
        console.log('✅ Paiements chargés:', items.length, 'items')
        setPaiements(items)
        setError(null)
      } catch (err) {
        console.error('❌ Erreur fetch:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchPaiements()
  }, [])

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
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement?')
    if (!confirmed) return
    
    try {
      const res = await fetch(`/api/paiements`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setPaiements(paiements.filter((p) => p.id !== id))
      }
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const handleSaveNewPaiement = (newPaiement: any) => {
    setPaiements([newPaiement, ...paiements])
    setIsCreateOpen(false)
  }

  const selectedPaiement = paiements.find((p) => p.id === selectedPaiementId)

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paiements...</p>
        </div>
      </div>
    )
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-900 font-semibold mb-2">Erreur</h3>
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gold-gradient-text">💵 Paiements</h1>
          <p className="text-[var(--color-anthracite)] mt-2">
            {paiements.length} paiement{paiements.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg hover:bg-[var(--color-gold-accent)] transition font-medium shadow-lg"
        >
          <Plus size={20} />
          Nouveau Paiement
        </button>
      </div>

      {/* Overview Statistics */}
      <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6 mb-6">
        <PaiementsOverview paiements={paiements} />
      </div>

      {/* Payments Table */}
      <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
        {paiements.length > 0 ? (
          <PaiementsTable 
            paiements={paiements} 
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--color-anthracite)]">Aucun paiement trouvé</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPaiement && (
        <PaiementDetailModal
          paiement={selectedPaiement as any}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {selectedPaiement && (
        <PaiementEditModal
          paiement={selectedPaiement as any}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Create Modal */}
      <NouveauPaiementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleSaveNewPaiement}
      />
      </div>
    </MainLayout>
  )
}
