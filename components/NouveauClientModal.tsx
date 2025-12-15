"use client"

import { useEffect, useState, FormEvent } from 'react'
import { X } from 'lucide-react'

type TypeClient = 'PARTICULIER' | 'ENTREPRISE' | 'ORGANISATION'

type Client = {
  id?: string | number
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  type?: TypeClient
  entreprise?: string
  gudefUrl?: string
  adresse?: string
  dateNaissance?: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Client) => Promise<void> | void
  initial?: Client | null
}

export default function NouveauClientModal({ isOpen, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<Client>({ nom: '', prenom: '', email: '', telephone: '', type: 'PARTICULIER', entreprise: '', gudefUrl: '', adresse: '', dateNaissance: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setForm({
        nom: initial.nom || '',
        prenom: initial.prenom || '',
        email: initial.email || '',
        telephone: initial.telephone || '',
        type: initial.type || 'PARTICULIER',
        entreprise: initial.entreprise || '',
        gudefUrl: initial.gudefUrl || '',
        adresse: initial.adresse || '',
        dateNaissance: initial.dateNaissance || '',
        id: initial.id,
      })
    } else {
      setForm({ nom: '', prenom: '', email: '', telephone: '', type: 'PARTICULIER', entreprise: '', gudefUrl: '', adresse: '', dateNaissance: '' })
    }
  }, [initial, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <div className="relative w-full max-w-3xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-y-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh', maxWidth: 'calc(100vw - 24px)' }}>
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
              <h3 className="text-lg font-semibold text-[var(--color-gold)]">{initial ? 'Modifier le client' : 'Nouveau client'}</h3>
              <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]">
                <X />
              </button>
            </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
          {error && <div className="text-red-700 bg-red-100 p-2 rounded">{error}</div>}

          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Nom *</label>
              <input required value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Prénom</label>
              <input value={form.prenom || ''} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Téléphone</label>
              <input value={form.telephone || ''} onChange={e => setForm(f => ({...f, telephone: e.target.value}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Type de client *</label>
              <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as TypeClient}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                <option value="PARTICULIER">Particulier</option>
                <option value="ENTREPRISE">Entreprise</option>
                <option value="ORGANISATION">Organisation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Entreprise / Organisation</label>
              <input value={form.entreprise || ''} onChange={e => setForm(f => ({...f, entreprise: e.target.value}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Lien GUDEF (optionnel)</label>
              <input type="url" value={form.gudefUrl || ''} onChange={e => setForm(f => ({...f, gudefUrl: e.target.value}))} placeholder="https://gudef.gouv.tg/..." className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date de naissance</label>
              <input type="date" value={form.dateNaissance || ''} onChange={e => setForm(f => ({...f, dateNaissance: e.target.value}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Adresse</label>
              <input value={form.adresse || ''} onChange={e => setForm(f => ({...f, adresse: e.target.value}))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]">Annuler</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold">
              {submitting ? 'Enregistrement...' : (initial ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
