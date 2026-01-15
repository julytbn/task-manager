'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import MainLayout from '@/components/layouts/MainLayout'
import ChargesDetailTable from '@/components/accounting/ChargesDetailTable'
import { Plus, Trash2, Edit2, TrendingDown, TrendingUp, DollarSign, FileText, Upload } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AccountingSummary {
  client: { id: string; nom: string; prenom: string; entreprise: string; type: string }
  abonnements: any[]
  financials: { totalEntrees: number; totalCharges: number; solde: number; pourcentageCharges: string }
  details: {
    paiements: { total: number; count: number }
    factures: { total: number; count: number }
    charges: { total: number; count: number; parCategorie: Record<string, { montant: number; count: number }> }
  }
  periode: string
}

interface DocumentComptable {
  id: string
  nom: string
  montant: number
  categorie?: string
  type: 'ENTREE' | 'CHARGE' | 'AUTRE'
  description?: string
  dateDocument?: string
  url?: string
  notes?: string
  chargeId?: string
  entreeId?: string
}

export default function ClientAccountingPage() {
  const params = useParams() as { id: string }
  const searchParams = useSearchParams()
  const clientId = params.id

  // Lire les paramètres de la URL (mois/année de redirection après upload)
  const urlMonth = searchParams?.get('month') ? parseInt(searchParams.get('month')!) : null
  const urlYear = searchParams?.get('year') ? parseInt(searchParams.get('year')!) : null

  const [summary, setSummary] = useState<AccountingSummary | null>(null)
  const [documents, setDocuments] = useState<DocumentComptable[]>([])
  const [entrees, setEntrees] = useState<any[]>([])
  const [trendDataState, setTrendDataState] = useState<any[]>([])
  const [chargesTVAData, setChargesTVAData] = useState<any>(null)
  const [dossierId, setDossierId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(urlMonth || new Date().getMonth() + 1)
  const [year, setYear] = useState(urlYear || new Date().getFullYear())
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<DocumentComptable | null>(null)
  const [chargesFilter, setChargesFilter] = useState<'TOUS' | 'AVEC_TVA' | 'SANS_TVA'>('TOUS')
  const [formData, setFormData] = useState({
    nom: '',
    montant: '',
    categorie: 'AUTRES_CHARGES',
    type: 'CHARGE' as 'ENTREE' | 'CHARGE' | 'AUTRE',
    description: '',
    dateDocument: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const categoriesByType = {
    CHARGE: ['SALAIRES_CHARGES_SOCIALES', 'LOYER_IMMOBILIER', 'UTILITIES', 'MATERIEL_EQUIPEMENT', 'TRANSPORT_DEPLACEMENT', 'FOURNITURES_BUREAUTIQUE', 'MARKETING_COMMUNICATION', 'ASSURANCES', 'TAXES_IMPOTS', 'AUTRES_CHARGES'],
    ENTREE: ['VENTES_PRODUITS', 'SERVICES_RENDUS', 'LOYERS_RECUS', 'INTERETS_PLACEMENTS', 'SUBVENTIONS', 'AUTRES_REVENUS'],
    AUTRE: ['JUSTIFICATIF', 'AUTRE']
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [summaryRes, documentsRes, entreesRes, trendRes, chargesTVARes] = await Promise.all([
        fetch(`/api/clients/${clientId}/accounting-summary?month=${month}&year=${year}`),
        fetch(`/api/clients/${clientId}/documents-comptables?month=${month}&year=${year}`),
        fetch(`/api/clients/${clientId}/entrees?month=${month}&year=${year}`),
        fetch(`/api/clients/${clientId}/accounting-trend?year=${year}`),
        fetch(`/api/clients/${clientId}/charges-tva?month=${month}&year=${year}`)
      ])
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (documentsRes.ok) {
        const data = await documentsRes.json()
        setDocuments(data.documents || [])
      }
      if (entreesRes.ok) {
        const data = await entreesRes.json()
        setEntrees(data.entrees || [])
      }
      if (trendRes.ok) {
        const data = await trendRes.json()
        setTrendDataState(data.trendData || [])
      }
      if (chargesTVARes.ok) {
        const data = await chargesTVARes.json()
        setChargesTVAData(data)
      }

      // Récupérer aussi le dossier comptable
      const dossierRes = await fetch(`/api/clients/${clientId}/dossier-comptable?month=${month}&year=${year}`)
      if (dossierRes.ok) {
        const dossierData = await dossierRes.json()
        setDossierId(dossierData.id)
      } else {
        // Pas de dossier pour ce mois/année
        setDossierId(null)
      }
    } catch (error) {
      console.error('Erreur de chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [month, year])

  const handleAddDocument = () => {
    setEditingDocument(null)
    setFormData({ nom: '', montant: '', categorie: 'AUTRES_CHARGES', type: 'CHARGE', description: '', dateDocument: new Date().toISOString().split('T')[0], notes: '' })
    setUploadedFile(null)
    setIsDocumentDialogOpen(true)
  }

  const handleEditDocument = (doc: DocumentComptable) => {
    setEditingDocument(doc)
    setFormData({ nom: doc.nom, montant: doc.montant.toString(), categorie: doc.categorie || 'AUTRES_CHARGES', type: doc.type, description: doc.description || '', dateDocument: doc.dateDocument || new Date().toISOString().split('T')[0], notes: doc.notes || '' })
    setIsDocumentDialogOpen(true)
  }

  const handleSaveDocument = async () => {
    if (!formData.nom || !formData.montant || !formData.type) {
      alert('Nom, montant et type sont obligatoires')
      return
    }
    try {
      const url = editingDocument ? `/api/clients/${clientId}/documents-comptables/${editingDocument.id}` : `/api/clients/${clientId}/documents-comptables`
      const method = editingDocument ? 'PATCH' : 'POST'
      
      const formDataToSend = new FormData()
      formDataToSend.append('nom', formData.nom)
      formDataToSend.append('montant', parseFloat(formData.montant).toString())
      formDataToSend.append('categorie', formData.categorie)
      formDataToSend.append('type', formData.type)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('dateDocument', formData.dateDocument)
      formDataToSend.append('notes', formData.notes)
      
      if (uploadedFile) {
        formDataToSend.append('fichier', uploadedFile)
      }
      
      const response = await fetch(url, {
        method,
        body: formDataToSend
      })
      if (response.ok) {
        setIsDocumentDialogOpen(false)
        setUploadedFile(null)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur de sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return
    try {
      const response = await fetch(`/api/clients/${clientId}/documents-comptables/${documentId}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur de suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Préparer les données pour le graphique de tendance (derniers 6 mois)
  const getTrendData = () => {
    return trendData
  }

  // Préparer les données pour le graphique de répartition TVA
  const getTVADistributionData = () => {
    // Utiliser les vraies données des charges si disponibles
    if (chargesTVAData) {
      const totalAvecTVA = chargesTVAData.totalAvecTVA || 0
      const totalSansTVA = chargesTVAData.totalSansTVA || 0
      
      return [
        { name: 'Achats avec TVA', value: totalAvecTVA, fill: '#3b82f6' },
        { name: 'Achats sans TVA', value: totalSansTVA, fill: '#f59e0b' },
      ]
    }

    // Fallback: calculer à partir des documents comptables
    let totalAvecTVA = 0
    let totalSansTVA = 0

    documents.filter(d => d.type === 'CHARGE').forEach(doc => {
      // Estimation: si montant > seuil, considérer avec TVA
      // Sinon basé sur catégorie
      totalAvecTVA += doc.montant * 0.6 // 60% avec TVA par défaut
      totalSansTVA += doc.montant * 0.4 // 40% sans TVA par défaut
    })

    return [
      { name: 'Achats avec TVA', value: totalAvecTVA, fill: '#3b82f6' },
      { name: 'Achats sans TVA', value: totalSansTVA, fill: '#f59e0b' },
    ]
  }

  const getTrendDataDisplay = () => {
    return trendDataState
  }

  const trendData = getTrendDataDisplay()
  const tvaDistributionData = getTVADistributionData()
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1']

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text">Comptabilité Client</h1>
            {summary && <p className="text-gray-600 mt-2">{summary.client.entreprise || `${summary.client.prenom} ${summary.client.nom}`}</p>}
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Mois</label>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(parseInt(e.target.value))} 
                  className="px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2024, m - 1).toLocaleString('fr-FR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Année</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(parseInt(e.target.value))} 
                  className="px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white font-medium"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <Link
              href={`/clients/${clientId}/accounting/upload-situation`}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-semibold mt-6"
            >
              <Upload className="h-4 w-4" />
              Importer Charges
            </Link>
            <Link
              href={`/clients/${clientId}/accounting/upload-entrees`}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold mt-6"
            >
              <Upload className="h-4 w-4" />
              Importer Entrées (PDF)
            </Link>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Total Entrées</h3>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{summary.financials.totalEntrees.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</div>
              <p className="text-xs text-gray-500 mt-1">Documents d'entrée</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Total Charges</h3>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{summary.financials.totalCharges.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</div>
              <p className="text-xs text-gray-500 mt-1">{summary.financials.pourcentageCharges}% des entrées</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Solde</h3>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className={`text-2xl font-bold ${summary.financials.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>{summary.financials.solde.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</div>
              <p className="text-xs text-gray-500 mt-1">{summary.financials.solde >= 0 ? 'Bénéfice' : 'Déficit'}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Abonnement</h3>
                <div className="h-4 w-4 text-blue-600">📋</div>
              </div>
              <div className="text-xl font-bold">{summary.abonnements.length > 0 ? <span className="text-green-600">✓ Actif</span> : <span className="text-red-600">✗ Inactif</span>}</div>
              {summary.abonnements.length > 0 && <p className="text-xs text-gray-500 mt-1">{summary.abonnements[0].montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}/mois</p>}
            </div>
          </div>
        )}

        {/* Graphiques de tendance et répartition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique de tendance Entrées vs Charges */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Tendance Entrées vs Charges - {year}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  formatter={(value) => (value as number).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                />
                <Legend />
                <Line type="monotone" dataKey="entrees" stroke="#10b981" strokeWidth={2} name="Entrées" />
                <Line type="monotone" dataKey="charges" stroke="#ef4444" strokeWidth={2} name="Charges" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique de répartition Avec TVA vs Sans TVA */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Répartition des Achats (Avec TVA vs Sans TVA)</h2>
            {tvaDistributionData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <p>Aucune charge enregistrée</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tvaDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${(value as number).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tvaDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => (value as number).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tableau des charges détaillées */}
        {dossierId && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold">💰 Charges (Dépenses/Achats)</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChargesFilter('TOUS')}
                    className={`px-4 py-2 rounded transition text-sm font-medium ${chargesFilter === 'TOUS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Tous les Achats
                  </button>
                  <button
                    onClick={() => setChargesFilter('AVEC_TVA')}
                    className={`px-4 py-2 rounded transition text-sm font-medium ${chargesFilter === 'AVEC_TVA' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Avec TVA
                  </button>
                  <button
                    onClick={() => setChargesFilter('SANS_TVA')}
                    className={`px-4 py-2 rounded transition text-sm font-medium ${chargesFilter === 'SANS_TVA' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Sans TVA
                  </button>
                </div>
              </div>
              <ChargesDetailTable dossierId={dossierId} filter={chargesFilter} />
            </div>
          </div>
        )}

        {/* Tableau des entrées */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-bold">📋 Entrées (Revenus/Ventes)</h2>
            <Link
              href={`/clients/${clientId}/accounting/upload-entrees`}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-sm"
            >
              <Plus className="h-4 w-4" />
              Ajouter une Entrée
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Référence</th>
                  <th className="text-left py-3 px-4 font-semibold">Désignation</th>
                  <th className="text-right py-3 px-4 font-semibold">Montant HT</th>
                  <th className="text-right py-3 px-4 font-semibold">TVA</th>
                  <th className="text-right py-3 px-4 font-semibold">Montant TTC</th>
                  <th className="text-left py-3 px-4 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {entrees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">Aucune entrée enregistrée</td>
                  </tr>
                ) : (
                  entrees.map((entree) => (
                    <tr key={entree.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(entree.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 px-4 font-medium">{entree.reference || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate" title={entree.description}>
                          {entree.description}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700">{entree.montantHT ? entree.montantHT.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }) : '0 F'}</td>
                      <td className="text-right py-3 px-4 text-amber-600 font-medium">{entree.montantTVA ? entree.montantTVA.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }) : '0 F'}</td>
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">{entree.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${entree.sourceType === 'MANUAL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {entree.sourceType === 'MANUAL' ? 'Manuel' : 'PDF'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>



        {isDocumentDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
              <div className="p-6 border-b">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {editingDocument ? 'Éditer le document' : 'Ajouter un document comptable'}
                </h2>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom du document *</label>
                    <input type="text" placeholder="Ex: Facture ABC-001" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ENTREE' | 'CHARGE' | 'AUTRE', categorie: e.target.value === 'ENTREE' ? 'VENTES_PRODUITS' : 'AUTRES_CHARGES' })} className="w-full px-3 py-2 border border-gray-300 rounded">
                      <option value="CHARGE">Charge (dépense)</option>
                      <option value="ENTREE">Entrée (revenu)</option>
                      <option value="AUTRE">Autre (justificatif)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Montant *</label>
                    <input type="number" placeholder="0" step="0.01" value={formData.montant} onChange={(e) => setFormData({ ...formData, montant: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Catégorie *</label>
                    <select value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded">
                      {categoriesByType[formData.type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date du document</label>
                  <input type="date" value={formData.dateDocument} onChange={(e) => setFormData({ ...formData, dateDocument: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input type="text" placeholder="Détails du document" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea placeholder="Remarques additionnelles" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded resize-none" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Justificatif (Facture, Reçu, etc.)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="file" 
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                      className="hidden" 
                      id="file-input"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      <p className="text-sm text-gray-600">Cliquez pour ajouter un fichier</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC (Max 10MB)</p>
                      {uploadedFile && <p className="text-sm font-medium text-green-600 mt-2">✓ {uploadedFile.name}</p>}
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t justify-end">
                <button onClick={() => setIsDocumentDialogOpen(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Annuler</button>
                <button onClick={handleSaveDocument} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">{editingDocument ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
