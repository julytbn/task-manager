"use client"
import React, { useState } from 'react'
import { X } from 'lucide-react'

interface ProjectItem {
  id: string
  title: string
}

interface AssignProjectModalProps {
  isOpen: boolean
  onClose: () => void
  projects: ProjectItem[]
  onAssign: (projetId: string) => Promise<void>
}

export default function AssignProjectModal({ isOpen, onClose, projects, onAssign }: AssignProjectModalProps) {
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!isOpen) return null

  const filtered = projects.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-20">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[95%] md:w-3/4 lg:w-2/5 rounded-lg shadow-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">📁 Assigner un projet</h2>
          <button onClick={onClose} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"><X /></button>
        </div>

        <div className="mb-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un projet..." className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div className="max-h-64 overflow-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun projet trouvé</div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="text-sm">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-gray-500">ID: {p.id}</div>
                </div>
                <div>
                  <button disabled={!!loadingId} onClick={async () => { setLoadingId(p.id); await onAssign(p.id); setLoadingId(null) }} className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">{loadingId === p.id ? 'Assignation...' : 'Assigner'}</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-50 border rounded-md">Fermer</button>
        </div>
      </div>
    </div>
  )
}
