'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layouts/MainLayout'
import DataTable from '@/components/DataTable'
import NouvelleChargeModal from '@/components/NouvelleChargeModal'
import { Button } from '@/components/ui'
import { Plus, Search, Filter, Download } from 'lucide-react'


type Charge = {
  id: string
  description: string
  montant: number
  categorie?: string
  date?: string
  statut?: string
}

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [showModal, setShowModal] = useState(false)
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [chargeToDelete, setChargeToDelete] = useState<Charge | null>(null)

  useEffect(() => {
    const loadCharges = async () => {
      try {
        const res = await fetch('/api/charges')
        if (!res.ok) throw new Error('Failed to load charges')
        const data = await res.json()
        // L'API retourne { success, data, count } ou un array direct
        const chargesData = Array.isArray(data) ? data : (data.data || [])
        setCharges(chargesData)
      } catch (err) {
        console.error('Error loading charges:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCharges()
  }, [])

  const filtered = charges.filter(charge => {
    const matchSearch = charge.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = !categoryFilter || charge.categorie === categoryFilter
    
    let matchDate = true
    if (charge.date && (monthFilter || yearFilter)) {
      const chargeDate = new Date(charge.date)
      const chargeMonth = (chargeDate.getMonth() + 1).toString().padStart(2, '0')
      const chargeYear = chargeDate.getFullYear().toString()
      
      if (monthFilter && yearFilter) {
        matchDate = chargeMonth === monthFilter && chargeYear === yearFilter
      } else if (yearFilter) {
        matchDate = chargeYear === yearFilter
      } else if (monthFilter) {
        matchDate = chargeMonth === monthFilter
      }
    }
    
    return matchSearch && matchCategory && matchDate
  })

  const totalAmount = filtered.reduce((sum, charge) => sum + (charge.montant || 0), 0)

  const handleEdit = (row: any) => {
    setEditingCharge(row as Charge)
    setShowModal(true)
  }

  const handleDelete = (row: any) => {
    setChargeToDelete(row as Charge)
    setShowConfirmDelete(true)
  }

  const confirmDelete = async () => {
    if (!chargeToDelete) return
    try {
      const res = await fetch(`/api/charges/${chargeToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete charge')
      setCharges(charges.filter(c => c.id !== chargeToDelete.id))
      setShowConfirmDelete(false)
      setChargeToDelete(null)
    } catch (err) {
      console.error('Error deleting charge:', err)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingCharge(null)
  }

  const columns = [
    { key: 'description', label: 'Libellé' },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'montant', label: 'Montant', render: (v: any) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(v) },
    { key: 'date', label: 'Date', render: (v: any) => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
    { key: 'statut', label: 'Statut' },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-black-deep)]">Charges</h1>
            <p className="text-sm text-[var(--color-anthracite)] mt-1">Gérez les dépenses et charges</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Download size={16} />
              Exporter
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              Nouvelle charge
            </Button>
          </div>
        </div>

        <NouvelleChargeModal 
          isOpen={showModal} 
          onClose={handleModalClose}
          onSubmit={(newCharge) => {
            setCharges([...charges, newCharge])
            handleModalClose()
            // Recharger les charges depuis l'API
            const loadCharges = async () => {
              try {
                const res = await fetch('/api/charges')
                if (!res.ok) throw new Error('Failed to load charges')
                const data = await res.json()
                const chargesData = Array.isArray(data) ? data : (data.data || [])
                setCharges(chargesData)
              } catch (err) {
                console.error('Error loading charges:', err)
              }
            }
            loadCharges()
          }}
        />

        <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-[var(--color-gold)]">
          <Search size={18} className="text-[var(--color-anthracite)]" />
          <input
            type="text"
            placeholder="Rechercher une charge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none bg-transparent text-[var(--color-black-deep)]"
          />
        </div>

        <div className="flex gap-3 flex-wrap bg-white p-4 rounded-lg border border-[var(--color-gold)]">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--color-anthracite)]">Année:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 border border-[var(--color-gold)] rounded outline-none text-[var(--color-black-deep)]"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--color-anthracite)]">Mois:</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 border border-[var(--color-gold)] rounded outline-none text-[var(--color-black-deep)]"
            >
              <option value="">Tous les mois</option>
              <option value="01">Janvier</option>
              <option value="02">Février</option>
              <option value="03">Mars</option>
              <option value="04">Avril</option>
              <option value="05">Mai</option>
              <option value="06">Juin</option>
              <option value="07">Juillet</option>
              <option value="08">Août</option>
              <option value="09">Septembre</option>
              <option value="10">Octobre</option>
              <option value="11">Novembre</option>
              <option value="12">Décembre</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--color-anthracite)]">Catégorie:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-[var(--color-gold)] rounded outline-none text-[var(--color-black-deep)]"
            >
              <option value="">Toutes les catégories</option>
              <option value="Salaires">Salaires</option>
              <option value="Loyer">Loyer</option>
              <option value="Électricité">Électricité</option>
              <option value="Internet">Internet</option>
              <option value="Fournitures">Fournitures</option>
              <option value="Transport">Transport</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--color-anthracite)]">Chargement...</div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={filtered}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            
            <div className="bg-white p-4 rounded-lg border border-[var(--color-gold)] flex justify-between items-center">
              <div className="text-sm text-[var(--color-anthracite)]">
                {filtered.length} charge{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
              </div>
              <div className="font-bold text-[var(--color-black-deep)]">
                Total: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(totalAmount)}
              </div>
            </div>
          </>
        )}

        {/* Modal de confirmation de suppression */}
        {showConfirmDelete && chargeToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-[var(--color-black-deep)] mb-2">
                Supprimer cette charge?
              </h2>
              <p className="text-sm text-[var(--color-anthracite)] mb-6">
                Êtes-vous sûr de vouloir supprimer la charge "{chargeToDelete.description}"? Cette action ne peut pas être annulée.
              </p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Annuler
                </Button>
                <Button 
                  variant="danger"
                  onClick={confirmDelete}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
