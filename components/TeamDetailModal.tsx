"use client"
import React from 'react'
import { X, UserPlus, UserMinus } from 'lucide-react'

type Member = { id: string; name: string; role: string; email?: string; tasksInProgress?: number; progress?: number }
type Team = {
  id: string
  name: string
  lead: string
  membersCount: number
  members: Member[]
  projects: { name: string; state: string; deadline?: string; progress: number; payment?: string }[]
  status: string
  createdAt?: string
}

interface Props {
  team: Team | null
  isOpen: boolean
  onClose: () => void
  onRemoveMember?: (teamId: string, memberId: string) => void
  onPromoteLead?: (teamId: string, memberId: string) => void
}

export default function TeamDetailModal({ team, isOpen, onClose, onRemoveMember, onPromoteLead }: Props) {
  if (!isOpen || !team) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[95%] md:w-3/4 lg:w-2/3 max-h-[80vh] overflow-auto rounded-lg shadow-lg p-6 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{team.name} — Détails</h2>
            <p className="text-sm text-gray-600">Chef d'équipe • {team.lead} • Créée le {team.createdAt || '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"><X /></button>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium">Membres</h3>
            <div className="mt-3 bg-gray-50 border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Collaborateur</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Poste</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">Email</th>
                    <th className="text-center px-3 py-2 whitespace-nowrap">Tâches</th>
                    <th className="text-center px-3 py-2 whitespace-nowrap">Progression</th>
                    <th className="text-right px-3 py-2 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members && team.members.length > 0 ? team.members.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-gray-100">
                      <td className="px-3 py-3 whitespace-nowrap">{m.name}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{m.role}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{m.email || '—'}</td>
                      <td className="px-3 py-3 text-center">{m.tasksInProgress || 0}</td>
                      <td className="px-3 py-3 text-center">{m.progress ? `${m.progress}%` : '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Retirer le membre"
                            onClick={() => {
                              if (window.confirm(`Retirer ${m.name} de l'équipe ?`)) {
                                onRemoveMember?.(team.id, m.id)
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 whitespace-nowrap"
                          >Retirer</button>

                          {m.name === team.lead ? (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md whitespace-nowrap">Chef</span>
                          ) : (
                            <button
                              title="Promouvoir en chef"
                              onClick={() => {
                                if (window.confirm(`Promouvoir ${m.name} comme chef d'équipe ?`)) {
                                  onPromoteLead?.(team.id, m.id)
                                }
                              }}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 whitespace-nowrap"
                            >Chef</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-4 py-3 text-center text-gray-500">Aucun membre</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Projets assignés</h3>
            <div className="mt-3 space-y-3">
              {team.projects.map((p) => (
                <div key={p.name} className="bg-white border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600">{p.state} • {p.deadline || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-700">{p.progress}%</div>
                    <div className="text-xs text-gray-500">{p.payment || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-50 border rounded-md">Fermer</button>
        </div>
      </div>
    </div>
  )
}
