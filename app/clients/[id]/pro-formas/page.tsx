'use client'

import React, { useState, useEffect } from 'react'
import { Eye, Download, Trash2 } from 'lucide-react'
import ProFormaPreview from '@/components/ProFormaPreview'
import { exportProFormaToPDF } from '@/lib/pdfExport'

type ProForma = {
  id: string
  numero?: string
  client: {
    prenom: string
    nom: string
    adresse?: string
  }
  description?: string
  dateEcheance?: string
  montant: number
  notes?: string
  lignes: Array<{
    designation: string
    intervenant?: string
    montant: number
  }>
}

export default function ProFormaDetails({ params }: { params: { clientId: string } }) {
  const [proFormas, setProFormas] = useState<ProForma[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProForma, setSelectedProForma] = useState<ProForma | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchProFormas()
  }, [params.clientId])

  const fetchProFormas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pro-formas?clientId=${params.clientId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setProFormas(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr?')) return
    try {
      const res = await fetch(`/api/pro-formas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      await fetchProFormas()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDownload = (proForma: ProForma) => {
    // Générer un PDF à partir de l'aperçu
    setSelectedProForma(proForma)
    setShowPreview(true)

    // attendre le rendu du preview puis exporter
    setTimeout(async () => {
      try {
        await exportProFormaToPDF('proforma-preview', `${(proForma.numero || 'proforma')}-${proForma.id}.pdf`)
      } catch (err) {
        console.error('Erreur export PDF:', err)
        alert('Erreur lors de la génération du PDF')
      }
    }, 600)
  }

  if (showPreview && selectedProForma) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">📄 Pro Forma {selectedProForma.numero || ''}</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-white hover:bg-white/20 p-2 rounded"
            >
              ✕
            </button>
          </div>

          {/* Preview */}
          <div className="p-8 bg-gray-100">
            <div className="bg-white">
              <ProFormaPreview
                clientName={`${selectedProForma.client.prenom} ${selectedProForma.client.nom}`}
                clientAddress={selectedProForma.client.adresse || 'Adresse non renseignée'}
                description={selectedProForma.description}
                dateEcheance={selectedProForma.dateEcheance}
                lignes={selectedProForma.lignes}
                notes={selectedProForma.notes}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end p-6 border-t bg-white">
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-medium hover:bg-[var(--color-gold-accent)] transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pro Formas</h2>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : proFormas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Aucune pro-forma trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Numéro</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Montant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date échéance</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {proFormas.map(pf => (
                <tr key={pf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{pf.numero || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{pf.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {pf.montant.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {pf.dateEcheance ? new Date(pf.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button
                      onClick={() => {
                        setSelectedProForma(pf)
                        setShowPreview(true)
                      }}
                      className="text-[var(--color-gold)] hover:text-[var(--color-gold-accent)]"
                      title="Aperçu"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDownload(pf)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Télécharger"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(pf.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
