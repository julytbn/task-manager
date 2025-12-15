"use client"
import { useState, useEffect } from 'react'
import { X, Download, Eye, Plus, RefreshCw } from 'lucide-react'
import { downloadFacturePDF, previewFacturePDF } from '@/lib/factureGenerator'
import { generateFactureNumber } from '@/lib/paiementUtils'

// Fonction pour calculer la date d'échéance basée sur la fréquence de paiement
function calculateDueDate(frequencePaiement: string): string {
  const today = new Date()
  const dueDate = new Date(today)

  switch (frequencePaiement) {
    case 'PONCTUEL':
      // 30 jours pour les paiements ponctuels
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case 'MENSUEL':
      // 15 jours pour les paiements mensuels
      dueDate.setDate(dueDate.getDate() + 15)
      break
    case 'TRIMESTRIEL':
      // 30 jours pour les paiements trimestriels
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case 'SEMESTRIEL':
      // 45 jours pour les paiements semestriels
      dueDate.setDate(dueDate.getDate() + 45)
      break
    case 'ANNUEL':
      // 60 jours pour les paiements annuels
      dueDate.setDate(dueDate.getDate() + 60)
      break
    default:
      // Par défaut 30 jours
      dueDate.setDate(dueDate.getDate() + 30)
  }

  return dueDate.toISOString().split('T')[0]
}

interface FactureData {
  id: string
  numero: string
  dateEmission: string
  dateEcheance?: string
  statut: string
  montant: number
  montantTotal: number
  tauxTVA?: number
  client: {
    id: string
    nom: string
    prenom?: string
    email?: string
    telephone?: string
    adresse?: string
  }
  projet?: {
    id: string
    titre: string
    description?: string
  }
  taches?: Array<{
    id: string
    titre: string
    montant?: number
    heuresReelles?: number
  }>
  notes?: string
}

interface NouveauFactureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (facture: any) => void
  clientId?: string
  clientName?: string
  clientProjets?: any[]
}

