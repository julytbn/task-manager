'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layouts/MainLayout'
import { Plus, Trash2, Upload, CheckCircle2, AlertCircle, Loader } from 'lucide-react'
import { useParams } from 'next/navigation'

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

interface UploadResult {
  success: boolean
  message: string
  entreesCreated?: number
  errors?: string[]
}

export default function UploadEntreesPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const clientId = params.id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'manual' | 'pdf'>('manual')
  const [entrees, setEntrees] = useState<Entree[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      lignes: [{ id: '1', designation: '', quantite: 1, prixUnitaire: 0, totalHT: 0 }],
      remise: 0,
      sousTotal: 0,
      tauxTVA: 18,
      montantTVA: 0,
      montantTTC: 0,
    },
  ])

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [redirectTimer, setRedirectTimer] = useState(5)

  // Calcul des totaux pour une ligne
  const calculateLineTotal = (ligne: LigneEntree) => {
    return ligne.quantite * ligne.prixUnitaire
  }

  // Mise à jour d'une ligne
  const handleLigneChange = (
    entreeId: string,
    ligneId: string,
    field: string,
    value: string | number
  ) => {
    setEntrees(
      entrees.map((e) => {
        if (e.id !== entreeId) return e
        return {
          ...e,
          lignes: e.lignes.map((l) => {
            if (l.id !== ligneId) return l
            const updated = { ...l, [field]: value }
            if (field === 'quantite' || field === 'prixUnitaire') {
              updated.totalHT = calculateLineTotal(updated)
            }
            return updated
          }),
        }
      })
    )
  }

  // Ajout d'une ligne
  const handleAddLigne = (entreeId: string) => {
    setEntrees(
      entrees.map((e) => {
        if (e.id !== entreeId) return e
        const newLigneId = Math.max(...e.lignes.map((l) => parseInt(l.id)), 0) + 1
        return {
          ...e,
          lignes: [
            ...e.lignes,
            { id: String(newLigneId), designation: '', quantite: 1, prixUnitaire: 0, totalHT: 0 },
          ],
        }
      })
    )
  }

  // Suppression d'une ligne
  const handleRemoveLigne = (entreeId: string, ligneId: string) => {
    setEntrees(
      entrees.map((e) => {
        if (e.id !== entreeId) return e
        return {
          ...e,
          lignes: e.lignes.filter((l) => l.id !== ligneId),
        }
      })
    )
  }

  // Mise à jour des champs d'entree (remise, TVA)
  const handleEntreeChange = (entreeId: string, field: string, value: string | number) => {
    setEntrees(
      entrees.map((e) => {
        if (e.id !== entreeId) return e
        return { ...e, [field]: value }
      })
    )
  }

  // Calcul des totaux d'une entrée
  const calculateEntreeTotals = (entree: Entree): Entree => {
    const sousTotal = entree.lignes.reduce((sum, l) => sum + l.totalHT, 0)
    const montantAfterRemise = sousTotal - entree.remise
    const montantTVA = (montantAfterRemise * entree.tauxTVA) / 100
    const montantTTC = montantAfterRemise + montantTVA

    return {
      ...entree,
      sousTotal,
      montantTVA,
      montantTTC,
    }
  }

  // Soumission du formulaire manuel
  const handleSubmitManual = async () => {
    try {
      setUploading(true)
      const entreesWithTotals = entrees.map(calculateEntreeTotals)

      // Validation
      const errors: string[] = []
      entreesWithTotals.forEach((e, idx) => {
        if (!e.date) errors.push(`Entrée ${idx + 1}: Date requise`)
        if (e.lignes.length === 0) errors.push(`Entrée ${idx + 1}: Au moins une ligne requise`)
        e.lignes.forEach((l, lidx) => {
          if (!l.designation) errors.push(`Entrée ${idx + 1}, ligne ${lidx + 1}: Désignation requise`)
          if (l.quantite <= 0)
            errors.push(`Entrée ${idx + 1}, ligne ${lidx + 1}: Quantité doit être > 0`)
          if (l.prixUnitaire < 0)
            errors.push(`Entrée ${idx + 1}, ligne ${lidx + 1}: Prix unitaire invalide`)
        })
      })

      if (errors.length > 0) {
        setResult({
          success: false,
          message: `Erreurs de validation: ${errors.length} problème(s) trouvé(s)`,
          errors,
        })
        setUploading(false)
        return
      }

      // API call
      const response = await fetch(`/api/clients/${clientId}/create-entrees-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entrees: entreesWithTotals }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          message: data.message || 'Erreur lors de la création des entrées',
          errors: data.errors,
        })
        setUploading(false)
        return
      }

      setResult({
        success: true,
        message: 'Entrées créées avec succès!',
        entreesCreated: data.entreesCreated,
      })

      // Auto-redirect
      setRedirecting(true)
      let timer = 5
      const interval = setInterval(() => {
        timer -= 1
        setRedirectTimer(timer)
        if (timer <= 0) {
          clearInterval(interval)
          router.push(`/clients/${clientId}/accounting`)
        }
      }, 1000)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur lors de la soumission: ' + (error instanceof Error ? error.message : 'Unknown'),
      })
    } finally {
      setUploading(false)
    }
  }

  // Upload PDF
  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/clients/${clientId}/upload-entrees`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          message: data.message || 'Erreur lors de l\'importation du PDF',
          errors: data.errors,
        })
        return
      }

      setResult({
        success: true,
        message: 'Entrées importées avec succès!',
        entreesCreated: data.entreesCreated,
      })

      // Auto-redirect
      setRedirecting(true)
      let timer = 5
      const interval = setInterval(() => {
        timer -= 1
        setRedirectTimer(timer)
        if (timer <= 0) {
          clearInterval(interval)
          router.push(`/clients/${clientId}/accounting`)
        }
      }, 1000)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur: ' + (error instanceof Error ? error.message : 'Unknown'),
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setResult(null)
    setRedirecting(false)
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Importer des Entrées</h1>
          <p className="text-gray-600 mt-2">Créez manuellement ou importez vos entrées client</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-4 px-4 font-medium border-b-2 transition ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Saisie Manuelle
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`pb-4 px-4 font-medium border-b-2 transition ${
              activeTab === 'pdf'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📄 Importer PDF
          </button>
        </div>

        {/* Tab 1: Manual Entry */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            {entrees.map((entree, entreeIdx) => {
              const totals = calculateEntreeTotals(entree)
              return (
                <div key={entree.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                  <h2 className="text-xl font-bold mb-4">Entrée {entreeIdx + 1}</h2>

                  {/* Row 1: Date & Reference */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        value={entree.date}
                        onChange={(e) => handleEntreeChange(entree.id, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Référence
                      </label>
                      <input
                        type="text"
                        value={entree.reference}
                        onChange={(e) => handleEntreeChange(entree.id, 'reference', e.target.value)}
                        placeholder="Num. facture"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Lines Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-3 py-2 text-left font-medium">Désignation</th>
                          <th className="px-3 py-2 text-right font-medium">Quantité</th>
                          <th className="px-3 py-2 text-right font-medium">P.U</th>
                          <th className="px-3 py-2 text-right font-medium">Total HT</th>
                          <th className="px-3 py-2 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entree.lignes.map((ligne) => (
                          <tr key={ligne.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={ligne.designation}
                                onChange={(e) =>
                                  handleLigneChange(entree.id, ligne.id, 'designation', e.target.value)
                                }
                                placeholder="Exemple: Ventes produits"
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={ligne.quantite}
                                onChange={(e) =>
                                  handleLigneChange(entree.id, ligne.id, 'quantite', parseFloat(e.target.value) || 0)
                                }
                                className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={ligne.prixUnitaire}
                                onChange={(e) =>
                                  handleLigneChange(entree.id, ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)
                                }
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {ligne.totalHT.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleRemoveLigne(entree.id, ligne.id)}
                                disabled={entree.lignes.length === 1}
                                className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Line Button */}
                  <button
                    onClick={() => handleAddLigne(entree.id)}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition mb-4"
                  >
                    <Plus size={16} />
                    Ajouter une ligne
                  </button>

                  {/* Summary Section */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Sous-total:</span>
                      <span>
                        {totals.sousTotal.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Remise:</span>
                        <input
                          type="number"
                          value={entree.remise}
                          onChange={(e) =>
                            handleEntreeChange(entree.id, 'remise', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span>Montant après remise:</span>
                        <span>
                          {(totals.sousTotal - entree.remise).toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Taux TVA:</span>
                          <select
                            value={entree.tauxTVA}
                            onChange={(e) =>
                              handleEntreeChange(entree.id, 'tauxTVA', parseFloat(e.target.value))
                            }
                            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="0">0%</option>
                            <option value="18">18%</option>
                            <option value="21">21%</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm font-medium bg-blue-100 p-2 rounded mt-2">
                      <span>TVA ({entree.tauxTVA}%):</span>
                      <span>
                        {totals.montantTVA.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-bold bg-green-100 p-3 rounded">
                      <span>TOTAL TTC:</span>
                      <span>
                        {totals.montantTTC.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Submit Button */}
            <button
              onClick={handleSubmitManual}
              disabled={uploading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {uploading && <Loader className="animate-spin" size={20} />}
              {uploading ? 'Création en cours...' : '✓ Créer les entrées'}
            </button>
          </div>
        )}

        {/* Tab 2: PDF Upload */}
        {activeTab === 'pdf' && (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Glissez-déposez un fichier PDF ou{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline font-medium"
                >
                  cliquez pour parcourir
                </button>
              </p>
              <p className="text-sm text-gray-500">Le PDF doit contenir un tableau avec les colonnes: Date, Désignation, Montant</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0])
                    setResult(null)
                  }
                }}
                className="hidden"
              />
            </div>

            {file && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">{file.name}</p>
                  <p className="text-sm text-blue-700">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  !file || uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {uploading && <Loader className="animate-spin" size={20} />}
                {uploading ? 'Importation en cours...' : 'Importer le PDF'}
              </button>
              {result && (
                <button
                  onClick={handleClear}
                  className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                >
                  Importer un autre fichier
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result Message */}
        {result && (
          <div
            className={`mt-8 p-6 rounded-lg border ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircle2 className="text-green-600 mt-1" size={24} />
              ) : (
                <AlertCircle className="text-red-600 mt-1" size={24} />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">
                  {result.success ? '✓ Succès!' : '✗ Erreur'}
                </h3>
                <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                </p>
                {result.entreesCreated && (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-green-700">
                      ✅ {result.entreesCreated} entrée(s) créée(s) avec succès!
                    </p>
                    {redirecting && (
                      <p className="text-sm text-green-600 mt-3">
                        Redirection vers la comptabilité dans {redirectTimer} secondes...
                      </p>
                    )}
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => router.push(`/clients/${clientId}/accounting`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Voir la comptabilité →
                      </button>
                    </div>
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium mb-2">Erreurs:</p>
                    <ul className="list-disc list-inside text-red-600 space-y-1">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>... et {result.errors.length - 5} autres erreurs</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Format Guide */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Format du PDF</h2>
          <p className="text-gray-700 mb-4">
            Le PDF doit contenir un tableau avec les colonnes suivantes:
          </p>
          <div className="bg-white rounded p-4 font-mono text-sm">
            <p className="text-gray-700">
              <span className="font-bold">Date</span> | <span className="font-bold">Description</span> | <span className="font-bold">Montant</span>
            </p>
            <p className="text-gray-500 mt-2">Exemple:</p>
            <p className="text-gray-700 mt-1">01/11/2025 | Ventes produits | 500000</p>
            <p className="text-gray-700">02/11/2025 | Services rendus | 750000</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
