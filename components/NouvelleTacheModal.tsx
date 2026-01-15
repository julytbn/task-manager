'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'

interface Projet {
  id: string
  titre: string
}

interface Service {
  id: string
  nom: string
}

interface Employe {
  id: string
  nom: string
  prenom: string
}

interface NouvelleTacheModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initial?: any
  readOnly?: boolean
}
export function NouvelleTacheModal({ isOpen, onClose, onSave, initial }: NouvelleTacheModalProps) {
  const { data: session } = useSession()
  const [projets, setProjets] = useState<Projet[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    projetId: '',
    assigneAId: '',
    statut: 'A_FAIRE',
    priorite: 'MOYENNE',
    dateEcheance: ''
  })

  // When editing, prefill form with `initial` data
  useEffect(() => {
    if (isOpen && initial) {
      console.log('🔧 Charging task data in modal:', initial);
      console.log('📋 Assignee ID:', initial.assigneAId || initial.assigneA?.id);
      setFormData({
        titre: initial.titre || '',
        description: initial.description || '',
        projetId: initial.projetId || initial.projet?.id || '',
        assigneAId: initial.assigneAId || initial.assigneA?.id || '',
        statut: initial.statut || 'A_FAIRE',
        priorite: initial.priorite || 'MOYENNE',
        dateEcheance: initial.dateEcheance ? new Date(initial.dateEcheance).toISOString().slice(0,10) : ''
      })
    } else if (!isOpen) {
      // reset when closing
      setFormData({
        titre: '',
        description: '',
        projetId: '',
        assigneAId: '',
        statut: 'A_FAIRE',
        priorite: 'MOYENNE',
        dateEcheance: ''
      })
    }
  }, [isOpen, initial])

  // Update form when employees are loaded (to ensure assigneAId is set correctly)
  useEffect(() => {
    if (isOpen && initial && employes.length > 0 && formData.assigneAId) {
      console.log('✅ Employees loaded:', employes);
      const assignedEmployee = employes.find(emp => emp.id === formData.assigneAId);
      console.log('🎯 Assigned employee found:', assignedEmployee);
    }
  }, [employes, isOpen, initial, formData.assigneAId])

  // Charger les projets et employés
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        console.log('📋 [NouvelleTacheModal] Chargement des projets et utilisateurs...')
        
        const [projetsResponse, employesResponse] = await Promise.all([
          fetch('/api/projets'),
          fetch('/api/utilisateurs')
        ])
        
        // Vérifier le statut HTTP des réponses
        if (!projetsResponse.ok) {
          console.error('❌ Erreur API projets:', projetsResponse.status, projetsResponse.statusText)
          throw new Error(`Erreur API projets: ${projetsResponse.statusText}`)
        }
        
        if (!employesResponse.ok) {
          console.error('❌ Erreur API utilisateurs:', employesResponse.status, employesResponse.statusText)
          throw new Error(`Erreur API utilisateurs: ${employesResponse.statusText}`)
        }
        
        const projetsRes = await projetsResponse.json()
        const employesRes = await employesResponse.json()
        
        console.log('✅ Projets reçus:', projetsRes)
        console.log('✅ Utilisateurs reçus:', employesRes)
        
        // Normaliser les projets reçus (certaines API renvoient `title` au lieu de `titre`)
        const projetsFormatted = (Array.isArray(projetsRes) ? projetsRes : projetsRes.data || []).map((p: any) => ({ 
          id: p.id, 
          titre: p.titre || p.title || p.nom || '' 
        }))
        
        const employesFiltered = (Array.isArray(employesRes) ? employesRes : employesRes.data || []).filter((u: any) => u.role === 'EMPLOYE')
        
        console.log('📊 Projets formatés:', projetsFormatted)
        console.log('👥 Employés filtrés:', employesFiltered)
        
        setProjets(projetsFormatted)
        setEmployes(employesFiltered)
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error)
        setProjets([])
        setEmployes([])
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // If readOnly, do nothing
    if ((initial as any)?.readOnly) return

    // Convertir les chaînes vides en null pour les champs optionnels
    const payload: any = {
      titre: formData.titre,
      description: formData.description || null,
      projetId: formData.projetId,
      statut: formData.statut,
      priorite: formData.priorite,
      dateEcheance: formData.dateEcheance || null
    }

    // Only include assigneAId if it was explicitly provided (avoid permission issues for regular employees)
    if (formData.assigneAId) {
      payload.assigneAId = formData.assigneAId
    }

    onSave(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[var(--color-offwhite)] rounded-lg shadow-lg overflow-y-auto border border-[var(--color-gold)]/20" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-t-lg bg-gradient-to-r from-[var(--color-black-deep)] to-[var(--color-black-900)]/90">
          <h3 className="text-lg font-semibold text-[var(--color-gold)]">Nouvelle Tâche</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-black-900)]/20 text-[var(--color-offwhite)]">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
          <div className="text-sm text-[var(--color-anthracite)] mb-4">Les champs avec * sont obligatoires</div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Titre *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Projet *</label>
              <select
                name="projetId"
                value={formData.projetId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="">Sélectionner un projet</option>
                {projets.map(projet => (
                  <option key={projet.id} value={projet.id}>
                    {projet.titre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Assigné à</label>
              <select
                name="assigneAId"
                value={formData.assigneAId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              >
                <option value="">Non assigné</option>
                {employes.map(employe => (
                  <option key={employe.id} value={employe.id}>
                    {employe.prenom} {employe.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Only managers/admins can set status. Employees always submit as SOUMISE */}
            {session?.user?.role !== 'EMPLOYE' ? (
              <div>
                <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Statut *</label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                  required
                >
                  <option value="A_FAIRE">À faire</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_REVISION">En révision</option>
                  <option value="TERMINE">Terminé</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Statut</label>
                <div className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-[var(--color-offwhite)] text-[var(--color-anthracite)]">
                  📋 Soumise (en attente de validation)
                </div>
                <p className="text-xs text-[var(--color-anthracite)]/60 mt-1">Les tâches soumises seront validées par un manager</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Priorité *</label>
              <select
                name="priorite"
                value={formData.priorite}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
                required
              >
                <option value="BASSE">Basse</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-anthracite)] mb-1">Date d'échéance</label>
              <input
                type="date"
                name="dateEcheance"
                value={formData.dateEcheance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-anthracite)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}