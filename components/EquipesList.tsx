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
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-[var(--color-offwhite)] border-b border-[var(--color-border)]">
        <div className="flex items-center bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 gap-2 flex-1">
          <Search size={16} className="text-[var(--color-anthracite)]" />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Recherche par équipe / employé / projet" 
            className="w-full outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={sizeFilter} 
            onChange={(e) => setSizeFilter(e.target.value)} 
            className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-anthracite)]"
          >
            <option value="">Taille</option>
            <option value="small">Petite (&lt;=5)</option>
            <option value="medium">Moyenne (6-15)</option>
            <option value="large">Grande (&gt;=16)</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-anthracite)]"
          >
            <option value="">Statut</option>
            <option value="Active">Active</option>
            <option value="En attente">En attente</option>
            <option value="Surchargée">Surchargée</option>
          </select>
          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)} 
            className="bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-anthracite)]"
          >
            <option value="">Projet</option>
            {allProjects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-gold)] border-b border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-3 text-left font-bold text-[var(--color-black-deep)]">Nom</th>
              <th className="px-6 py-3 text-left font-bold text-[var(--color-black-deep)]">Responsable</th>
              <th className="px-6 py-3 text-left font-bold text-[var(--color-black-deep)]">Membres</th>
              <th className="px-6 py-3 text-left font-bold text-[var(--color-black-deep)]">Projets</th>
              <th className="px-6 py-3 text-left font-bold text-[var(--color-black-deep)]">Statut</th>
              <th className="px-6 py-3 text-right font-bold text-[var(--color-black-deep)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-white">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-[var(--color-offwhite)] transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-[var(--color-black-deep)]">{t.name}</td>
                <td className="px-6 py-3 text-sm text-[var(--color-anthracite)]">{t.lead}</td>
                <td className="px-6 py-3 text-sm">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
                    {t.membersCount} membre{t.membersCount !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-[var(--color-anthracite)]">
                  {t.projects.length > 0 ? t.projects.slice(0, 2).join(', ') + (t.projects.length > 2 ? ` +${t.projects.length - 2}` : '') : '—'}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    t.status === 'Active' ? 'bg-green-100 text-green-800' 
                    : t.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right relative">
                  <button 
                    onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                    className="p-2 hover:bg-[var(--color-offwhite)] rounded-lg text-[var(--color-anthracite)]"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openMenu === t.id && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-10">
                      <button 
                        onClick={() => { onView(t.id); setOpenMenu(null); }} 
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 font-medium"
                      >
                        👁️ Voir détails
                      </button>
                      <button 
                        onClick={() => { onEdit(t.id); setOpenMenu(null); }} 
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 font-medium"
                      >
                        ✏️ Éditer
                      </button>
                      <button 
                        onClick={() => { onAddMember(t.id); setOpenMenu(null); }} 
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 font-medium"
                      >
                        ➕ Ajouter membre
                      </button>
                      <button 
                        onClick={() => { onAssignProject(t.id); setOpenMenu(null); }} 
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 font-medium"
                      >
                        📋 Affecter projet
                      </button>
                      <button 
                        onClick={() => { onDelete(t.id); setOpenMenu(null); }} 
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-[var(--color-border)] font-medium"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[var(--color-anthracite)]">
          Aucune équipe trouvée.
        </div>
      )}
    </div>
  )
}
