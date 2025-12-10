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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-xl p-6 sm:p-8 relative">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-black-deep)]">{team.name}</h2>
            <p className="text-sm text-[var(--color-anthracite)]/70 mt-1">
              Chef d'équipe: <span className="font-semibold text-[var(--color-gold)]">{team.lead}</span> • Créée le {team.createdAt || '—'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-[var(--color-offwhite)] text-[var(--color-anthracite)]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu principal */}
        <div className="space-y-6">
          {/* Membres */}
          <div>
            <h3 className="text-lg font-bold text-[var(--color-black-deep)] mb-4">
              Membres ({team.members?.length || 0})
            </h3>
            <div className="bg-[var(--color-offwhite)] rounded-lg border border-[var(--color-border)] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-gold)]/10 border-b border-[var(--color-border)]">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-[var(--color-gold)]">Collaborateur</th>
                    <th className="text-left px-6 py-3 font-semibold text-[var(--color-gold)]">Poste</th>
                    <th className="text-left px-6 py-3 font-semibold text-[var(--color-gold)]">Email</th>
                    <th className="text-center px-6 py-3 font-semibold text-[var(--color-gold)]">Tâches</th>
                    <th className="text-center px-6 py-3 font-semibold text-[var(--color-gold)]">Progression</th>
                    <th className="text-right px-6 py-3 font-semibold text-[var(--color-gold)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] bg-white">
                  {team.members && team.members.length > 0 ? team.members.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--color-offwhite)] transition-colors">
                      <td className="px-6 py-3 font-medium text-[var(--color-black-deep)]">{m.name}</td>
                      <td className="px-6 py-3 text-[var(--color-anthracite)]">{m.role}</td>
                      <td className="px-6 py-3 text-[var(--color-anthracite)]/70">{m.email || '—'}</td>
                      <td className="px-6 py-3 text-center text-[var(--color-black-deep)]">{m.tasksInProgress || 0}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
                          {m.progress ? `${m.progress}%` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {m.name === team.lead ? (
                            <span className="px-3 py-1 text-xs font-semibold bg-[var(--color-gold)]/20 text-[var(--color-gold)] rounded-full">👑 Chef</span>
                          ) : (
                            <button
                              title="Promouvoir en chef"
                              onClick={() => {
                                if (window.confirm(`Promouvoir ${m.name} comme chef d'équipe ?`)) {
                                  onPromoteLead?.(team.id, m.id)
                                }
                              }}
                              className="px-3 py-1 text-xs font-semibold bg-[var(--color-gold)]/20 text-[var(--color-gold)] rounded-full hover:bg-[var(--color-gold)]/30 transition-colors"
                            >
                              Promouvoir
                            </button>
                          )}
                          <button
                            title="Retirer le membre"
                            onClick={() => {
                              if (window.confirm(`Retirer ${m.name} de l'équipe ?`)) {
                                onRemoveMember?.(team.id, m.id)
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <UserMinus size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-[var(--color-anthracite)]/70">Aucun membre</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Projets assignés */}
          <div>
            <h3 className="text-lg font-bold text-[var(--color-black-deep)] mb-4">
              Projets assignés ({team.projects?.length || 0})
            </h3>
            {team.projects && team.projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.projects.map((p) => (
                  <div key={p.name} className="bg-white border border-[var(--color-border)] rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-[var(--color-black-deep)]">{p.name}</h4>
                        <p className="text-xs text-[var(--color-anthracite)]/70 mt-1">{p.state} • {p.deadline || '—'}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
                        {p.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                      <div 
                        className="bg-[var(--color-gold)] h-2 rounded-full transition-all" 
                        style={{ width: `${p.progress}%` }}
                      ></div>
                    </div>
                    {p.payment && (
                      <p className="text-xs text-[var(--color-anthracite)]/70 mt-2">Paiement: {p.payment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[var(--color-offwhite)] rounded-lg border border-[var(--color-border)]">
                <p className="text-[var(--color-anthracite)]/70">Aucun projet assigné</p>
              </div>
            )}
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border)]">
            <div className="bg-[var(--color-offwhite)] rounded-lg p-4">
              <p className="text-xs font-semibold text-[var(--color-anthracite)]/70 uppercase mb-2">Total Membres</p>
              <p className="text-2xl font-bold text-[var(--color-black-deep)]">{team.membersCount}</p>
            </div>
            <div className="bg-[var(--color-offwhite)] rounded-lg p-4">
              <p className="text-xs font-semibold text-[var(--color-anthracite)]/70 uppercase mb-2">Statut</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                team.status === 'Active' ? 'bg-green-100 text-green-800' 
                : team.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
              }`}>
                {team.status}
              </span>
            </div>
            <div className="bg-[var(--color-offwhite)] rounded-lg p-4">
              <p className="text-xs font-semibold text-[var(--color-anthracite)]/70 uppercase mb-2">Projets</p>
              <p className="text-2xl font-bold text-[var(--color-gold)]">{team.projects?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:brightness-95 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
