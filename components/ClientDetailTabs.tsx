'use client'

import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import AbonnementModal from './AbonnementModal'
import ProjectModal from './ProjectModal'
import ClientDocumentsUpload from './ClientDocumentsUpload'
import ProjectTasksModal from './ProjectTasksModal'
import ProjectInvoicesModal from './ProjectInvoicesModal'
import NouveauFactureModal from './NouveauFactureModal'
import NouveauPaiementModal from './NouveauPaiementModal'
import ProFormaModal from './ProFormaModal'
import ProFormaList from './ProFormaList'

type TabKey =
  | 'infos'
  | 'abonnements'
  | 'projets'
  | 'factures'
  | 'paiements'
  | 'documents'
  | 'communications'
  | 'notes'

type Props = {
  client: any
}

function formatDate(d?: string | Date | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR')
  } catch (e) {
    return '—'
  }
}

function getStatutColor(statut?: string) {
  switch ((statut || '').toLowerCase()) {
    case 'payée':
    case 'payee':
      return 'text-green-700 bg-green-100'
    case 'en attente':
    case 'pending':
      return 'text-yellow-700 bg-yellow-100'
    case 'annulée':
    case 'annulee':
      return 'text-red-700 bg-red-100'
    default:
      return 'text-gray-700 bg-gray-100'
  }
}

