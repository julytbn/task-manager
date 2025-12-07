# 🚀 GUIDE D'EXÉCUTION - SYNCHRONISATION FRONTEND/BACKEND

**Date:** Décembre 3, 2025  
**Type:** Step-by-Step Implementation  
**Durée Estimée:** 8-10 jours

---

## 📋 TABLE DES MATIÈRES

1. [Étape 1: Corriger Paiements (URGENT)](#étape-1-corriger-paiements)
2. [Étape 2: Harmoniser Énums](#étape-2-harmoniser-énums)
3. [Étape 3: Ajouter Validations](#étape-3-ajouter-validations)
4. [Étape 4: Gestion Erreurs](#étape-4-gestion-erreurs-globale)
5. [Étape 5: Tests & Validation](#étape-5-tests--validation)

---

## ÉTAPE 1: Corriger Paiements

### 1.1 - Vérifier l'API Paiements

**Fichier:** `/app/api/paiements/route.ts`

```tsx
// GET /api/paiements - Vérifier structure retour
// Doit retourner: Array<{
//   id: string
//   montant: number
//   statut: string (EN_ATTENTE | PAYÉ | PARTIELLEMENT_PAYÉ)
//   factureId: string (OBLIGATOIRE - NOT NULL)
//   methodePaiement?: string
//   dateEmission: string
//   dateEcheance?: string
// }>
```

**Test dans Terminal:**
```powershell
# Vérifier API fonctionne
Invoke-WebRequest -Uri "http://localhost:3000/api/paiements" -Method GET | ConvertFrom-Json | Select-Object -First 5
```

### 1.2 - Corriger Page Paiements

**Fichier:** `/app/paiements/page.tsx`

**AVANT:**
```tsx
'use client'
import { useState } from 'react'

const mockPaiements = [
  {
    id: '1',
    client: 'Entreprise ABC',
    projet: 'App Mobile',
    // ... mock data
  },
  // ... 3 autres
]

export default function PaiementsPage() {
  const [selectedPaiementId, setSelectedPaiementId] = useState<string | null>(null)
  // ❌ Pas de fetch API, utilise seulement mockPaiements
```

**APRÈS:**
```tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, Download } from 'lucide-react'
import PaiementsOverview from '@/components/PaiementsOverview'
import PaiementsTable from '@/components/PaiementsTable'
import NouveauPaiementModal from '@/components/NouveauPaiementModal'

type Paiement = {
  id: string
  montant: number
  statut: 'EN_ATTENTE' | 'PAYÉ' | 'PARTIELLEMENT_PAYÉ'
  factureId: string
  methodePaiement?: string
  dateEmission: string
  facture?: {
    id: string
    numero: string
    client: { nom: string }
  }
}

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ✅ Fetch depuis API réelle
  const fetchPaiements = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/paiements')
      if (!res.ok) throw new Error('Erreur récupération paiements')
      const data: Paiement[] = await res.json()
      setPaiements(data)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaiements()
  }, [])

  const handlePaiementCreated = (newPaiement: Paiement) => {
    setPaiements([newPaiement, ...paiements])
    setIsModalOpen(false)
    // ✅ Toast success (à ajouter avec toast library)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Paiements</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={20} /> Nouveau Paiement
        </button>
      </div>

      <PaiementsOverview paiements={paiements} />
      <PaiementsTable paiements={paiements} onRefresh={fetchPaiements} />

      <NouveauPaiementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handlePaiementCreated}
      />
    </div>
  )
}
```

### 1.3 - Vérifier PaiementsTable Utilise Données API

**Fichier:** `/components/PaiementsTable.tsx`

```tsx
// ✅ Doit utiliser paiements depuis props (API)
interface PaiementsTableProps {
  paiements: Paiement[]
  onRefresh: () => Promise<void>
}

export default function PaiementsTable({ paiements, onRefresh }: PaiementsTableProps) {
  // ✅ Utiliser paiements depuis props (données API)
  // ❌ Ne pas avoir de mockData interne

  return (
    <table className="w-full">
      <tbody>
        {paiements.map((p) => (
          <tr key={p.id}>
            <td>{p.facture?.numero}</td>
            <td>{p.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</td>
            <td>{p.statut}</td>
            {/* ... */}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### 1.4 - Test Paiements

```powershell
# Terminal - Tester page charge sans erreurs
npm run dev

# Vérifier dans navigateur:
# - http://localhost:3000/paiements charge
# - Liste de paiements s'affiche (depuis API)
# - Pas de mock data visible
# - Bouton "Nouveau Paiement" fonctionne
```

---

## ÉTAPE 2: Harmoniser Énums

### 2.1 - Vérifier useEnums Hook

**Fichier:** `/lib/useEnums.ts`

```tsx
// ✅ Doit exister et fonctionne
// Test: Est-ce que ce code fonctionne?

import { useEnums } from '@/lib/useEnums'

function TestEnums() {
  const { priorites } = useEnums('priorites')
  // ✅ Si c'est défini, hook fonctionne
  // ❌ Si undefined, hook cassé
}
```

### 2.2 - Clients: Remplacer Enum Type

**Fichier:** `/app/clients/page.tsx`

**AVANT:**
```tsx
// ❌ Hardcodé
const filterConfig: Record<'TOUS' | 'ENTREPRISE' | 'PARTICULIER', string> = {
  TOUS: 'Tous les clients',
  ENTREPRISE: 'Entreprises',
  PARTICULIER: 'Particuliers',
}
// Si on ajoute type dans BD, code casse!
```

**APRÈS:**
```tsx
// ✅ Depuis enum BD
import { useEnums } from '@/lib/useEnums'

export default function ClientsPage() {
  const { typesClients } = useEnums('types-clients')  // ou votre endpoint

  const filterConfig = {
    TOUS: 'Tous les clients',
    ...Object.fromEntries(typesClients.map(t => [t.value, t.label]))
  }

  // Utiliser dans le select:
  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
    <option value="TOUS">Tous</option>
    {typesClients.map(type => (
      <option key={type.value} value={type.value}>
        {type.label}
      </option>
    ))}
  </select>
}
```

### 2.3 - Factures: Remplacer Enum Statuts

**Fichier:** `/app/factures/page.tsx`

**AVANT:**
```tsx
// ❌ Hardcodé
const getStatusBadge = (statut: string) => {
  const colors: Record<string, string> = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
    PAYEE: 'bg-green-100 text-green-800',
    REMBOURSEE: 'bg-blue-100 text-blue-800',
    ANNULEE: 'bg-red-100 text-red-800'
  }
  // Si on ajoute statut dans BD, oublie!
}
```

**APRÈS:**
```tsx
// ✅ Depuis enum BD
import { useEnums } from '@/lib/useEnums'

export default function FacturesPage() {
  const { statutsFactures } = useEnums('statuts-factures')

  const getStatusBadge = (statut: string) => {
    const statusObj = statutsFactures.find(s => s.value === statut)
    return {
      color: statusObj?.color || 'bg-gray-100 text-gray-800',
      label: statusObj?.label || statut
    }
  }

  return (
    // ... dans la table
    <tr>
      <td>
        <span className={getStatusBadge(facture.statut).color}>
          {getStatusBadge(facture.statut).label}
        </span>
      </td>
    </tr>
  )
}
```

### 2.4 - Projets: Vérifier Statuts

**Fichier:** `/app/projets/page.tsx`

```tsx
// ✅ Vérifier: statusConfig utilise-t-il enum BD ou hardcodé?
// À vérifier dans le code exact
```

### 2.5 - Tâches: Vérifier Enum Priorité

**Fichier:** `/components/dashboard/SubmitTaskForm.tsx`

```tsx
// ✅ Vérifier si utilise useEnums('priorites')
// Selon ENUM_SUMMARY.md, ça devrait être migré
// À confirmer
```

---

## ÉTAPE 3: Ajouter Validations

### 3.1 - Créer Fichier Schemas

**Fichier:** `/lib/formSchemas.ts` (à créer)

```tsx
import { z } from 'zod'

// ✅ Schemas Zod pour chaque formulaire

export const ClientSchema = z.object({
  nom: z.string().min(1, 'Nom requis').min(2, 'Minimum 2 caractères'),
  prenom: z.string().optional(),
  email: z.string().email('Email invalide').optional(),
  telephone: z.string().optional(),
  type: z.enum(['PARTICULIER', 'ENTREPRISE', 'ORGANISATION']),
  entreprise: z.string().optional(),
  adresse: z.string().optional(),
})

export const ProjetSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client requis'),
  budget: z.number().min(0, 'Budget doit être positif'),
  dateDebut: z.date(),
  dateFin: z.date(),
  statut: z.enum(['EN_COURS', 'TERMINE', 'EN_RETARD']),
})

export const PaiementSchema = z.object({
  montant: z.number().min(0, 'Montant doit être positif'),
  statut: z.enum(['EN_ATTENTE', 'PAYÉ', 'PARTIELLEMENT_PAYÉ']),
  factureId: z.string().min(1, 'Facture requise'),
  methodePaiement: z.string().optional(),
  dateEmission: z.date(),
})

export const FactureSchema = z.object({
  numero: z.string().min(1, 'Numéro requis'),
  clientId: z.string().min(1, 'Client requis'),
  montant: z.number().min(0, 'Montant doit être positif'),
  montantTVA: z.number().min(0),
  statut: z.enum(['EN_ATTENTE', 'PAYEE', 'REMBOURSEE', 'ANNULEE']),
  dateEmission: z.date(),
})

export const TacheSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  priorite: z.enum(['HAUTE', 'NORMALE', 'BASSE']),
  statut: z.enum(['NOUVEAU', 'EN_COURS', 'TERMINE']),
  projetId: z.string().min(1, 'Projet requis'),
})

