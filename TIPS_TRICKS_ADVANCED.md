# 💡 Tips & Tricks - Développement Dashboard Kekeli Group

## 🎨 Astuces CSS

### 1. Utiliser les Variables CSS pour Thématisation Dynamique

```css
/* app/globals.css */
:root {
  --color-gold: #D4AF37;
  --color-primary: var(--color-gold);
}

/* Changer dynamiquement */
html.dark-mode {
  --color-gold: #FFD700;
  --color-offwhite: #1a1a1a;
}
```

### 2. Créer des Variantes d'Ombres

```css
.shadow-subtle { box-shadow: var(--color-shadow); }
.shadow-medium { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
.shadow-heavy { box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
```

### 3. Gradient Or Réutilisable

```css
.gold-gradient {
  background: linear-gradient(90deg, #D4AF37 0%, #FFD700 100%);
}

.gold-gradient-text {
  background: linear-gradient(90deg, #D4AF37 0%, #FFD700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Utilisation */
<h1 className="gold-gradient-text">Titre</h1>
<div className="gold-gradient h-2 rounded-full"></div>
```

---

## 🚀 Astuces React/TypeScript

### 1. Hook Custom pour Données Paginées

```tsx
// hooks/usePagination.ts
export function usePagination<T>(
  data: T[],
  itemsPerPage: number,
  currentPage: number
) {
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)

  return { paginatedData, totalPages }
}

// Usage
const { paginatedData, totalPages } = usePagination(tasks, 10, currentPage)
```

### 2. Hook Custom pour Recherche Debounced

```tsx
// hooks/useDebouncedSearch.ts
import { useState, useEffect } from 'react'

export function useDebouncedSearch<T>(
  items: T[],
  searchKey: keyof T,
  debounceMs = 300
) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState(items)

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = items.filter(item =>
        String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase())
      )
      setResults(filtered)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, items, searchKey, debounceMs])

  return { searchTerm, setSearchTerm, results }
}

// Usage
const { searchTerm, setSearchTerm, results } = useDebouncedSearch(clients, 'nom')
```

### 3. Composant Wrapper pour Export CSV

```tsx
// components/ExportButton.tsx
export function ExportButton<T extends Record<string, any>>({
  data,
  fileName = 'export',
  columns,
}: {
  data: T[]
  fileName?: string
  columns: (keyof T)[]
}) {
  const handleExport = () => {
    const csv = [
      columns.join(','),
      ...data.map(row =>
        columns.map(col => JSON.stringify(row[col])).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${fileName}.csv`)
    link.click()
  }

  return (
    <button onClick={handleExport} className="btn-secondary">
      📥 Exporter CSV
    </button>
  )
}

// Usage
<ExportButton
  data={tasks}
  columns={['titre', 'statut', 'priorite']}
  fileName="taches"
/>
```

### 4. Composant Modal Générique

```tsx
// components/Dialog.tsx
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold gold-gradient-text mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        <div className="flex gap-4">
          <Button variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎯 Patterns Avancés

### 1. Composant avec Skeleton Loader

```tsx
export function DataWithSkeleton({
  isLoading,
  data,
  children,
}: {
  isLoading: boolean
  data: any
  children: React.ReactNode
}) {
  if (isLoading) {
    return (
      <div className="card space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-[var(--color-border)] rounded-lg" />
        ))}
      </div>
    )
  }

  return <>{children}</>
}
```

### 2. Cache Local avec SessionStorage

```tsx
// hooks/useSessionCache.ts
export function useSessionCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000 // 5 mins
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = sessionStorage.getItem(key)
    const cachedData = cached ? JSON.parse(cached) : null

    if (cachedData && Date.now() - cachedData.timestamp < ttl) {
      setData(cachedData.data)
      setLoading(false)
      return
    }

    fetcher().then(result => {
      sessionStorage.setItem(
        key,
        JSON.stringify({ data: result, timestamp: Date.now() })
      )
      setData(result)
      setLoading(false)
    })
  }, [key, fetcher, ttl])

  return { data, loading }
}
```

### 3. Permission Wrapper

```tsx
// components/ProtectedAction.tsx
export function ProtectedAction({
  requiredRole,
  children,
  fallback = null,
}: {
  requiredRole: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { data: session } = useSession()

  if (!session || !requiredRole.includes(session.user?.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage
<ProtectedAction requiredRole={['MANAGER', 'ADMIN']}>
  <Button>Supprimer</Button>
</ProtectedAction>
```

---

## 📊 Optimisations Performance

### 1. Memoization pour Listes Longues

```tsx
const MemoizedCard = React.memo(({ item }: { item: Card }) => {
  return (
    <div className="card">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  )
})
```

