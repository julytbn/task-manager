# 🎨 Dashboard Kekeli Group - Design System & Implémentation

## Vue d'ensemble

Bienvenue dans le dashboard professionnel et élégant de **Kekeli Group**, cabinet d'expertise comptable. Ce projet utilise une palette de couleurs luxueuse (noir profond + or métallique), une typographie élégante et une architecture composants cohérente.

---

## 📋 Palette de Couleurs

### Couleurs Principales
```css
--color-black-deep: #000000          /* Noir profond */
--color-black-900: #111111           /* Noir 900 */
--color-gold: #D4AF37                /* Or principal */
--color-gold-accent: #FFD700         /* Or accent */
--color-gold-shadow: #C9A227         /* Or ombré */
--color-offwhite: #F8F9FA            /* Blanc cassé */
--color-anthracite: #333333          /* Gris anthracite */
--color-surface: #FFFFFF             /* Blanc pur */
--color-border: #E0E0E0              /* Bordure grise */
```

### Usage
- **Fond principal** : `--color-offwhite` (#F8F9FA)
- **Accents/Icônes** : `--color-gold` (#D4AF37)
- **Sidebar** : Dégradé de noir
- **Texte** : `--color-anthracite` (#333333)

---

## 🔤 Typographie

### Polices Importées
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### Utilisation
- **Titres** : `Playfair Display` (serif élégante)
  - Taille: 32px-48px
  - Poids: 700-800
  
- **Corps** : `Montserrat` (sans-serif moderne)
  - Taille: 14px-16px
  - Poids: 400-600

### Exemple CSS
```css
h1, h2, h3 {
  font-family: var(--font-title);
  color: var(--color-black-deep);
}

body, p, span {
  font-family: var(--font-body);
  color: var(--color-anthracite);
}
```

---

## 🧩 Composants Réutilisables

### 1. **StatCard** (`components/StatCard.tsx`)
Carte statistique avec icône, valeur et tendance.

```tsx
<StatCard
  icon={ListChecks}
  title="À faire"
  value={12}
  trend={{ value: 5, direction: 'up' }}
/>
```

**Props:**
- `icon`: Icône Lucide
- `title`: Titre court
- `value`: Valeur à afficher
- `trend`: Tendance (optional)
- `bgColor`: Couleur fond (default: white)

**Responsive**: 4 colonnes desktop → 2 tablette → 1 mobile

---

### 2. **DataTable** (`components/DataTable.tsx`)
Tableau professionnel avec tri, pagination, actions.

```tsx
<DataTable
  columns={[
    { key: 'titre', label: 'Titre', sortable: true },
    { key: 'statut', label: 'Statut' },
  ]}
  data={tasks}
  onEdit={handleEdit}
  onDelete={handleDelete}
  hasActions={true}
  itemsPerPage={10}
/>
```

**Features:**
- Tri multi-colonnes
- Pagination avec numéros
- Alternance de lignes (blanc/gris)
- Actions (voir, éditer, supprimer)
- Responsive (défilement horizontal sur mobile)

---

### 3. **FormField, Button, Select** (`components/FormField.tsx`)
Composants de formulaire cohérents.

```tsx
<FormField
  label="Nom"
  placeholder="Entrez le nom..."
  icon={User}
  required
/>

<Button variant="primary" size="lg">
  Enregistrer
</Button>

<Select
  label="Statut"
  options={[
    { label: 'Actif', value: 'ACTIVE' },
    { label: 'Inactif', value: 'INACTIVE' },
  ]}
/>
```

**Button Variants:**
- `primary`: Fond doré, texte noir
- `secondary`: Border doré, texte doré
- `danger`: Fond rouge

**Button Sizes:**
- `sm`, `md`, `lg`

---

### 4. **ProgressBar** (`components/ProgressBar.tsx`)
Barre de progression élégante avec gradient or.

```tsx
<ProgressBar
  value={75}
  max={100}
  label="Progression"
  showPercentage={true}
  size="md"
/>
```

---

### 5. **Navbar** (`components/Navbar.tsx`)
Barre supérieure avec recherche, notifications, avatar.

**Features:**
- Fond semi-transparent noir
- Recherche centrée
- Notifications avec badge
- Dropdown profil utilisateur
- Responsive (compacte sur mobile)

---

### 6. **ManagerSidebar** (`components/ManagerSidebar.tsx`)
Navigation latérale luxueuse.

**Responsive:**
- **Desktop** (>1024px): 250px complet avec texte
- **Tablette** (768-1024px): 60px réduit (icônes seules)
- **Mobile** (<768px): Menu overlay 250px

**États:**
- Normal: Icône dorée, texte blanc cassé
- Hover: Fond #222222
- Active: Bordure/top gauche doré

---

### 7. **Toast** (`components/Toast.tsx`)
Notifications toast minimalistes.

```tsx
const { toasts, addToast, ToastContainer } = useToast()

addToast('Opération réussie', 'success', 3000)
addToast('Erreur!', 'error')
```

**Types:**
- `success`: Vert
- `error`: Rouge
- `warning`: Jaune/orange
- `info`: Doré

---

### 8. **Spinner** (`components/Spinner.tsx`)
Chargement avec animation doré.

```tsx
<Spinner size="md" />
<Spinner size="lg" overlay={true} />
```

---

## 🎯 Pages Implémentées

### 1. **Dashboard** (`app/dashboard/manager-dashboard.tsx`)
- 4 cartes statistiques
- Graphique linéaire (revenus mensuels)
- Graphiques circulaires (répartition tâches, paiements)
- Tableau tâches récentes
- Responsive: 4→2→1 cartes

### 2. **Tâches** (`app/taches/page.tsx`)
- Barre de filtres (statut, priorité)
- Tableau avec tri et pagination
- Actions (voir, éditer, supprimer)
- Responsive avec défilement horizontal

### 3. **Clients** (`app/clients/page.tsx`)
- Vue tableau ou cartes (toggle)
- Cartes clients avec statistiques
- Panel détail au clic sur un client
- Recherche en temps réel

### 4. **Projets** (`app/projets/page.tsx`)
- Vue cartes avec image placeholder
- Barre de progression dorée
- Statut badges
- Informations budget et dates
- Toggle tableau/cartes

---

## 📐 Responsive Design

### Breakpoints
- **Desktop** (lg): >1024px - Version complète
- **Tablette** (md): 768px-1024px - Sidebar réduite (60px)
- **Mobile** (<768px) - Menu burger, sidebar overlay

### Grilles Adaptatives
```tsx
grid-cols-1 md:grid-cols-2 lg:grid-cols-4
/* 1 colonne mobile, 2 tablette, 4 desktop */
```

### Tableaux sur Mobile
- Défilement horizontal
- Colonnes minimales
- Actions compactées

---

## 🎨 Classes Utilitaires CSS

### Cartes
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-gold);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 24px;
  transition: box-shadow 0.3s ease;
}
.card:hover {
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.15);
  transform: translateY(-2px) scale(1.02);
}
```

### Boutons
```css
.btn-primary {
  background: var(--color-gold);
  color: var(--color-black-deep);
  border-radius: 4px;
  padding: 12px 24px;
  font-weight: 600;
}

