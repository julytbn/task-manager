"use client"
import { useState } from 'react'

type Tache = {
  id: string
  titre: string
  statut?: string
  priorite?: string
}

export default function KanbanBoard({ tasks, onTaskClick, onUpdate }:{ tasks:Tache[]; onTaskClick:(t:Tache)=>void; onUpdate:(id:string, patch:Partial<Tache>)=>void }){
  const columns = ['À faire','En cours','En révision','Terminées']
  const [local, setLocal] = useState<Tache[]>(tasks)

  // Keep local in sync when tasks prop changes
  if (tasks !== local) {
    // this shallow check is ok for simple sync
    setLocal(tasks)
  }

  const onDragStart = (e: React.DragEvent, id:string) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const onDrop = (e: React.DragEvent, column:string) => {
    const id = e.dataTransfer.getData('text/plain')
    setLocal(prev => prev.map(t => t.id === id ? { ...t, statut: column } : t))
    onUpdate(id, { statut: column })
  }

  const allow = (e: React.DragEvent) => { e.preventDefault() }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map(col => (
        <div key={col} className="bg-white rounded p-3 border shadow-sm">
          <div className="font-semibold mb-2">{col}</div>
          <div onDragOver={allow} onDrop={(e)=>onDrop(e,col)} className="space-y-2 min-h-[120px]">
            {local.filter(t => ((t.statut||'') === col || (col === 'À faire' && !(t.statut||''))) ).map(t => (
              <div key={t.id} draggable onDragStart={(e)=>onDragStart(e,t.id)} className="p-2 border rounded hover:bg-gray-50 cursor-grab" onClick={()=>onTaskClick(t)}>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">{t.titre}</div>
                  <div className="text-xs text-gray-500">{t.priorite}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
