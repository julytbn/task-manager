'use client'

import { useState, useEffect } from 'react'
import NouveauClientModal from '../../components/NouveauClientModal'
import { Search, Eye, Pencil, Trash2, Plus } from 'lucide-react'

type Client = {
  id: string
  nom: string
  prenom: string
  email?: string
  telephone?: string
  type: 'PARTICULIER' | 'ENTREPRISE' | 'ORGANISATION'
  entreprise?: string
  adresse?: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'TOUS' | 'ENTREPRISE' | 'PARTICULIER'>('TOUS')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Erreur lors de la récupération')
      const data = await response.json()
      setClients(data)
      setFilteredClients(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  useEffect(() => {
    let filtered = clients

    // Filtrer par type
    if (filterType === 'ENTREPRISE') {
      filtered = filtered.filter(c => c.type === 'ENTREPRISE')
    } else if (filterType === 'PARTICULIER') {
      filtered = filtered.filter(c => c.type === 'PARTICULIER')
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(c =>
        `${c.nom} ${c.prenom} ${c.entreprise || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredClients(filtered)
  }, [searchTerm, filterType, clients])

  // Statistiques
  const totalClients = clients.length
  const enterprises = clients.filter(c => c.type === 'ENTREPRISE').length
  const particuliers = clients.filter(c => c.type === 'PARTICULIER').length
  const totalRevenue = 98500000 // À mettre à jour selon vos données

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-1">Gérez tous vos clients et leurs informations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingClient(null); setIsModalOpen(true) }} className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Nouveau Client</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalClients}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v2h2v-2a11 11 0 10-20 0v2h2v-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entreprises</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{enterprises}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Particuliers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{particuliers}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.693 7.38A2 2 0 0115.064 21H11a2 2 0 01-2-2v-6.764A2 2 0 0111 9h3.764a2 2 0 012 2v2M7 20H4a2 2 0 01-2-2v-6.764A2 2 0 014 9h3v11z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenus Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{(totalRevenue / 1000000).toFixed(1)}M FCFA</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche et Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(['TOUS', 'ENTREPRISE', 'PARTICULIER'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'TOUS' ? 'Tous' : type === 'ENTREPRISE' ? 'Entreprises' : 'Particuliers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table des clients */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CLIENT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROJETS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MONTANT TOTAL</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {`${client.prenom?.charAt(0) || ''}${client.nom.charAt(0)}`.toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{client.nom} {client.prenom}</p>
                        <p className="text-sm text-gray-500">{client.entreprise || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      client.type === 'ENTREPRISE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-pink-100 text-pink-800'
                    }`}>
                      {client.type === 'ENTREPRISE' ? 'Entreprise' : 'Particulier'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{client.telephone || '-'}</p>
                      <p className="text-gray-500">{client.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    0 projets
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    0 FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => { setEditingClient(client); setIsModalOpen(true) }} className="text-gray-400 hover:text-blue-600">
                        <Pencil size={18} />
                      </button>
                      <button onClick={async () => {
                        if (!confirm('Supprimer ce client ?')) return
                        try {
                          const res = await fetch('/api/clients', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: client.id }) })
                          if (!res.ok) throw new Error('Erreur suppression')
                          setClients(prev => prev.filter(c => c.id !== client.id))
                          setFilteredClients(prev => prev.filter(c => c.id !== client.id))
                        } catch (err) {
                          console.error(err)
                          alert('Impossible de supprimer le client')
                        }
                      }} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun client trouvé</p>
          </div>
        )}
      </div>

      {/* Modal création / modification client */}
      <NouveauClientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingClient(null) }}
        initial={editingClient}
        onSave={async (data) => {
          try {
            // Si on édite un client existant
            if (editingClient && editingClient.id) {
              const res = await fetch('/api/clients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, id: editingClient.id })
              })
              if (!res.ok) throw new Error('Erreur lors de la mise à jour')
            } else {
              const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              })
              if (!res.ok) throw new Error('Erreur lors de la création')
            }

            setIsModalOpen(false)
            setEditingClient(null)
            await fetchClients()
          } catch (err) {
            console.error(err)
            alert('Une erreur est survenue lors de l\'enregistrement du client')
          }
        }}
      />
    </div>
  )
}
