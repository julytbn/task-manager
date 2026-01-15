"use client"
import { useEffect, useState } from 'react'
import PaiementsOverview from '../../components/PaiementsOverview'
import PaiementsTable from '../../components/PaiementsTable'
import PaiementDetailModal from '@/components/PaiementDetailModal'
import PaiementEditModal from '@/components/PaiementEditModal'
import NouveauPaiementModal from '@/components/NouveauPaiementModal'
import { Plus } from 'lucide-react'
import MainLayout from '@/components/layouts/MainLayout'

export type Paiement = {
  id: string
  montant: number
  moyenPaiement: 'ESPECES' | 'CHEQUE' | 'VIREMENT_BANCAIRE' | 'CARTE_BANCAIRE' | 'MOBILE_MONEY' | 'PAYPAL' | 'AUTRE'
  reference?: string | null
  datePaiement: string | Date
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'REFUSE' | 'REMBOURSE'
  notes?: string | null
  clientId: string
  factureId: string
  client?: {
    id: string
    nom: string
    prenom?: string | null
  }
  facture?: {
    id: string
    numero: string
    montantTotal?: number
    montant?: number
    statut: string
    paiements?: Array<{
      id: string
      montant: number
    }>
    client?: {
      id: string
      nom: string
      prenom?: string | null
    }
    projet?: {
      id: string
      nom: string
      projetServices?: Array<{
        id: string
        ordre: number
        service?: {
          id: string
          nom: string
          description?: string | null
          tarif: number
        }
      }>
    }
  }
  projet?: {
    id: string
    nom: string
    projetServices?: Array<{
      id: string
      ordre: number
      service?: {
        id: string
        nom: string
        description?: string | null
        tarif: number
      }
    }>
  } | null
  tache?: {
    id: string
    titre: string
  } | null
}

export default function PaiementsPage() {
  const [selectedPaiementId, setSelectedPaiementId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les paiements avec les relations nécessaires
  useEffect(() => {
    const fetchPaiements = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/paiements?all=true')
        if (!res.ok) throw new Error('Erreur API paiements')
        const data = await res.json()
        
        // Mapper les données reçues de l'API
        const paiementsData = data.payments || []
        
        // Mapper les données pour correspondre au type attendu
        const formattedPaiements = paiementsData.map((p: any) => ({
          id: p.id,
          montant: p.montant,
          moyenPaiement: p.moyenPaiement,
          reference: p.reference,
          datePaiement: p.datePaiement,
          statut: p.statut,
          notes: p.notes,
          clientId: p.clientId,
          factureId: p.factureId,
          client: p.client ? {
            id: p.client.id,
            nom: p.client.nom,
            prenom: p.client.prenom
          } : undefined,
          facture: p.facture ? {
            id: p.facture.id,
            numero: p.facture.numero,
            montantTotal: p.facture.montantTotal || 0,
            montant: p.facture.montant || 0,
            statut: p.facture.statut,
            paiements: p.facture.paiements ? p.facture.paiements.map((pmt: any) => ({
              id: pmt.id,
              montant: pmt.montant
            })) : [],
            client: p.facture.client ? {
              id: p.facture.client.id,
              nom: p.facture.client.nom,
              prenom: p.facture.client.prenom
            } : undefined,
            projet: p.facture.projet ? {
              id: p.facture.projet.id,
              nom: p.facture.projet.nom,
              projetServices: p.facture.projet.projetServices
            } : undefined
          } : undefined,
          projet: p.projet ? {
            id: p.projet.id,
            nom: p.projet.nom,
            projetServices: p.projet.projetServices
          } : (p.facture?.projet ? {
            id: p.facture.projet.id,
            nom: p.facture.projet.nom,
            projetServices: p.facture.projet.projetServices
          } : (p.tache?.projet ? {
            id: p.tache.projet.id,
            nom: p.tache.projet.nom,
            projetServices: (p.tache.projet as any).projetServices
          } : null)),
          tache: p.tache ? {
            id: p.tache.id,
            titre: p.tache.titre
          } : null
        }))
        
        setPaiements(formattedPaiements)
        setError(null)
      } catch (err) {
        console.error('Erreur lors du chargement des paiements:', err)
        setError('Erreur lors du chargement des paiements')
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
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des paiements...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
            <h3 className="text-red-900 font-semibold mb-2">Erreur</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
            >
              Réessayer
            </button>
          </div>
        ) : paiements.length > 0 ? (
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
