"use client"
import { useEffect, useState } from 'react'

export default function EmployeeSettings(){
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({ nom: '', prenom: '', telephone: '', departement: '' })
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    try { return (localStorage.getItem('theme') as 'light'|'dark') || 'light' } catch { return 'light' }
  })
  const [lang, setLang] = useState<string>(() => {
    try { return localStorage.getItem('lang') || (navigator.language?.startsWith('fr') ? 'fr' : 'en') } catch { return 'fr' }
  })

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const res = await fetch('/api/me')
        const json = await res.json()
        if(!mounted) return
        setUser(json)
        setForm({ nom: json.nom||'', prenom: json.prenom||'', telephone: json.telephone||'', departement: json.departement||'' })
      }catch(e){ console.error(e) }
      finally{ if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted = false }
  },[])

  // Apply theme and language on mount / when changed
  useEffect(()=>{
    try{
      if(theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', theme)
    }catch(e){ /* ignore server */ }
  },[theme])

  useEffect(()=>{
    try{
      document.documentElement.lang = lang
      localStorage.setItem('lang', lang)
    }catch(e){ /* ignore server */ }
  },[lang])

  const saveProfile = async () => {
    try{
      const res = await fetch('/api/me', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setUser(json)
      setEditing(false)
      alert('Profil mis à jour')
    }catch(e:any){ alert('Erreur: '+(e.message||e)) }
  }

  const changePassword = async () => {
    try{
      const res = await fetch('/api/me', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ oldPassword, newPassword }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      alert('Mot de passe mis à jour')
      setOldPassword(''); setNewPassword('')
    }catch(e:any){ alert('Erreur: '+(e.message||e)) }
  }

  const logout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) return <div className="p-6">Chargement...</div>
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Paramètres</h2>
          <p className="text-sm text-gray-500">Gère ton profil, sécurité et préférences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">{(user?.prenom||'').charAt(0)}{(user?.nom||'').charAt(0)}</div>
              <div>
                <div className="text-lg font-semibold text-slate-900">{user?.prenom} {user?.nom}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
              </div>
              <div className="ml-auto">
                <button onClick={()=>setEditing(e=>!e)} className="px-3 py-2 border rounded-md text-sm bg-white/40">{editing ? 'Annuler' : 'Modifier'}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Nom</label>
                <input disabled={!editing} value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Prénom</label>
                <input disabled={!editing} value={form.prenom} onChange={e=>setForm({...form, prenom:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Téléphone</label>
                <input disabled={!editing} value={form.telephone} onChange={e=>setForm({...form, telephone:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Poste</label>
                <input disabled value={user?.role} className="mt-1 w-full border rounded-md px-3 py-2 bg-gray-50" />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={saveProfile} disabled={!editing} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow">💾 Enregistrer</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold mb-3 text-slate-900">Sécurité</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Ancien mot de passe</label>
                <input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Nouveau mot de passe</label>
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 bg-white" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={changePassword} className="px-4 py-2 bg-emerald-600 text-white rounded-md shadow">Mettre à jour</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold mb-3 text-slate-900">Préférences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Thème</label>
                <select value={theme} onChange={e=>setTheme(e.target.value as 'light'|'dark')} className="mt-1 w-full border rounded-md px-3 py-2 bg-white">
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Langue</label>
                <select value={lang} onChange={e=>setLang(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2 bg-white">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-semibold mb-3 text-slate-900">Notifications</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">Nouvelle tâche assignée</div>
                  <div className="text-xs text-gray-500">Recevoir une alerte quand une tâche vous est assignée</div>
                </div>
                <input type="checkbox" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">Rappel échéance</div>
                  <div className="text-xs text-gray-500">Recevoir un rappel avant la date d'échéance</div>
                </div>
                <input type="checkbox" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">Paiement effectué</div>
                  <div className="text-xs text-gray-500">Notifications de paiements</div>
                </div>
                <input type="checkbox" />
              </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-semibold mb-3 text-slate-900">Documents & Identité</h4>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between"><span>Contrat</span><button className="text-indigo-600">Voir</button></div>
              <div className="flex items-center justify-between"><span>Reçus</span><button className="text-indigo-600">Voir</button></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-semibold mb-3 text-slate-900">Support</h4>
            <div className="text-sm space-y-2">
              <div>📞 RH: +225 00 00 00 00</div>
              <div>📧 support@entreprise.com</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <button onClick={()=>{ if(confirm('Se déconnecter ?')) logout() }} className="w-full px-3 py-2 bg-red-600 text-white rounded-md">🚪 Se déconnecter</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
