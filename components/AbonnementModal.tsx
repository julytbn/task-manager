"use client"

import { useState, useEffect, FormEvent } from 'react'
import { X } from 'lucide-react'
import NouveauServiceModal from './NouveauServiceModal'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
}

export default function AbonnementModal({ isOpen, onClose, onSaved, initialData }: Props) {
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedService, setSelectedService] = useState('')
  const [dateDebut, setDateDebut] = useState<string>('')
  const [frequence, setFrequence] = useState<string>('MENSUEL')
  const [dateProchainFacture, setDateProchainFacture] = useState<string>('')

  // Calculer la date de prochaine facturation automatiquement
  const calculateNextInvoiceDate = (debut: string, freq: string) => {
    if (!debut) return ''
    
    const date = new Date(debut)
    switch (freq) {
      case 'MENSUEL':
        date.setMonth(date.getMonth() + 1)
        break
      case 'TRIMESTRIEL':
        date.setMonth(date.getMonth() + 3)
        break
      case 'SEMESTRIEL':
        date.setMonth(date.getMonth() + 6)
        break
      case 'ANNUEL':
        date.setFullYear(date.getFullYear() + 1)
        break
      case 'PONCTUEL':
        date.setDate(date.getDate() + 7)
        break
      default:
        return ''
    }
    
    return date.toISOString().split('T')[0]
  }

  // Recalculer quand dateDebut ou frequence change
  useEffect(() => {
    const nextDate = calculateNextInvoiceDate(dateDebut, frequence)
    setDateProchainFacture(nextDate)
  }, [dateDebut, frequence])

  useEffect(() => {
    if (!isOpen) return
    const fetchData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([fetch('/api/clients'), fetch('/api/services')])
        if (!cRes.ok || !sRes.ok) throw new Error('Impossible de charger les données')
        setClients(await cRes.json())
        setServices(await sRes.json())
      } catch (err) {
        console.error(err)
        setError('Impossible de charger les clients et services')
      }
    }
    fetchData()
    
    // Initialiser les états si on édite un abonnement existant
    if (initialData?.id) {
      setDateDebut(initialData.dateDebut ? new Date(initialData.dateDebut).toISOString().split('T')[0] : '')
      setFrequence(initialData.frequence || 'MENSUEL')
      const nextDate = calculateNextInvoiceDate(
        initialData.dateDebut ? new Date(initialData.dateDebut).toISOString().split('T')[0] : '',
        initialData.frequence || 'MENSUEL'
      )
      setDateProchainFacture(nextDate)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const data: Record<string, any> = Object.fromEntries(form.entries())

    try {
      if (!selectedService) {
        throw new Error('Veuillez sélectionner un service')
      }
      data.serviceId = selectedService

      // Conversion en types correctes
      if (data.montant) data.montant = parseFloat(String(data.montant))
      if (data.dateDebut) data.dateDebut = new Date(String(data.dateDebut)).toISOString()
      if (data.dateFin) data.dateFin = new Date(String(data.dateFin)).toISOString()

      const url = initialData?.id ? `/api/abonnements/${initialData.id}` : '/api/abonnements'
      const method = initialData?.id ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Pour les nouveaux abonnements, indiquer qu'une facture doit être auto-générée
          generateInitialFacture: !initialData?.id
        }),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de la sauvegarde')
      }
      
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {initialData?.id ? 'Modifier l\'abonnement' : 'Nouvel abonnement'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input 
                  name="nom" 
                  defaultValue={initialData?.nom || ''} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Ex: Abonnement Comptabilité"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                {initialData?.clientId ? (
                  <>
                    <select
                      name="clientId"
                      defaultValue={initialData.clientId}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-700"
                    >
                      <option value={initialData.clientId}>{initialData.clientName || `Client ${initialData.clientId}`}</option>
                    </select>
                    <input type="hidden" name="clientId" value={String(initialData.clientId)} />
                  </>
                ) : (
                  <select 
                    name="clientId" 
                    defaultValue={initialData?.clientId || ''} 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select 
                  name="serviceId" 
                  value={selectedService}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowServiceModal(true)
                      e.target.value = ''
                    } else {
                      setSelectedService(e.target.value)
                    }
                  }}
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Sélectionner un service --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                  <option value="__add_new__" className="text-blue-600 font-semibold">+ Ajouter un nouveau service</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input 
                  name="montant" 
                  type="number" 
                  step="0.01"
                  defaultValue={initialData?.montant || ''} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="50000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                <select 
                  name="frequence" 
                  value={frequence}
                  onChange={(e) => setFrequence(e.target.value)}
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="PONCTUEL">Ponctuel</option>
                  <option value="MENSUEL">Mensuel</option>
                  <option value="TRIMESTRIEL">Trimestriel</option>
                  <option value="SEMESTRIEL">Semestriel</option>
                  <option value="ANNUEL">Annuel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                <select 
                  name="statut" 
                  defaultValue={initialData?.statut || 'ACTIF'} 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ACTIF">Actif</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="EN_RETARD">En retard</option>
                  <option value="ANNULE">Annulé</option>
                  <option value="TERMINE">Terminé</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                <input 
                  name="dateDebut" 
                  type="date" 
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date prochaine facturation</label>
                <input 
                  type="date" 
                  value={dateProchainFacture}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600" 
                />
                <p className="text-xs text-gray-500 mt-1">Calculée automatiquement selon la fréquence</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin (optionnelle)</label>
                <input 
                  name="dateFin" 
                  type="date" 
                  defaultValue={initialData?.dateFin ? new Date(initialData.dateFin).toISOString().split('T')[0] : ''} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isSubmitting ? 'Enregistrement...' : (initialData?.id ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </form>
        </div>

        <NouveauServiceModal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          onSave={async (newService) => {
            // Ajouter le nouveau service à la liste des services
            const response = await fetch('/api/services', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newService)
            })
            
            if (!response.ok) {
              const err = await response.json()
              throw new Error(err.error || 'Erreur lors de la création du service')
            }
            
            const createdService = await response.json()
            setServices([...services, createdService])
            setSelectedService(createdService.id)
            setShowServiceModal(false)
          }}
        />
      </div>
    </div>
  )
}
