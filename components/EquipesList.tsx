"use client"
import React, { useMemo, useState } from 'react'
import TeamCard from './TeamCard'
import { Search, Filter, Grid, List, MoreVertical } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Team = {
  id: string
  name: string
  lead: string
  membersCount: number
  members: any[]
  projects: string[]
  status: 'Active' | 'En attente' | 'Surchargée'
  createdAt?: string
}

interface Props {
  teams: Team[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAddMember: (id: string) => void
  onAssignProject: (id: string) => void
}

export default function EquipesList({ teams, onView, onEdit, onDelete, onAddMember, onAssignProject }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isEmployeePath = !!pathname && (pathname.startsWith('/dashboard/employe') || pathname.startsWith('/employe'))
  const isEmployeeUser = session?.user?.role === 'EMPLOYE'
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return teams.filter((t) => {
      if (query) {
        const q = query.toLowerCase()
        if (!t.name.toLowerCase().includes(q) && !t.lead.toLowerCase().includes(q) && !t.projects.join(' ').toLowerCase().includes(q)) return false
      }
      if (statusFilter && t.status !== statusFilter) return false
      if (sizeFilter) {
        if (sizeFilter === 'small' && t.membersCount > 5) return false
        if (sizeFilter === 'medium' && (t.membersCount < 6 || t.membersCount > 15)) return false
        if (sizeFilter === 'large' && t.membersCount < 16) return false
      }
      if (projectFilter && !t.projects.includes(projectFilter)) return false
      return true
    })
  }, [teams, query, statusFilter, sizeFilter, projectFilter])

  const allProjects = Array.from(new Set(teams.flatMap((t) => t.projects)))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white border rounded-md px-3 py-2 gap-2 w-full">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recherche par équipe / employé / projet" className="w-full outline-none" />
        </div>

        <div className="flex items-center gap-2">
          <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="bg-white border rounded-md px-3 py-2">
            <option value="">Taille</option>
            <option value="small">Petite (&lt;=5)</option>
            <option value="medium">Moyenne (6-15)</option>
            <option value="large">Grande (&gt;=16)</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border rounded-md px-3 py-2">
            <option value="">Statut</option>
            <option value="Active">Active</option>
            <option value="En attente">En attente</option>
            <option value="Surchargée">Surchargée</option>
          </select>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="bg-white border rounded-md px-3 py-2">
            <option value="">Projet</option>
            {allProjects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <div className="hidden">
          <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} className={`p-2 rounded-md border ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`} title="Vue cartes">
            <Grid size={16} />
          </button>
          <button onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'} className={`p-2 rounded-md border ${viewMode === 'table' ? 'bg-gray-100' : 'bg-white'}`} title="Vue tableau">
            <List size={16} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TeamCard key={t.id} team={t} onView={onView} onEdit={onEdit} onDelete={onDelete} onAddMember={onAddMember} onAssignProject={onAssignProject} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-md">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Responsable</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Membres</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Projets</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{t.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.lead}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.membersCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.projects.join(', ')}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${t.status === 'Active' ? 'bg-green-100 text-green-800' : t.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right relative">
                    <button 
                      onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === t.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                        <button onClick={() => { onView(t.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50">
                          Voir détails
                        </button>
                        <button onClick={() => { onEdit(t.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50">
                          Éditer
                        </button>
                        <button onClick={() => { onAddMember(t.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50">
                          Ajouter membre
                        </button>
                        <button onClick={() => { onAssignProject(t.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50">
                          Affecter projet
                        </button>
                        <button onClick={() => { onDelete(t.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t">
                          Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && <div className="text-gray-500">Aucune équipe trouvée.</div>}
    </div>
  )
}
