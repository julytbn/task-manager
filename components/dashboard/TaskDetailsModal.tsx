"use client"
import { useState } from 'react'

type Tache = {
  id: string
  titre: string
  description?: string
  projet?: { nom?: string }
  priorite?: string
  dateEcheance?: string | null
  statut?: string
  estPayee?: boolean
  paiementPartiel?: boolean
  tempsPasse?: string
}

export default function TaskDetailsModal({ task, onClose, onUpdate }:{ task:Tache; onClose:()=>void; onUpdate:(id:string, patch:Partial<Tache>)=>void }){
  const [status, setStatus] = useState(task.statut || '')
  const [time, setTime] = useState(task.tempsPasse || '')
  const [note, setNote] = useState('')

  const save = async () => {
    // optimistic local update
    onUpdate(task.id, { statut: status, tempsPasse: time })
    onClose()
    // TODO: call API to persist changes
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20">
      <div className="bg-white w-full max-w-2xl rounded shadow-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{task.titre}</h3>
            <div className="text-sm text-gray-500">{task.projet?.nom || '—'}</div>
          </div>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-600">Description</div>
            <div className="text-sm text-gray-700">{task.description || 'Aucune description fournie.'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-600">Priorité</div>
              <div className="text-sm">{task.priorite || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Deadline</div>
              <div className="text-sm">{task.dateEcheance ? new Date(task.dateEcheance).toLocaleString() : '—'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600">Statut</div>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option>À faire</option>
              <option>En cours</option>
              <option>En révision</option>
              <option>Terminée</option>
              <option>Annulée</option>
            </select>
          </div>

          <div>
            <div className="text-sm text-gray-600">Temps passé</div>
            <input value={time} onChange={e=>setTime(e.target.value)} placeholder="ex: 3h 20m" className="w-full border rounded px-2 py-1" />
          </div>

          <div>
            <div className="text-sm text-gray-600">Notes internes</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} className="w-full border rounded p-2" rows={3} />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">Fermer</button>
          <button onClick={save} className="px-3 py-2 bg-indigo-600 text-white rounded">🔄 Mettre à jour</button>
        </div>
      </div>
    </div>
  )
}