export default function ClientDetailTabs({ client }: Props) {
  const [active, setActive] = useState<TabKey>('infos')
  const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false)
  const [isProFormaModalOpen, setIsProFormaModalOpen] = useState(false)
  const [editingProForma, setEditingProForma] = useState<any>(null)
  const [proFormas, setProFormas] = useState<any[]>([])
  const [loadingProFormas, setLoadingProFormas] = useState(false)

  // Charger les pro-formas du client
  useEffect(() => {
    if (active === 'factures') {
      fetchProFormas()
    }
  }, [active])

  const fetchProFormas = async () => {
    try {
      setLoadingProFormas(true)
      const res = await fetch(`/api/pro-formas?clientId=${client.id}`)
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setProFormas(data)
    } catch (err) {
      console.error('Erreur chargement pro-formas:', err)
    } finally {
      setLoadingProFormas(false)
    }
  }

  // Charger les pro-formas au montage pour les rendre visibles sans changer d'onglet
  useEffect(() => {
    if (client?.id) fetchProFormas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  const handleEditProForma = (proForma: any) => {
    setEditingProForma(proForma)
    setIsProFormaModalOpen(true)
  }

  const handleProFormaSuccess = () => {
    setEditingProForma(null)
    fetchProFormas()
  }

  const tabs: { key: TabKey; title: string }[] = [
    { key: 'infos', title: 'Infos' },
    { key: 'abonnements', title: 'Abonnements' },
    { key: 'projets', title: 'Projets' },
    { key: 'factures', title: 'Factures' },
    { key: 'paiements', title: 'Paiements' },
    { key: 'documents', title: 'Documents' },
    { key: 'communications', title: 'Communication' },
    { key: 'notes', title: 'Notes' },
  ]

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-shadow)] flex-shrink-0 border-2 border-[var(--color-gold)] shadow-md">
              {client?.avatar ? (
                <img 
                  src={client.avatar} 
                  alt={client.nom || 'Avatar'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-indigo-200">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="currentColor"/>
                    <path d="M3 21c0-3.866 3.582-7 9-7s9 3.134 9 7v1H3v-1z" fill="currentColor" fillOpacity="0.5"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h1 className="text-2xl font-bold gold-gradient-text leading-tight">
                      {client?.nom || 'Nom du client'}
                    </h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client?.statut === 'Actif' || client?.etat === 'Actif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-[var(--color-gold)] text-[var(--color-black-deep)]'
                    }`}>
                      {client?.statut || client?.etat || 'Inactif'}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-anthracite)]">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      {client?.type || 'Entreprise'}
                    </span>
                    {client?.entreprise && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-gray-300">•</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M12 18h.01"></path>
                        </svg>
                        {client.entreprise}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button 
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium bg-[var(--color-gold)] text-[var(--color-black-deep)] hover:bg-[var(--color-gold-accent)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-gold)] transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Modifier
                  </button>
                  <button 
                    className="inline-flex items-center justify-center px-4 py-2 border border-[var(--color-border)] rounded-lg shadow-sm text-sm font-medium text-[var(--color-anthracite)] bg-white hover:bg-[var(--color-gold)]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-gold)] transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Exporter
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 mt-1">{client?.email || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Téléphone</p>
                    <p className="text-sm text-gray-900 mt-1">{client?.telephone || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Adresse</p>
                    <p className="text-sm text-gray-900 mt-1">{client?.adresse || 'Non renseignée'}</p>
                  </div>
                </div>
              </div>

              {/* Bloc Informations légales (pour entreprises) */}
              {client?.type === 'ENTREPRISE' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Informations légales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {client?.entreprise && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Entreprise</p>
                        <p className="text-sm text-gray-900 mt-1">{client.entreprise}</p>
                      </div>
                    )}
                    {client?.gudefUrl && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Vérification GUDEF</p>
                        <a 
                          href={client.gudefUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline mt-1"
                        >
                          🔗 Consulter la fiche
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 border-b border-[var(--color-border)]">
          <div className="flex space-x-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`relative px-5 py-3.5 text-sm font-medium transition-colors ${
                  active === t.key
                    ? 'text-[var(--color-gold)] gold-gradient-text'
                    : 'text-[var(--color-anthracite)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10'
                }`}
              >
                {t.title}
                {active === t.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-gold)]"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          {active === 'infos' && <TabInfos client={client} />}
          {active === 'abonnements' && <TabAbonnements abonnements={client.abonnements || []} clientId={client.id} clientName={client.nom} />}
          {active === 'projets' && <TabProjets projets={client.projets || []} clientId={client.id} />}
          {active === 'factures' && (
            <TabFactures 
              factures={client.factures || []} 
              clientId={client.id} 
              clientName={client.nom} 
              clientProjets={client.projets}
              proFormas={proFormas}
              loadingProFormas={loadingProFormas}
              onOpenProFormaModal={() => setIsProFormaModalOpen(true)}
              onRefreshProFormas={fetchProFormas}
              onEditProForma={handleEditProForma}
            />
          )}
          {active === 'paiements' && <TabPaiements paiements={client.paiements || []} clientId={client.id} onOpenPaiementModal={() => setIsPaiementModalOpen(true)} />}
          {active === 'documents' && <TabDocuments clientId={client.id} />}
          {active === 'communications' && (
            <div className="py-12 text-center">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Section en cours de développement</h3>
                <p className="mt-1 text-sm text-gray-500">L'historique et l'envoi de messages seront bientôt disponibles.</p>
              </div>
            </div>
          )}
          {active === 'notes' && (
            <div className="py-12 text-center">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Section en cours de développement</h3>
                <p className="mt-1 text-sm text-gray-500">La gestion des notes internes et de l'historique sera bientôt disponible.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouveau Paiement */}
      <NouveauPaiementModal
        isOpen={isPaiementModalOpen}
        onClose={() => setIsPaiementModalOpen(false)}
        onSave={(paiement) => {
          // Logique de sauvegarde du paiement
          setIsPaiementModalOpen(false)
        }}
        clientName={client.nom}
        projets={client.projets || []}
      />

      {/* Modal Pro Forma */}
      <ProFormaModal
        clientId={client.id}
        isOpen={isProFormaModalOpen}
        onClose={() => {
          setIsProFormaModalOpen(false)
          setEditingProForma(null)
        }}
        onSuccess={handleProFormaSuccess}
        projets={client.projets || []}
        editingProForma={editingProForma}
      />
    </div>
  )
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center text-gray-600">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-lg font-medium text-slate-800">{value}</div>
      </div>
    </div>
  )
}

function TabInfos({ client }: { client: Props['client'] }) {
  // Calculer les stats à partir des vraies données
  const montantTotalPaiements = client?.paiements 
    ? client.paiements.reduce((sum: number, p: any) => sum + (p.montant || 0), 0) 
    : 0

  const facturesPayees = client?.factures 
    ? client.factures.filter((f: any) => f.statut?.toLowerCase() === 'payée' || f.statut?.toLowerCase() === 'payee').length 
    : 0

  const stats = {
    projets: client?.projets ? client.projets.length : 0,
    tachesTerminees: 0, // À calculer si besoin
    facturesPayees: facturesPayees,
    montantPaye: montantTotalPaiements,
    abonnementsActifs: client?.abonnements ? client.abonnements.filter((a: any) => a.statut === 'active' || a.statut === 'actif' || a.statut === 'ACTIF').length : 0,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Info Card */}
      <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📋 Informations personnelles</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M3 8l7.89 5.26a2 2 0 002.22 0L21 8M3 8V6a2 2 0 012-2h14a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Email</div>
              <div className="text-sm font-medium text-slate-800">{client?.email || '—'}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 6-9 11-9 11S3 16 3 10a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Adresse</div>
              <div className="text-sm font-medium text-slate-800">{client?.adresse || '—'}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Téléphone</div>
              <div className="text-sm font-medium text-slate-800">{client?.telephone || '—'}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Date de naissance</div>
              <div className="text-sm font-medium text-slate-800">{formatDate(client?.dateNaissance)}</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Dernière modification</div>
              <div className="text-sm font-medium text-slate-800">{formatDate(client?.dateModification || client?.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Stats Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 Statistiques rapides</h3>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9h6M9 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 font-medium">Projets totaux</div>
                <div className="text-lg font-bold text-blue-700">{stats.projets}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 font-medium">Tâches terminées</div>
                <div className="text-lg font-bold text-green-700">{stats.tachesTerminees}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 font-medium">Factures payées</div>
                <div className="text-lg font-bold text-purple-700">{stats.facturesPayees}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="none"><path d="M12 1v22M17 5H9.5a4.5 4.5 0 0 0 0 9h5m0-9a4.5 4.5 0 0 1 0 9m-5 0H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 font-medium">Montant total payé</div>
                <div className="text-lg font-bold text-orange-700">{stats.montantPaye ? `${stats.montantPaye} FCFA` : '—'}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12M7 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 font-medium">Abonnements actifs</div>
                <div className="text-lg font-bold text-pink-700">{stats.abonnementsActifs}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabAbonnements({ abonnements = [], clientId, clientName }: { abonnements?: any[]; clientId?: string | number; clientName?: string }) {
  const [showModal, setShowModal] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  function badgeColor(statut: string) {
    switch (statut?.toLowerCase()) {
      case 'actif': return 'bg-green-50 text-green-600';
      case 'suspendu': return 'bg-gray-100 text-gray-500';
      case 'retard': return 'bg-red-50 text-red-500';
      default: return 'bg-gray-50 text-gray-600';
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Abonnements actifs</h3>
          <button onClick={() => { setInitialData(clientId ? { clientId, clientName } : null); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm flex items-center gap-2 hover:bg-blue-700">
            <span className="text-lg">+</span> Nouvel abonnement
          </button>
        </div>
        <div className="overflow-x-auto">
          {abonnements.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">Aucun abonnement.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 font-medium text-gray-600">SERVICE</th>
                  <th className="py-2 px-3 font-medium text-gray-600">FRÉQUENCE</th>
                  <th className="py-2 px-3 font-medium text-gray-600">MONTANT</th>
                  <th className="py-2 px-3 font-medium text-gray-600">STATUT</th>
                  <th className="py-2 px-3 font-medium text-gray-600">DATE DÉBUT</th>
                  <th className="py-2 px-3 font-medium text-gray-600">DATE FIN</th>
                  <th className="py-2 px-3 font-medium text-gray-600">PROCHAIN PAIEMENT</th>
                  <th className="py-2 px-3 font-medium text-gray-600">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {abonnements.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-slate-800">{a.nom || a.type || '—'}</td>
                    <td className="py-2 px-3">{a.frequence || '—'}</td>
                    <td className="py-2 px-3 font-semibold">{a.montant ? `${a.montant.toLocaleString()} FCFA` : '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor(a.statut)}`}>{a.statut || '—'}</span>
                    </td>
                    <td className="py-2 px-3">{formatDate(a.dateDebut)}</td>
                    <td className="py-2 px-3">{formatDate(a.dateFin)}</td>
                    <td className="py-2 px-3 font-semibold text-blue-600">{a.prochainPaiement ? formatDate(a.prochainPaiement) : '-'}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-3 items-center">
                        <button title="Voir" className="text-blue-600 hover:text-blue-800"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.05 12a9.94 9.94 0 0 1 19.9 0 9.94 9.94 0 0 1-19.9 0z"/></svg></button>
                        <button title="Modifier" className="text-gray-600 hover:text-gray-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
                        <button title="Supprimer" className="text-red-500 hover:text-red-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <AbonnementModal isOpen={showModal} onClose={() => { setShowModal(false); setInitialData(null); }} onSaved={() => { setShowModal(false); setInitialData(null); }} initialData={initialData} />
    </>
  );
}

