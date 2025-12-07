"use client"

import { useEffect, useState } from 'react'
import { Edit2, Trash2, AlertCircle } from 'lucide-react'

interface AbonnementsListProps {
  abonnements: any[]
  onEdit?: (abo: any) => void
  onRefresh?: () => void
}

export default function AbonnementsList({ 
  abonnements: initialAbonnements, 
  onEdit,
  onRefresh 
}: AbonnementsListProps) {
  const [abonnements, setAbonnements] = useState<any[]>(initialAbonnements || [])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('TOUS')
  const [abonnementStatuts, setAbonnementStatuts] = useState<any[] | null>(null)

  useEffect(() => {
    setAbonnements(initialAbonnements || [])
  }, [initialAbonnements])

  // Attempt to load enums for abonnements statuts if the API exposes them
  useEffect(() => {
    const fetchAbonnementStatuts = async () => {
      try {
        const res = await fetch('/api/enums/statuts-abonnements')
        if (!res.ok) return
        const json = await res.json()
        const arr = json['statuts-abonnements'] || json || []
        if (Array.isArray(arr) && arr.length > 0) {
          setAbonnementStatuts(arr)
        }
      } catch (err) {
        console.debug('Aucun enum abonnements disponible', err)
      }
    }

    fetchAbonnementStatuts()
  }, [])

  const handleEdit = (abo: any) => {
    onEdit?.(abo)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) return
    
    try {
      const res = await fetch(`/api/abonnements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      setAbonnements(abonnements.filter(a => a.id !== id))
      onRefresh?.()
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la suppression')
    }
  }

  const isOverdue = (abo: any): boolean => {
    if (!abo.dateProchainFacture) return false
    return new Date(abo.dateProchainFacture) < new Date()
  }

  // Filtrer les abonnements en fonction du statut
  const filtered = abonnements.filter((abo) => {
    if (filterStatus === 'TOUS') return true
    if (filterStatus === 'EN_RETARD') return isOverdue(abo)
    if (filterStatus === 'ACTIF') return abo.statut === 'ACTIF' && !isOverdue(abo)
    return abo.statut === filterStatus
  })

  // Récupérer le nombre de notifications (abonnements en retard)
  const overdueCount = abonnements.filter(isOverdue).length

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 text-center">Chargement...</div>
  }

  if (filtered.length === 0) {
    return <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">Aucun abonnement trouvé</div>
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('TOUS')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              filterStatus === 'TOUS' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({abonnements.length})
          </button>

          {abonnementStatuts && abonnementStatuts.length > 0 ? (
            abonnementStatuts.map((s: any) => (
              <button
                key={s.id ?? s.cle ?? s.value}
                onClick={() => setFilterStatus(s.cle ?? s.id ?? s.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  filterStatus === (s.cle ?? s.id ?? s.value) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.label ?? s.value ?? (s.cle ?? s.id)}
              </button>
            ))
          ) : (
            ['ACTIF', 'SUSPENDU', 'EN_RETARD', 'ANNULE', 'TERMINE'].map((status) => {
              const count = abonnements.filter(a => 
                status === 'EN_RETARD' ? isOverdue(a) : a.statut === status
              ).length
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    filterStatus === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status} ({count})
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Montant</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fréquence</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Prochaine facture</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((abo) => {
              const overdue = isOverdue(abo)
              const rowClass = overdue ? 'bg-red-50' : ''
              
              return (
                <tr key={abo.id} className={`border-b border-gray-200 hover:bg-gray-50 ${rowClass}`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{abo.nom}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{abo.client?.nom || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{(abo.montant || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{abo.frequence}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1">
                      {overdue && <AlertCircle size={16} className="text-red-600" />}
                      <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {abo.dateProchainFacture 
                          ? new Date(abo.dateProchainFacture).toLocaleDateString('fr-FR')
                          : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      abo.statut === 'ACTIF' ? 'bg-green-100 text-green-800' :
                      abo.statut === 'SUSPENDU' ? 'bg-yellow-100 text-yellow-800' :
                      abo.statut === 'EN_RETARD' ? 'bg-red-100 text-red-800' :
                      abo.statut === 'ANNULE' ? 'bg-gray-100 text-gray-800' :
                      abo.statut === 'TERMINE' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {abo.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(abo)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(abo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