### 2. Virtual Scrolling pour Grandes Listes

```tsx
// Pour tables avec 1000+ rows
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => <div style={style}>{/* Row */}</div>}
</FixedSizeList>
```

### 3. useMemo pour Calculs Lourds

```tsx
const expensiveValue = useMemo(() => {
  // Calcul complexe
  return data.reduce((acc, item) => acc + calculateValue(item), 0)
}, [data])
```

---

## 🌐 Responsive Utilities

### 1. Hook pour Déterminer Breakpoint

```tsx
// hooks/useBreakpoint.ts
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setBreakpoint('mobile')
      else if (window.innerWidth < 1024) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}

// Usage
const breakpoint = useBreakpoint()
const isMobile = breakpoint === 'mobile'
```

### 2. Composant Responsive

```tsx
export function Responsive({
  mobile,
  tablet,
  desktop,
}: {
  mobile: React.ReactNode
  tablet: React.ReactNode
  desktop: React.ReactNode
}) {
  const breakpoint = useBreakpoint()

  return (
    <>
      <div className="block md:hidden">{mobile}</div>
      <div className="hidden md:block lg:hidden">{tablet}</div>
      <div className="hidden lg:block">{desktop}</div>
    </>
  )
}
```

---

## 🔐 Sécurité

### 1. Validation d'Input

```tsx
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s\-\+()]+$/.test(phone)
}
```

### 2. Rate Limiting sur Submit

```tsx
// hooks/useRateLimiter.ts
export function useRateLimiter(delayMs = 1000) {
  const [canSubmit, setCanSubmit] = useState(true)

  const throttledAction = async (action: () => Promise<void>) => {
    if (!canSubmit) return

    setCanSubmit(false)
    try {
      await action()
    } finally {
      setTimeout(() => setCanSubmit(true), delayMs)
    }
  }

  return { canSubmit, throttledAction }
}
```

---

## 🎨 Customization Avancée

### 1. Thème Dynamique

```tsx
// contexts/ThemeContext.tsx
export const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  )
}
```

### 2. Customiser Couleurs au Runtime

```tsx
export function CustomizeColors() {
  const handleChangeGold = (color: string) => {
    document.documentElement.style.setProperty('--color-gold', color)
  }

  return (
    <input
      type="color"
      defaultValue="#D4AF37"
      onChange={(e) => handleChangeGold(e.target.value)}
    />
  )
}
```

---

## 🧪 Tests Unitaires

### 1. Test d'un Composant

```tsx
// __tests__/StatCard.test.tsx
import { render, screen } from '@testing-library/react'
import StatCard from '@/components/StatCard'
import { ListChecks } from 'lucide-react'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(
      <StatCard
        icon={ListChecks}
        title="Test"
        value={42}
      />
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
```

### 2. Test d'un Hook

```tsx
// __tests__/usePagination.test.ts
import { usePagination } from '@/hooks/usePagination'
import { renderHook } from '@testing-library/react'

describe('usePagination', () => {
  it('returns correct pagination', () => {
    const data = Array.from({ length: 25 }, (_, i) => i + 1)
    const { result } = renderHook(() => usePagination(data, 10, 1))
    
    expect(result.current.paginatedData).toHaveLength(10)
    expect(result.current.totalPages).toBe(3)
  })
})
```

---

## 📝 Conventions de Code

### Nommage de Fichiers
- Composants: `PascalCase` (`StatCard.tsx`)
- Hooks: `camelCase` avec préfixe `use` (`useFetch.ts`)
- Utils: `camelCase` (`formatDate.ts`)
- Styles: `kebab-case` (`.card-header`)

### Structure de Composants
```tsx
'use client' // Directive si client-side

// Imports
import React from 'react'

// Types
type ComponentProps = {
  title: string
  value: number
}

// Component
export default function Component({ title, value }: ComponentProps) {
  // State
  const [state, setState] = React.useState()

  // Effects
  React.useEffect(() => {}, [])

  // Handlers
  const handleClick = () => {}

  // Render
  return (
    <div className="card">
      {/* JSX */}
    </div>
  )
}
```

---

## 🚀 Déploiement & Production

### 1. Optimiser pour Production

```bash
# Build optimisé
npm run build

# Analyser bundle
npm run analyze
```

### 2. Variables d'Environnement

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
API_SECRET_KEY=xxx
```

### 3. SEO Basique

```tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Kekeli Group',
  description: 'Gestion d\'entreprise professionnelle',
  keywords: ['cabinet', 'comptable', 'gestion'],
}
```

---

**Version:** 1.0.0 | **Date:** Décembre 2025 | **Kekeli Group**