export default function NouveauFactureModal({
  isOpen,
  onClose,
  onSave,
  clientId,
  clientName,
  clientProjets,
}: NouveauFactureModalProps) {
  const [formData, setFormData] = useState({
    numero: '',
    clientId: clientId || '',
    client: clientName || '',
    abonnementId: '',
    projetId: '',
    serviceId: '',
    sourceType: '', // 'abonnement', 'projet', 'service'
    montant: '',
    tauxTVA: 18,
    description: '',
    conditionsPaiement: '',
    reference: '',
    montantEnLettres: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    statut: 'EN_ATTENTE',
    notes: '',
  })

  const [lignes, setLignes] = useState<Array<any>>([])
  const [documents, setDocuments] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [abonnements, setAbonnements] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  // Charger les clients, abonnements et services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, abonnementsRes, servicesRes] = await Promise.all([
          fetch('/api/clients').then(res => res.json()),
          fetch('/api/abonnements').then(res => res.json()),
          fetch('/api/services').then(res => res.json())
        ])
        setClients(clientsRes || [])
        setAbonnements(abonnementsRes || [])
        setServices(servicesRes || [])
      } catch (err) {
        console.error('Erreur chargement données:', err)
      }
    }
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Générer le numéro de facture à l'ouverture du modal
  useEffect(() => {
    if (isOpen && !formData.numero) {
      const newNumber = generateFactureNumber()
      setFormData((prev) => ({
        ...prev,
        numero: newNumber,
        client: clientName || prev.client,
      }))
    }
  }, [isOpen, clientName])

  const handleGenerateNumber = () => {
    const newNumber = generateFactureNumber()
    setFormData((prev) => ({
      ...prev,
      numero: newNumber,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Si le client change, récupérer l'ID et mettre à jour les projets
    if (name === 'clientId') {
      const selectedClient = clients.find((c) => c.id === value)
      setFormData((prev) => ({
        ...prev,
        clientId: value,
        client: selectedClient?.nom || selectedClient?.prenom || '',
      }))
    }
    // Gestion des sources de facture (radio buttons simulations)
    else if (name === 'sourceType') {
      // Réinitialiser les IDs et garder le type
      setFormData((prev) => ({
        ...prev,
        sourceType: value,
        abonnementId: value === 'abonnement' ? prev.abonnementId : '',
        projetId: value === 'projet' ? prev.projetId : '',
        serviceId: value === 'service' ? prev.serviceId : '',
      }))
    }
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'montant' || name === 'tauxTVA' ? parseFloat(value) || '' : value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation: au moins une source (abonnement, projet ou service)
    const hasSource = formData.abonnementId || formData.projetId || formData.serviceId
    if (!formData.numero || !formData.clientId || !formData.montant || !hasSource) {
      setError('Veuillez remplir tous les champs obligatoires (incluant une source)')
      return
    }

    // Vérifier qu'une seule source est fournie
    const sourceCount = [formData.abonnementId, formData.projetId, formData.serviceId].filter(Boolean).length
    if (sourceCount > 1) {
      setError('Une facture ne peut avoir qu\'UNE seule source (abonnement, projet ou service)')
      return
    }

    setLoading(true)

    try {
      const tauxTVA = formData.tauxTVA || 18
      const montantSansTVA = parseFloat(String(formData.montant))
      const montantTVA = montantSansTVA * (tauxTVA / 100)
      const montantTotal = montantSansTVA + montantTVA

      const newFacture = {
        numero: formData.numero,
        clientId: formData.clientId,
        client: { id: formData.clientId, nom: formData.client },
        abonnementId: formData.abonnementId || undefined,
        projetId: formData.projetId || undefined,
        serviceId: formData.serviceId || undefined,
        montant: montantSansTVA,
        montantTotal,
        tauxTVA,
        description: formData.description || undefined,
        conditionsPaiement: formData.conditionsPaiement || undefined,
        reference: formData.reference || undefined,
        montantEnLettres: formData.montantEnLettres || undefined,
        dateEmission: formData.dateEmission,
        dateEcheance: formData.dateEcheance || undefined,
        statut: formData.statut,
        notes: formData.notes || undefined,
        lignes: lignes.length ? lignes.map((l) => ({ designation: l.designation, intervenant: l.intervenant, montantAPayer: Number(l.montantAPayer) || 0, montantGlobal: Number(l.montantAPayer) || 0, ordre: l.ordre })) : undefined,
        documentsRequis: documents.length ? documents.map((d) => ({ nom: d.nom, obligatoire: !!d.obligatoire, notes: d.notes || null })) : undefined,
      }

      onSave(newFacture)
      
      // Réinitialiser le formulaire
      setFormData({
        numero: '',
        clientId: '',
        client: '',
        abonnementId: '',
        projetId: '',
        serviceId: '',
        sourceType: '',
        montant: '',
        tauxTVA: 18,
        description: '',
        conditionsPaiement: '',
        reference: '',
        montantEnLettres: '',
        dateEmission: new Date().toISOString().split('T')[0],
        dateEcheance: '',
        statut: 'EN_ATTENTE',
        notes: '',
      })
      setLignes([])
      setDocuments([])
    } catch (err) {
      setError('Erreur lors de la création de la facture')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addLigne = () => {
    setLignes((prev) => [...prev, { designation: '', intervenant: '', montantAPayer: 0, ordre: prev.length + 1 }])
  }
  const removeLigne = (idx: number) => setLignes((prev) => prev.filter((_, i) => i !== idx))
  const updateLigne = (idx: number, key: string, value: any) => setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, [key]: value } : l))

  const addDocument = () => setDocuments((prev) => [...prev, { nom: '', obligatoire: false, notes: '' }])
  const removeDocument = (idx: number) => setDocuments((prev) => prev.filter((_, i) => i !== idx))
  const updateDocument = (idx: number, key: string, value: any) => setDocuments((prev) => prev.map((d, i) => i === idx ? { ...d, [key]: value } : d))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouvelle Facture</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]" disabled={loading}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-700 bg-red-100 p-2 rounded">{error}</div>}

          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Numéro de facture *</label>
              <div className="flex gap-2">
                <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Généré automatiquement" className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded bg-white" readOnly required />
                <button type="button" onClick={handleGenerateNumber} className="px-3 py-2 border border-[var(--color-border)] rounded bg-white hover:bg-gray-50 transition flex items-center gap-2 text-[var(--color-anthracite)]" title="Générer un nouveau numéro">↻</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Format: FAC-YYYYMMDD-SEQUENCE (Ex: FAC-20251201-001)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date d'émission *</label>
              <input type="date" name="dateEmission" value={formData.dateEmission} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date d'échéance</label>
            <input type="date" name="dateEcheance" value={formData.dateEcheance} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Client *</label>
              {clients.length > 0 ? (
                <select name="clientId" value={formData.clientId} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" required disabled={!!clientId}>
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom || c.prenom || 'Client'}</option>
                  ))}
                </select>
              ) : (
                <input type="text" name="client" value={formData.client} onChange={handleChange} placeholder="Ex: Entreprise ABC" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" readOnly={!!clientName} required />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-2">Source de la facture *</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sourceType"
                  value="abonnement"
                  checked={formData.sourceType === 'abonnement'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Abonnement (Récurrente)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sourceType"
                  value="projet"
                  checked={formData.sourceType === 'projet'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Projet (Ponctuelle)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sourceType"
                  value="service"
                  checked={formData.sourceType === 'service'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Service (Ponctuel)</span>
              </label>
            </div>
          </div>

          {/* Afficher les sélecteurs selon le type choisi */}
          {formData.sourceType === 'abonnement' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Abonnement *</label>
              <select
                name="abonnementId"
                value={formData.abonnementId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="">Sélectionner un abonnement</option>
                {abonnements.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom} | {a.service?.nom || 'Service'} | {a.montant}€/{a.frequence}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.sourceType === 'projet' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Projet *</label>
              {clientProjets && clientProjets.length > 0 ? (
                <select
                  name="projetId"
                  value={formData.projetId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                  required
                >
                  <option value="">Sélectionner un projet</option>
                  {clientProjets.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom || p.titre || 'Projet sans titre'}</option>
                  ))}
                </select>
              ) : (
                <input type="text" placeholder="Pas de projets disponibles" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" readOnly />
              )}
            </div>
          )}

          {formData.sourceType === 'service' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Service *</label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="">Sélectionner un service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.nom} | {s.prix}€</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Montant HT *</label>
              <input type="number" name="montant" value={formData.montant} onChange={handleChange} placeholder="0" step="1000" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Taux TVA (%)</label>
              <input type="number" name="tauxTVA" value={formData.tauxTVA} onChange={handleChange} placeholder="18" step="0.01" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>
          {formData.montant && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700"><strong>Montant TTC:</strong> {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(parseFloat(String(formData.montant)) * (1 + (formData.tauxTVA || 18) / 100))}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Statut</label>
              <select name="statut" value={formData.statut} onChange={handleChange} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white">
                <option value="EN_ATTENTE">En attente</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Remarques ou conditions de paiement..." rows={3} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white" />
            </div>
          </div>

          {/* Pro Invoice Fields */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <h4 className="font-semibold text-[var(--color-anthracite)] mb-3">Informations professionnelles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description générale de la facture..." rows={2} className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Conditions de paiement</label>
                <input type="text" name="conditionsPaiement" value={formData.conditionsPaiement} onChange={handleChange} placeholder="Ex: Net 30 jours" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Référence</label>
                <input type="text" name="reference" value={formData.reference} onChange={handleChange} placeholder="Référence client/interne" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Montant en lettres</label>
                <input type="text" name="montantEnLettres" value={formData.montantEnLettres} onChange={handleChange} placeholder="Ex: Quatre cent mille" className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white text-sm" />
              </div>
            </div>
          </div>

          {/* Invoice Lines */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-[var(--color-anthracite)]">Lignes de facture</h4>
              <button type="button" onClick={addLigne} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm">
                <Plus size={16} /> Ajouter ligne
              </button>
            </div>
            <div className="space-y-2">
              {lignes.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucune ligne. Cliquez sur "Ajouter ligne" pour en créer.</p>
              ) : (
                lignes.map((ligne, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700">Désignation</label>
                      <input type="text" value={ligne.designation} onChange={(e) => updateLigne(idx, 'designation', e.target.value)} placeholder="Ex: Service de..." className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-sm" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-700">Montant HT</label>
                      <input type="number" value={ligne.montantAPayer} onChange={(e) => updateLigne(idx, 'montantAPayer', parseFloat(e.target.value) || 0)} placeholder="0" step="100" className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-sm" />
                    </div>
                    <button type="button" onClick={() => removeLigne(idx)} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Required Documents */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-[var(--color-anthracite)]">Documents à fournir</h4>
              <button type="button" onClick={addDocument} className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition text-sm">
                <Plus size={16} /> Ajouter document
              </button>
            </div>
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucun document requis. Cliquez sur "Ajouter document" pour en définir.</p>
              ) : (
                documents.map((doc, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700">Nom du document</label>
                      <input type="text" value={doc.nom} onChange={(e) => updateDocument(idx, 'nom', e.target.value)} placeholder="Ex: Passport, Facture..." className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-sm" />
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="checkbox" checked={doc.obligatoire} onChange={(e) => updateDocument(idx, 'obligatoire', e.target.checked)} className="rounded" />
                      <label className="text-xs text-gray-700">Obligatoire</label>
                    </div>
                    <button type="button" onClick={() => removeDocument(idx)} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold">{loading ? 'Création en cours...' : 'Créer la facture'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Composant pour afficher les actions de facture (télécharger, aperçu)
 */
export function FactureActions({ facture }: { facture: FactureData }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => previewFacturePDF(facture)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm"
        title="Aperçu"
      >
        <Eye size={16} />
        Aperçu
      </button>
      <button
        onClick={() => downloadFacturePDF(facture)}
        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition text-sm"
        title="Télécharger"
      >
        <Download size={16} />
        Télécharger
      </button>
    </div>
  )
}
