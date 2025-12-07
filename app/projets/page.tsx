'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Grid, List } from 'lucide-react'
import { MainLayout, StatCard, DataTable, ProgressBar } from '../../components'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/ui'
import ProjectModal from '../../components/ProjectModal'
import ProjectDetailModal from '../../components/ProjectDetailModal'
import EditProjectModal from '../../components/EditProjectModal'

const fetchProjects = async () => {
  const response = await fetch('/api/projets')
  if (response.ok) {
    const json = await response.json()
    // Normaliser les clés retournées par l'API afin d'assurer une compatibilité
    // avec le reste de l'application (certaines routes renvoient `title`/`status`).
    if (Array.isArray(json)) {
      return json.map((p: any) => ({
        // garder les valeurs existantes mais fournir des alias attendus
        ...p,
        titre: p.titre || p.title || p.nom || '',
        statut: p.statut || p.status || p.statut || '',
      }))
    }
    // cas où l'API renvoie un objet unique
    return {
      ...json,
      titre: json.titre || json.title || json.nom || '',
      statut: json.statut || json.status || json.statut || '',
    }
  }
  return []
}

const Page = () => {
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data || [])
      setIsLoading(false)
    })
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        (p.titre || p.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.client?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [projects, searchTerm])

  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => (p.statut || '').toString().toUpperCase().includes('EN_COURS')).length,
    completed: projects.filter((p) => (p.statut || '').toString().toUpperCase().includes('TERMINE')).length,
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / projects.length) : 0,
  }

  // Fonction pour calculer la progression en fonction du statut
  const getProgressFromStatus = (statut: string | undefined): number => {
    const status = statut?.toUpperCase() || ''
    if (status.includes('TERMINE')) return 100
    if (status.includes('EN_COURS')) return 50
    return 0
  }

  const handleEdit = (project: any) => {
    setSelectedProject(project)
    setIsEditOpen(true)
  }

  const handleDelete = async (projectId: number) => {
    try {
      const response = await fetch(`/api/projets/${projectId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setProjects(projects.filter((p) => p.id !== projectId))
        setIsDetailOpen(false)
        alert('Projet supprimé avec succès')
      } else {
        const error = await response.json()
        alert(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`)
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du projet:', err)
      alert('Erreur lors de la suppression du projet')
    }
  }

  const handleDeleteFromTable = async (row: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${row.titre}" ? Cette action est irréversible.`)) {
      await handleDelete(row.id)
    }
  }

  const handleView = (project: any) => {
    setSelectedProject(project)
    setIsDetailOpen(true)
  }

  const handleProjectCreated = async () => {
    try {
      const data = await fetchProjects()
      setProjects(data || [])
    } catch (err) {
      console.error('Erreur rafraîchissement projets:', err)
    }
    setIsProjectModalOpen(false)
  }

  const handleSaveEdit = (updatedProject: any) => {
    setIsEditOpen(false)
    setSelectedProject(null)
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gold-gradient-text">Gestion des projets</h1>
            <p className="text-[var(--color-anthracite)]/70 mt-2">Tous vos projets en un seul endroit</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setIsProjectModalOpen(true)}>
            <Plus size={20} />
            Nouveau projet
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={Plus} title="Projets totaux" value={stats.total} trend={{ value: 8, direction: 'up' }} />
          <StatCard icon={Plus} title="En cours" value={stats.inProgress} trend={{ value: 5, direction: 'up' }} />
          <StatCard icon={Plus} title="Terminés" value={stats.completed} trend={{ value: 3, direction: 'up' }} />
          <StatCard icon={Plus} title="Progression moyenne" value={`${stats.avgProgress}%`} trend={{ value: 12, direction: 'up' }} />
        </div>

        {/* Search & View Toggle */}
        <div className="card flex items-center gap-4">
          <div className="flex-1">
            <FormField placeholder="Rechercher par titre ou client..." value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-4">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]' : 'text-[var(--color-anthracite)] hover:bg-[var(--color-offwhite)]'}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]' : 'text-[var(--color-anthracite)] hover:bg-[var(--color-offwhite)]'}`}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-[var(--color-anthracite)]/70">Chargement des projets...</div>
        ) : viewMode === 'table' ? (
          <div className="card">
            <DataTable
              columns={[
                { key: 'titre', label: 'Projet', sortable: true, width: '20%' },
                { key: 'client', label: 'Client', width: '20%' },
                { key: 'statut', label: 'Statut', sortable: true, width: '15%' },
                { key: 'progress', label: 'Progression', width: '25%' },
                { key: 'budget', label: 'Budget', sortable: true, width: '15%' },
                { key: 'dateDebut', label: 'Début', width: '10%' },
              ]}
              data={filteredProjects.map((p) => ({
                ...p,
                titre: p.titre || p.nom || 'Sans titre',
                client: p.client?.nom || 'N/A',
                statut: p.statut || 'N/A',
                progress: `${(p.progress ?? getProgressFromStatus(p.statut))}%`,
                budget: p.budget ? `${(p.budget / 1000).toFixed(0)}K FCFA` : '-',
                dateDebut: p.dateDebut ? new Date(p.dateDebut).toLocaleDateString('fr-FR') : '-',
              }))}
              onEdit={handleEdit}
              onDelete={handleDeleteFromTable}
              itemsPerPage={10}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="card group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleView(project)}>
                {/* Project Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-[var(--color-gold)]/20 to-[var(--color-gold-shadow)]/20 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl font-bold gold-gradient-text">
                    {(project.titre || project.nom)?.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Project Info */}
                <h3 className="text-lg font-bold text-[var(--color-black-deep)] mb-2">
                  {project.titre || project.nom || 'Sans titre'}
                </h3>
                <p className="text-sm text-[var(--color-anthracite)]/70 mb-4">
                  Client: {project.client?.nom || 'N/A'}
                </p>

                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
                    {project.statut || 'N/A'}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-anthracite)]">
                    {project.dateDebut ? new Date(project.dateDebut).toLocaleDateString('fr-FR') : '-'}
                  </span>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  value={getProgressFromStatus(project.statut)}
                  label="Progression"
                  showPercentage={true}
                  size="md"
                />

                {/* Budget */}
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <p className="text-xs uppercase text-[var(--color-anthracite)]/70 font-semibold mb-2">Budget</p>
                  <p className="text-lg font-bold gold-gradient-text">
                    {project.budget ? `${(project.budget / 1000).toFixed(0)}K FCFA` : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
      <ProjectDetailModal
        project={selectedProject}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <EditProjectModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveEdit}
        project={selectedProject}
      />
    </MainLayout>
  )
}

export default Page