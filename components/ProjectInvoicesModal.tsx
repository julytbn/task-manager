'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

interface Invoice {
  id: string
  numero: string
  montant: number
  tauxTVA: number
  montantTotal: number
  statut?: string
  dateEmission?: string
  dateEcheance?: string
  datePaiement?: string
  notes?: string
}

interface ProjectInvoicesModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  clientId: string
}

function getStatutColor(statut?: string) {
  switch ((statut || '').toLowerCase()) {
    case 'payée':
    case 'payee':
      return 'bg-green-100 text-green-800'
    case 'en_attente':
    case 'en attente':
      return 'bg-yellow-100 text-yellow-800'
    case 'partiellement_payée':
    case 'partiellement payée':
      return 'bg-blue-100 text-blue-800'
    case 'annulée':
    case 'annulee':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(d?: string | Date | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR')
  } catch (e) {
    return '—'
  }
}

export default function ProjectInvoicesModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  clientId,
}: ProjectInvoicesModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [formData, setFormData] = useState({
    numero: '',
    montant: '',
    tauxTVA: '18',
    dateEcheance: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen && projectId) {
      fetchInvoices()
    }
  }, [isOpen, projectId])

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projets/${projectId}/factures`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des factures')
      }
      const data = await response.json()
      setInvoices(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.numero.trim()) {
      alert('Le numéro de facture est requis')
      return
    }

    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      alert('Le montant doit être supérieur à 0')
      return
    }

    try {
      const montant = parseFloat(formData.montant)
      const tauxTVA = parseFloat(formData.tauxTVA) || 18
      const montantTVA = montant * (tauxTVA / 100)
      const montantTotal = montant + montantTVA

      const payload = {
        numero: formData.numero,
        montant: montant,
        tauxTVA: tauxTVA,
        montantTotal: montantTotal,
        dateEcheance: formData.dateEcheance || null,
        notes: formData.notes || null,
        clientId: clientId,
        projetId: projectId
      }

      const response = await fetch(`/api/projets/${projectId}/factures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur lors de la création de la facture')
      }

      // Réinitialiser le formulaire et rafraîchir la liste
      setFormData({
        numero: '',
        montant: '',
        tauxTVA: '18',
        dateEcheance: '',
        notes: ''
      })
      setShowCreateForm(false)
      await fetchInvoices()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création de la facture')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Factures du projet</h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Bouton pour créer une nouvelle facture */}
          {!showCreateForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                <Plus size={16} />
                Nouvelle facture
              </button>
            </div>
          )}

          {/* Formulaire de création */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Créer une nouvelle facture</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de facture *</label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="INV-2024-001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant HT (FCFA) *</label>
                    <input
                      type="number"
                      name="montant"
                      value={formData.montant}
                      onChange={handleFormChange}
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA (%)</label>
                    <input
                      type="number"
                      name="tauxTVA"
                      value={formData.tauxTVA}
                      onChange={handleFormChange}
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                    <input
                      type="date"
                      name="dateEcheance"
                      value={formData.dateEcheance}
                      onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notes optionnelles"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Créer la facture
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des factures */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Chargement des factures...</div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && invoices.length === 0 && (
            <div className="py-12 text-center text-gray-600">
              Aucune facture trouvée pour ce projet.
            </div>
          )}

          {!loading && !error && invoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">NUMÉRO</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">MONTANT HT</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">TVA</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">TOTAL TTC</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">STATUT</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">DATE ÉMISSION</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">DATE ÉCHÉANCE</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700">DATE PAIEMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, idx) => (
                    <tr key={invoice.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="py-3 px-4 font-medium text-slate-800">{invoice.numero}</td>
                      <td className="py-3 px-4 font-semibold">
                        {Number(invoice.montant).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3 px-4">
                        {Number(invoice.tauxTVA).toLocaleString('fr-FR')}% = {Number(invoice.montantTotal - invoice.montant).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {Number(invoice.montantTotal).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatutColor(invoice.statut)}`}>
                          {invoice.statut || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatDate(invoice.dateEmission)}</td>
                      <td className="py-3 px-4">{formatDate(invoice.dateEcheance)}</td>
                      <td className="py-3 px-4">{formatDate(invoice.datePaiement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
