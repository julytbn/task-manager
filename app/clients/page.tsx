'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid, List, Eye } from 'lucide-react'
import DataTable from '@/components/DataTable'
import { FormField, Button } from '@/components/FormField'
import NouveauClientModal from '@/components/NouveauClientModal'
import StatCard from '@/components/StatCard'
import { useEnums } from '@/lib/useEnums'
import MainLayout from '@/components/layouts/MainLayout'

type Client = {
  id: string
  nom: string
  prenom: string
  email?: string
  telephone?: string
  type: string
  regimeFiscal?: string
  entreprise?: string
  adresse?: string
  projetsCount?: number
  montantTotal?: number
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [modalInitialClient, setModalInitialClient] = useState<Client | null>(null)
  
  // Filtres avancés
  const [filters, setFilters] = useState({
    type: '',
    regimeFiscal: '',
    adresse: '',
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/clients')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`)
      }
      
      const data = await response.json()
      setClients(data || [])
    } catch (error) {
      console.error('Erreur chargement clients:', error)
      alert(`Erreur lors du chargement des clients: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    fetchClients()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Filtre recherche textuelle
      const matchSearch = !searchTerm || 
        client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.adresse?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtre type
      const matchType = !filters.type || client.type === filters.type
      
      // Filtre régime fiscal
      const matchRegime = !filters.regimeFiscal || (client as any).regimeFiscal === filters.regimeFiscal
      
      // Filtre adresse
      const matchAdresse = !filters.adresse || 
        client.adresse?.toLowerCase().includes(filters.adresse.toLowerCase())
      
      return matchSearch && matchType && matchRegime && matchAdresse
    })
  }, [clients, searchTerm, filters])

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.type !== 'INACTIF').length,
    totalRevenue: clients.reduce((sum, c) => sum + (c.montantTotal || 0), 0),
  }

  const handleEdit = (row: any) => {
    const client = row._client || null
    if (!client) return
    setModalInitialClient(client)
    setIsNewClientOpen(true)
  }

  const handleDelete = async (row: any) => {
    const client = row._client || null
    if (!client) return
    if (!confirm(`Supprimer le client ${client.prenom} ${client.nom} ?`)) return
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      await fetchClients()
      if (selectedClient?.id === client.id) setSelectedClient(null)
    } catch (err) {
      console.error('Erreur suppression client:', err)
      alert('Impossible de supprimer le client')
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Gestion des clients</h1>
          <p className="text-gray-500 mt-2">Tous vos clients et leurs projets</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => { setModalInitialClient(null); setIsNewClientOpen(true); }}>
          <Plus size={20} />
          Nouveau client
        </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Plus}
            title="Clients totaux"
            value={stats.total}
            trend={{ value: 5, direction: 'up' }}
          />
          <StatCard
            icon={Plus}
            title="Clients actifs"
            value={stats.active}
            trend={{ value: 3, direction: 'up' }}
          />
          <StatCard
            icon={Plus}
            title="Revenus totaux"
            value={`${(stats.totalRevenue / 1000000).toFixed(1)}M`}
            trend={{ value: 12, direction: 'up' }}
          />
        </div>

        {/* Search & Filters Section */}
        <div className="space-y-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  placeholder="Rechercher par nom, email ou entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-all"
                >
                  {showAdvancedFilters ? '⬆ Filtres' : '⬇ Filtres'}
                </button>
                
                <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'table'
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    title="Vue tableau"
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    title="Vue en grille"
                  >
                    <Grid size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de client</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="PARTICULIER">Particulier</option>
                  <option value="ENTREPRISE">Entreprise</option>
                  <option value="ORGANISATION">Organisation</option>
                  <option value="ETABLISSEMENT">Établissement</option>
                  <option value="SOCIETE">Société</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Régime fiscal</label>
                <select
                  value={filters.regimeFiscal}
                  onChange={(e) => setFilters({...filters, regimeFiscal: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="AVEC_TVA">Avec TVA</option>
                  <option value="SANS_TVA">Sans TVA</option>
                  <option value="TPU">TPU</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={filters.adresse}
                  onChange={(e) => setFilters({...filters, adresse: e.target.value})}
                  placeholder="Filtrer par adresse..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {(filters.type || filters.regimeFiscal || filters.adresse) && (
                <button
                  onClick={() => setFilters({type: '', regimeFiscal: '', adresse: ''})}
                  className="col-span-1 md:col-span-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Chargement des clients...</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <DataTable
                columns={[
                  { key: 'nom', label: 'Nom', sortable: true, width: '20%' },
                  { key: 'email', label: 'Email', width: '20%' },
                  { key: 'telephone', label: 'Téléphone', width: '15%' },
                  { key: 'entreprise', label: 'Entreprise', width: '20%' },
                  { key: 'projetsCount', label: 'Projets', sortable: true, width: '10%' },
                  { key: 'montantTotal', label: 'Montant', sortable: true, width: '15%' },
                ]}
                data={filteredClients.map(c => ({
                  _client: c,
                  id: c.id,
                  nom: `${c.prenom} ${c.nom}`,
                  email: c.email || '-',
                  telephone: c.telephone || '-',
                  entreprise: c.entreprise || '-',
                  projetsCount: c.projetsCount || 0,
                  montantTotal: c.montantTotal ? `${(c.montantTotal / 1000).toFixed(0)}K FCFA` : '-',
                }))}
                onView={(row) => router.push(`/clients/${row._client.id}`)}
                onEdit={(row) => handleEdit(row as any)}
                onDelete={(row) => handleDelete(row as any)}
                itemsPerPage={10}
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <div
                      key={client.id}
                      className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                          {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          client.type?.toLowerCase() === 'entreprise' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {client.type || 'Particulier'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {client.prenom} {client.nom}
                      </h3>
                      {client.entreprise && (
                        <p className="text-sm text-gray-500 mb-4">
                          {client.entreprise}
                        </p>
                      )}
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{client.email || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{client.telephone || 'Non renseigné'}</span>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="mr-6">
                            <p className="text-xs text-gray-500">Projets</p>
                            <p className="text-lg font-semibold text-gray-900">{client.projetsCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {client.montantTotal ? (
                                <>
                                  {(client.montantTotal / 1000).toFixed(0)}K 
                                  <span className="text-sm text-gray-500">FCFA</span>
                                </>
                              ) : '-'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/clients/${client.id}`)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] transition-colors"
                          title="Voir les détails"
                        >
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun client trouvé</h3>
                    <p className="mt-1 text-sm text-gray-500">Essayez de modifier vos critères de recherche.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Client Detail Panel */}
        {selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end">
            <div className="w-full max-w-md bg-white shadow-xl p-8 overflow-y-auto">
              <button
                onClick={() => setSelectedClient(null)}
                className="absolute top-6 right-6 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedClient.prenom} {selectedClient.nom}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setModalInitialClient(selectedClient)
                      setIsNewClientOpen(true)
                    }}
                    className="px-3 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Supprimer le client ${selectedClient.prenom} ${selectedClient.nom} ?`)) return
                      try {
                        const res = await fetch(`/api/clients/${selectedClient.id}`, { method: 'DELETE' })
                        if (!res.ok) throw new Error('Erreur suppression')
                        await fetchClients()
                        setSelectedClient(null)
                      } catch (err) {
                        console.error('Erreur suppression client:', err)
                        alert('Impossible de supprimer le client')
                      }
                    }}
                    className="px-3 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">Email</p>
                  <p className="text-lg text-gray-900">{selectedClient.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">Téléphone</p>
                  <p className="text-lg text-gray-900">{selectedClient.telephone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">Entreprise</p>
                  <p className="text-lg text-gray-900">{selectedClient.entreprise || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">Adresse</p>
                  <p className="text-lg text-gray-900">{selectedClient.adresse || '-'}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="mr-6">
                      <p className="text-xs text-gray-500">Projets</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedClient.projetsCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedClient.montantTotal ? (
                          <>
                            {(selectedClient.montantTotal / 1000).toFixed(0)}K 
                            <span className="text-sm text-gray-500">FCFA</span>
                          </>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(selectedClient);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Nouveau Client Modal */}
          <NouveauClientModal
            isOpen={isNewClientOpen}
            initial={modalInitialClient as any}
            onClose={() => {
              setIsNewClientOpen(false)
              setModalInitialClient(null)
            }}
            onSave={async (data) => {
              try {
                if (data.id) {
                  // Update existing
                  const res = await fetch(`/api/clients/${data.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  })
                  if (!res.ok) throw new Error('Erreur lors de la mise à jour du client')
                } else {
                  // Create new
                  const res = await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  })
                  if (!res.ok) throw new Error('Erreur lors de la création du client')
                }

                await fetchClients()
                setIsNewClientOpen(false)
                setModalInitialClient(null)
              } catch (err) {
                console.error('Erreur sauvegarde client:', err)
                throw err
              }
            }}
          />
      </div>
    </MainLayout>
  )
}
