'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MainLayout from '@/components/layouts/MainLayout'
import { Eye, EyeOff, Plus, Trash2, ArrowLeft } from 'lucide-react'

interface LigneEntree {
  id: string
  designation: string
  quantite: number
  prixUnitaire: number
  totalHT: number
}

interface Entree {
  id: string
  date: string
  reference: string
  lignes: LigneEntree[]
  remise: number
  sousTotal: number
  tauxTVA: number
  montantTVA: number
  montantTTC: number
}

interface ValidationError {
  field: string
  message: string
}

export default function UploadEntreesPage() {
  const router = useRouter()
  const params = useParams() as { id: string } | null
  const clientId = params?.id || ''

  // Initialiser les entrées avec une par défaut
  const [entrees, setEntrees] = useState<Entree[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      lignes: [
        { id: '1', designation: '', quantite: 1, prixUnitaire: 0, totalHT: 0 }
      ],
      remise: 0,
      sousTotal: 0,
      tauxTVA: 18,
      montantTVA: 0,
      montantTTC: 0
    }
  ])

  const [expandedIndex, setExpandedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [success, setSuccess] = useState(false)

  // Calculer les totaux pour une entrée
  const calculateEntreeTotals = (entree: Entree): Entree => {
    const sousTotal = entree.lignes.reduce((sum, l) => sum + (l.totalHT || 0), 0)
    const montantAfterRemise = sousTotal - (entree.remise || 0)
    const montantTVA = (montantAfterRemise * (entree.tauxTVA || 0)) / 100
    const montantTTC = montantAfterRemise + montantTVA

    return {
      ...entree,
      sousTotal: Math.round(sousTotal * 100) / 100,
      montantTVA: Math.round(montantTVA * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100
    }
  }

  // Mettre à jour une entrée
  const updateEntree = (index: number, updates: Partial<Entree>) => {
    const newEntrees = [...entrees]
    newEntrees[index] = calculateEntreeTotals({ ...newEntrees[index], ...updates })
    setEntrees(newEntrees)
  }

  // Mettre à jour une ligne
  const updateLigne = (entreeIndex: number, ligneIndex: number, updates: Partial<LigneEntree>) => {
    const newEntrees = [...entrees]
    const ligne = { ...newEntrees[entreeIndex].lignes[ligneIndex], ...updates }
    
    // Calculer le totalHT
    if ('prixUnitaire' in updates || 'quantite' in updates) {
      ligne.totalHT = Math.round(ligne.quantite * ligne.prixUnitaire * 100) / 100
    }
    
    newEntrees[entreeIndex].lignes[ligneIndex] = ligne
    newEntrees[entreeIndex] = calculateEntreeTotals(newEntrees[entreeIndex])
    setEntrees(newEntrees)
  }

  // Ajouter une ligne
  const addLigne = (entreeIndex: number) => {
    const newEntrees = [...entrees]
    const newId = String(Math.max(...newEntrees[entreeIndex].lignes.map(l => parseInt(l.id))) + 1)
    newEntrees[entreeIndex].lignes.push({
      id: newId,
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      totalHT: 0
    })
    newEntrees[entreeIndex] = calculateEntreeTotals(newEntrees[entreeIndex])
    setEntrees(newEntrees)
  }

  // Supprimer une ligne
  const removeLigne = (entreeIndex: number, ligneIndex: number) => {
    const newEntrees = [...entrees]
    newEntrees[entreeIndex].lignes.splice(ligneIndex, 1)
    if (newEntrees[entreeIndex].lignes.length === 0) {
      newEntrees[entreeIndex].lignes.push({
        id: '1',
        designation: '',
        quantite: 1,
        prixUnitaire: 0,
        totalHT: 0
      })
    }
    newEntrees[entreeIndex] = calculateEntreeTotals(newEntrees[entreeIndex])
    setEntrees(newEntrees)
  }

  // Ajouter une entree
  const addEntree = () => {
    const newId = String(Math.max(...entrees.map(e => parseInt(e.id))) + 1)
    setEntrees([
      ...entrees,
      {
        id: newId,
        date: new Date().toISOString().split('T')[0],
        reference: '',
        lignes: [
          { id: '1', designation: '', quantite: 1, prixUnitaire: 0, totalHT: 0 }
        ],
        remise: 0,
        sousTotal: 0,
        tauxTVA: 18,
        montantTVA: 0,
        montantTTC: 0
      }
    ])
  }

  // Valider et soumettre
  const handleSubmit = async () => {
    const validationErrors: ValidationError[] = []

    entrees.forEach((entree, idx) => {
      if (!entree.date) {
        validationErrors.push({ field: `entree-${idx}-date`, message: 'La date est requise' })
      }
      if (entree.lignes.length === 0) {
        validationErrors.push({ field: `entree-${idx}-lignes`, message: 'Au moins une ligne est requise' })
      }
      entree.lignes.forEach((ligne, ligneIdx) => {
        if (!ligne.designation) {
          validationErrors.push({
            field: `entree-${idx}-ligne-${ligneIdx}-designation`,
            message: 'La désignation est requise'
          })
        }
        if (ligne.quantite <= 0) {
          validationErrors.push({
            field: `entree-${idx}-ligne-${ligneIdx}-quantite`,
            message: 'La quantité doit être > 0'
          })
        }
        if (ligne.prixUnitaire <= 0) {
          validationErrors.push({
            field: `entree-${idx}-ligne-${ligneIdx}-prix`,
            message: 'Le prix unitaire doit être > 0'
          })
        }
      })
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors([])

    try {
      const response = await fetch(`/api/clients/${clientId}/create-entrees-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entrees })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/clients/${clientId}/accounting`)
        }, 1500)
      } else {
        setErrors(data.errors || [{ field: 'general', message: 'Erreur lors de la création des entrées' }])
      }
    } catch (error) {
      setErrors([{ field: 'general', message: 'Erreur de connexion au serveur' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">📋 Entrées Manuelles</h1>
            <p className="text-slate-600">Créer une ou plusieurs factures d'entrées</p>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✓ Entrées créées avec succès!</p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-900 mb-2">Erreurs détectées:</p>
            <ul className="space-y-1">
              {errors.map((err, idx) => (
                <li key={idx} className="text-sm text-red-800">• {err.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Entrées */}
        <div className="space-y-4 mb-8">
          {entrees.map((entree, entreeIdx) => (
            <div key={entree.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header Entree */}
              <button
                onClick={() => setExpandedIndex(expandedIndex === entreeIdx ? -1 : entreeIdx)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-4 text-left flex-1">
                  <div>
                    <p className="font-semibold text-slate-900">
                      📄 Entrée #{entreeIdx + 1} - {entree.date}
                    </p>
                    {entree.reference && (
                      <p className="text-sm text-slate-600">Ref: {entree.reference}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      {entree.lignes.length} ligne(s) • <span className="font-semibold text-indigo-600">
                        {entree.montantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  {expandedIndex === entreeIdx ? (
                    <EyeOff className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </button>

              {/* Contenu Entree */}
              {expandedIndex === entreeIdx && (
                <div className="px-6 py-6 space-y-6 border-t">
                  {/* Date et Référence */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">📅 Date</label>
                      <input
                        type="date"
                        value={entree.date}
                        onChange={(e) => updateEntree(entreeIdx, { date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">🔖 Référence (Facture/Bon)</label>
                      <input
                        type="text"
                        value={entree.reference}
                        onChange={(e) => updateEntree(entreeIdx, { reference: e.target.value })}
                        placeholder="INV-001, BON-123..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Lignes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">📝 Détails des Lignes</h3>
                      <button
                        onClick={() => addLigne(entreeIdx)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter Ligne
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100 border-b-2 border-slate-300">
                            <th className="px-3 py-2 text-left font-medium text-slate-700">Désignation</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700">Quantité</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700">Prix Unitaire</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-700">Total HT</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {entree.lignes.map((ligne, ligneIdx) => (
                            <tr key={ligne.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={ligne.designation}
                                  onChange={(e) => updateLigne(entreeIdx, ligneIdx, { designation: e.target.value })}
                                  placeholder="Travaux, Matériel..."
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={ligne.quantite}
                                  onChange={(e) => updateLigne(entreeIdx, ligneIdx, { quantite: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={ligne.prixUnitaire}
                                  onChange={(e) => updateLigne(entreeIdx, ligneIdx, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-slate-900">
                                {ligne.totalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => removeLigne(entreeIdx, ligneIdx)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                  disabled={entree.lignes.length === 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Remise et TVA */}
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">💰 Remise</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={entree.remise}
                        onChange={(e) => updateEntree(entreeIdx, { remise: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">📊 Taux TVA (%)</label>
                      <select
                        value={entree.tauxTVA}
                        onChange={(e) => updateEntree(entreeIdx, { tauxTVA: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">0%</option>
                        <option value="18">18%</option>
                        <option value="21">21%</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">🧮 Montant TVA</label>
                      <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg">
                        <p className="font-semibold text-slate-900">
                          {entree.montantTVA.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Résumé */}
                  <div className="bg-gradient-to-r from-slate-100 to-blue-50 p-4 rounded-lg space-y-2 border-l-4 border-blue-500">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">Sous-total:</span>
                      <span className="font-medium text-slate-900">
                        {entree.sousTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                      </span>
                    </div>
                    {entree.remise > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">Après remise:</span>
                        <span className="font-medium text-slate-900">
                          {(entree.sousTotal - entree.remise).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                        </span>
                      </div>
                    )}
                    {entree.montantTVA > 0 && (
                      <div className="flex justify-between text-sm text-amber-700">
                        <span>TVA ({entree.tauxTVA}%):</span>
                        <span className="font-medium">
                          +{entree.montantTVA.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                      <span className="text-slate-900">Total TTC:</span>
                      <span className="text-indigo-600">
                        {entree.montantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Boutons Actions */}
        <div className="flex gap-4">
          <button
            onClick={addEntree}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Ajouter Entrée
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition"
          >
            {loading ? 'Enregistrement...' : '✓ Enregistrer les Entrées'}
          </button>
        </div>
      </div>
    </div>
    </MainLayout>
  )
}
