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
  onAdd: (email: string) => Promise<void>
}

export default function AddMemberModal({ isOpen, onClose, users, onAdd }: AddMemberModalProps) {
  const [query, setQuery] = useState('')
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const filtered = users.filter(u => {
    const name = `${u.prenom || ''} ${u.nom || ''}`.trim().toLowerCase()
    const email = (u.email || '').toLowerCase()
    return name.includes(query.toLowerCase()) || email.includes(query.toLowerCase())
  })

  const handleAddClick = async (email: string | undefined) => {
    if (!email) return
    try {
      setErrorMsg(null)
      setLoadingEmail(email)
      await onAdd(email)
      // If success, close the modal after a short delay
      setTimeout(() => {
        setLoadingEmail(null)
        onClose()
      }, 500)
    } catch (err) {
      setLoadingEmail(null)
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l\'ajout')
      console.error('Erreur ajout membre:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-20 p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[95%] md:w-3/4 lg:w-2/5 rounded-lg shadow-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">➕ Ajouter un membre</h2>
          <button onClick={onClose} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"><X /></button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="mb-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom ou email..." className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div className="max-h-64 overflow-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun utilisateur trouvé</div>
          ) : (
            filtered.map(u => (
              <div key={u.email || u.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                <div className="text-sm">
                  <div className="font-medium">{(u.prenom || '') + (u.nom ? ' ' + u.nom : '') || u.email}</div>
                  <div className="text-xs text-gray-500">{u.email || '—'}</div>
                </div>
                <div>
                  <button 
                    disabled={!!loadingEmail} 
                    onClick={() => handleAddClick(u.email)}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {loadingEmail === u.email ? '⏳...' : '✓ Ajouter'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-50 border rounded-md hover:bg-gray-100">Fermer</button>
        </div>
      </div>
    </div>
  )
}
