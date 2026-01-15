'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/layouts/MainLayout'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader } from 'lucide-react'

interface UploadResult {
  success: boolean
  message: string
  documentsCreated?: number
  errors?: string[]
}

export default function UploadSituationPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const clientId = params.id

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [documentType, setDocumentType] = useState<'CHARGE' | 'ENTREE' | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      setFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      setFile(files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier')
      return
    }
    if (!documentType) {
      alert('Veuillez sélectionner si le document contient des charges ou des entrées')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('situationFile', file)
      formData.append('documentType', documentType)

      const response = await fetch(`/api/clients/${clientId}/upload-situation`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success && data.month && data.year) {
        // Attendre 1 seconde avant de rediriger pour que les données soient bien en base
        setTimeout(() => {
          router.push(`/clients/${clientId}/accounting?month=${data.month}&year=${data.year}`)
        }, 1000)
      }
      
      setResult(data)
    } catch (error) {
      console.error('Erreur upload:', error)
      setResult({
        success: false,
        message: 'Erreur lors du téléchargement',
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold gold-gradient-text">Importer la Situation Comptable</h1>
          <p className="text-gray-600 mt-2">Téléchargez votre fichier Excel, CSV ou PDF pour créer automatiquement les charges et entrées</p>
        </div>

        {!result ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Zone d'upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
                accept=".xlsx,.xls,.csv,.pdf"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                <p className="text-lg font-semibold text-gray-800">Déposer votre fichier ici</p>
                <p className="text-sm text-gray-500 mt-2">ou cliquez pour parcourir</p>
                <p className="text-xs text-gray-400 mt-2">Format accepté: Excel (.xlsx, .xls), CSV ou PDF</p>
              </label>
            </div>

            {/* Fichier sélectionné */}
            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">{file.name}</p>
                  <p className="text-sm text-green-700">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            )}

            {/* Sélection du type de document */}
            {file && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-amber-900 mb-4">Type de document:</p>
                <p className="text-sm text-amber-800 mb-4">Sélectionnez si votre fichier contient des charges ou des entrées</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDocumentType('CHARGE')}
                    className={`p-4 rounded-lg border-2 transition font-semibold ${
                      documentType === 'CHARGE'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                    }`}
                  >
                    💰 CHARGES
                  </button>
                  <button
                    onClick={() => setDocumentType('ENTREE')}
                    className={`p-4 rounded-lg border-2 transition font-semibold ${
                      documentType === 'ENTREE'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                    }`}
                  >
                    📈 ENTRÉES
                  </button>
                </div>
              </div>
            )}

            {/* Format attendu */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-blue-900 mb-3">Format attendu:</p>
              <p className="text-sm text-blue-800 mb-3">Votre fichier Excel/CSV doit contenir les colonnes suivantes:</p>
              <div className="bg-white rounded border border-blue-200 p-4 text-sm font-mono text-gray-700 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 pr-4">Colonne</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><span className="bg-gray-200 px-2 py-1 rounded text-xs">Date</span></td>
                      <td className="py-2 pr-4">Date (JJ/MM/YYYY)</td>
                      <td className="py-2">Date du document</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><span className="bg-gray-200 px-2 py-1 rounded text-xs">Raison Social</span></td>
                      <td className="py-2 pr-4">Texte</td>
                      <td className="py-2">Nom du fournisseur ou du client</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><span className="bg-gray-200 px-2 py-1 rounded text-xs">Montant HT</span></td>
                      <td className="py-2 pr-4">Nombre</td>
                      <td className="py-2">Montant hors taxes (XAF)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><span className="bg-gray-200 px-2 py-1 rounded text-xs">Montant TVA</span></td>
                      <td className="py-2 pr-4">Nombre</td>
                      <td className="py-2">Montant de la TVA (XAF)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><span className="bg-gray-200 px-2 py-1 rounded text-xs">Montant TTC</span></td>
                      <td className="py-2 pr-4">Nombre</td>
                      <td className="py-2">Montant toutes taxes comprises (XAF)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bouton d'upload */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || !documentType || uploading}
                className={`flex-1 py-3 rounded font-semibold flex items-center justify-center gap-2 transition ${
                  !file || !documentType || uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importer la situation
                  </>
                )}
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          /* Résultat */
          <div className="max-w-2xl mx-auto">
            <div
              className={`rounded-lg p-8 text-center ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {result.success ? (
                <>
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Succès! ✓</h2>
                  <p className="text-green-700 mb-2">{result.message}</p>
                  {result.documentsCreated && (
                    <p className="text-lg font-semibold text-green-800 mb-6">
                      ✅ {result.documentsCreated} document(s) créé(s) avec succès
                    </p>
                  )}
                  <p className="text-sm text-green-600 mb-4">Redirection en cours...</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
                  <h2 className="text-2xl font-bold text-red-800 mb-2">Erreur</h2>
                  <p className="text-red-700 mb-4">{result.message}</p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="bg-white rounded p-4 mb-4 text-left max-h-40 overflow-y-auto">
                      <p className="text-sm font-semibold text-red-800 mb-2">Détails:</p>
                      <ul className="space-y-1">
                        {result.errors.map((error, idx) => (
                          <li key={idx} className="text-sm text-red-600">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setResult(null)
                      setFile(null)
                    }}
                    className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
                  >
                    Réessayer
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
