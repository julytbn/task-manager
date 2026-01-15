'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, FileText, Image, File } from 'lucide-react'

interface Document {
  id: string
  nom: string
  description?: string
  type?: string
  url: string
  taille?: number
  dateUpload: string
  uploadPar?: string
}

interface TaskDocumentsModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
}

export default function TaskDocumentsModal({
  isOpen,
  onClose,
  taskId,
  taskTitle
}: TaskDocumentsModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && taskId) {
      fetchDocuments()
    }
  }, [isOpen, taskId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/taches/${taskId}`)
      if (!res.ok) throw new Error('Erreur lors du chargement des documents')
      
      const data = await res.json()
      // Récupérer les documents depuis la tâche
      const docs = data.DocumentTache || []
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="w-5 h-5 text-gray-500" />
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleDownload = (doc: Document) => {
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.nom
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">📄 Documents - {taskTitle}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-[var(--color-gold)] text-2xl">⏳</div>
              <p className="text-gray-600 mt-2">Chargement des documents...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              ❌ {error}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 font-medium">Aucun document attaché</p>
              <p className="text-gray-500 text-sm mt-1">L'employé n'a pas encore uploadé de document pour cette tâche</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {documents.length} document{documents.length > 1 ? 's' : ''} trouvé{documents.length > 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex items-start justify-between bg-gray-50"
                  >
                    <div className="flex gap-4 flex-1">
                      {/* File Icon */}
                      <div className="flex-shrink-0 flex items-center">
                        {getFileIcon(doc.type)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {doc.nom}
                        </h3>
                        {doc.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(doc.taille)}</span>
                          {doc.uploadPar && (
                            <span>Uploadé par: {doc.uploadPar}</span>
                          )}
                          <span>
                            {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="ml-4 flex-shrink-0 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg hover:bg-[var(--color-gold-accent)] transition font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
