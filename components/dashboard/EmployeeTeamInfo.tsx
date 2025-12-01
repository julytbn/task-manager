"use client"
import React, { useEffect, useState } from 'react'
import { Users, FolderOpen, AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

interface TeamMember {
  id: string
  nom: string
  prenom: string
  email: string
  role?: string
}

interface ProjectTask {
  id: string
  titre: string
  statut: string
  priorite: string
  dateEcheance?: string | null
  assigneAId?: string
}

interface Project {
  id: string
  titre: string
  description?: string
  statut: string
  tachesCount: number
  taches: ProjectTask[]
}

interface EquipeData {
  id: string
  nom: string
  description?: string
  lead: { id: string; nom: string; prenom: string; email: string } | null
  membres: TeamMember[]
  projets: Project[]
}

interface UserData {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  equipe: EquipeData | null
}

const getStatusColor = (statut: string): string => {
  const s = statut?.toUpperCase() || ''
  if (s.includes('TERMINE')) return 'bg-green-100 text-green-700 border-green-300'
  if (s.includes('EN_COURS')) return 'bg-blue-100 text-blue-700 border-blue-300'
  if (s.includes('EN_REVISION')) return 'bg-purple-100 text-purple-700 border-purple-300'
  return 'bg-gray-100 text-gray-700 border-gray-300'
}

const getPriorityColor = (priorite: string): string => {
  const p = priorite?.toUpperCase() || ''
  if (p.includes('URGENT')) return 'bg-red-50 border-red-200'
  if (p.includes('HAUTE')) return 'bg-orange-50 border-orange-200'
  if (p.includes('MOYENNE')) return 'bg-yellow-50 border-yellow-200'
  return 'bg-blue-50 border-blue-200'
}

const getStatusIcon = (statut: string) => {
  const s = statut?.toUpperCase() || ''
  if (s.includes('TERMINE')) return <CheckCircle2 size={16} className="text-green-600" />
  if (s.includes('EN_COURS')) return <Clock size={16} className="text-blue-600" />
  if (s.includes('EN_REVISION')) return <AlertTriangle size={16} className="text-purple-600" />
  return <AlertCircle size={16} className="text-gray-600" />
}

export default function EmployeeTeamInfo() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/me')
        if (!res.ok) throw new Error('Failed to fetch user')
        
        const data = await res.json()
        if (mounted) {
          setUserData(data)
          setError(null)
        }
      } catch (err) {
        console.error('Erreur chargement team', err)
        if (mounted) setError('Erreur lors du chargement des données')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!userData?.equipe) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-yellow-800">Pas d'équipe</div>
            <div className="text-sm text-yellow-700">Vous n'appartinez à aucune équipe actuellement. Veuillez contacter votre manager.</div>
          </div>
        </div>
      </div>
    )
  }

  const { equipe } = userData
  const totalTasks = equipe.projets.reduce((sum, p) => sum + p.tachesCount, 0)
  const completedTasks = equipe.projets.reduce((sum, p) => 
    sum + p.taches.filter(t => t.statut?.toUpperCase().includes('TERMINE')).length, 0
  )
  const inProgressTasks = equipe.projets.reduce((sum, p) => 
    sum + p.taches.filter(t => t.statut?.toUpperCase().includes('EN_COURS')).length, 0
  )

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Team Overview Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-1">👥 {equipe.nom}</h2>
            {equipe.description && <p className="text-sm text-blue-700">{equipe.description}</p>}
          </div>
          <div className="bg-white rounded p-3 border border-blue-100">
            <div className="text-xs text-blue-600 font-semibold uppercase">Membres</div>
            <div className="text-2xl font-bold text-blue-900">{equipe.membres.length}</div>
          </div>
          <div className="bg-white rounded p-3 border border-blue-100">
            <div className="text-xs text-blue-600 font-semibold uppercase">Projets</div>
            <div className="text-2xl font-bold text-blue-900">{equipe.projets.length}</div>
          </div>
          <div className="bg-white rounded p-3 border border-blue-100">
            <div className="text-xs text-blue-600 font-semibold uppercase">Tâches</div>
            <div className="text-2xl font-bold text-blue-900">{totalTasks}</div>
          </div>
        </div>
        {equipe.lead && (
          <div className="mt-4 text-sm text-blue-700">
            <span className="font-medium">Chef d'équipe:</span> {equipe.lead.prenom} {equipe.lead.nom}
          </div>
        )}
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold">Terminées</div>
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            </div>
            <CheckCircle2 size={28} className="text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold">En cours</div>
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
            </div>
            <Clock size={28} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold">À faire</div>
              <div className="text-2xl font-bold text-gray-600">{totalTasks - completedTasks - inProgressTasks}</div>
            </div>
            <AlertCircle size={28} className="text-gray-200" />
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">Membres de l'équipe ({equipe.membres.length})</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipe.membres.map(m => (
            <div key={m.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded p-3 border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {m.prenom.charAt(0)}{m.nom.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{m.prenom} {m.nom}</div>
                  <div className="text-xs text-gray-600">{m.email}</div>
                  {m.role && <div className="text-xs text-blue-600 font-medium mt-1">{m.role}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects and Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen size={20} className="text-green-600" />
          <h3 className="text-lg font-semibold">Projets assignés ({equipe.projets.length})</h3>
        </div>
        <div className="space-y-4">
          {equipe.projets.length > 0 ? equipe.projets.map((projet) => {
            const isExpanded = expandedProject === projet.id
            const completedProjectTasks = projet.taches.filter(t => t.statut?.toUpperCase().includes('TERMINE')).length
            const progressPercent = projet.tachesCount > 0 ? Math.round((completedProjectTasks / projet.tachesCount) * 100) : 0
            
            return (
              <div key={projet.id} className={`border rounded-lg overflow-hidden transition-all ${getPriorityColor('')}`}>
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : projet.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-opacity-75 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{projet.titre}</h4>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(projet.statut)}`}>
                        {projet.statut}
                      </span>
                    </div>
                    {projet.description && (
                      <p className="text-sm text-gray-600 mb-2">{projet.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{progressPercent}% - {completedProjectTasks}/{projet.tachesCount} tâches</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </button>

                {/* Expanded Tasks List */}
                {isExpanded && projet.taches.length > 0 && (
                  <div className="border-t bg-gray-50 p-4 space-y-2 max-h-96 overflow-y-auto">
                    {projet.taches.map(tache => (
                      <div key={tache.id} className={`p-3 rounded border-l-4 ${getPriorityColor(tache.priorite)}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(tache.statut)}
                              <span className="font-medium text-gray-900">{tache.titre}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(tache.statut)}`}>
                                {tache.statut}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 border border-gray-300">
                                {tache.priorite}
                              </span>
                              {tache.dateEcheance && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 border border-gray-300">
                                  📅 {new Date(tache.dateEcheance).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && projet.taches.length === 0 && (
                  <div className="border-t bg-gray-50 p-4 text-center text-sm text-gray-600">
                    Aucune tâche pour ce projet
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="text-center py-6 text-gray-500">
              Aucun projet assigné à cette équipe
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
