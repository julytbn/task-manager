"use client"
import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/layouts/MainLayout'
import TaskDetailsModal from '@/components/dashboard/TaskDetailsModal'

type Tache = {
  id: string
  titre: string
  dateEcheance?: string | null
  priorite?: string
  statut?: string
  projet?: { titre?: string }
  estPayee?: boolean
}

export default function EmployeeCalendar(){
  const [tasks, setTasks] = useState<Tache[]>([])
  const [view, setView] = useState<'month'|'week'|'day'>('month')
  const [date, setDate] = useState(new Date())
  const [filters, setFilters] = useState({ projet: '', priorite: '', statut: '', paiement: '' })
  const [selected, setSelected] = useState<Tache | null>(null)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const res = await fetch('/api/taches')
        const data = await res.json()
        if(!mounted) return
        setTasks(data || [])
      }catch(e){ console.error(e) }
    })()
    return ()=>{ mounted = false }
  },[])

  const filtered = useMemo(()=>{
    return tasks.filter(t => {
      if (filters.projet && !(t.projet?.titre||'').toLowerCase().includes(filters.projet.toLowerCase())) return false
      if (filters.priorite && !(t.priorite||'').toLowerCase().includes(filters.priorite.toLowerCase())) return false
      if (filters.statut && !(t.statut||'').toLowerCase().includes(filters.statut.toLowerCase())) return false
      if (filters.paiement) {
        if (filters.paiement === 'payee' && !t.estPayee) return false
        if (filters.paiement === 'non' && t.estPayee) return false
      }
      return true
    })
  },[tasks, filters])

  const eventsByDay = useMemo(()=>{
    const map = new Map<string, Tache[]>()
    filtered.forEach(t => {
      if (!t.dateEcheance) return
      const day = new Date(t.dateEcheance).toISOString().slice(0,10)
      const arr = map.get(day) || []
      arr.push(t)
      map.set(day, arr)
    })
    return map
  },[filtered])

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const endOfMonth = new Date(date.getFullYear(), date.getMonth()+1, 0)

  const daysInMonth = useMemo(()=>{
    const days: Date[] = []
    for (let d = 1; d <= endOfMonth.getDate(); d++) days.push(new Date(date.getFullYear(), date.getMonth(), d))
    return days
  },[date])

  const colorForStatus = (s?:string) => {
    const st = (s||'').toLowerCase()
    if (st.includes('termine') || st.includes('done')) return 'bg-green-100 text-green-700'
    if (st.includes('en cours') || st.includes('encours')) return 'bg-blue-100 text-blue-700'
    if (st.includes('révision') || st.includes('revision')) return 'bg-orange-100 text-orange-700'
    if (st.includes('urgent') || st.includes('urgence') ) return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Calendrier</h2>
          <p className="text-sm text-gray-500">Vue {view} — {date.toLocaleString()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <select value={view} onChange={e=>setView(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="month">Mois</option>
            <option value="week">Semaine</option>
            <option value="day">Jour</option>
          </select>
          <button onClick={()=>setDate(new Date(date.getFullYear(), date.getMonth()-1, 1))} className="px-2 py-1 border rounded">‹</button>
          <button onClick={()=>setDate(new Date())} className="px-2 py-1 border rounded">Aujourd'hui</button>
          <button onClick={()=>setDate(new Date(date.getFullYear(), date.getMonth()+1, 1))} className="px-2 py-1 border rounded">›</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded mb-4 border">
        <div className="flex gap-3">
          <input placeholder="Projet" className="border rounded px-2 py-1" onChange={e=>setFilters(f=>({...f, projet: e.target.value}))} />
          <select onChange={e=>setFilters(f=>({...f, priorite: e.target.value}))} className="border rounded px-2 py-1">
            <option value="">Priorité</option>
            <option>Haute</option>
            <option>Moyenne</option>
            <option>Basse</option>
            <option>Urgente</option>
          </select>
          <select onChange={e=>setFilters(f=>({...f, statut: e.target.value}))} className="border rounded px-2 py-1">
            <option value="">Statut</option>
            <option>À faire</option>
            <option>En cours</option>
            <option>En révision</option>
            <option>Terminée</option>
          </select>
          <select onChange={e=>setFilters(f=>({...f, paiement: e.target.value}))} className="border rounded px-2 py-1">
            <option value="">Paiement</option>
            <option value="payee">Payée</option>
            <option value="non">Non payée</option>
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" onChange={e=>{ const v = e.target.checked; setFilters(f=>({...f, statut: v ? 'urgent' : ''})) }} />Afficher uniquement urgentes</label>
        </div>
      </div>

      {/* Calendar month grid simple */}
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-2">
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=> <div key={d} className="text-xs text-gray-500 text-center">{d}</div>)}
          {daysInMonth.map(day => {
            const key = day.toISOString().slice(0,10)
            const events = eventsByDay.get(key) || []
            return (
              <div key={key} className="min-h-[80px] border rounded p-2 bg-white">
                <div className="text-xs font-medium">{day.getDate()}</div>
                <div className="mt-1 space-y-1">
                  {events.map(e => (
                    <div key={e.id} onClick={()=>setSelected(e)} className={`text-xs px-2 py-1 rounded cursor-pointer ${colorForStatus(e.statut)}`}>{e.titre} {e.priorite==='Urgente' && '🚨'}</div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Week / Day simple list */}
      {view !== 'month' && (
        <div className="bg-white rounded p-4 border">
          <h3 className="font-semibold mb-3">Liste des tâches — {view}</h3>
          <ul className="space-y-2">
            {filtered.map(t => (
              <li key={t.id} className="p-2 border rounded flex justify-between items-start">
                <div>
                  <div className="font-medium">{t.titre}</div>
                  <div className="text-sm text-gray-500">Projet: {t.projet?.titre || '—'} • Deadline: {t.dateEcheance ? new Date(t.dateEcheance).toLocaleString() : '—'}</div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded ${colorForStatus(t.statut)}`}>{t.statut}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && <TaskDetailsModal task={selected as any} onClose={()=>setSelected(null)} onUpdate={(id,patch)=>{ setTasks(prev=>prev.map(p=>p.id===id?{...p,...(patch as any)}:p)); setSelected(null) }} />}
      </div>
    </MainLayout>
  )
}
