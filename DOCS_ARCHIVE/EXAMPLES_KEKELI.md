# 🚀 Exemples d'Utilisation Avancés - Kekeli Group Dashboard

## 1. Dashboard avec Statistiques Dynamiques

```tsx
'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { StatCard, DataTable } from '@/components'
import { BarChart3, Users, TrendingUp } from 'lucide-react'

export default function AdvancedDashboard() {
  const [stats, setStats] = useState({
    revenue: 2500000,
    clients: 45,
    projects: 18,
  })

  const [recentTransactions, setRecentTransactions] = useState([
    { date: '2025-12-04', client: 'ABC Corp', amount: 500000, status: 'PAYÉ' },
    { date: '2025-12-03', client: 'XYZ Ltd', amount: 350000, status: 'EN ATTENTE' },
  ])

  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-4xl font-bold gold-gradient-text">Dashboard Avancé</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={TrendingUp}
            title="Revenus"
            value={`${(stats.revenue / 1000000).toFixed(1)}M FCFA`}
            trend={{ value: 18, direction: 'up' }}
          />
          <StatCard
            icon={Users}
            title="Clients"
            value={stats.clients}
            trend={{ value: 5, direction: 'up' }}
          />
          <StatCard
            icon={BarChart3}
            title="Projets"
            value={stats.projects}
            trend={{ value: 2, direction: 'up' }}
          />
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="text-xl font-bold text-[var(--color-black-deep)] mb-6">
            Transactions récentes
          </h2>
          <DataTable
            columns={[
              { key: 'date', label: 'Date', sortable: true },
              { key: 'client', label: 'Client' },
              { key: 'amount', label: 'Montant', sortable: true },
              { key: 'status', label: 'Statut' },
            ]}
            data={recentTransactions}
            itemsPerPage={5}
            hasActions={true}
          />
        </div>
      </div>
    </MainLayout>
  )
}
```

---

## 2. Formulaire Complet avec Validation

```tsx
'use client'

import React, { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { FormField, Button, Select } from '@/components/FormField'
import { useToast } from '@/components/Toast'
import { User, Mail, Phone, Building } from 'lucide-react'

export default function ClientForm() {
  const { addToast, ToastContainer } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    type: 'PARTICULIER',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nom) newErrors.nom = 'Le nom est requis'
    if (!formData.email) newErrors.email = 'L\'email est requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email invalide'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      addToast('Veuillez corriger les erreurs', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        addToast('Client créé avec succès!', 'success')
        setFormData({ nom: '', email: '', telephone: '', entreprise: '', type: 'PARTICULIER' })
      } else {
        addToast('Erreur lors de la création', 'error')
      }
    } catch (err) {
      addToast('Erreur réseau', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold gold-gradient-text">Ajouter un client</h1>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <FormField
            label="Nom complet"
            placeholder="Entrez le nom..."
            icon={User}
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            error={errors.nom}
            required
          />

          <FormField
            label="Email"
            type="email"
            placeholder="exemple@email.com"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <FormField
            label="Téléphone"
            type="tel"
            placeholder="+212 6 12 34 56 78"
            icon={Phone}
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
          />

          <FormField
            label="Entreprise"
            placeholder="Nom de l'entreprise"
            icon={Building}
            value={formData.entreprise}
            onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
          />

          <Select
            label="Type de client"
            options={[
              { label: 'Particulier', value: 'PARTICULIER' },
              { label: 'Entreprise', value: 'ENTREPRISE' },
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
            >
              Créer le client
            </Button>
            <Button type="reset" variant="secondary" size="lg">
              Annuler
            </Button>
          </div>
        </form>
      </div>

      {ToastContainer}
    </MainLayout>
  )
}
```

---

## 3. Tableau Avancé avec Filtres et Export

