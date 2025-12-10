"use client"
import { useEffect, useState } from 'react'
import { useEnums } from '@/lib/useEnums'
import { CheckCircle, AlertCircle, Upload } from 'lucide-react'

interface TacheOption {
  id: string
  titre: string
  projetId: string
  serviceId?: string
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
  const [form, setForm] = useState<any>({ titre: '', projet: '', service: '', description: '', priorite: '', dateEcheance: '', heuresEstimees: '', montant: '', facturable: true, selectedTaskId: '' })
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
        setProjects(pJson || [])
        setServices(sJson || [])
        setMesTaches(Array.isArray(tachesJson) ? tachesJson : [])
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
        // Auto-remplir le projet et le service
        setForm((f: any) => ({
          ...f,
          titre: selectedTask.titre, // Auto-remplir le titre aussi
          projet: selectedTask.projetId,
          service: selectedTask.serviceId || ''
        }))
      }
    } else {
      // Réinitialiser les champs
      setForm((f: any) => ({
        ...f,
        titre: '',
        projet: '',
        service: ''
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
      <div className="card bg-green-50 border-green-200 max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-green-700 mb-3">Tâche soumise avec succès 🎉</h2>
            <div className="space-y-2 text-sm text-green-700/80 mb-4">
              <div><strong className="text-green-700">Titre:</strong> {result.titre}</div>
              <div><strong className="text-green-700">Projet:</strong> {result.projet?.titre || result.projet?.title || '—'}</div>
              <div><strong className="text-green-700">Deadline:</strong> {result.dateEcheance ? new Date(result.dateEcheance).toLocaleDateString('fr-FR') : '—'}</div>
              <div><strong className="text-green-700">Priorité:</strong> {result.priorite}</div>
              <div><strong className="text-green-700">Facturable:</strong> {result.facturable ? 'Oui' : 'Non'}</div>
            </div>
            <div className="flex gap-3">
              <a className="px-4 py-2 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:shadow-lg transition-all" href="/dashboard/employe/mes-taches">↩️ Retour à mes tâches</a>
              <a className="px-4 py-2 border border-green-300 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors" href="/dashboard/employe/calendrier">📅 Voir dans le calendrier</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl mx-auto space-y-6">
      {/* Mes tâches - Sélectionner une tâche existante */}
      <div>
        <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">📋 Sélectionner une de mes tâches (optionnel)</label>
        <select 
          value={form.selectedTaskId} 
          onChange={e => handleSelectTask(e.target.value)} 
          className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
          <option value="">Choisir une tâche... (ou soumettre une nouvelle)</option>
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
        <p className="text-xs text-[var(--color-anthracite)]/60 mt-1">💡 Sélectionnez une tâche pour auto-remplir le projet et le service</p>
      </div>

      {/* Titre */}
      <div>
        <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Titre de la tâche</label>
        <input 
          required 
          value={form.titre} 
          onChange={e=>setForm((f: any)=>({...f, titre:e.target.value}))} 
          className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none"
          placeholder="ex: Design de la page d'accueil" />
      </div>

      {/* Projet et Service */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Projet lié</label>
          <select 
            required 
            value={form.projet} 
            onChange={e=>setForm((f: any)=>({...f, projet:e.target.value}))} 
            className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
            <option value="">Choisir un projet</option>
            {projects.map(p=> <option key={p.id} value={p.id}>{p.title || p.titre || p.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Service</label>
          <select 
            required 
            value={form.service} 
            onChange={e=>setForm((f: any)=>({...f, service:e.target.value}))} 
            className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
            <option value="">Choisir un service</option>
            {services.map(s=> <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Description</label>
        <textarea 
          required 
          value={form.description} 
          onChange={e=>setForm((f: any)=>({...f, description:e.target.value}))} 
          className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none"
          rows={4}
          placeholder="Décrivez le travail à effectuer..."
        />
      </div>

      {/* Priorité, Deadline, Heures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Priorité</label>
          <select 
            required 
            value={form.priorite} 
            onChange={e=>setForm((f: any)=>({...f, priorite:e.target.value}))} 
            className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none"
            disabled={prioritesLoading}>
            <option value="">Sélectionner...</option>
            {prioritesLoading ? (
              <option disabled>Chargement...</option>
            ) : priorites && priorites.length > 0 ? (
              priorites.map(p => <option key={p.id || p.cle} value={p.cle}>{p.label || p.cle}</option>)
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
        <div>
          <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Date limite</label>
          <input 
            required 
            type="datetime-local" 
            value={form.dateEcheance} 
            onChange={e=>setForm((f: any)=>({...f, dateEcheance:e.target.value}))} 
            className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Durée estimée (h)</label>
          <input 
            type="number" 
            value={form.heuresEstimees} 
            onChange={e=>setForm((f: any)=>({...f, heuresEstimees:e.target.value}))} 
            className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none"
            placeholder="ex: 8"
          />
        </div>
      </div>

      {/* Montant et Facturable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Montant facturable (FCFA)</label>
          <input 
            type="number" 
            value={form.montant} 
            onChange={e=>setForm((f: any)=>({...f, montant:e.target.value}))} 
            placeholder="ex: 50000" 
            className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Facturable ?</label>
          <select 
            value={String(form.facturable)} 
            onChange={e=>setForm((f: any)=>({...f, facturable: e.target.value === 'true'}))} 
            className="w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-anthracite)] bg-white focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent outline-none">
            <option value="true">✓ Oui</option>
            <option value="false">✕ Non</option>
          </select>
        </div>
      </div>

      {/* Fichiers */}
      <div>
        <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide block mb-2">Fichiers joints (optionnel)</label>
        <label className="border-2 border-dashed border-[var(--color-gold)] rounded-lg p-6 text-center cursor-pointer hover:bg-[var(--color-gold)]/5 transition-colors block">
          <Upload size={24} className="mx-auto mb-2 text-[var(--color-gold)]" />
          <input 
            type="file" 
            multiple 
            onChange={e => setFiles(Array.from(e.target.files || []))} 
            className="hidden"
          />
          <div className="text-[var(--color-anthracite)]">
            <p className="font-semibold">Cliquez pour sélectionner des fichiers</p>
            <p className="text-xs text-[var(--color-anthracite)]/60 mt-1">ou glissez-déposez (PDF, images, Word, etc.)</p>
          </div>
        </label>
        {files.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-[var(--color-anthracite)]/60 font-medium mb-2">{files.length} fichier(s) sélectionné(s):</p>
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="text-xs text-[var(--color-anthracite)] flex items-center gap-2">
                  <span>📄</span> {f.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button 
          type="reset" 
          className="px-6 py-2 border border-[var(--color-border)] text-[var(--color-anthracite)] rounded-lg font-semibold hover:bg-[var(--color-offwhite)] transition-colors"
        >
          Réinitialiser
        </button>
        <button 
          type="submit" 
          disabled={submitting || prioritesLoading} 
          className="px-6 py-2 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? '⏳ Envoi en cours...' : '✓ Soumettre la tâche'}
        </button>
      </div>
    </form>
  )
}
