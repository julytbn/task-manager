"use client"
import { useEffect, useState } from 'react'
import Link from "next/link"
import { Plus, Eye, Download } from 'lucide-react'
import UiLayout from "../../components/UiLayout"
import NouveauFactureModal from "@/components/NouveauFactureModal"
import EditFactureModal from "@/components/EditFactureModal"
import { downloadFacturePDF, previewFacturePDF } from '@/lib/factureGenerator'

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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null)

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
    }
    previewFacturePDF(factureData)
  }

  const handleDownloadFacture = (facture: Facture) => {
    const factureData = {
      ...facture,
      client: facture.client,
      taches: [],
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
    <UiLayout showHeader={false}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Factures</h2>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus size={20} />
          Nouvelle Facture
        </button>
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
                <th className="px-6 py-3 text-left font-semibold">Numéro</th>
                <th className="px-6 py-3 text-left font-semibold">Client</th>
                <th className="px-6 py-3 text-left font-semibold">Projet</th>
                <th className="px-6 py-3 text-left font-semibold">Montant</th>
                <th className="px-6 py-3 text-left font-semibold">Restant</th>
                <th className="px-6 py-3 text-left font-semibold">Statut</th>
                <th className="px-6 py-3 text-left font-semibold">Date émission</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((facture) => {
                const badge = getStatusBadge(facture.statut)
                const montantTTC = facture.montantTotal ?? facture.montant
                const restant = (facture as any).restant ?? 0
                return (
                  <tr key={facture.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold">{facture.numero}</td>
                    <td className="px-6 py-3">{facture.client.nom}</td>
                    <td className="px-6 py-3">{facture.projet?.titre || '—'}</td>
                    <td className="px-6 py-3 font-medium">{(montantTTC).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</td>
                    <td className="px-6 py-3 text-gray-600">{(restant).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3">{new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handlePreviewFacture(facture)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm"
                          title="Aperçu"
                        >
                          <Eye size={14} />
                          Aperçu
                        </button>
                        <button
                          onClick={() => handleDownloadFacture(facture)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition text-sm"
                          title="Télécharger"
                        >
                          <Download size={14} />
                          Télécharger
                        </button>
                        <button
                          onClick={() => handleOpenEdit(facture)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition text-sm"
                          title="Modifier"
                        >
                          Modifier
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
        facture={editingFacture}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveEditFacture}
      />
    </UiLayout>
  )
}
