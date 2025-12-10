"use client"
import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { Lock, Bell, FileText, HelpCircle, LogOut } from 'lucide-react'

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

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
      </div>
    </MainLayout>
  )
  
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-4xl font-bold gold-gradient-text">Paramètres</h1>
          <p className="text-[var(--color-anthracite)]/70 mt-2">Gère ton profil, sécurité et préférences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 space-y-6">
            {/* Profile Card */}
            <div className="card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-shadow)] flex items-center justify-center text-[var(--color-black-deep)] text-xl font-bold">{(user?.prenom||'').charAt(0)}{(user?.nom||'').charAt(0)}</div>
                <div>
                  <div className="text-lg font-semibold text-[var(--color-black-deep)]">{user?.prenom} {user?.nom}</div>
                  <div className="text-sm text-[var(--color-anthracite)]/60">{user?.email}</div>
                </div>
                <div className="ml-auto">
                  <button onClick={()=>setEditing(e=>!e)} className="px-4 py-2 border border-[var(--color-gold)] rounded-lg text-[var(--color-gold)] hover:bg-[var(--color-gold)]/5 transition-colors">{editing ? 'Annuler' : '✏️ Modifier'}</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Nom</label>
                  <input disabled={!editing} value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} className={`mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] ${!editing ? 'bg-[var(--color-offwhite)]' : 'bg-white'}`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Prénom</label>
                  <input disabled={!editing} value={form.prenom} onChange={e=>setForm({...form, prenom:e.target.value})} className={`mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] ${!editing ? 'bg-[var(--color-offwhite)]' : 'bg-white'}`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Téléphone</label>
                  <input disabled={!editing} value={form.telephone} onChange={e=>setForm({...form, telephone:e.target.value})} className={`mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] ${!editing ? 'bg-[var(--color-offwhite)]' : 'bg-white'}`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Rôle</label>
                  <input disabled value={user?.role} className="mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] bg-[var(--color-offwhite)]" />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={saveProfile} disabled={!editing} className={`px-6 py-2 rounded-lg font-semibold transition-all ${editing ? 'bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] text-[var(--color-black-deep)] hover:shadow-lg' : 'bg-[var(--color-offwhite)] text-[var(--color-anthracite)] cursor-not-allowed'}`}>💾 Enregistrer</button>
              </div>
            </div>

            {/* Security Card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Lock size={20} className="text-[var(--color-gold)]" />
                <h3 className="text-lg font-bold text-[var(--color-black-deep)]">Sécurité</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Ancien mot de passe</label>
                  <input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Nouveau mot de passe</label>
                  <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)]" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={changePassword} className="px-6 py-2 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-accent)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:shadow-lg transition-all">Mettre à jour</button>
              </div>
            </div>

            {/* Preferences Card */}
            <div className="card">
              <h3 className="text-lg font-bold text-[var(--color-black-deep)] mb-6">Préférences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Thème</label>
                  <select value={theme} onChange={e=>setTheme(e.target.value as 'light'|'dark')} className="mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] bg-white">
                    <option value="light">Clair</option>
                    <option value="dark">Sombre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-anthracite)] uppercase tracking-wide">Langue</label>
                  <select value={lang} onChange={e=>setLang(e.target.value)} className="mt-2 w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-anthracite)] bg-white">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-6">
            {/* Notifications Card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Bell size={20} className="text-[var(--color-gold)]" />
                <h4 className="text-lg font-bold text-[var(--color-black-deep)]">Notifications</h4>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <div className="font-medium text-[var(--color-black-deep)]">Nouvelle tâche assignée</div>
                    <div className="text-xs text-[var(--color-anthracite)]/60">Recevoir une alerte quand une tâche vous est assignée</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-[var(--color-gold)]" />
                </label>
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <div className="font-medium text-[var(--color-black-deep)]">Rappel échéance</div>
                    <div className="text-xs text-[var(--color-anthracite)]/60">Recevoir un rappel avant la date d'échéance</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-[var(--color-gold)]" />
                </label>
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <div className="font-medium text-[var(--color-black-deep)]">Paiement effectué</div>
                    <div className="text-xs text-[var(--color-anthracite)]/60">Notifications de paiements</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-[var(--color-gold)]" />
                </label>
              </div>
            </div>

            {/* Documents Card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <FileText size={20} className="text-[var(--color-gold)]" />
                <h4 className="text-lg font-bold text-[var(--color-black-deep)]">Documents</h4>
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-lg">
                  <span className="text-[var(--color-black-deep)] font-medium">Contrat</span>
                  <button className="text-[var(--color-gold)] font-semibold hover:text-[var(--color-gold-accent)]">Voir</button>
                </div>
                <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-lg">
                  <span className="text-[var(--color-black-deep)] font-medium">Reçus</span>
                  <button className="text-[var(--color-gold)] font-semibold hover:text-[var(--color-gold-accent)]">Voir</button>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle size={20} className="text-[var(--color-gold)]" />
                <h4 className="text-lg font-bold text-[var(--color-black-deep)]">Support</h4>
              </div>
              <div className="text-sm space-y-2 text-[var(--color-anthracite)]">
                <div>📞 RH: +225 00 00 00 00</div>
                <div>📧 support@entreprise.com</div>
              </div>
            </div>

            {/* Logout Card */}
            <div className="card bg-red-50 border-red-200">
              <button onClick={()=>{ if(confirm('Se déconnecter ?')) logout() }} className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                <LogOut size={18} />
                Se déconnecter
              </button>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}
