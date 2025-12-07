import React from 'react'
import { notFound } from 'next/navigation'
import NextLink from 'next/link'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'

type ProjectDetail = {
  id: string
  title: string
  client: { id: string; nom: string } | null
  service?: { id: string; nom: string } | null
  status: 'en_cours' | 'termine' | 'en_retard'
  progress: number
  budget?: number | null
  dateDebut?: string | null
  dateFin?: string | null
  dateEcheance?: string | null
  tasks: Array<{ id: string; title: string; status: string }>
  team: Array<{ id: string; name: string; email?: string }>
  description?: string | null
}

const statusConfig = {
  en_cours: { color: 'bg-blue-500', label: 'En cours', badge: 'bg-blue-100 text-blue-800' },
  termine: { color: 'bg-green-500', label: 'Terminé', badge: 'bg-green-100 text-green-800' },
  en_retard: { color: 'bg-red-500', label: 'En retard', badge: 'bg-red-100 text-red-800' },
}

function getStatusIcon(status: string) {
  if (status === 'termine') return <CheckCircle size={16} />
  if (status === 'en_retard') return <AlertCircle size={16} />
  return <Clock size={16} />
}

async function fetchProject(id: string) {
  try {
    const projet = await prisma.projet.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
        taches: true,
        equipe: {
          include: {
            membres: {
              include: {
                utilisateur: true
              }
            }
          }
        }
      }
    })

    if (!projet) return null

    return {
      id: projet.id,
      title: projet.titre,
      client: projet.client ? { id: projet.client.id, nom: projet.client.nom } : null,
      service: projet.service ? { id: projet.service.id, nom: projet.service.nom } : null,
      status: (projet.statut === 'TERMINE' || projet.statut === 'ANNULE') ? 'termine' : (projet.statut === 'EN_RETARD' ? 'en_retard' : 'en_cours'),
      progress: projet.taches && projet.taches.length > 0 ? Math.round((projet.taches.filter(t => t.statut === 'TERMINE').length / projet.taches.length) * 100) : 0,
      budget: projet.budget || null,
      dateDebut: projet.dateDebut?.toISOString() || null,
      dateFin: projet.dateFin?.toISOString() || null,
      dateEcheance: projet.dateEcheance?.toISOString() || null,
      tasks: projet.taches ? projet.taches.map(t => ({ id: t.id, title: t.titre, status: t.statut })) : [],
      team: projet.equipe && projet.equipe.membres ? projet.equipe.membres.map(m => ({ id: m.utilisateur.id, name: `${m.utilisateur.prenom} ${m.utilisateur.nom}`, email: m.utilisateur.email })) : [],
      description: projet.description || null
    } as ProjectDetail
  } catch (err) {
    console.error('Erreur fetchProject:', err)
    return null
  }
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = params
  const project = await fetchProject(id)

  if (!project) return notFound()

  const status = statusConfig[project.status] || statusConfig.en_cours
  const tasksCompleted = project.tasks?.filter(t => t.status === 'TERMINE').length || 0
  const totalTasks = project.tasks?.length || 0

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-sm text-gray-600">{project.client?.nom || 'Sans client'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.badge}`}>
            {getStatusIcon(project.status)} {status.label}
          </span>
          <NextLink href="/projets" className="text-sm text-gray-600 hover:underline">Retour</NextLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-semibold mb-3">Détails du projet</h2>

          {project.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="text-sm text-gray-800">{project.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Service</p>
              <p className="text-sm text-gray-700">{project.service?.nom || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Budget</p>
              <p className="text-sm text-gray-900">{project.budget ? `${(project.budget / 1000000).toFixed(1)}M FCFA` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Période</p>
              <p className="text-sm text-gray-700">{project.dateDebut ? new Date(project.dateDebut).toLocaleDateString('fr-FR') : 'N/A'} - {project.dateFin ? new Date(project.dateFin).toLocaleDateString('fr-FR') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Échéance</p>
              <p className="text-sm text-gray-700">{project.dateEcheance ? new Date(project.dateEcheance).toLocaleDateString('fr-FR') : 'N/A'}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Tâches</p>
            {totalTasks === 0 ? (
              <p className="text-sm text-gray-600">Aucune tâche</p>
            ) : (
              <ul className="space-y-2">
                {project.tasks.map(t => (
                  <li key={t.id} className="flex items:center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.status}</p>
                    </div>
                    <div className="text-sm text-gray-700">{t.status === 'TERMINE' ? '✅' : '⏳'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="bg-white rounded-lg p-6 border">
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase">Progression</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">{Math.round(project.progress || 0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div className={`h-2.5 rounded-full ${status.color}`} style={{ width: `${project.progress || 0}%` }} />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase">Tâches</p>
            <p className="text-sm text-gray-700 font-medium">{tasksCompleted} / {totalTasks}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Équipe</p>
            {project.team && project.team.length > 0 ? (
              <ul className="space-y-2">
                {project.team.map(m => (
                  <li key={m.id} className="flex items-center justify-between">
                    <div className="text-sm text-gray-800">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.email || ''}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Aucun membre</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

