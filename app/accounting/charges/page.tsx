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
    return matchSearch && matchCategory
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
          <Button variant="ghost" size="sm">
            <Filter size={16} />
          </Button>
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
