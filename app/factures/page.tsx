"use client"
import { useEffect, useState } from 'react'
import Link from "next/link"
import { Plus, Eye, Download } from 'lucide-react'
import MainLayout from "@/components/MainLayout"
import NouveauFactureModal from "@/components/NouveauFactureModal"
import NouveauPaiementModal from "@/components/NouveauPaiementModal"
import EditFactureModal from "@/components/EditFactureModal"
import { downloadFacturePDF, previewFacturePDF } from '@/lib/factureGenerator'
import { useEnums } from '@/lib/useEnums'

type Facture = {
  id: string
  numero: string
  client: { id: string; nom: string }
  service?: { id: string; nom: string }
  projet?: { id: string; titre: string }
  statut: string
  montant: number
  montantTotal: number
  montantPaye?: number
  dateEmission: string
  dateEcheance?: string | null
}

export default function FacturesPage() {
  const { data: statutsFactures } = useEnums('statuts-factures')
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null)
  const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null)

  useEffect(() => {
    // Initial load
    const fetchFactures = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/factures')
        if (!res.ok) throw new Error('Erreur récupération factures')
        const data = await res.json()
        setFactures(data || [])
        setError(null)
      } catch (err) {
        setError((err as any).message || 'Erreur')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchFactures()
  }, [])

  const getStatusBadge = (statut: string) => {
    const statusEnum = statutsFactures?.find((s: any) => s.id === statut)
    const colorMap: Record<string, string> = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      PAYEE: 'bg-green-100 text-green-800',
      REMBOURSEE: 'bg-blue-100 text-blue-800',
      ANNULEE: 'bg-red-100 text-red-800'
    }
    return {
      color: colorMap[statut] || 'bg-gray-100 text-gray-800',
      label: statusEnum?.label || statut
    }
  }

  const handleSaveNewFacture = (newFacture: any) => {
    setFactures([newFacture, ...factures])
    setIsCreateOpen(false)
    alert('✅ Facture créée avec succès')
  }

  const handlePreviewFacture = (facture: Facture) => {
    const factureData = {
      ...facture,
      client: facture.client,
      taches: [],
      // Ensure dateEcheance is undefined when null to satisfy FactureData type
      dateEcheance: facture.dateEcheance ?? undefined,
    }
    previewFacturePDF(factureData)
  }

  const handleDownloadFacture = (facture: Facture) => {
    const factureData = {
      ...facture,
      client: facture.client,
      taches: [],
      dateEcheance: facture.dateEcheance ?? undefined,
    }
    downloadFacturePDF(factureData)
  }

  const handleOpenEdit = (facture: Facture) => {
    setEditingFacture(facture)
    setIsEditOpen(true)
  }

  const handleSaveEditFacture = (updated: any) => {
    // Mettre à jour localement immédiatement
    setFactures((prev) => prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)))
    alert('✅ Facture mise à jour')
    // Rafraîchir la liste depuis le serveur pour s'assurer d'avoir les champs calculés (ex: restant)
    ;(async () => {
      try {
        const res = await fetch('/api/factures')
        if (!res.ok) throw new Error('Erreur récupération factures')
        const data = await res.json()
        setFactures(data || [])
      } catch (err) {
        console.error('Erreur rafraîchissement factures:', err)
      }
    })()
  }

  return (
    <MainLayout>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gold-gradient-text">Factures</h1>
          <p className="text-[var(--color-anthracite)] mt-2">{factures.length} facture{factures.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg hover:bg-[var(--color-gold-accent)] transition font-medium"
        >
          <Plus size={20} />
          Nouvelle Facture
        </button>
      </div>

      {loading && <div className="text-center py-8 text-[var(--color-anthracite)]">Chargement...</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

      {!loading && !error && factures.length === 0 && (
        <div className="text-center py-12 text-[var(--color-anthracite)]">Aucune facture trouvée</div>
      )}

      {!loading && !error && factures.length > 0 && (
        <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-[var(--color-gold)]/10 border-b border-[var(--color-border)] sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">N° Facture</th>
                <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Client</th>
                <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Date émission</th>
                <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Date échéance</th>
                <th className="px-6 py-3 text-right font-semibold text-[var(--color-gold)]">Montant TTC</th>
                <th className="px-6 py-3 text-right font-semibold text-[var(--color-gold)]">Payé</th>
                <th className="px-6 py-3 text-right font-semibold text-[var(--color-gold)]">Restant</th>
                <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Statut</th>
                <th className="px-6 py-3 text-center font-semibold text-[var(--color-gold)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((facture) => {
                const badge = getStatusBadge(facture.statut)
                const montantTTC = facture.montantTotal ?? facture.montant
                const montantPaye = facture.montantPaye ?? 0
                const montantRestant = Math.max(0, montantTTC - montantPaye)
                const dateEmission = new Date(facture.dateEmission).toLocaleDateString('fr-FR')
                const dateEcheance = facture.dateEcheance 
                  ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR')
                  : '—'
                
                return (
                  <tr key={facture.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-semibold text-[var(--color-gold)]">{facture.numero}</td>
                    <td className="px-6 py-3 text-[var(--color-anthracite)]">{facture.client.nom}</td>
                    <td className="px-6 py-3 text-[var(--color-anthracite)]">{dateEmission}</td>
                    <td className="px-6 py-3 text-[var(--color-anthracite)]">{dateEcheance}</td>
                    <td className="px-6 py-3 text-right font-semibold text-[var(--color-anthracite)]">
                      {montantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-green-600">
                      {montantPaye.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-red-600">
                      {montantRestant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/factures/${facture.id}`} 
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-xs" 
                          title="Voir la facture"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition text-xs"
                          title="Télécharger la facture"
                          onClick={() => handleDownloadFacture(facture)}
                        >
                          <Download size={14} />
                        </button>
                        {facture.statut !== 'PAYEE' && (
                          <button
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition text-xs"
                            title="Ajouter Paiement"
                            onClick={() => { setSelectedFacture(facture); setIsPaiementModalOpen(true); }}
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <NouveauFactureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleSaveNewFacture}
      />

      {/* Edit Modal */}
      <EditFactureModal
        isOpen={isEditOpen}
        facture={editingFacture ? { ...editingFacture, dateEcheance: editingFacture.dateEcheance ?? undefined } : null}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveEditFacture}
      />

      {/* Modal Nouveau Paiement */}
      {selectedFacture && (
        <NouveauPaiementModal
          isOpen={isPaiementModalOpen}
          onClose={() => { setIsPaiementModalOpen(false); setSelectedFacture(null); }}
          onSave={async (paiement: any) => {
            if (!selectedFacture) return;
            try {
              const res = await fetch('/api/paiements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  montant: paiement.montantPayé || paiement.montantTotal,
                  factureId: selectedFacture.id,
                  clientId: selectedFacture.client.id,
                  projetId: selectedFacture.projet?.id,
                  methodePaiement: paiement.methodePaiement,
                  datePaiement: paiement.date,
                  notes: paiement.notes,
                })
              });
              if (!res.ok) throw new Error('Erreur enregistrement paiement');
              const result = await res.json();
              setIsPaiementModalOpen(false);
              setSelectedFacture(null);
              alert('✅ Paiement enregistré. Nouveau statut: ' + result.nouveauStatut);
              // Rafraîchir la liste des factures pour afficher le nouveau statut
              setLoading(true);
              const resFactures = await fetch('/api/factures');
              const dataFactures = await resFactures.json();
              setFactures(dataFactures || []);
              setLoading(false);
            } catch (err) {
              alert('Erreur lors de la création du paiement');
            }
          }}
          clientName={selectedFacture.client.nom}
          projets={selectedFacture.projet ? [selectedFacture.projet] : []}
        />
      )}
    </div>
    </MainLayout>
  )
}