.btn-secondary {
  background: transparent;
  color: var(--color-gold);
  border: 1px solid var(--color-gold);
}
```

### Gradient Or
```css
.gold-gradient-text {
  background: linear-gradient(90deg, #D4AF37 0%, #FFD700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Icônes
```css
.icon-gold {
  color: var(--color-gold);
  font-size: 20px;
}
```

---

## 🔧 Intégration dans Vos Pages

### Exemple Basique
```tsx
'use client'

import MainLayout from '@/components/MainLayout'
import { StatCard, DataTable, Button } from '@/components'

export default function MyPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-4xl font-bold gold-gradient-text">Mon Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={...} title="..." value={...} />
        </div>
        
        <div className="card">
          <DataTable columns={...} data={...} />
        </div>
      </div>
    </MainLayout>
  )
}
```

---

## 📦 Imports Rapides

```tsx
// Composants
import { StatCard, DataTable, ProgressBar, Button } from '@/components'

// Formulaires
import { FormField, Select, Button } from '@/components/FormField'

// Layout
import MainLayout from '@/components/MainLayout'

// Notifications
import { useToast } from '@/components/Toast'

// Icônes
import { Plus, ListChecks, DollarSign } from 'lucide-react'
```

---

## 🎭 Animations & Transitions

### Toutes les Transitions
- Durée: 0.3s
- Timing: ease

```css
transition: all 0.3s ease;
transition: background-color 0.3s ease;
transition: transform 0.3s ease;
```

### Hover Effects
- Cartes: élévation + scale 1.02
- Boutons: changement couleur
- Icônes: scale 1.1

---

## 🌐 Variables CSS Globales

Toutes les variables sont définies dans `app/globals.css` :

```css
:root {
  --header-height: 4rem;
  --sidebar-width: 250px;
  --sidebar-width-collapsed: 60px;
  --color-black-deep: #000000;
  --font-title: 'Playfair Display', serif;
  --font-body: 'Montserrat', sans-serif;
  --base-spacing: 8px;
  --radius-sm: 4px;
  --radius-md: 8px;
}
```

---

## ✨ Prochaines Étapes

1. ✅ Design system complet
2. ✅ Composants réutilisables
3. ✅ Pages principales
4. ⏭️ Modales d'édition/création
5. ⏭️ Authentification et permissions
6. ⏭️ Intégration API complète
7. ⏭️ Tests unitaires

---

## 📞 Support

Pour questions ou modifications du design system, consultez la documentation ou contactez l'équipe développement.

**Plateforme:** Kekeli Group - Cabinet d'expertise comptable  
**Version:** 1.0.0  
**Date:** Décembre 2025
