"use client"
import { useEffect, useState } from 'react'
import UiLayout from "../../components/UiLayout"
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
    <UiLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Utilisateurs</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <Plus size={16} />
          Ajouter utilisateur
        </button>
      </div>

      {loading && <div className="text-center py-8">Chargement...</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

      {!loading && !error && utilisateurs.length === 0 && (
        <div className="text-center py-8 text-gray-500">Aucun utilisateur trouvé</div>
      )}

      {!loading && !error && utilisateurs.length > 0 && (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Nom</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Téléphone</th>
                <th className="px-6 py-3 text-left font-semibold">Rôle</th>
                <th className="px-6 py-3 text-left font-semibold">Département</th>
                <th className="px-6 py-3 text-left font-semibold">Statut</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((user) => {
                const roleBadge = getRoleBadge(user.role)
                return (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{user.prenom} {user.nom}</td>
                    <td className="px-6 py-3 text-gray-600">{user.email}</td>
                    <td className="px-6 py-3 text-gray-600">{user.telephone || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-3 py-1 rounded text-xs font-semibold ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{user.departement || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        user.actif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {user.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right flex gap-2 justify-end">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Éditer">
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
    </UiLayout>
  )
}
