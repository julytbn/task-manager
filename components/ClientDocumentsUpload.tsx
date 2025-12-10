"use client"
import React, { useEffect, useState } from 'react'

type Document = {
  id: string
  nom: string
  description?: string | null
  type?: string | null
  url: string
  taille?: number | null
  dateUpload: string
  uploadPar?: string | null
}

export default function ClientDocumentsUpload({ clientId }: { clientId: string }) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)
  const [deletingError, setDeletingError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Use upload server URL from env (NEXT_PUBLIC_* is required for client-side)
  // If `NEXT_PUBLIC_UPLOAD_SERVER_URL` is not set, we fallback to the internal Next.js API
  const UPLOAD_SERVER_URL = (process.env.NEXT_PUBLIC_UPLOAD_SERVER_URL as string) || ''
  const UPLOAD_API_KEY = (process.env.NEXT_PUBLIC_UPLOAD_API_KEY as string) || ''
  const useExternalServer = Boolean(UPLOAD_SERVER_URL)

  useEffect(() => {
    fetchDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function fetchDocs() {
    try {
      const endpoint = useExternalServer
        ? `${UPLOAD_SERVER_URL}/clients/${clientId}/documents`
        : `/api/clients/${clientId}/documents`
      const res = await fetch(endpoint, {
        headers: useExternalServer && UPLOAD_API_KEY ? { 'x-api-key': UPLOAD_API_KEY } : undefined,
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      } else {
        setDocuments([])
        // eslint-disable-next-line no-console
        console.error('Fetch docs failed:', res.status, await res.text())
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Fetch docs error:', err)
      setDocuments([])
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!files || files.length === 0) {
      setError('Veuillez sélectionner un fichier')
      return
    }
    
    // Check if upload server is reachable with proper timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      try {
        const healthCheck = await fetch(`${UPLOAD_SERVER_URL}/health`, { 
          method: 'GET',
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!healthCheck.ok) {
          setError(`❌ Serveur d'upload indisponible (statut: ${healthCheck.status}). Assurez-vous que le serveur est lancé sur le port 4000.`)
          return
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        throw fetchErr
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      const isAborted = err instanceof Error && err.name === 'AbortError'
      const timeoutMsg = isAborted ? ' (Timeout après 5 secondes)' : ''
      setError(`❌ Impossible de se connecter au serveur d'upload (${UPLOAD_SERVER_URL}): ${errMsg}${timeoutMsg}\n\nAssurez-vous que:\n1. Le serveur est en cours d'exécution (npm run upload-server)\n2. Le port 4000 est disponible\n3. La variable NEXT_PUBLIC_UPLOAD_SERVER_URL est correcte`)
      // eslint-disable-next-line no-console
      console.error('Health check failed:', err)
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      let uploadCount = 0
      let failedFiles: string[] = []

      // If an external upload server is configured, use XMLHttpRequest to keep the progress behaviour
      if (useExternalServer) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i]
          await new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest()
            const url = `${UPLOAD_SERVER_URL}/upload`
            const timeoutId = setTimeout(() => {
              xhr.abort()
              setError(`⏱️ Timeout lors de l'upload de ${f.name}. Le serveur a mis trop de temps à répondre.`)
              failedFiles.push(f.name)
              setProgress(0)
              resolve()
            }, 60000)

            xhr.open('POST', url)
            if (UPLOAD_API_KEY) xhr.setRequestHeader('x-api-key', UPLOAD_API_KEY)

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100))
            }

            xhr.onload = async () => {
              clearTimeout(timeoutId)
              if (xhr.status >= 200 && xhr.status < 300) {
                uploadCount++
              } else {
                failedFiles.push(f.name)
                let errorMsg = xhr.responseText
                try {
                  const jsonErr = JSON.parse(xhr.responseText)
                  errorMsg = jsonErr.error || errorMsg
                } catch {}
                setError(`⚠️ Erreur upload ${f.name}: ${errorMsg}`)
              }
              setProgress(0)
              resolve()
            }

            xhr.onerror = () => {
              clearTimeout(timeoutId)
              failedFiles.push(f.name)
              setError(`❌ Erreur réseau pendant l'upload de ${f.name}. Vérifiez votre connexion et que le serveur d'upload est actif.`)
              setProgress(0)
              resolve()
            }

            xhr.onabort = () => {
              clearTimeout(timeoutId)
              failedFiles.push(f.name)
              setProgress(0)
              resolve()
            }

            const form = new FormData()
            form.append('file', f)
            form.append('clientId', clientId)
            form.append('nom', f.name)
            form.append('type', f.type || 'unknown')
            try {
              xhr.send(form)
            } catch (err) {
              setError(`❌ Erreur lors de l'envoi du fichier: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
              failedFiles.push(f.name)
              setProgress(0)
              resolve()
            }
          })
        }
      } else {
        // Use internal Next.js API for uploads (no per-file progress available)
        for (let i = 0; i < files.length; i++) {
          const f = files[i]
          try {
            const formData = new FormData()
            formData.append('file', f)
            formData.append('nom', f.name)
            formData.append('type', f.type || 'unknown')
            const res = await fetch(`/api/clients/${clientId}/documents`, { method: 'POST', body: formData })
            if (res.ok) {
              uploadCount++
            } else {
              failedFiles.push(f.name)
              let errText = await res.text()
              try {
                const j = JSON.parse(errText)
                errText = j.error || errText
              } catch {}
              setError(`⚠️ Erreur upload ${f.name}: ${errText}`)
            }
          } catch (err) {
            failedFiles.push(f.name)
            setError(`❌ Erreur réseau pendant l'upload de ${f.name}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
          }
        }
      }

      if (uploadCount > 0) {
        setSuccess(`✅ ${uploadCount} fichier(s) uploadé(s) avec succès${failedFiles.length > 0 ? ` (${failedFiles.length} échoué(s))` : ''}`)
        await fetchDocs()
        setFiles(null)
        const inputEl = document.getElementById(`file-input-${clientId}`) as HTMLInputElement | null
        if (inputEl) inputEl.value = ''
      } else if (failedFiles.length > 0) {
        setError(`❌ Tous les fichiers ont échoué: ${failedFiles.join(', ')}`)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(`❌ Erreur: ${errMsg}`)
      // eslint-disable-next-line no-console
      console.error('Upload error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteDocument(id: string) {
    setDeletingLoading(true)
    setDeletingError(null)
    try {
      const endpoint = useExternalServer
        ? `${UPLOAD_SERVER_URL}/clients/${clientId}/documents/${id}`
        : `/api/clients/${clientId}/documents/${id}`

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: useExternalServer && UPLOAD_API_KEY ? { 'x-api-key': UPLOAD_API_KEY } : undefined,
      })

      if (!res.ok) {
        let errText = await res.text()
        try {
          const j = JSON.parse(errText)
          errText = j.error || errText
        } catch {}
        setDeletingError(`Erreur suppression: ${errText}`)
      } else {
        // refresh list
        await fetchDocs()
        setDeletingId(null)
        setToast('Document supprimé avec succès')
        setTimeout(() => setToast(null), 3000)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setDeletingError(`Erreur suppression: ${msg}`)
    } finally {
      setDeletingLoading(false)
    }
  }
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div
          className="relative border-2 border-dashed border-gray-200 rounded-lg h-44 flex items-center justify-center bg-gray-50"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files
            if (f && f.length > 0) setFiles(f)
          }}
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none"><path d="M12 3v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 11l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 15v2a3 3 0 01-3 3H6a3 3 0 01-3-3v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-sm text-gray-600">Glissez-déposez vos fichiers ici ou cliquez pour parcourir</div>
            <div className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, Images (Max. 10 MB)</div>

            <div className="mt-4">
              <input id={`file-input-${clientId}`} type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files)} />
              <label htmlFor={`file-input-${clientId}`} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">Sélectionner des fichiers</label>
            </div>

            {files && files.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">{files.length} fichier(s) sélectionné(s)</div>
            )}

            <div className="absolute right-4 top-4">
              <button
                onClick={handleUpload as any}
                disabled={loading || !files || files.length === 0}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Upload...' : '⬆️ Upload'}
              </button>
            </div>
          </div>
        </div>
        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
        {success && <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}
        {progress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div className="h-2 bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">Progress: {progress}%</div>
          </div>
        )}
      </div>

      {/* Documents grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-medium mb-4">📂 Documents du client ({documents.length})</h4>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun document encore.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((d) => (
              <div key={d.id} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {/* file type icon */}
                    <div className="text-xs text-gray-500">
                      {d.type?.includes('pdf') ? (
                        <span className="inline-block px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold">PDF</span>
                      ) : d.type?.includes('word') || d.nom?.endsWith('.docx') ? (
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">Word</span>
                      ) : d.type?.includes('excel') || d.nom?.endsWith('.xls') ? (
                        <span className="inline-block px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-semibold">Excel</span>
                      ) : d.type?.includes('powerpoint') || d.nom?.endsWith('.ppt') ? (
                        <span className="inline-block px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs font-semibold">PPT</span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-semibold">Fichier</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{d.nom}</div>
                    <div className="text-xs text-gray-500 mt-1">{d.taille ? `${(d.taille / 1024).toFixed(2)} MB` : ''} {d.uploadPar ? `• ${d.uploadPar}` : ''}</div>
                    <div className="text-xs text-gray-400 mt-2">{d.dateUpload ? new Date(d.dateUpload).toLocaleDateString('fr-FR') : ''}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Voir</a>
                    <a href={d.url} download className="text-gray-700 hover:text-gray-900">Télécharger</a>
                  </div>
                  <button onClick={() => { setDeletingId(d.id); setDeletingError(null) }} className="text-red-500 text-sm">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => deletingLoading ? null : setDeletingId(null)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6 z-60">
            <h3 className="text-lg font-semibold mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-600 mb-4">Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.</p>
            {deletingError && <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">{deletingError}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)} disabled={deletingLoading} className="px-3 py-2 bg-gray-100 rounded">Annuler</button>
              <button onClick={() => deleteDocument(deletingId)} disabled={deletingLoading} className="px-3 py-2 bg-red-600 text-white rounded">{deletingLoading ? 'Suppression...' : 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
