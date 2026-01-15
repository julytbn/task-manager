"use client"
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
  telephone?: string
  departement?: string
  equipes: EquipeData[]
}

const getStatusColor = (statut: string): string => {
  const s = statut?.toUpperCase() || ''
  if (s.includes('TERMINE')) return 'bg-green-100 text-green-700 border-green-300'
  if (s.includes('EN_COURS')) return 'bg-blue-100 text-blue-700 border-blue-300'
  if (s.includes('EN_REVISION')) return 'bg-purple-100 text-purple-700 border-purple-300'
  return 'bg-gray-100 text-gray-700 border-gray-300'
}

const getStatusIcon = (statut: string) => {
  const s = statut?.toUpperCase() || ''
  if (s.includes('TERMINE')) return <CheckCircle2 size={16} className="text-green-600" />
  if (s.includes('EN_COURS')) return <Clock size={16} className="text-blue-600" />
  if (s.includes('EN_REVISION')) return <AlertTriangle size={16} className="text-purple-600" />
  return <AlertCircle size={16} className="text-gray-600" />
}

// Composant pour afficher les détails d'une équipe
function TeamDetails({ team }: { team: EquipeData }) {
  const totalTasks = team.projets.reduce((sum: number, p: Project) => sum + (p.taches?.length || 0), 0)
  const completedTasks = team.projets.reduce((sum: number, p: Project) => 
    sum + (p.taches?.filter((t: ProjectTask) => t.statut?.toUpperCase().includes('TERMINE')).length || 0), 0
  )
  const inProgressTasks = team.projets.reduce((sum: number, p: Project) => 
    sum + (p.taches?.filter((t: ProjectTask) => t.statut?.toUpperCase().includes('EN_COURS')).length || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* En-tête de l'équipe */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900">👥 {team.nom}</h2>
            {team.description && <p className="text-sm text-blue-700 mt-1">{team.description}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded p-3 border border-blue-100">
              <div className="text-xs text-blue-600 font-semibold uppercase">Membres</div>
              <div className="text-2xl font-bold text-blue-900">{team.membres.length}</div>
            </div>
            <div className="bg-white rounded p-3 border border-blue-100">
              <div className="text-xs text-blue-600 font-semibold uppercase">Projets</div>
              <div className="text-2xl font-bold text-blue-900">{team.projets.length}</div>
            </div>
            <div className="bg-white rounded p-3 border border-blue-100">
              <div className="text-xs text-blue-600 font-semibold uppercase">Tâches</div>
              <div className="text-2xl font-bold text-blue-900">{totalTasks}</div>
            </div>
          </div>
        </div>
        
        {team.lead && (
          <div className="mt-4 text-sm text-blue-700">
            <span className="font-medium">Chef d'équipe:</span> {team.lead.prenom} {team.lead.nom}
          </div>
        )}
      </div>

      {/* Statistiques des tâches */}
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

      {/* Liste des membres */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">Membres de l'équipe</h3>
        </div>
        <div className="divide-y">
          {team.membres.map((membre) => (
            <div key={membre.id} className="p-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {membre.prenom?.[0]}{membre.nom?.[0]}
              </div>
              <div className="ml-3">
                <div className="font-medium">{membre.prenom} {membre.nom}</div>
                <div className="text-sm text-gray-500">{membre.email}</div>
              </div>
              {team.lead?.id === membre.id && (
                <span className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Chef d'équipe
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EmployeeTeamInfo() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<EquipeData | null>(null)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  useEffect(() => {
    console.log('Chargement des données utilisateur...');
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        console.log('Appel de /api/me...');
        const res = await fetch('/api/me');
        if (!res.ok) throw new Error('Échec de la récupération des données utilisateur');
        
        const data = await res.json();
        console.log('Données brutes de /api/me:', data);
        
        // Si l'utilisateur a une équipe
        if (data.equipe) {
          const equipe = data.equipe;
          const equipeData = {
            id: equipe.id,
            nom: equipe.nom,
            description: equipe.description || 'Équipe de développement',
            lead: equipe.lead,
            membres: equipe.membres?.map((m: any) => ({
              id: m.utilisateur.id,
              nom: m.utilisateur.nom,
              prenom: m.utilisateur.prenom,
              email: m.utilisateur.email,
              role: m.role
            })) || [],
            projets: equipe.projets || []
          };
          
          const formattedUser: UserData = {
            id: data.id,
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            telephone: data.telephone,
            role: data.role,
            departement: data.departement,
            equipes: [equipeData]
          };
          
          if (mounted) {
            console.log('Définition des données utilisateur avec équipe:', formattedUser);
            setUserData(formattedUser);
            setError(null);
          }
        } else {
          // User has no teams - set empty teams array
          const formattedUser: UserData = {
            id: data.id,
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            telephone: data.telephone,
            role: data.role,
            departement: data.departement,
            equipes: []  // Empty array - no default team
          };
          
          if (mounted) {
            console.log('Utilisateur sans équipe:', formattedUser);
            setUserData(formattedUser);
            setError(null);
          }
        }
        
        // La définition de userData est déjà gérée dans les blocs conditionnels
      } catch (err) {
        console.error('Erreur chargement team', err)
        if (mounted) setError('Erreur lors du chargement des données')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  console.log('Rendu du composant - État actuel:', { loading, userData, error });

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

  if (!userData?.equipes?.length) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-yellow-800">Aucune équipe</div>
            <div className="text-sm text-yellow-700">Vous n'appartenez à aucune équipe actuellement. Veuillez contacter votre manager.</div>
          </div>
        </div>
      </div>
    )
  }

  // Si une équipe est sélectionnée, afficher ses détails
  if (selectedTeam) {
    return (
      <div>
        <button 
          onClick={() => setSelectedTeam(null)}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Retour à la liste des équipes
        </button>
        <TeamDetails team={selectedTeam} />
      </div>
    )
  }

  // Sinon, afficher la liste des équipes
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mes équipes</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {userData.equipes.map((equipe) => {
          const totalTasks = equipe.projets.reduce((sum, p) => sum + (p.taches?.length || 0), 0)
          const completedTasks = equipe.projets.reduce((sum, p) => 
            sum + (p.taches?.filter(t => t.statut?.toUpperCase().includes('TERMINE')).length || 0), 0
          )
          
          return (
            <div 
              key={equipe.id}
              onClick={() => setSelectedTeam(equipe)}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{equipe.nom}</h4>
                  {equipe.description && (
                    <p className="text-sm text-gray-600 mt-1">{equipe.description}</p>
                  )}
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <Users size={14} className="mr-1" />
                    {equipe.membres.length} membre{equipe.membres.length > 1 ? 's' : ''}
                    <span className="mx-2">•</span>
                    <FolderOpen size={14} className="mr-1" />
                    {equipe.projets.length} projet{equipe.projets.length > 1 ? 's' : ''}
                    <span className="mx-2">•</span>
                    <CheckCircle2 size={14} className="mr-1" />
                    {completedTasks}/{totalTasks} tâches
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {equipe.lead?.id === userData.id ? 'Vous êtes le chef' : ''}
                </div>
              </div>
              
              {totalTasks > 0 && (
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
