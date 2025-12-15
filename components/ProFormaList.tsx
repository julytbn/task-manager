'use client'

import React, { useState } from 'react'
import { Download, Trash2, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import ProFormaPreview from './ProFormaPreview'
import { exportProFormaToPDF } from '@/lib/pdfExport'

type ProFormaLigne = {
  id: string
  designation: string
  montant: number
  intervenant?: string
  ordre: number
}

type ProForma = {
  id: string
  numero: string
  description?: string
  montant: number
  montantTotal: number
  statut: string
  dateCreation: string
  dateEcheance?: string
  dateValidation?: string
  notes?: string
  lignes: ProFormaLigne[]
  client: {
    id: string
    nom: string
    prenom: string
    entreprise?: string
  }
  projet?: {
    id: string
    titre: string
  }
}

type ProFormaListProps = {
  proFormas: ProForma[]
  onEdit?: (proForma: ProForma) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
}

const getStatusColor = (statut: string) => {
  switch (statut) {
    case 'EN_COURS':
      return { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock }
    case 'ACCEPTEE':
      return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }
    case 'REJETEE':
      return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    case 'FACTUREE':
      return { bg: 'bg-purple-100', text: 'text-purple-800', icon: FileText }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock }
  }
}

const getStatusLabel = (statut: string) => {
  const labels: Record<string, string> = {
    EN_COURS: 'En cours',
    ACCEPTEE: 'Acceptée',
    REJETEE: 'Rejetée',
    FACTUREE: 'Facturée',
    EXPIREE: 'Expirée'
  }
  return labels[statut] || statut
}

export default function ProFormaList({
  proFormas = [],
  onEdit,
  onDelete,
  onRefresh
}: ProFormaListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pro-formas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      setDeleteConfirm(null)
      onDelete?.(id)
      onRefresh?.()
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const handleConvertToInvoice = async (id: string) => {
    try {
      setConvertingId(id)
      const res = await fetch(`/api/pro-formas/${id}/convert-to-invoice`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Erreur conversion')
      const data = await res.json()
      alert(`Pro-forma convertie en facture: ${data.facture.numero}`)
      onRefresh?.()
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la conversion')
    } finally {
      setConvertingId(null)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/pro-formas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus })
      })
      if (!res.ok) throw new Error('Erreur mise à jour')
      onRefresh?.()
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const downloadPDF = async (pf: ProForma) => {
    try {
      // Rendre temporairement le composant d'aperçu dans le DOM afin d'avoir les mêmes styles
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = '800px'
      tempDiv.style.background = '#FFFFFF'
      document.body.appendChild(tempDiv)

      const root = createRoot(tempDiv)
      root.render(
        <div style={{ padding: '20mm', background: '#fff' }}>
          <ProFormaPreview
            clientName={`${pf.client.prenom || ''} ${pf.client.nom || ''}`.trim() || 'Client'}
            clientAddress={pf.client.entreprise || ''}
            description={pf.description}
            dateEcheance={pf.dateEcheance}
            lignes={pf.lignes}
            notes={pf.notes}
            elementId="proforma-preview-temp"
          />
        </div>
      )

      // Laisser React monter et les images se charger
      await new Promise(resolve => setTimeout(resolve, 1000))

      const previewElement = document.getElementById('proforma-preview-temp')
      if (previewElement) {
        // Forcer la recalcul de la hauteur
        const height = previewElement.scrollHeight
        console.log(`ProForma ${pf.numero} - preview height: ${height}px`)
      }

      await exportProFormaToPDF('proforma-preview-temp', `ProForma_${pf.numero}.pdf`)

      // Nettoyer
      root.unmount()
      document.body.removeChild(tempDiv)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du PDF. Vérifier la console pour plus de détails.')
    }
  }

  if (proFormas.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">Aucune pro-forma</p>
        <p className="text-gray-400 text-sm">Commencez par créer une nouvelle pro-forma</p>
      </div>
    )
  }

  // Grouper par statut
  const groupedByStatus = proFormas.reduce((acc, pf) => {
    if (!acc[pf.statut]) acc[pf.statut] = []
    acc[pf.statut].push(pf)
    return acc
  }, {} as Record<string, ProForma[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedByStatus).map(([statut, items]) => {
        const statusConfig = getStatusColor(statut)
        const StatusIcon = statusConfig.icon

        return (
          <div key={statut} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
              {getStatusLabel(statut)} ({items.length})
            </h3>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((pf) => {
                const statusColor = getStatusColor(pf.statut)
                const ProFormaStatusIcon = statusColor.icon

                return (
                  <div key={pf.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* En-tête avec couleur de statut */}
                    <div 
                      className={`${statusColor.bg} ${statusColor.text} px-4 py-2 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <ProFormaStatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{getStatusLabel(pf.statut)}</span>
                      </div>
                      <span className="text-xs opacity-80">#{pf.numero}</span>
                    </div>

                    {/* Corps de la carte */}
                    <div className="p-4">
                      <div className="space-y-3">
                        {/* Ligne client */}
                        <div>
                          <p className="text-xs text-gray-500">Client</p>
                          <p className="text-sm font-medium text-gray-900">
                            {pf.client.nom} {pf.client.prenom}
                            {pf.client.entreprise && ` (${pf.client.entreprise})`}
                          </p>
                        </div>

                        {/* Ligne projet si disponible */}
                        {pf.projet && (
                          <div>
                            <p className="text-xs text-gray-500">Projet</p>
                            <p className="text-sm text-gray-900">{pf.projet.titre}</p>
                          </div>
                        )}

                        {/* Ligne montant */}
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500">Montant</p>
                          <p className="text-lg font-bold text-gray-900">
                            {(pf.montantTotal || pf.montant || 0).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} €
                          </p>
                        </div>

                        {/* Ligne date */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            Créée le {new Date(pf.dateCreation).toLocaleDateString('fr-FR')}
                          </span>
                          {pf.dateEcheance && (
                            <span className="font-medium">
                              Échéance: {new Date(pf.dateEcheance).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {pf.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">Notes</p>
                          <p className="text-sm text-gray-700 italic">{pf.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                        <button
                          onClick={() => downloadPDF(pf)}
                          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEdit?.(pf)}
                          className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>

                        {deleteConfirm === pf.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => handleDelete(pf.id)}
                              className="p-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Confirmer
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(pf.id)}
                            className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Boutons de gestion des statuts */}
                        {pf.statut === 'EN_COURS' && (
                          <button
                            onClick={() => handleUpdateStatus(pf.id, 'ACCEPTEE')}
                            className="p-2 text-amber-500 hover:text-amber-700 rounded-full hover:bg-amber-50"
                            title="Valider le pro-forma"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                        )}

                        {pf.statut === 'ACCEPTEE' && (
                          <button
                            onClick={() => handleConvertToInvoice(pf.id)}
                            className="p-2 text-green-500 hover:text-green-700 rounded-full hover:bg-green-50"
                            disabled={convertingId === pf.id}
                            title="Convertir en facture"
                          >
                            {convertingId === pf.id ? (
                              <span className="animate-spin text-sm">⟳</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                            )}
                          </button>
                        )}

                        {pf.statut === 'REJETEE' && (
                          <button
                            onClick={() => handleUpdateStatus(pf.id, 'EN_COURS')}
                            className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50"
                            title="Réactiver le pro-forma"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 4 23 10 17 10"></polyline>
                              <path d="M20.49 15a9 9 0 1 1 .12-4.95"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