export const AbonnementSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  serviceId: z.string().min(1, 'Service requis'),
  montantMensuel: z.number().min(0),
  frequencePaiement: z.enum(['MENSUEL', 'TRIMESTRIEL', 'ANNUEL']),
  dateDebut: z.date(),
  statut: z.enum(['ACTIF', 'SUSPENDU', 'ANNULE']),
})

export type ClientFormData = z.infer<typeof ClientSchema>
export type ProjetFormData = z.infer<typeof ProjetSchema>
export type PaiementFormData = z.infer<typeof PaiementSchema>
export type FactureFormData = z.infer<typeof FactureSchema>
export type TacheFormData = z.infer<typeof TacheSchema>
export type AbonnementFormData = z.infer<typeof AbonnementSchema>
```

### 3.2 - Créer Composant FormError

**Fichier:** `/components/FormError.tsx` (à créer)

```tsx
interface FormErrorProps {
  error?: string
  className?: string
}

export default function FormError({ error, className }: FormErrorProps) {
  if (!error) return null

  return (
    <div className={`bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm ${className}`}>
      ❌ {error}
    </div>
  )
}
```

### 3.3 - Ajouter Validation à Modal

**Exemple:** `/components/NouveauClientModal.tsx`

```tsx
'use client'
import { useState } from 'react'
import { z } from 'zod'
import { ClientSchema, type ClientFormData } from '@/lib/formSchemas'
import FormError from './FormError'

