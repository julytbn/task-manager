'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Eye } from 'lucide-react'
import ProFormaPreview from './ProFormaPreview'
import { exportProFormaToPDF } from '@/lib/pdfExport'

type ProFormaLigne = {
  id?: string
  designation: string
  montant: number
  intervenant?: string
  type?: string
  ordre: number
}

type ProFormaModalProps = {
  clientId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  projets?: Array<{ id: string; titre: string }>
  editingProForma?: any
}

export default function ProFormaModal({
  clientId,
  isOpen,
  onClose,
  onSuccess,
  projets = [],
  editingProForma
}: ProFormaModalProps) {
  console.log('[ProFormaModal] Props received - clientId:', clientId, 'projets count:', projets?.length, 'projets:', projets)
  
  const [formData, setFormData] = useState({
    description: '',
    projetId: '',
    dateEcheance: '',
    notes: '',
    lignes: [] as ProFormaLigne[]
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const [localProjets, setLocalProjets] = useState<any[]>(projets || [])

  // Récupérer les infos du client et charger la pro-forma si en édition
  useEffect(() => {
    if (isOpen && clientId) {
      // Récupérer les infos du client
      fetch(`/api/clients/${clientId}`)
        .then(res => res.json())
        .then(data => {
          console.log('[ProFormaModal] Client data fetched:', data)
          console.log('[ProFormaModal] Client projets from API:', data?.projets)
          setClientData(data)
          
          // Si les projets viennent de l'API ET qu'on n'avait pas reçu via props, les utiliser
          if (data?.projets && Array.isArray(data.projets) && data.projets.length > 0) {
            console.log('[ProFormaModal] Using projets from API client')
            setLocalProjets(data.projets)
          } else if (projets && projets.length > 0) {
            console.log('[ProFormaModal] Using projets from props')
            setLocalProjets(projets)
          } else {
            console.warn('[ProFormaModal] No projets found from API or props')
            setLocalProjets([])
          }
        })
        .catch(err => console.error('[ProFormaModal] Erreur fetch client:', err))

      // Si édition, charger les données de la pro-forma
      if (editingProForma) {
        setFormData({
          description: editingProForma.description || '',
          projetId: editingProForma.projetId || '',
          dateEcheance: editingProForma.dateEcheance || '',
          notes: editingProForma.notes || '',
          lignes: editingProForma.lignes || []
        })
      } else {
        // Sinon initialiser une ligne vide
        if (formData.lignes.length === 0) {
          setFormData(prev => ({
            ...prev,
            lignes: [{ designation: '', montant: 0, type: 'MAIN_D_OEUVRE', ordre: 0 }]
          }))
        }
      }
    }
  }, [isOpen, clientId, editingProForma, projets])

  const addLigne = () => {
    setFormData(prev => ({
      ...prev,
      lignes: [
        ...prev.lignes,
        {
          designation: '',
          montant: 0,
          type: 'MAIN_D_OEUVRE',
          ordre: prev.lignes.length
        }
      ]
    }))
  }

  const removeLigne = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }))
  }

  const updateLigne = (index: number, field: keyof ProFormaLigne, value: any) => {
    const newLignes = [...formData.lignes]
    newLignes[index] = {
      ...newLignes[index],
      [field]: value
    }
    setFormData(prev => ({ ...prev, lignes: newLignes }))
  }

  const calculateTotals = () => {
    const totalHT = formData.lignes.reduce((sum, l) => sum + (l.montant || 0), 0)
    return totalHT
  }

  const totalHT = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Valider qu'au moins une ligne existe
      if (formData.lignes.length === 0 || formData.lignes.every(l => !l.designation)) {
        setError('Au moins une ligne avec désignation est requise')
        setLoading(false)
        return
      }

      const payload = {
        clientId,
        description: formData.description,
        projetId: formData.projetId || undefined,
        dateEcheance: formData.dateEcheance || undefined,
        montant: totalHT,
        notes: formData.notes,
        lignes: formData.lignes.filter(l => l.designation)
      }

      // Si édition, utiliser PUT, sinon POST
      const method = editingProForma ? 'PUT' : 'POST'
      const url = editingProForma ? `/api/pro-formas/${editingProForma.id}` : '/api/pro-formas'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Erreur ${editingProForma ? 'modification' : 'création'} pro-forma`)
      }

      // Succès
      setFormData({
        description: '',
        projetId: '',
        dateEcheance: '',
        notes: '',
        lignes: []
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError((err as any).message || 'Erreur')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">📄 Aperçu Pro Forma</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-white hover:bg-white/20 p-2 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Preview */}
          <div className="p-8 bg-gray-100">
            <div className="bg-white">
              <ProFormaPreview
                clientName={clientData ? `${clientData.prenom} ${clientData.nom}` : 'Nom du Client'}
                clientAddress={clientData?.adresse || 'Adresse du client'}
                description={formData.description}
                dateEcheance={formData.dateEcheance}
                lignes={formData.lignes.filter(l => l.designation)}
                notes={formData.notes}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end p-6 border-t bg-white">
            <button
              onClick={async () => {
                try {
                  const filename = `ProForma_${(clientData?.nom || clientData?.prenom || clientId)}_${new Date().toISOString().slice(0,10)}.pdf`
                  await exportProFormaToPDF('proforma-preview', filename)
                } catch (err) {
                  console.error(err)
                  alert('Erreur lors de l\'export du PDF')
                }
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 mr-2"
            >
              Télécharger
            </button>

            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-medium hover:bg-[var(--color-gold-accent)] transition"
            >
              Retour à l'édition
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">✨ {editingProForma ? 'Modifier' : 'Créer'} Pro Forma</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 📌 Info Clarification */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-sm text-blue-900 mb-2">💡 Important : Clarification sur les Montants</h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Les montants saisis incluent la main d'œuvre et les frais de prestation. 
              Après déduction des coûts externes, le solde constitue le bénéfice net de l'entreprise.
            </p>
          </div>          {/* Info client */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Client ID:</strong> {clientId}
            </p>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Projets disponibles:</strong> {localProjets.length} projet{localProjets.length !== 1 ? 's' : ''}
              {localProjets.length > 0 && (
                <span className="text-xs block mt-1">
                  {localProjets.map(p => `${p.titre || p.nom}`).join(', ')}
                </span>
              )}
            </p>
          </div>

          {/* Description & Projet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Ex: Audit fiscal Q4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projet (optionnel)
              </label>
              <select
                value={formData.projetId}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, projetId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              >
                <option value="">-- Sélectionner un projet --</option>
                {Array.isArray(localProjets) && localProjets.length > 0 ? (
                  localProjets.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.titre || p.nom || `Projet ${p.id}`}
                    </option>
                  ))
                ) : (
                  <option disabled>Aucun projet disponible</option>
                )}
              </select>
              {Array.isArray(localProjets) && localProjets.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">⚠️ Aucun projet lié à ce client</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance (optionnel)
              </label>
              <input
                type="date"
                value={formData.dateEcheance}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, dateEcheance: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              />
            </div>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Lignes</h3>
              <button
                type="button"
                onClick={addLigne}
                className="bg-[var(--color-gold)] text-[var(--color-black-deep)] px-3 py-1 rounded flex items-center gap-2 hover:bg-[var(--color-gold-accent)] transition"
              >
                <Plus className="w-4 h-4" />
                Ajouter ligne
              </button>
            </div>

            <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
              {formData.lignes.map((ligne, index) => (
                <div key={index} className="bg-white p-4 rounded border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Désignation
                      </label>
                      <input
                        type="text"
                        value={ligne.designation}
                        onChange={(e) =>
                          updateLigne(index, 'designation', e.target.value)
                        }
                        placeholder="Ex: Audit fiscal Q3"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={ligne.type || 'MAIN_D_OEUVRE'}
                        onChange={(e) =>
                          updateLigne(index, 'type', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                      >
                        <option value="MAIN_D_OEUVRE">Main d'œuvre</option>
                        <option value="FRAIS_EXTERNES">Frais externes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Intervenant (optionnel)
                      </label>
                      <input
                        type="text"
                        value={ligne.intervenant || ''}
                        onChange={(e) =>
                          updateLigne(index, 'intervenant', e.target.value)
                        }
                        placeholder="Ex: Jean Dupont"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Montant HT (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ligne.montant}
                        onChange={(e) =>
                          updateLigne(index, 'montant', Number(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Montant: <strong className="text-[var(--color-gold)]">{ligne.montant.toLocaleString('fr-FR')} FCFA</strong>
                    </span>
                    {formData.lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLigne(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <div className="border-t border-gray-300 pt-2 flex justify-between text-lg">
                <span className="font-bold">TOTAL HT:</span>
                <span className="font-bold text-[var(--color-gold)]">
                  {totalHT.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Conditions de paiement, remarques..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={loading || formData.lignes.length === 0}
              className="px-6 py-2 border-2 border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg font-medium hover:bg-yellow-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={formData.lignes.length === 0 ? 'Ajoutez au moins une ligne pour voir l\'aperçu' : 'Voir un aperçu du pro-forma'}
            >
              <Eye size={18} />
              Aperçu
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || formData.lignes.every(l => !l.designation)}
              className="px-6 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-medium hover:bg-[var(--color-gold-accent)] transition disabled:opacity-50 flex items-center gap-2"
              title={formData.lignes.every(l => !l.designation) ? 'Remplissez au moins une ligne avec une désignation' : `${editingProForma ? 'Modifier' : 'Créer'} le pro-forma`}
            >
              {loading ? '⏳ En cours...' : (editingProForma ? '✅ Modifier Pro Forma' : '✅ Créer Pro Forma')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
