"use client"
import React, { useState } from 'react'
import { X } from 'lucide-react'

interface EditTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description?: string) => void
  initialName?: string
  initialDescription?: string
  isLoading?: boolean
}

export default function EditTeamModal({ isOpen, onClose, onSave, initialName = '', initialDescription = '', isLoading }: EditTeamModalProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)

  React.useEffect(() => {
    setName(initialName)
    setDescription(initialDescription)
  }, [initialName, initialDescription, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Le nom est requis')
    onSave(name, description || undefined)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-20">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[95%] md:w-1/2 lg:w-2/5 rounded-lg shadow-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">✏️ Modifier l'équipe</h2>
          <button onClick={onClose} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de l'équipe *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Équipe Développement" className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de l'équipe..." className="w-full px-3 py-2 border rounded-md" rows={3} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-50 border rounded-md">Annuler</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{isLoading ? 'Sauvegarde...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
