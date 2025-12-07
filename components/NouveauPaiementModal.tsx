"use client"
import { useState, useEffect, useCallback } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { generateTransactionReference } from '@/lib/paiementUtils'

interface NouveauPaiementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (paiement: any) => void
  clientName?: string
  projets?: any[]
  prefilledClient?: { id: string; nom: string }
  prefilledService?: { id: string; nom: string }
  prefilledMontant?: number
}

export default function NouveauPaiementModal({
  isOpen,
  onClose,
  onSave,
  clientName = '',
  projets = [],
  prefilledClient,
  prefilledService,
  prefilledMontant,
}: NouveauPaiementModalProps) {
  const [formData, setFormData] = useState({
    client: '',
    clientId: '',
    service: '',
    serviceId: '',
    montantTotal: '',
    montantPayé: '',
    methodePaiement: 'Transfert bancaire',
    statut: 'impayé' as const,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [projectsList, setProjectsList] = useState<any[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [hasLoadedClients, setHasLoadedClients] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isFromDetailPage, setIsFromDetailPage] = useState(false)

  // Charger les clients
  const loadClients = useCallback(async () => {
    setIsLoadingClients(true)
    console.debug('[NouveauPaiementModal] loadClients: start')
    setError('')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch('/api/clients', { signal: controller.signal })
      clearTimeout(timeout)
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`Erreur ${response.status} ${text}`)
      }
      const data = await response.json()
      console.debug('[NouveauPaiementModal] loadClients: response received', { count: Array.isArray(data) ? data.length : undefined })
      setClients(data)
      setHasLoadedClients(true)
    } catch (err) {
      console.error('Erreur chargement clients:', err)
      setError('Impossible de charger la liste des clients. Réessayez.')
      setClients([])
    } finally {
      setIsLoadingClients(false)
    }
  }, [])

  // Charger les projets d'un client
  const loadProjectsForClient = useCallback(async (clientId: string) => {
    if (!clientId) return
    setIsLoadingProjects(true)
    console.debug('[NouveauPaiementModal] loadProjectsForClient: start', { clientId })
    setError('')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(`/api/clients/${clientId}`, { signal: controller.signal })
      clearTimeout(timeout)
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`Erreur ${response.status} ${text}`)
      }
      const clientData = await response.json()
      console.debug('[NouveauPaiementModal] loadProjectsForClient: response received', { projetsCount: (clientData?.projets || []).length })
      setProjectsList(clientData.projets || [])
    } catch (err) {
      console.error('Erreur chargement projets:', err)
      setError('Impossible de charger les projets du client. Réessayez.')
      setProjectsList([])
    } finally {
      setIsLoadingProjects(false)
    }
  }, [])
 
  // Au chargement du modal
  useEffect(() => {
    if (!isOpen) return

    // Si on a des données de facture pré-remplies
    if (prefilledClient && prefilledMontant) {
      setIsFromDetailPage(true)
      const newReference = generateTransactionReference()
      setFormData((prev) => ({
        ...prev,
        client: prefilledClient.nom,
        clientId: prefilledClient.id,
        montantTotal: String(prefilledMontant),
        montantPayé: String(prefilledMontant),
        service: prefilledService?.nom || '',
        serviceId: prefilledService?.id || '',
        reference: newReference,
      }))
      setClients([prefilledClient])
      if (prefilledService) {
        setProjectsList([prefilledService])
      }
      return
    }

    // Si on a clientName et projets, c'est qu'on vient de la page détail client
    if (clientName && projets.length > 0) {
      setIsFromDetailPage(true)
      const newReference = generateTransactionReference()
      const firstProjet = projets[0]
      setFormData((prev) => ({
        ...prev,
        client: clientName,
        service: firstProjet?.id || '',
        serviceId: firstProjet?.id || '',
        montantTotal: firstProjet?.montantEstime || firstProjet?.budget || '',
        reference: newReference,
      }))
      setProjectsList(projets)
    } else {
      // Sinon, on charge les clients depuis l'API
      setIsFromDetailPage(false)
      const newReference = generateTransactionReference()
      setFormData((prev) => ({
        ...prev,
        reference: newReference,
      }))
      if (!hasLoadedClients) loadClients()
    }
  }, [isOpen, clientName, projets, loadClients])

  // Quand le client change, charger ses projets
  useEffect(() => {
    if (!isFromDetailPage && formData.clientId) {
      loadProjectsForClient(formData.clientId)
    }
  }, [formData.clientId, isFromDetailPage, loadProjectsForClient])

  // Mettre à jour le montant total quand le service change
  useEffect(() => {
    if (formData.service && projectsList.length > 0) {
      const selectedService = projectsList.find((p) => p.id === formData.service)
      if (selectedService) {
        setFormData((prev) => ({
          ...prev,
          montantTotal: selectedService.montantEstime || selectedService.budget || '',
        }))
      }
    }
  }, [formData.service, projectsList])

  const handleGenerateReference = () => {
    const newReference = generateTransactionReference()
    setFormData((prev) => ({
      ...prev,
      reference: newReference,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'client') {
      // Trouver le client sélectionné
      const selectedClient = clients.find(c => c.id === value)
      setFormData((prev) => ({
        ...prev,
        clientId: value,
        client: selectedClient?.nom || value,
        projet: '',
        projetId: '',
        montantTotal: '',
      }))
      setProjectsList([])
    } else if (name === 'projet') {
      const selectedProjet = projectsList.find(p => p.id === value)
      setFormData((prev) => ({
        ...prev,
        projet: value,
        projetId: value,
        montantTotal: selectedProjet?.montantEstime || selectedProjet?.budget || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: (name === 'montantTotal' || name === 'montantPayé') ? value : value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.client || !formData.service || !formData.montantTotal) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    const montantTotal = parseFloat(String(formData.montantTotal))
    const montantPayé = parseFloat(String(formData.montantPayé)) || 0

    if (montantPayé && montantPayé > montantTotal) {
      setError('Le montant payé ne peut pas dépasser le montant total')
      return
    }

    setLoading(true)

    try {
      const soldeRestant = montantTotal - montantPayé

      // Déterminer le statut en fonction des montants
      let statut = 'EN_ATTENTE'
      if (montantPayé === montantTotal) {
        statut = 'CONFIRME'
      }

      // Envoyer à l'API
      const response = await fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: montantPayé || montantTotal,
          moyenPaiement: formData.methodePaiement === 'Transfert bancaire' ? 'VIREMENT_BANCAIRE' : 'AUTRE',
          datePaiement: formData.date,
          statut: statut,
          clientId: formData.clientId,
          projetId: formData.serviceId,
          reference: formData.reference,
          notes: formData.notes,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      const result = await response.json()

      const newPaiement = {
        id: result.paiement?.id || Math.random().toString(36).substr(2, 9),
        client: formData.client,
        service: formData.service,
        montantTotal,
        montantPayé,
        soldeRestant,
        methodePaiement: formData.methodePaiement,
        statut: statut as 'payé' | 'partiel' | 'impayé',
        date: formData.date,
      }

      onSave(newPaiement)
      setFormData({
        client: '',
        clientId: '',
        service: '',
        serviceId: '',
        montantTotal: '',
        montantPayé: '',
        methodePaiement: 'Transfert bancaire',
        statut: 'impayé',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
      })
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la création du paiement')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouveau Paiement</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]" disabled={loading}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-700 bg-red-100 p-2 rounded">{error}</div>}

          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Client *</label>
              {isFromDetailPage ? (
                <input type="text" value={formData.client} disabled className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-gray-50 text-gray-600 cursor-not-allowed" />
              ) : (
                <select name="client" value={formData.clientId} onChange={handleChange} disabled={isLoadingClients} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" required>
                  {isLoadingClients ? (
                    <option value="">Chargement des clients...</option>
                  ) : clients.length === 0 ? (
                    <option value="">Aucun client disponible</option>
                  ) : (
                    <>
                      <option value="">Sélectionner un client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </>
                  )}
                </select>
              )}
              {!isFromDetailPage && error && (
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-sm text-red-600">{error}</p>
                  <button type="button" onClick={() => loadClients()} className="text-sm text-blue-600 underline">Réessayer</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Service *</label>
              <select name="service" value={formData.service} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" required disabled={projectsList.length === 0 || isLoadingProjects}>
                {isLoadingProjects ? (
                  <option value="">Chargement des services...</option>
                ) : projectsList.length === 0 ? (
                  <option value="">Aucun service pour ce client</option>
                ) : (
                  <>
                    <option value="">Sélectionner un service</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.titre || p.nom}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Montant total *</label>
              <input type="number" name="montantTotal" value={formData.montantTotal} onChange={handleChange} placeholder="0" step="1000" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Montant payé</label>
              <input type="number" name="montantPayé" value={formData.montantPayé} onChange={handleChange} placeholder="0" step="1000" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
              <p className="text-xs text-gray-500 mt-1">Solde restant: {formData.montantTotal && formData.montantPayé ? (Number(formData.montantTotal) - Number(formData.montantPayé)) : '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Méthode de paiement</label>
              <select name="methodePaiement" value={formData.methodePaiement} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                <option value="Transfert bancaire">Transfert bancaire</option>
                <option value="Mobile money">Mobile money</option>
                <option value="Chèque">Chèque</option>
                <option value="Espèces">Espèces</option>
                <option value="Carte bancaire">Carte bancaire</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date du paiement</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Référence / N° de transaction</label>
            <div className="flex gap-2">
              <input type="text" name="reference" value={formData.reference} onChange={handleChange} placeholder="Généré automatiquement" className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded bg-white" readOnly />
              <button type="button" onClick={handleGenerateReference} className="px-3 py-2 border border-[var(--color-border)] rounded bg-white hover:bg-gray-50 transition flex items-center gap-2 text-[var(--color-anthracite)]" title="Générer une nouvelle référence">↻</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Format: PAI-YYYYMMDD-SEQUENCE-RANDOM (Ex: PAI-20251201-0001-A7F2)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Remarques ou informations supplémentaires..." rows={3} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold">{loading ? 'Création en cours...' : 'Créer le paiement'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