```tsx
'use client'

import React, { useState, useMemo } from 'react'
import MainLayout from '@/components/MainLayout'
import DataTable from '@/components/DataTable'
import { FormField, Select } from '@/components/FormField'
import { Download, Filter } from 'lucide-react'

export default function AdvancedTable() {
  const [data, setData] = useState([
    { id: 1, titre: 'Projet 1', client: 'Client A', budget: 100000, progress: 75 },
    { id: 2, titre: 'Projet 2', client: 'Client B', budget: 150000, progress: 50 },
  ])

  const [filters, setFilters] = useState({
    search: '',
    minBudget: '',
    maxBudget: '',
  })

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.titre.toLowerCase().includes(filters.search.toLowerCase())
      const minOk = !filters.minBudget || item.budget >= parseInt(filters.minBudget)
      const maxOk = !filters.maxBudget || item.budget <= parseInt(filters.maxBudget)
      return matchesSearch && minOk && maxOk
    })
  }, [data, filters])

  const handleExport = () => {
    const csv = [
      ['ID', 'Titre', 'Client', 'Budget', 'Progression'].join(','),
      ...filteredData.map(item =>
        [item.id, item.titre, item.client, item.budget, `${item.progress}%`].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'export.csv'
    a.click()
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold gold-gradient-text">Projets</h1>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg hover:bg-[var(--color-gold-accent)] transition-all font-semibold"
          >
            <Download size={18} />
            Exporter
          </button>
        </div>

        {/* Filters */}
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Rechercher"
            placeholder="Titre ou client..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <FormField
            label="Budget min"
            type="number"
            placeholder="0"
            value={filters.minBudget}
            onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
          />
          <FormField
            label="Budget max"
            type="number"
            placeholder="1000000"
            value={filters.maxBudget}
            onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
          />
        </div>

        {/* Table */}
        <div className="card">
          <DataTable
            columns={[
              { key: 'titre', label: 'Titre', sortable: true },
              { key: 'client', label: 'Client' },
              { key: 'budget', label: 'Budget', sortable: true },
              { key: 'progress', label: 'Progression' },
            ]}
            data={filteredData}
            itemsPerPage={10}
          />
        </div>
      </div>
    </MainLayout>
  )
}
```

---

## 4. Modal Personnalisée

```tsx
'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { FormField, Button } from '@/components/FormField'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  onSubmit: (data: any) => void
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, onSubmit, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold gold-gradient-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-gold)]/10 rounded-lg transition-all"
          >
            <X size={24} className="text-[var(--color-anthracite)]" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Footer */}
        <div className="flex gap-4 pt-6 border-t border-[var(--color-border)]">
          <Button type="submit" variant="primary" onClick={() => onSubmit({})}>
            Enregistrer
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}

// Usage
export function ExampleModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg"
      >
        Ouvrir Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Créer un nouveau projet"
        onSubmit={(data) => {
          console.log('Submitted:', data)
          setIsOpen(false)
        }}
      >
        <FormField label="Nom du projet" placeholder="Entrez le nom..." />
        <FormField label="Budget" type="number" placeholder="100000" />
      </Modal>
    </>
  )
}
```

---

## 5. Hook Personnalisé pour les Données

```tsx
// hooks/useFetch.ts
'use client'

import { useState, useEffect } from 'react'

type UseFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, any>
  deps?: any[]
}

export function useFetch<T>(url: string, options?: UseFetchOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url, {
          method: options?.method || 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const result = await response.json()
        if (mounted) setData(result)
      } catch (err) {
        if (mounted) setError(err as Error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, options?.deps || [url])

  return { data, loading, error }
}

// Usage
export function MyComponent() {
  const { data: clients, loading } = useFetch('/api/clients')

  return loading ? <p>Chargement...</p> : <div>{/* render data */}</div>
}
```

---

## 6. Responsive Card Grid

```tsx
// grid-responsive.tsx
export function ResponsiveCardGrid({ items }: { items: any[] }) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map(item => (
        <div
          key={item.id}
          className="card group hover:shadow-lg transition-all duration-300"
        >
          {/* Card content */}
          <h3 className="text-lg font-bold text-[var(--color-black-deep)] mb-2">
            {item.title}
          </h3>
          <p className="text-sm text-[var(--color-anthracite)]/70">
            {item.description}
          </p>
          
          {/* Value */}
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <p className="text-2xl font-bold gold-gradient-text">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 📝 Bonnes Pratiques

1. **Toujours utiliser les variables CSS** (`--color-gold`, `--font-title`)
2. **Espacements en multiples de 8px** (`gap-6`, `p-8`)
3. **Transitions sur 0.3s** pour cohérence
4. **Classes réutilisables** plutôt que styles inline
5. **Responsive first** : mobile → tablet → desktop
6. **Accessibilité** : labels, ARIA, contraste

---

## 🎨 Personnalisation

Pour modifier les couleurs, éditez `app/globals.css` :

```css
:root {
  --color-gold: #FFD700; /* Changez la couleur or */
  --font-title: 'Georgia', serif; /* Changez la police */
}
```

Tous les composants utiliseront automatiquement les nouvelles valeurs!

---

**Version:** 1.0.0 | **Date:** Décembre 2025 | **Kekeli Group**
