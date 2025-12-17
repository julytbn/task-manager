'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Plus } from 'lucide-react'
import DataTable from '@/components/DataTable'
import { FormField, Select, Button } from '@/components/FormField'
import MainLayout from '@/components/layouts/MainLayout'

interface TacheItem {
  id: string
  titre: string
  description?: string
  projet?: { nom?: string; titre?: string }
  assigneA?: { prenom?: string; nom?: string }
  statut?: string
  priorite?: string
  dateEcheance?: string
  montant?: number
}

export default function TachesPage() {
  const [tasks, setTasks] = useState<TacheItem[]>([])
  const [filters, setFilters] = useState({
    statut: '',
    priorite: '',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/taches')
        const data = res.ok ? await res.json() : []
        if (mounted) setTasks(data || [])
      } catch (err) {
        console.error('Erreur chargement tâches:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.statut && task.statut !== filters.statut) return false
      if (filters.priorite && task.priorite !== filters.priorite) return false
      return true
    })
  }, [tasks, filters])

  const handleEdit = async (task: any) => {
    try {
      const response = await fetch(`/api/taches/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titre: task.titre,
          description: task.description,
          statut: task.statut,
          priorite: task.priorite,
          dateEcheance: task.dateEcheance,
          assigneAId: task.assigneA?.id || null
        })
      });

      if (response.ok) {
        // Rafraîchir la liste des tâches
        const updatedTasks = await fetch('/api/taches').then(res => res.json());
        setTasks(updatedTasks);
        alert('Tâche mise à jour avec succès');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      const message = error instanceof Error ? error.message : 'Étapes lors de la mise à jour de la tâche';
      alert(message);
    }
  };

  const handleDelete = async (task: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.titre}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/taches/${task.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Mettre à jour l'état local en supprimant la tâche
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
        alert('Tâche supprimée avec succès');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error);
      const message = error instanceof Error ? error.message : 'Étapes lors de la suppression de la tâche';
      alert(message);
    }
  };

  const handleView = (task: any) => {
    console.log('Afficher tâche:', task)
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gold-gradient-text">Gestion des tâches</h1>
            <p className="text-[var(--color-anthracite)]/70 mt-2">Tous les projets et leurs tâches associées</p>
          </div>
          <Button variant="primary" size="lg">
            <Plus size={20} />
            Nouvelle tâche
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Select
            label="Statut"
            options={[
              { label: 'À faire', value: 'A_FAIRE' },
              { label: 'En cours', value: 'EN_COURS' },
              { label: 'En révision', value: 'EN_REVISION' },
              { label: 'Terminée', value: 'TERMINEE' },
            ]}
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
          />
          <Select
            label="Priorité"
            options={[
              { label: 'Basse', value: 'BASSE' },
              { label: 'Normale', value: 'NORMALE' },
              { label: 'Haute', value: 'HAUTE' },
              { label: 'Urgent', value: 'URGENT' },
            ]}
            value={filters.priorite}
            onChange={(e) => setFilters({ ...filters, priorite: e.target.value })}
          />
          <Button
            variant="secondary"
            onClick={() => setFilters({ statut: '', priorite: '' })}
            className="mt-6"
          >
            Réinitialiser
          </Button>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold gold-gradient-text">
              Tâches ({filteredTasks.length})
            </h2>
          </div>
          {isLoading ? (
            <div className="text-center py-12 text-[var(--color-anthracite)]/70">
              Chargement des tâches...
            </div>
          ) : (
            <DataTable
              columns={[
                { key: 'titre', label: 'Titre', sortable: true, width: '25%' },
                { key: 'projet', label: 'Projet', sortable: true, width: '20%' },
                { key: 'assignee', label: 'Assignée à', width: '20%' },
                { key: 'statut', label: 'Statut', sortable: true, width: '15%' },
                { key: 'priorite', label: 'Priorité', width: '10%' },
                { key: 'dateEcheance', label: 'Échéance', sortable: true, width: '10%' },
              ]}
              data={filteredTasks.map(t => ({
                titre: t.titre || 'Sans titre',
                projet: t.projet?.nom || t.projet?.titre || '-',
                assignee: t.assigneA?.nom || 'Non assigné',
                statut: t.statut || 'N/A',
                priorite: t.priorite || 'Normale',
                dateEcheance: t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString('fr-FR') : '-',
              }))}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              itemsPerPage={15}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}