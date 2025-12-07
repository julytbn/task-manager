"use client"
import { useEffect, useState } from 'react'
import { useEnums } from '@/lib/useEnums'

export default function SubmitTaskForm(){
  const [projects, setProjects] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const { data: priorites, loading: prioritesLoading } = useEnums('priorites')
  const { data: statutsTaches, loading: statutsLoading } = useEnums('statuts-taches')
  const [form, setForm] = useState<any>({ titre: '', projet: '', service: '', description: '', priorite: '', dateEcheance: '', heuresEstimees: '', montant: '', facturable: true })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const [pRes, sRes] = await Promise.all([fetch('/api/projets'), fetch('/api/services')])
        const pJson = await pRes.json()
        const sJson = await sRes.json()
        if(!mounted) return
        setProjects(pJson || [])
        setServices(sJson || [])
      }catch(e){ console.error(e) }
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
      // Default statut
      const defaultStatut = (statutsTaches && statutsTaches.length > 0) ? (statutsTaches.find((s:any)=>s.cle==='A_FAIRE')?.cle || statutsTaches[0].cle) : 'A_FAIRE'
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
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-lg font-semibold">Tâche soumise avec succès 🎉</h2>
          <div className="mt-3 text-sm text-gray-700">
            <div><strong>Titre:</strong> {result.titre}</div>
            <div><strong>Projet:</strong> {result.projet?.titre || result.projet?.title || '—'}</div>
            <div><strong>Deadline:</strong> {result.dateEcheance ? new Date(result.dateEcheance).toLocaleString() : '—'}</div>
            <div><strong>Priorité:</strong> {result.priorite}</div>
            <div><strong>Facturable:</strong> {result.facturable ? 'Oui' : 'Non'}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <a className="px-3 py-2 bg-indigo-600 text-white rounded" href="/dashboard/employe/mes-taches">Retour à mes tâches</a>
            <a className="px-3 py-2 border rounded" href="/dashboard/employe/calendrier">Voir dans le calendrier</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-3">Soumettre une tâche</h2>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow border space-y-3">
        <div>
          <label className="text-sm">Titre de la tâche</label>
          <input required value={form.titre} onChange={e=>setForm((f: any)=>({...f, titre:e.target.value}))} className="w-full border rounded px-2 py-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Projet lié</label>
            <select required value={form.projet} onChange={e=>setForm((f: any)=>({...f, projet:e.target.value}))} className="w-full border rounded px-2 py-1">
              <option value="">Choisir projet</option>
              {projects.map(p=> <option key={p.id} value={p.id}>{p.title || p.titre || p.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Service</label>
            <select required value={form.service} onChange={e=>setForm((f: any)=>({...f, service:e.target.value}))} className="w-full border rounded px-2 py-1">
              <option value="">Choisir service</option>
              {services.map(s=> <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm">Description</label>
          <textarea required value={form.description} onChange={e=>setForm((f: any)=>({...f, description:e.target.value}))} className="w-full border rounded p-2" rows={4} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Priorité</label>
            <select required value={form.priorite} onChange={e=>setForm((f: any)=>({...f, priorite:e.target.value}))} className="w-full border rounded px-2 py-1">
              <option value="">Sélectionner...</option>
              {priorites.map(p => <option key={p.id} value={p.cle}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Deadline</label>
            <input required type="datetime-local" value={form.dateEcheance} onChange={e=>setForm((f: any)=>({...f, dateEcheance:e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-sm">Durée estimée (heures)</label>
            <input type="number" value={form.heuresEstimees} onChange={e=>setForm((f: any)=>({...f, heuresEstimees:e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Montant facturable (FCFA)</label>
            <input type="number" value={form.montant} onChange={e=>setForm((f: any)=>({...f, montant:e.target.value}))} placeholder="ex: 50000" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-sm">Facturable ?</label>
            <select value={String(form.facturable)} onChange={e=>setForm((f: any)=>({...f, facturable: e.target.value === 'true'}))} className="w-full border rounded px-2 py-1">
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm">Fichiers joints (optionnel)</label>
          <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="w-full" />
          <div className="text-xs text-gray-500">Formats acceptés: photo, PDF, Word, autre — plusieurs fichiers possibles</div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting || prioritesLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">{submitting? 'Envoi...' : '🔵 Soumettre la tâche'}</button>
        </div>
      </form>
    </div>
  )
}
