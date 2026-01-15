'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, FileText, Image, File } from 'lucide-react'
import { Modal } from '@/components/ui'

interface Document {
  id: string
  nom: string
  description?: string
  type?: string
  url: string
  taille?: number
  dateUpload?: string
  uploadPar?: string
}

interface Task {
  id: string
  titre: string
  description?: string
  projet?: { id?: string; nom?: string; titre?: string }
  service?: { id?: string; nom?: string }
  assigneA?: { id?: string; prenom?: string; nom?: string }
  statut?: string
  priorite?: string
  dateEcheance?: string | null
  montant?: number
  documents?: Document[]
  DocumentTache?: Array<{ id: string; nom: string; url: string }>
}

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
  onValidate?: (taskId: string) => void
  onReject?: (taskId: string, reason: string) => void
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onValidate,
  onReject
}: TaskDetailModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  useEffect(() => {
    if (isOpen && task?.id) {
      fetchDocuments()
    }
  }, [isOpen, task?.id])

  const fetchDocuments = async () => {
    if (!task?.id) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/taches/${task.id}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || data.DocumentTache || [])
      } else {
        setError('Erreur lors du chargement des documents')
      }
    } catch (err) {
      console.error('Erreur chargement documents:', err)
      setError('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !task) return null

  const getFileIcon = (doc: Document) => {
    if (doc.type?.startsWith('image/')) {
      return <Image size={16} className="text-blue-500" />
    } else if (doc.type?.includes('pdf')) {
      return <FileText size={16} className="text-red-500" />
    }
    return <File size={16} className="text-gray-500" />
  }

  const priorityColor = {
    BASSE: 'bg-blue-100 text-blue-800',
    MOYENNE: 'bg-yellow-100 text-yellow-800',
    HAUTE: 'bg-orange-100 text-orange-800',
    URGENTE: 'bg-red-100 text-red-800'
  }

  const statusColor = {
    SOUMISE: 'bg-orange-100 text-orange-800',
    EN_COURS: 'bg-blue-100 text-blue-800',
    TERMINEE: 'bg-green-100 text-green-800',
    VALIDEE: 'bg-green-100 text-green-800',
    REJETEE: 'bg-red-100 text-red-800',
    ANNULEE: 'bg-gray-100 text-gray-800'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.titre} className="max-w-2xl">
      <div className="space-y-6">
        {/* Task Header */}
        <div className="border-b pb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.titre}</h2>
              {task.description && (
                <p className="text-gray-600 text-sm">{task.description}</p>
              )}
            </div>
          </div>

          {/* Task Details Grid */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Project/Service */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Projet</p>
              <p className="text-sm text-gray-900 font-medium">
                {task.projet?.titre || task.service?.nom || '—'}
              </p>
            </div>

            {/* Client */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Client</p>
              <p className="text-sm text-gray-900 font-medium">—</p>
            </div>

            {/* Assigned To */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Assigné à</p>
              <p className="text-sm text-gray-900 font-medium">
                {task.assigneA ? `${task.assigneA.prenom || ''} ${task.assigneA.nom || ''}`.trim() : '—'}
              </p>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Statut</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColor[task.statut as keyof typeof statusColor] || 'bg-gray-100 text-gray-800'}`}>
                {task.statut || '—'}
              </span>
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Priorité</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${priorityColor[task.priorite as keyof typeof priorityColor] || 'bg-gray-100 text-gray-800'}`}>
                {task.priorite || '—'}
              </span>
            </div>

            {/* Deadline */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Date limite</p>
              <p className="text-sm text-gray-900 font-medium">
                {task.dateEcheance ? new Date(task.dateEcheance).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>

            {/* Amount */}
            {task.montant && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Montant</p>
                <p className="text-sm text-gray-900 font-medium">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(task.montant)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Documents liés</h3>

          {loading && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Chargement des documents...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!loading && documents.length > 0 ? (
            <div className="space-y-2 border rounded-lg divide-y max-h-64 overflow-y-auto">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(doc)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.nom}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {doc.taille && (
                          <span className="text-xs text-gray-500">
                            {(doc.taille / 1024).toFixed(2)} KB
                          </span>
                        )}
                        {doc.dateUpload && (
                          <span className="text-xs text-gray-500">
                            {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {doc.uploadPar && (
                          <span className="text-xs text-gray-500">
                            Par {doc.uploadPar}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-2 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Télécharger"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 text-sm">Aucun document lié</p>
              </div>
            )
          )}
        </div>

        {/* Action Buttons */}
        {(onValidate || onReject) && task.statut?.toUpperCase() === 'SOUMISE' && (
          <div className="border-t pt-4">
            {!showRejectForm ? (
              <div className="flex gap-3">
                {onValidate && (
                  <button
                    onClick={() => onValidate(task.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    ✅ Valider
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    ❌ Rejeter
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800">Le commentaire est obligatoire pour rejeter</p>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez précisément pourquoi cette tâche est rejetée..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-red-500"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectReason('')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (rejectReason.trim() && onReject) {
                        onReject(task.id, rejectReason)
                        setShowRejectForm(false)
                        setRejectReason('')
                      }
                    }}
                    disabled={!rejectReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Confirmer le rejet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
