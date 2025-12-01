"use client"
import { useEffect, useState, FormEvent } from 'react'
import EquipeDetail from './EquipeDetail'

export default function TeamManagement() {
  const [equipes, setEquipes] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [leadEmail, setLeadEmail] = useState<string | null>(null)
  const [objectifs, setObjectifs] = useState<string>('')
  const [dateEcheance, setDateEcheance] = useState<string | null>(null)

  useEffect(() => {
    fetchList()
    fetchUsers()
  }, [])

  async function fetchList() {
    try {
      setLoading(true)
      const res = await fetch('/api/equipes')
      if (!res.ok) throw new Error('Erreur lors du chargement des équipes')
      const data = await res.json()
      setEquipes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setEquipes([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/utilisateurs')
      if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error(err)
      setUsers([])
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const formData = new FormData(e.currentTarget)
      const nom = formData.get('nom')?.toString() || ''
      const description = formData.get('description')?.toString() || ''
      const objectifsValue = formData.get('objectifs')?.toString() || objectifs
      const dateEcheanceValue = formData.get('dateEcheance')?.toString() || dateEcheance
      const leadEmailValue = formData.get('leadEmail')?.toString() || leadEmail

      // member emails are stored in selectedMembers (array of emails)
      const memberEmails = selectedMembers.map(s => s.trim()).filter(Boolean)
      const notFound: string[] = []
      const memberIds = memberEmails.map(email => {
        const u = users.find((u) => u.email === email)
        if (!u) notFound.push(email)
        return u?.id
      }).filter(Boolean)

      if (notFound.length) {
        throw new Error(`Email(s) non trouvé(s): ${notFound.join(', ')}`)
      }

      const leadUser = leadEmailValue ? users.find(u => u.email === leadEmailValue) : undefined

      const payload: any = {
        nom,
        description,
        objectifs: objectifsValue || undefined,
        dateEcheance: dateEcheanceValue || undefined,
        leadId: leadUser?.id || null,
        membres: memberIds
      }

      const res = await fetch('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erreur création équipe')
      }

      setShowCreate(false)
      setSelectedMembers([])
      setLeadEmail(null)
      setObjectifs('')
      setDateEcheance(null)
      await fetchList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur création équipe')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestion des équipes</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCreate(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ➕ Créer une équipe
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 mb-2 font-semibold">Liste des équipes</div>
            {loading ? (
              <div className="text-gray-600">Chargement…</div>
            ) : equipes.length === 0 ? (
              <div className="text-gray-600 text-sm">Aucune équipe</div>
            ) : (
              <ul className="space-y-2">
                {equipes.map((eq) => (
                  <li 
                    key={eq.id} 
                    className="py-2 px-2 flex items-center justify-between border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(eq.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{eq.nom}</div>
                      <div className="text-xs text-gray-500">
                        Membres: {eq.membres?.length || 0} • Projets: {eq.projets?.length || 0}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelected(eq.id); }} 
                      className="text-indigo-600 hover:text-indigo-800 ml-2"
                    >
                      👁
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {selected ? (
            <EquipeDetail id={selected} onBack={() => setSelected(null)} />
          ) : (
            <div className="bg-white p-6 rounded shadow text-gray-600 text-center">
              Sélectionnez une équipe pour voir les détails.
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Créer une équipe</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nom d'équipe *</label>
                <input 
                  name="nom" 
                  required 
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Ex: Équipe Marketing"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  name="description" 
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  rows={3}
                  placeholder="Description de l'équipe"
                />
              </div>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Chef d'équipe (email)</label>
                  <select
                    name="leadEmail"
                    value={leadEmail || ''}
                    onChange={(e) => setLeadEmail(e.target.value || null)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Aucun —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.nom} {u.prenom} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date d'échéance (optionnel)</label>
                  <input
                    name="dateEcheance"
                    type="date"
                    value={dateEcheance || ''}
                    onChange={(e) => setDateEcheance(e.target.value || null)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Objectifs</label>
                  <textarea
                    name="objectifs"
                    value={objectifs}
                    onChange={(e) => setObjectifs(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Objectifs de l'équipe"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Ajouter des membres (par email, virgule ou nouvelle ligne)</label>
                  <textarea
                    name="memberEmails"
                    value={selectedMembers.join('\n')}
                    onChange={(e) => setSelectedMembers(Array.from(new Set(e.target.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean))))}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="ex: jean.dupont@example.com, sophie.martin@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Saisissez les e-mails des membres. Les e-mails doivent correspondre à des utilisateurs existants.</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreate(false)
                    setSelectedMembers([])
                  }} 
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
