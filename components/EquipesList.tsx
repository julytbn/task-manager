"use client"
import React, { useMemo, useState } from 'react'
import TeamCard from './TeamCard'
import { Search, Filter } from 'lucide-react'

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
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [projectFilter, setProjectFilter] = useState<string>('')

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <TeamCard key={t.id} team={t} onView={onView} onEdit={onEdit} onDelete={onDelete} onAddMember={onAddMember} onAssignProject={onAssignProject} />
        ))}
      </div>

      {filtered.length === 0 && <div className="text-gray-500">Aucune équipe trouvée.</div>}
    </div>
  )
}
