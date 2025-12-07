"use client"
import { useEffect, useState } from 'react'
import MainLayout from "@/components/MainLayout"
import { Plus, Edit2, Trash2 } from 'lucide-react'

type Utilisateur = {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: string
  departement?: string
  actif: boolean
}

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/utilisateurs')
        if (!res.ok) throw new Error('Erreur récupération utilisateurs')
        const data = await res.json()
        if (mounted) setUtilisateurs(data || [])
      } catch (err) {
        if (mounted) setError((err as any).message || 'Erreur')
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      EMPLOYE: 'bg-green-100 text-green-800',
      CONSULTANT: 'bg-orange-100 text-orange-800'
    }
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      MANAGER: 'Manager',
      EMPLOYE: 'Employé',
      CONSULTANT: 'Consultant'
    }
    return { color: colors[role] || 'bg-gray-100 text-gray-800', label: labels[role] || role }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text">Utilisateurs</h1>
            <p className="text-[var(--color-anthracite)] mt-2">Gérez les utilisateurs, rôles et accès</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded hover:bg-[var(--color-gold-accent)]">
            <Plus size={16} />
            Ajouter utilisateur
          </button>
        </div>

        {loading && <div className="text-center py-8 text-[var(--color-anthracite)]">Chargement...</div>}
        {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

        {!loading && !error && utilisateurs.length === 0 && (
          <div className="text-center py-8 text-[var(--color-anthracite)]">Aucun utilisateur trouvé</div>
        )}

        {!loading && !error && utilisateurs.length > 0 && (
          <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-gold)]/10 border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Nom</th>
                  <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Téléphone</th>
                  <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Rôle</th>
                  <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Département</th>
                  <th className="px-6 py-3 text-left font-semibold text-[var(--color-gold)]">Statut</th>
                  <th className="px-6 py-3 text-right font-semibold text-[var(--color-gold)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((user) => {
                  const roleBadge = getRoleBadge(user.role)
                  return (
                    <tr key={user.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-gold)]/5">
                      <td className="px-6 py-3 font-medium">{user.prenom} {user.nom}</td>
                      <td className="px-6 py-3 text-[var(--color-anthracite)]">{user.email}</td>
                      <td className="px-6 py-3 text-[var(--color-anthracite)]">{user.telephone || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-3 py-1 rounded text-xs font-semibold ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[var(--color-anthracite)]">{user.departement || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs ${
                          user.actif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {user.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right flex gap-2 justify-end">
                        <button className="p-1 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 rounded" title="Éditer">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