function TabProjets({ projets = [], clientId }: { projets?: any[]; clientId?: string | number }) {
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [showInvoicesModal, setShowInvoicesModal] = useState(false)

  const handleCreate = () => {
    setShowModal(true)
  }

  const handleViewTasks = (project: any) => {
    setSelectedProject(project)
    setShowTasksModal(true)
  }

  const handleViewInvoices = (project: any) => {
    setSelectedProject(project)
    setShowInvoicesModal(true)
  }

  const onProjectCreated = () => {
    // After creating a project, reload to fetch server-side data for this client page
    try {
      window.location.reload()
    } catch (e) {
      // fallback: do nothing
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Projets</h3>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm flex items-center gap-2 hover:bg-blue-700">
            + Nouveau projet
          </button>
        </div>

        {projets.length === 0 ? (
          <div className="py-6 text-sm text-gray-600">Aucun projet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">TITRE DU PROJET</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">SERVICE</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">STATUT</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">BUDGET</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">PÉRIODE</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {projets.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{p.nom || p.titre || 'Projet sans titre'}</td>
                    <td className="py-3 px-4 text-gray-700">{p.service?.nom || p.type || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{p.statut || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{p.budget ? `${Number(p.budget).toLocaleString('fr-FR')} FCFA` : '-'}</td>
                    <td className="py-3 px-4 text-gray-700">{p.dateDebut ? `${formatDate(p.dateDebut)} – ${formatDate(p.dateFin)}` : '-'}</td>
                    <td className="py-3 px-4 text-sm space-x-2">
                      <button 
                        onClick={() => handleViewTasks(p)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Tâches
                      </button>
                      <button 
                        onClick={() => handleViewInvoices(p)}
                        className="text-green-600 hover:underline font-medium"
                      >
                        Factures
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ProjectModal isOpen={showModal} onClose={() => setShowModal(false)} onProjectCreated={onProjectCreated} initialClientId={clientId} />
      </div>

      {selectedProject && (
        <>
          <ProjectTasksModal
            isOpen={showTasksModal}
            onClose={() => {
              setShowTasksModal(false)
              setSelectedProject(null)
            }}
            projectId={selectedProject.id}
            projectName={selectedProject.nom || selectedProject.titre || 'Projet sans titre'}
          />

          <ProjectInvoicesModal
            isOpen={showInvoicesModal}
            onClose={() => {
              setShowInvoicesModal(false)
              setSelectedProject(null)
            }}
            projectId={selectedProject.id}
            projectName={selectedProject.nom || selectedProject.titre || 'Projet sans titre'}
            clientId={clientId as string}
          />
        </>
      )}
    </>
  )
}

function TabFactures({ 
  factures, 
  clientId, 
  clientName, 
  clientProjets,
  proFormas = [],
  loadingProFormas = false,
  onOpenProFormaModal,
  onRefreshProFormas,
  onEditProForma
}: { 
  factures: any[]
  clientId?: string | number
  clientName?: string
  clientProjets?: any[]
  proFormas?: any[]
  loadingProFormas?: boolean
  onOpenProFormaModal?: () => void
  onRefreshProFormas?: () => void
  onEditProForma?: (pf: any) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [invoices, setInvoices] = useState(factures || [])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Rafraîchir les factures automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshInvoices()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [clientId])

  const refreshInvoices = async () => {
    if (!clientId) return
    
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.factures || [])
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des factures:', err)
    }
  }

  const handleRefreshClick = async () => {
    setIsRefreshing(true)
    try {
      await refreshInvoices()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleModalSave = async (facture: any) => {
    try {
      const montant = parseFloat(String(facture.montant)) || 0
      const tauxTVA = parseFloat(String(facture.tauxTVA)) || 18
      const montantTVA = montant * (tauxTVA / 100)
      const montantTotal = montant + montantTVA

      const payload = {
        numero: facture.numero,
        montant: montant,
        tauxTVA: tauxTVA,
        montantTotal: montantTotal,
        dateEmission: facture.dateEmission || new Date().toISOString().split('T')[0],
        dateEcheance: facture.dateEcheance || null,
        notes: facture.notes || null,
        statut: facture.statut || 'EN_ATTENTE',
        clientId: clientId
      }

      const response = await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur lors de la création de la facture')
      }

      const newInvoice = await response.json()
      setInvoices([newInvoice, ...invoices])
      setShowModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création de la facture')
    }
  }

  // Always render header/button area; show "Aucune facture." only in the list area when empty
  const safeInvoices = invoices || []

  return (
    <div className="space-y-6">
      {/* Bouton pour créer une nouvelle facture */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Factures</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm text-gray-700 disabled:opacity-50"
            title="Rafraîchir les factures"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            <Plus size={16} />
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Modal de création de facture */}
      <NouveauFactureModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleModalSave}
        clientId={clientId as string}
        clientName={clientName}
        clientProjets={clientProjets}
      />

      {/* Liste des factures */}
      {invoices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-700">NUMÉRO</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">PROJET</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">MONTANT HT</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">TVA</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">TOTAL</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">STATUT</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">DATE ÉMISSION</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">DATE PAIEMENT</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((f, idx) => (
                <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="py-3 px-4 font-medium text-slate-800">{f.numero || f.reference || f.id}</td>
                  <td className="py-3 px-4 text-gray-700">{f.projet?.titre || '—'}</td>
                  <td className="py-3 px-4 font-semibold">{f.montant ? `${Number(f.montant).toLocaleString('fr-FR')} FCFA` : '—'}</td>
                  <td className="py-3 px-4">
                    {f.tauxTVA ? `${Number(f.tauxTVA).toLocaleString('fr-FR')}%` : '—'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {f.montantTotal ? `${Number(f.montantTotal).toLocaleString('fr-FR')} FCFA` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatutColor(f.statut)}`}>
                      {f.statut ? f.statut.replace(/_/g, ' ') : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{formatDate(f.dateEmission || f.date)}</td>
                  <td className="py-3 px-4">{formatDate(f.datePaiement)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section Pro Formas */}
      <div className="mt-8 pt-8 border-t-2 border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">✨ Pro Formas</h3>
          <button
            onClick={onOpenProFormaModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg hover:bg-[var(--color-gold-accent)] font-medium text-sm transition"
          >
            <Plus size={16} />
            Créer Pro Forma
          </button>
        </div>

        {loadingProFormas ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-gray-600 mt-2">Chargement des pro-formas...</p>
          </div>
        ) : proFormas && proFormas.length > 0 ? (
          <ProFormaList
            proFormas={proFormas}
            onEdit={onEditProForma}
            onDelete={() => onRefreshProFormas?.()}
            onRefresh={onRefreshProFormas}
          />
        ) : (
          <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 font-medium">Aucune pro-forma</p>
            <p className="text-gray-500 text-sm mt-1">Commencez par créer une nouvelle pro-forma</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TabPaiements({ paiements, clientId, onOpenPaiementModal }: { paiements: any[]; clientId: string; onOpenPaiementModal: () => void }) {
  if (!paiements || paiements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Paiements</h3>
          <button onClick={onOpenPaiementModal} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
            <Plus size={16} />
            Enregistrer un paiement
          </button>
        </div>
        <div className="py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6m0 4v.01" strokeLinecap="round" />
          </svg>
          <p className="text-gray-600 font-medium">Aucun paiement enregistré</p>
          <p className="text-gray-500 text-sm mt-1">Les paiements de ce client apparaîtront ici</p>
        </div>
      </div>
    )
  }

  const getStatutColor = (statut?: string) => {
    switch ((statut || '').toLowerCase()) {
      case 'confirmé':
      case 'confirme':
        return 'bg-green-100 text-green-800'
      case 'en attente':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refusé':
      case 'refuse':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Paiements</h3>
        <button onClick={onOpenPaiementModal} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
          <Plus size={16} />
          Enregistrer un paiement
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-gray-700">MONTANT</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700">MOYEN</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700">RÉFÉRENCE</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700">STATUT</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700">DATE PAIEMENT</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700">PROJET / ABONNEMENT</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {p.montant ? `${Number(p.montant).toLocaleString('fr-FR')} FCFA` : '—'}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {p.moyenPaiement || p.methode || '—'}
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">
                  {p.reference || p.id}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatutColor(p.statut)}`}>
                    {p.statut ? p.statut.toUpperCase().replace(/_/g, ' ') : '—'}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {formatDate(p.datePaiement || p.date)}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {p.projet?.titre || p.abonnement?.nom || p.projetNom || '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-800 p-1" title="Voir les détails">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-1" title="Supprimer">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabDocuments({ clientId }: { clientId: string }) {
  return (
    <div>
      <ClientDocumentsUpload clientId={clientId} />
    </div>
  )
}
