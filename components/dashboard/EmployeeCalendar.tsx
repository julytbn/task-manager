"use client"
import { useEffect, useMemo, useState } from 'react'
// MainLayout is provided by the route layout; do not wrap pages here
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
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendrier</h2>
          <p className="text-sm text-gray-500 mt-1">
            {view === 'month' && 'Vue mensuelle • '}
            {view === 'week' && 'Vue hebdomadaire • '}
            {view === 'day' && 'Vue journalière • '}
            {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <select 
            value={view} 
            onChange={e=>setView(e.target.value as any)} 
            className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          >
            <option value="month">Mois</option>
            <option value="week">Semaine</option>
            <option value="day">Jour</option>
          </select>
          <div className="flex items-center border rounded-md overflow-hidden">
            <button 
              onClick={()=>setDate(new Date(date.getFullYear(), date.getMonth()-1, 1))} 
              className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              ‹
            </button>
            <button 
              onClick={()=>setDate(new Date())} 
              className="px-3 py-1.5 border-x text-sm hover:bg-gray-50 transition-colors"
            >
              Aujourd'hui
            </button>
            <button 
              onClick={()=>setDate(new Date(date.getFullYear(), date.getMonth()+1, 1))} 
              className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Projet</label>
            <input 
              placeholder="Filtrer par projet" 
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]" 
              onChange={e=>setFilters(f=>({...f, projet: e.target.value}))} 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Priorité</label>
            <select 
              onChange={e=>setFilters(f=>({...f, priorite: e.target.value}))} 
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            >
              <option value="">Toutes les priorités</option>
              <option>Haute</option>
              <option>Moyenne</option>
              <option>Basse</option>
              <option>Urgente</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Statut</label>
            <select 
              onChange={e=>setFilters(f=>({...f, statut: e.target.value}))} 
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            >
              <option value="">Tous les statuts</option>
              <option>À faire</option>
              <option>En cours</option>
              <option>En révision</option>
              <option>Terminée</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Paiement</label>
            <select 
              onChange={e=>setFilters(f=>({...f, paiement: e.target.value}))} 
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            >
              <option value="">Tous les paiements</option>
              <option value="payee">Payée</option>
              <option value="non">Non payée</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 p-1">
            <input 
              type="checkbox" 
              id="urgentOnly"
              onChange={e=>{ 
                const v = e.target.checked; 
                setFilters(f=>({...f, statut: v ? 'urgent' : ''})) 
              }} 
              className="h-4 w-4 text-[var(--color-gold)] focus:ring-[var(--color-gold)] border-gray-300 rounded"
            />
            <label htmlFor="urgentOnly" className="text-sm text-gray-700">Urgentes uniquement</label>
          </div>
        </div>
      </div>

      {/* Calendar month grid */}
      {view === 'month' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="py-3 text-center text-sm font-medium text-gray-500">
                {d}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-fr">
            {daysInMonth.map((day, index) => {
              const key = day.toISOString().slice(0, 10)
              const events = eventsByDay.get(key) || []
              const isToday = new Date().toDateString() === day.toDateString()
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              
              return (
                <div 
                  key={key} 
                  className={`min-h-[120px] border-r border-b p-2 ${
                    isWeekend ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className={`flex justify-between items-center mb-1`}>
                    <span className={`text-sm font-medium ${
                      isToday 
                        ? 'bg-[var(--color-gold)] text-white rounded-full w-6 h-6 flex items-center justify-center' 
                        : 'text-gray-700'
                    }`}>
                      {day.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-xs text-[var(--color-gold)] font-medium">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 max-h-[calc(100%-28px)] overflow-y-auto">
                    {events.map(e => (
                      <div 
                        key={e.id} 
                        onClick={() => setSelected(e)} 
                        className={`text-xs px-2 py-1 rounded cursor-pointer truncate ${colorForStatus(e.statut)}`}
                        title={e.titre}
                      >
                        {e.titre} {e.priorite === 'Urgente' && '🚨'}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week / Day list view */}
      {view !== 'month' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              {view === 'week' ? 'Tâches de la semaine' : 'Tâches du jour'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {date.toLocaleDateString('fr-FR', { 
                  ...(view === 'week' 
                    ? { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      } 
                    : { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric' 
                      })
                })}
              </span>
            </h3>
          </div>
          
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Aucune tâche à afficher pour cette période.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filtered.map(t => {
                const dueDate = t.dateEcheance ? new Date(t.dateEcheance) : null
                const isOverdue = dueDate && dueDate < new Date() && t.statut !== 'Terminée' && t.statut !== 'Terminé'
                
                return (
                  <li 
                    key={t.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(t)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h4 className="text-base font-medium text-gray-900 truncate">
                            {t.titre}
                          </h4>
                          {t.priorite === 'Urgente' && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 gap-2">
                          {t.projet?.titre && (
                            <span className="inline-flex items-center">
                              <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              {t.projet.titre}
                            </span>
                          )}
                          
                          {t.dateEcheance && (
                            <span className={`inline-flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {dueDate?.toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {isOverdue && ' • En retard'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.statut === 'Terminée' || t.statut === 'Terminé' 
                            ? 'bg-green-100 text-green-800' 
                            : t.statut === 'En cours' || t.statut === 'En cours de traitement'
                            ? 'bg-blue-100 text-blue-800'
                            : t.statut === 'En révision' || t.statut === 'En attente de validation'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {t.statut}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {selected && <TaskDetailsModal task={selected as any} onClose={()=>setSelected(null)} onUpdate={(id,patch)=>{ setTasks(prev=>prev.map(p=>p.id===id?{...p,...(patch as any)}:p)); setSelected(null) }} />}
      </div>
  )
}
