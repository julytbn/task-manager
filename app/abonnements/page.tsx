'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Grid, List } from 'lucide-react'
import { FormField, Button } from '@/components/FormField'
import StatCard from '@/components/StatCard'
import AbonnementsList from '@/components/AbonnementsList'
import AbonnementModal from '@/components/AbonnementModal'
import MainLayout from '@/components/layouts/MainLayout'

type Abonnement = {
  id: string
  nom: string
  client?: { nom: string }
  montant: number
  frequence: string
  statut: string
  dateProchainFacture?: string
}

export default function AbonnementsPage() {
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAbonnement, setSelectedAbonnement] = useState<any>(null)

  const fetchAbonnements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/abonnements')
      if (response.ok) {
        const data = await response.json()
        setAbonnements(data || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAbonnements()
  }, [])

  const filteredAbonnements = useMemo(() => {
    return abonnements.filter(abo =>
      (abo.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (abo.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    )
  }, [abonnements, searchTerm])

  const stats = {
    total: abonnements.length,
    actifs: abonnements.filter(a => a.statut === 'ACTIF').length,
    enRetard: abonnements.filter(a => {
      if (!a.dateProchainFacture) return false
      return new Date(a.dateProchainFacture) < new Date()
    }).length,
    montantMensuel: abonnements
      .filter(a => a.statut === 'ACTIF')
      .reduce((sum, a) => sum + (a.montant || 0), 0),
  }

  const handleCreateNew = () => {
    setSelectedAbonnement(null)
    setIsModalOpen(true)
  }

  const handleSaved = () => {
    fetchAbonnements()
    setIsModalOpen(false)
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestion des abonnements</h1>
            <p className="text-gray-500 mt-2">Gérez les abonnements clients avec facturation automatique</p>
          </div>
          <Button variant="primary" size="lg" onClick={handleCreateNew}>
            <Plus size={20} />
            Nouvel abonnement
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            icon={Plus} 
            title="Abonnements totaux" 
            value={stats.total} 
            trend={{ value: 0, direction: 'up' }} 
          />
          <StatCard 
            icon={Plus} 
            title="Actifs" 
            value={stats.actifs} 
            trend={{ value: 0, direction: 'up' }} 
          />
          <StatCard 
            icon={Plus} 
            title="En retard" 
            value={stats.enRetard} 
            trend={{ value: 0, direction: stats.enRetard > 0 ? 'down' : 'up' }} 
          />
          <StatCard 
            icon={Plus} 
            title="Montant mensuel" 
            value={`${(stats.montantMensuel / 1000).toFixed(0)}K FCFA`} 
            trend={{ value: 0, direction: 'up' }} 
          />
        </div>

        {/* Search & View Toggle */}
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="flex-1">
            <FormField 
              placeholder="Rechercher par nom ou client..." 
              value={searchTerm} 
              onChange={(e: any) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'cards' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Chargement des abonnements...</div>
        ) : viewMode === 'table' ? (
          <AbonnementsList 
            abonnements={filteredAbonnements}
            onEdit={(abo) => {
              setSelectedAbonnement(abo)
              setIsModalOpen(true)
            }}
            onRefresh={fetchAbonnements}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAbonnements.map((abo) => {
              const isOverdue = abo.dateProchainFacture && new Date(abo.dateProchainFacture) < new Date()
              return (
                <div 
                  key={abo.id} 
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{abo.nom}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      abo.statut === 'ACTIF' 
                        ? 'bg-green-100 text-green-800' 
                        : abo.statut === 'SUSPENDU'
                        ? 'bg-yellow-100 text-yellow-800'
                        : abo.statut === 'ANNULE'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {abo.statut}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Client: {abo.client?.nom || '-'}
                  </p>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Montant</span>
                      <span className="font-semibold text-gray-900">
                        {(abo.montant || 0).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Fréquence</span>
                      <span className="font-semibold text-gray-900">{abo.frequence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Prochaine facture</span>
                      <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {abo.dateProchainFacture 
                          ? new Date(abo.dateProchainFacture).toLocaleDateString('fr-FR')
                          : '-'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAbonnement(abo)
                      setIsModalOpen(true)
                    }}
                    className="mt-4 w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                  >
                    Modifier
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AbonnementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAbonnement(null)
        }}
        onSaved={handleSaved}
        initialData={selectedAbonnement}
      />
    </MainLayout>
  )
}
