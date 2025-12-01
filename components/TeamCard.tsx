"use client"
import React from 'react'
import { MoreHorizontal, Users, FileText, Trash2, Plus, Edit2 } from 'lucide-react'

interface Team {
  id: string
  name: string
  lead: string
  membersCount: number
  members: { id: string; name: string; role: string; email?: string; tasksInProgress?: number; progress?: number }[]
  projects: string[]
  status: 'Active' | 'En attente' | 'Surchargée'
  createdAt?: string
}

interface TeamCardProps {
  team: Team
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAddMember: (id: string) => void
  onAssignProject: (id: string) => void
}

export default function TeamCard({ team, onView, onEdit, onDelete, onAddMember, onAssignProject }: TeamCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
            <p className="text-sm text-gray-600 mt-1">Chef d'équipe • {team.lead}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${team.status === 'Active' ? 'bg-green-100 text-green-800' : team.status === 'Surchargée' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{team.status}</span>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700">
          <div className="flex items-center gap-3">
            <Users size={16} />
            <span>{team.membersCount} membres</span>
          </div>
          <div className="mt-2 text-sm">
            <div className="text-gray-500">Projets :</div>
            <div className="text-gray-800">{team.projects.slice(0,3).join(', ') || '—'}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onView(team.id)} className="text-sm px-3 py-2 bg-gray-50 border rounded-md hover:bg-gray-100">📄 Détails</button>
          <button onClick={() => onEdit(team.id)} className="text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><Edit2 size={14}/>Modifier</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onAddMember(team.id)} title="Ajouter membre" className="p-2 rounded-md bg-green-50 hover:bg-green-100 text-green-700"><Plus size={16}/></button>
          <button onClick={() => onAssignProject(team.id)} title="Assigner projet" className="p-2 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700"><FileText size={16}/></button>
          <button onClick={() => onDelete(team.id)} title="Supprimer" className="p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-700"><Trash2 size={16}/></button>
        </div>
      </div>
    </div>
  )
}
