"use client"
import { useEffect, useState } from 'react'
import { useEnums } from '@/lib/useEnums'
import { CheckCircle, AlertCircle, Upload } from 'lucide-react'

interface TacheOption {
  id: string
  titre: string
  projetId: string
  serviceId?: string
  assigneAId?: string
  projet: { id: string; titre: string }
  service?: { id: string; nom: string }
}

export default function SubmitTaskForm(){
  const [projects, setProjects] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [mesTaches, setMesTaches] = useState<TacheOption[]>([])
  const [loadingTaches, setLoadingTaches] = useState(true)
  const { data: priorites, loading: prioritesLoading } = useEnums('priorites')
  const { data: statutsTaches, loading: statutsLoading } = useEnums('statuts-taches')
  const [form, setForm] = useState<any>({ titre: '', projet: '', service: '', description: '', priorite: '', dateEcheance: '', heuresEstimees: '', montant: '', facturable: true, selectedTaskId: '', assigneAId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const [pRes, sRes, tachesRes] = await Promise.all([
          fetch('/api/projets'), 
          fetch('/api/services'),
          fetch('/api/taches/mes-taches')
        ])
        const pJson = await pRes.json()
        const sJson = await sRes.json()
        const tachesJson = await tachesRes.json()
        if(!mounted) return
        // 👈 Handle both array and object response for projets
        const projetsData = Array.isArray(pJson) ? pJson : (pJson?.data || [])
        // 👈 Handle both array and object response for services
        const servicesData = Array.isArray(sJson) ? sJson : (sJson?.data || [])
        // 👈 Handle both array and object response from /api/taches/mes-taches
        const tachesData = Array.isArray(tachesJson) ? tachesJson : (tachesJson?.data || [])
        
        setProjects(projetsData)
        setServices(servicesData)
        setMesTaches(tachesData)
        setLoadingTaches(false)
      }catch(e){ 
        console.error(e)
        setLoadingTaches(false)
      }
    })()
    return ()=>{ mounted = false }
  },[])

  // Définir la priorité par défaut une fois chargée
  useEffect(() => {
    if (!prioritesLoading && priorites.length > 0 && !form.priorite) {
      const defaultPriority = priorites.find(p => p.cle === 'MOYENNE') || priorites[0]
      setForm((f: any) => ({ ...f, priorite: defaultPriority.cle }))
    }
  }, [prioritesLoading, priorites, form.priorite])

  // Gérer la sélection d'une tâche existante pour auto-remplir projet et service
  const handleSelectTask = (taskId: string) => {
    setForm((f: any) => ({ ...f, selectedTaskId: taskId }))
    
    if (taskId) {
      const selectedTask = mesTaches.find(t => t.id === taskId)
      if (selectedTask) {
        // Auto-remplir le projet, le service, et l'assigné
        console.log('📋 Task sélectionnée:', selectedTask)
        setForm((f: any) => ({
          ...f,
          titre: selectedTask.titre,
          // 👈 Utiliser les IDs depuis les relations complètes (projet et service) ou les champs directs
          projet: selectedTask.projet?.id || selectedTask.projetId || '',
          service: selectedTask.service?.id || selectedTask.serviceId || '',
          assigneAId: selectedTask.assigneAId || ''
        }))
      }
    } else {
      // Réinitialiser les champs
      setForm((f: any) => ({
        ...f,
        titre: '',
        projet: '',
        service: '',
        assigneAId: ''
      }))
    }
  }

  const [files, setFiles] = useState<File[]>([])

  const submit = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)
    try{
      const formData = new FormData()
      formData.append('titre', form.titre)
      formData.append('projet', form.projet)
      if (form.service) formData.append('service', form.service)
      formData.append('description', form.description)
      formData.append('priorite', form.priorite)
      formData.append('dateEcheance', form.dateEcheance)
      if (form.heuresEstimees) formData.append('heuresEstimees', String(form.heuresEstimees))
      if (form.montant) formData.append('montant', String(form.montant))
      formData.append('facturable', String(!!form.facturable))
      // Default statut - mark as SOUMISE for submitted tasks
      const defaultStatut = (statutsTaches && statutsTaches.length > 0) ? (statutsTaches.find((s:any)=>s.cle==='SOUMISE')?.cle || 'SOUMISE') : 'SOUMISE'
      formData.append('statut', defaultStatut)
      
      // 👈 Ajouter l'assigneAId s'il existe
      if (form.assigneAId) {
        formData.append('assigneAId', form.assigneAId)
      }

      // Attach files
      files.forEach((f) => {
        formData.append('files', f, f.name)
      })

      const res = await fetch('/api/taches', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setResult(json)
    }catch(err:any){
      alert('Erreur: '+(err.message||err))
    }finally{ setSubmitting(false) }
  }

  if (result) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-800">Tâche soumise avec succès 🎉</h3>
            <div className="mt-2 text-sm text-green-700 space-y-2">
              <p><span className="font-medium">Titre:</span> {result.titre}</p>
              <p><span className="font-medium">Projet:</span> {result.projet?.titre || result.projet?.title || '—'}</p>
              <p>
                <span className="font-medium">Deadline:</span> {result.dateEcheance 
                  ? new Date(result.dateEcheance).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) 
                  : '—'}
              </p>
              <p><span className="font-medium">Priorité:</span> {result.priorite}</p>
              <p><span className="font-medium">Facturable:</span> {result.facturable ? 'Oui' : 'Non'}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a 
                href="/dashboard/employe/mes-taches" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--color-gold)] hover:bg-[var(--color-gold-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-gold)] transition-colors"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Retour à mes tâches
              </a>
              <a 
                href="/dashboard/employe/calendrier" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-gold)] transition-colors"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Voir dans le calendrier
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="p-6 space-y-6">
      {/* Mes tâches - Sélectionner une tâche existante */}
      <div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sélectionner une de mes tâches <span className="text-gray-500 font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            <select 
              value={form.selectedTaskId} 
              onChange={e => handleSelectTask(e.target.value)} 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] sm:text-sm rounded-md"
            >
              <option value="">Choisir une tâche existante...</option>
              {loadingTaches ? (
                <option disabled>Chargement de vos tâches...</option>
              ) : mesTaches.length > 0 ? (
                mesTaches.map(tache => (
                  <option key={tache.id} value={tache.id}>
                    {tache.titre} ({tache.projet?.titre || 'Projet inconnu'})
                  </option>
                ))
              ) : (
                <option disabled>Aucune tâche assignée</option>
              )}
            </select>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Sélectionnez une tâche pour pré-remplir automatiquement les champs
          </p>
        </div>
      </div>

      {/* Titre */}
      <div className="space-y-2">
        <label htmlFor="titre" className="block text-sm font-medium text-gray-700">
          Titre de la tâche <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="titre"
            required
            value={form.titre}
            onChange={e => setForm((f: any) => ({ ...f, titre: e.target.value }))}
            className="shadow-sm focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="ex: Design de la page d'accueil"
          />
        </div>
      </div>

      {/* Projet & Service */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="projet" className="block text-sm font-medium text-gray-700">
            Projet lié <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="projet"
              required
              value={form.projet}
              onChange={e => setForm((f: any) => ({ ...f, projet: e.target.value }))}
              className="shadow-sm focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Sélectionner un projet</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title || p.titre || p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="service" className="block text-sm font-medium text-gray-700">
            Service <span className="text-gray-500 font-normal">(optionnel)</span>
          </label>
          <div className="mt-1">
            <select
              id="service"
              value={form.service}
              onChange={e => setForm((f: any) => ({ ...f, service: e.target.value }))}
              className="shadow-sm focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Sélectionner un service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            rows={4}
            required
            value={form.description}
            onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
            className="shadow-sm focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full sm:text-sm border border-gray-300 rounded-md"
            placeholder="Décrivez en détail le travail effectué..."
          />
        </div>
      </div>

      {/* Priorité, Échéance, Durée */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="priorite" className="block text-sm font-medium text-gray-700">
            Priorité <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="priorite"
              required
              value={form.priorite}
              onChange={e => setForm((f: any) => ({ ...f, priorite: e.target.value }))}
              className="shadow-sm focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={prioritesLoading}
            >
              <option value="">Sélectionner une priorité</option>
              {prioritesLoading ? (
                <option disabled>Chargement...</option>
              ) : priorites && priorites.length > 0 ? (
                priorites.map(p => (
                  <option key={p.id || p.cle} value={p.cle}>
                    {p.label || p.cle}
                  </option>
                ))
              ) : (
                <>
                  <option value="BASSE">Basse</option>
                  <option value="MOYENNE">Moyenne</option>
                  <option value="HAUTE">Haute</option>
                  <option value="URGENTE">Urgente</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="dateEcheance" className="block text-sm font-medium text-gray-700">
            Date limite <span className="text-gray-500 font-normal">(optionnel)</span>
          </label>
          <div className="mt-1">
            <input
              type="datetime-local"
              id="dateEcheance"
              value={form.dateEcheance}
              onChange={e => setForm((f: any) => ({ ...f, dateEcheance: e.target.value }))}
              className="shadow-sm focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="heuresEstimees" className="block text-sm font-medium text-gray-700">
            Durée estimée (heures)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="heuresEstimees"
              min="0"
              step="0.5"
              value={form.heuresEstimees}
              onChange={e => setForm((f: any) => ({ ...f, heuresEstimees: e.target.value }))}
              className="focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="ex: 3.5"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Montant et Facturable */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="montant" className="block text-sm font-medium text-gray-700">
            Montant facturable
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">FCFA</span>
            </div>
            <input
              type="number"
              id="montant"
              min="0"
              step="100"
              value={form.montant}
              onChange={e => setForm((f: any) => ({ ...f, montant: e.target.value }))}
              className="focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] block w-full pl-16 sm:text-sm border-gray-300 rounded-md"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Facturable
          </label>
          <div className="mt-1">
            <div className="flex items-center space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={form.facturable === true}
                  onChange={() => setForm((f: any) => ({ ...f, facturable: true }))}
                  className="h-4 w-4 text-[var(--color-gold)] focus:ring-[var(--color-gold)] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Oui</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={form.facturable === false}
                  onChange={() => setForm((f: any) => ({ ...f, facturable: false }))}
                  className="h-4 w-4 text-[var(--color-gold)] focus:ring-[var(--color-gold)] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Non</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Fichiers joints */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Fichiers joints <span className="text-gray-500 font-normal">(optionnel)</span>
        </label>
        <div className="mt-1">
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-[var(--color-gold)] hover:text-[var(--color-gold-dark)] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus:ring-[var(--color-gold)]"
                >
                  <span>Téléverser des fichiers</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={e => setFiles(Array.from(e.target.files || []))}
                  />
                </label>
                <p className="pl-1">ou glissez-déposez</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, PDF, DOCX jusqu'à 10MB
              </p>
            </div>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, index) => index !== i))}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment réinitialiser le formulaire ? Toutes les modifications seront perdues.')) {
                setForm({
                  titre: '',
                  description: '',
                  projet: '',
                  service: '',
                  priorite: '',
                  dateEcheance: '',
                  heuresEstimees: '',
                  montant: '',
                  facturable: true,
                  selectedTaskId: ''
                })
                setFiles([])
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-gold)]"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={submitting || prioritesLoading}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--color-gold)] hover:bg-[var(--color-gold-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Soumettre la tâche
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