interface NouveauClientModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (client: any) => void
}

export default function NouveauClientModal({ isOpen, onClose, onCreated }: NouveauClientModalProps) {
  const [formData, setFormData] = useState<Partial<ClientFormData>>({
    type: 'PARTICULIER',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // ✅ Valider avec Zod
      const validatedData = ClientSchema.parse(formData)

      // ✅ Envoyer à API
      setLoading(true)
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erreur création client')
      }

      const newClient = await res.json()
      onCreated(newClient)
      setFormData({})
      onClose()

    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Afficher erreurs validation
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
        setErrors(fieldErrors)
      } else {
        // ✅ Afficher erreur serveur
        setErrors({ submit: (error as Error).message })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Nouveau Client</h2>

        {/* ✅ Afficher erreur globale */}
        {errors.submit && <FormError error={errors.submit} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input
              type="text"
              value={formData.nom || ''}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.nom ? 'border-red-500' : 'border-gray-300'}`}
            />
            {/* ✅ Afficher erreur champ */}
            {errors.nom && <FormError error={errors.nom} />}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <FormError error={errors.email} />}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select
              value={formData.type || 'PARTICULIER'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="PARTICULIER">Particulier</option>
              <option value="ENTREPRISE">Entreprise</option>
              <option value="ORGANISATION">Organisation</option>
            </select>
            {errors.type && <FormError error={errors.type} />}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## ÉTAPE 4: Gestion Erreurs Globale

### 4.1 - Ajouter Toast Provider

**Fichier:** `/app/providers.tsx` (ajouter)

```tsx
'use client'

import { ReactNode } from 'react'
import { Toaster } from 'sonner'  // ou react-hot-toast

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  )
}
```

**Fichier:** `/app/layout.tsx` (modifier)

```tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 4.2 - Utiliser Toast dans Formulaires

