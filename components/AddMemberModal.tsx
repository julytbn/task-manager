"use client"
import React, { useState } from 'react'
import { X } from 'lucide-react'

interface UserItem {
  id: string
  prenom?: string
  nom?: string
  email?: string
}

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  users: UserItem[]
  onAdd: (utilisateurId: string) => Promise<void>
}

export default function AddMemberModal({ isOpen, onClose, users, onAdd }: AddMemberModalProps) {
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!isOpen) return null

  const filtered = users.filter(u => {
    const name = `${u.prenom || ''} ${u.nom || ''}`.trim().toLowerCase()
    const email = (u.email || '').toLowerCase()
    return name.includes(query.toLowerCase()) || email.includes(query.toLowerCase())
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-20">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[95%] md:w-3/4 lg:w-2/5 rounded-lg shadow-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">➕ Ajouter un membre</h2>
          <button onClick={onClose} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"><X /></button>
        </div>

        <div className="mb-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom ou email..." className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div className="max-h-64 overflow-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun utilisateur trouvé</div>
          ) : (
            filtered.map(u => (
              <div key={u.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="text-sm">
                  <div className="font-medium">{(u.prenom || '') + (u.nom ? ' ' + u.nom : '') || u.email}</div>
                  <div className="text-xs text-gray-500">{u.email || '—'}</div>
                </div>
                <div>
                  <button disabled={!!loadingId} onClick={async () => { setLoadingId(u.id); await onAdd(u.id); setLoadingId(null) }} className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">{loadingId === u.id ? 'Ajout...' : 'Ajouter'}</button>
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
