"use client"
import React, { useState } from 'react'
import { X } from 'lucide-react'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, description?: string, leadId?: string) => void
  isLoading?: boolean
}

export default function CreateTeamModal({ isOpen, onClose, onCreate, isLoading }: CreateTeamModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; prenom?: string; nom?: string; email?: string }>>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(undefined)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Le nom est requis')
    onCreate(name, description || undefined, selectedLeadId)
    setName('')
    setDescription('')
    setSelectedLeadId(undefined)
  }

  React.useEffect(() => {
    let mounted = true
    if (!isOpen) return
    ;(async () => {
      try {
        setLoadingUsers(true)
        const res = await fetch('/api/utilisateurs/available')
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        if (mounted) setUsers(data.map((u: any) => ({ id: u.id, prenom: u.prenom, nom: u.nom, email: u.email })))
      } catch (err) {
        console.error('Erreur fetch users', err)
      } finally {
        if (mounted) setLoadingUsers(false)
      }
    })()
    return () => { mounted = false }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-20 p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[95%] md:w-1/2 lg:w-2/5 rounded-lg shadow-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">➕ Créer une équipe</h2>
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

          <div>
            <label className="block text-sm font-medium mb-1">Chef d'équipe (optionnel)</label>
            <select value={selectedLeadId || ''} onChange={(e) => setSelectedLeadId(e.target.value || undefined)} className="w-full px-3 py-2 border rounded-md">
              <option value="">— Aucun —</option>
              {loadingUsers ? <option>Chargement...</option> : users.map(u => (
                <option key={u.id} value={u.id}>{(u.prenom || '') + (u.nom ? ' ' + u.nom : '')} {u.email ? `(${u.email})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-50 border rounded-md">Annuler</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{isLoading ? 'Création...' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