```tsx
// ✅ Utiliser dans handleSubmit

import { toast } from 'sonner'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    const validatedData = ClientSchema.parse(formData)
    
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    })

    if (!res.ok) {
      const error = await res.json()
      toast.error(error.message || 'Erreur création')
      return
    }

    const newClient = await res.json()
    onCreated(newClient)
    
    // ✅ Toast success
    toast.success('✅ Client créé avec succès!')
    
    onClose()
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      toast.error(`❌ ${firstError.path.join('.')}: ${firstError.message}`)
    } else {
      toast.error(`❌ ${(error as Error).message}`)
    }
  }
}
```

---

## ÉTAPE 5: Tests & Validation

### 5.1 - Checklist Test Paiements

```
✅ Avant de continuer:

[ ] Terminal: npm run dev - pas d'erreurs
[ ] Page /paiements charge correctement
[ ] Voir liste paiements depuis API
[ ] Pas de mock data visible
[ ] Bouton "Nouveau Paiement" ouvre modal
[ ] Formulaire validation affiche erreurs
[ ] Créer paiement ajoute à liste
[ ] Toast success s'affiche
[ ] Énums paiement depuis BD
```

### 5.2 - Checklist Énums

```
✅ Pour chaque page:

[ ] Clients: Types depuis enum BD
[ ] Factures: Statuts depuis enum BD
[ ] Projets: Statuts depuis enum BD
[ ] Tâches: Priorité depuis enum BD
[ ] Abonnements: Fréquence depuis enum BD
[ ] Pas de hardcoded values
```

### 5.3 - Test Terminal

```powershell
# Vérifier API paiements
$paiements = (Invoke-WebRequest -Uri "http://localhost:3000/api/paiements" -Method GET | ConvertFrom-Json)
$paiements | Select-Object -First 3 | Format-List

# Vérifier énums
$enums = (Invoke-WebRequest -Uri "http://localhost:3000/api/enums/types-clients" -Method GET | ConvertFrom-Json)
$enums | Format-List

# Créer paiement test
$body = @{
  montant = 100000
  statut = "EN_ATTENTE"
  factureId = "test-id"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/paiements" `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body
```

---

## 📊 Résumé des Fichiers à Modifier

| Fichier | Type | Étape | Priorité |
|---------|------|-------|----------|
| `/app/paiements/page.tsx` | Modifier | 1 | 🔴 |
| `/components/PaiementsTable.tsx` | Vérifier | 1 | 🔴 |
| `/app/clients/page.tsx` | Modifier | 2 | 🟠 |
| `/app/factures/page.tsx` | Modifier | 2 | 🟠 |
| `/app/projets/page.tsx` | Vérifier | 2 | 🟠 |
| `/components/SubmitTaskForm.tsx` | Vérifier | 2 | 🟠 |
| `/lib/formSchemas.ts` | Créer | 3 | 🟠 |
| `/components/FormError.tsx` | Créer | 3 | 🟠 |
| `/components/NouveauClientModal.tsx` | Modifier | 3 | 🟠 |
| `/components/NouveauPaiementModal.tsx` | Modifier | 3 | 🟠 |
| `/app/providers.tsx` | Modifier | 4 | 🟠 |
| `/app/layout.tsx` | Modifier | 4 | 🟠 |

---

**Prêt à commencer l'implémentation! 🚀**
