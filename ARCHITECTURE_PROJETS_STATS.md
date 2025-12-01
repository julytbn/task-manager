# 🏗️ Architecture - Statistiques Projets BD

## Vue d'ensemble globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  /app/projets/page.tsx                                              │
│  ├─ useProjectsStatistics() hook                                    │
│  ├─ KPI Cards Component                                            │
│  └─ Affichage en temps réel                                        │
│                                                                       │
│  /lib/useProjectsStatistics.ts (React Hook)                         │
│  ├─ Cache au niveau module (5 min)                                 │
│  ├─ Gestion loading/error                                          │
│  ├─ Fetch depuis /api/dashboard/projets-stats                      │
│  └─ Types TypeScript complets                                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                ↓ HTTP
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Next.js API)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  /app/api/dashboard/projets-stats/route.ts (GET)                    │
│  ├─ Prisma Client                                                  │
│  ├─ Query EnumStatutProjet (statuts actifs)                        │
│  ├─ Query Projet with relations                                    │
│  │  ├─ client                                                       │
│  │  ├─ service                                                      │
│  │  └─ taches (with paiements)                                     │
│  │                                                                   │
│  ├─ Business Logic:                                                │
│  │  ├─ Comptage projets EN_COURS                                   │
│  │  ├─ Comptage projets TERMINE                                    │
│  │  ├─ Somme des budgets                                           │
│  │  ├─ Formatage FCFA                                              │
│  │  └─ Enrichissement avec enums                                   │
│  │                                                                   │
│  └─ Retour JSON Response                                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                ↓ SQL
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─ Projet                                                          │
│  │  ├─ id (PK)                                                     │
│  │  ├─ titre                                                       │
│  │  ├─ statut (FK → EnumStatutProjet.cle)                         │
│  │  ├─ budget                                                      │
│  │  ├─ dateCreation                                                │
│  │  └─ ...                                                         │
│  │                                                                   │
│  ├─ Client                                                          │
│  │  ├─ id (PK)                                                     │
│  │  ├─ nom                                                         │
│  │  └─ ...                                                         │
│  │                                                                   │
│  ├─ Service                                                         │
│  │  └─ ...                                                         │
│  │                                                                   │
│  ├─ Tache                                                           │
│  │  └─ ...                                                         │
│  │                                                                   │
│  └─ EnumStatutProjet                                               │
│     ├─ cle: "EN_COURS" | "TERMINE" | ...                          │
│     ├─ label: "En cours" | "Terminé" | ...                        │
│     ├─ ordre: 1, 2, ...                                           │
│     └─ actif: true                                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Flux d'exécution détaillé

### 1. User Navigate Flow

```
User ouvre navigateur
        ↓
Navigate vers /projets
        ↓
Browser charge app/projets/page.tsx
        ↓
React compose le composant
        ↓
useProjectsStatistics() hook init
```

### 2. Hook Execution

```
useProjectsStatistics() appelé
        ↓
useEffect déclenché
        ↓
Check projectStatsCache (module level)
        │
        ├─ Cache VALIDE (< 5 min)
        │  └─ setData(projectStatsCache) → FAST ⚡
        │
        └─ Cache INVALIDE (> 5 min ou null)
           └─ Fetch /api/dashboard/projets-stats
              ↓
              Backend query DB
              ↓
              Return JSON
              ↓
              Update cache
              ↓
              setData(jsonData) → RENDER
```

### 3. API Route Execution

```
GET /api/dashboard/projets-stats
        ↓
Try block
├─ Fetch EnumStatutProjet
│  └─ SELECT * FROM "EnumStatutProjet" WHERE actif = true
│
├─ Fetch Projet with relations
│  └─ SELECT * FROM "Projet"
│     JOIN "Client" ON Projet.clientId = Client.id
│     JOIN "Service" ON Projet.serviceId = Service.id
│     LEFT JOIN "Tache" ON Projet.id = Tache.projetId
│     ORDER BY dateCreation DESC
│
├─ JavaScript Processing
│  ├─ Initialize statistics object
│  ├─ Loop through projets
│  │  ├─ Get budget sum
│  │  ├─ Match statut with enum
│  │  ├─ Classify EN_COURS vs TERMINE
│  │  └─ Build projectData objects
│  │
│  ├─ Format budget to FCFA
│  │  └─ Use toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })
│  │
│  └─ Build response object
│
└─ Return NextResponse.json({...})
```

### 4. Component Render

```
Data received by component
        ↓
stats calculated/mapped
        ↓
KPI Cards rendered
        ├─ Total Projets: {stats.total}
        ├─ En Cours: {stats.enCours}
        ├─ Terminés: {stats.termines}
        └─ Budget: {stats.budgetFormatted}
```

---

## Cache Strategy

```
Module Level Cache:
┌─────────────────────────────────────┐
│ projectStatsCache: ProjectsStats|null│
│ cacheTimestamp: number              │
│ CACHE_DURATION: 5 * 60 * 1000       │
└─────────────────────────────────────┘

When hook initializes:
├─ NOW = Date.now()
├─ ELAPSED = NOW - cacheTimestamp
│
├─ IF (projectStatsCache && ELAPSED < CACHE_DURATION)
│  └─ Return cached data ⚡ (< 5ms)
│
└─ ELSE
   └─ Fetch from API (400-600ms)
      └─ Update cache
```

---

## Data Transformation Pipeline

```
Raw DB Data
    ↓
┌─────────────────────────────────────────────┐
│ Prisma Objects:                              │
│ {                                            │
│   id: string                                 │
│   titre: string                              │
│   statut: string (e.g., "EN_COURS")        │
│   budget: number                             │
│   client: {...}                              │
│   service: {...}                             │
│   taches: [...]                              │
│ }                                            │
└────────────────────┬────────────────────────┘
                     ↓
            JavaScript Processing
    ┌──────────────────────────────────┐
    │ for each projet {                │
    │   find enum label by statut.cle  │
    │   classify EN_COURS or TERMINE   │
    │   build projectData structure    │
    │   add to appropriate list        │
    │ }                                │
    └───────────┬──────────────────────┘
                ↓
┌─────────────────────────────────────────────┐
│ ProjectData Objects:                         │
│ {                                            │
│   id, titre, description, client,           │
│   service, statut, budget, dates,           │
│   taches: { total, terminated, ...}        │
│ }                                            │
└────────────────────┬────────────────────────┘
                     ↓
         Format Agregations & Budget
    ┌──────────────────────────────────┐
    │ {                                │
    │   totalProjets: 11               │
    │   projetsEnCours: 2              │
    │   projetsTermines: 3             │
    │   budgetTotal: 50000000          │
    │   budgetTotalFormatted:          │
    │     "50 000 000 XOF"             │
    │ }                                │
    └───────────┬──────────────────────┘
                ↓
        JSON Response (3-5KB)
```

---

## Type System Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Interface: ProjectsStatistics                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Aggregations:                                           │
│  ├─ totalProjets: number                               │
│  ├─ projetsEnCours: number                             │
│  ├─ projetsTermines: number                            │
│  ├─ budgetTotal: number                                │
│  └─ budgetTotalFormatted: string                       │
│                                                           │
│ Collections:                                            │
│  ├─ projetsEnCoursList: ProjectData[]                  │
│  └─ projetsTerminesList: ProjectData[]                 │
│                                                           │
│ Reference Data:                                         │
│  └─ statutsDisponibles: {cle, label, ordre}[]         │
│                                                           │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ Interface: ProjectData                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ├─ id: string                                         │
│  ├─ titre: string                                      │
│  ├─ description: string | null                         │
│  │                                                       │
│  ├─ client: {                                          │
│  │   id, nom, prenom, email, telephone                 │
│  │ }                                                    │
│  │                                                       │
│  ├─ service: {                                         │
│  │   id, nom                                           │
│  │ }                                                    │
│  │                                                       │
│  ├─ statut: {                                          │
│  │   cle: string (EN_COURS, TERMINE, etc)             │
│  │   label: string (from EnumStatutProjet)            │
│  │ }                                                    │
│  │                                                       │
│  ├─ budget: number                                     │
│  ├─ dateDebut: string | null                          │
│  ├─ dateFin: string | null                            │
│  ├─ dateEcheance: string | null                       │
│  │                                                       │
│  └─ taches: {                                          │
│      total, terminated, inProgress, pending            │
│    }                                                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
API Call
    ↓
Try Block
    ├─ Prisma queries
    ├─ Data transformation
    └─ Response formatting
    ↓
Catch Block (error)
    ├─ console.error() logged
    └─ Return 500 error response
    ↓
Hook receives response
    ├─ status 200? → setData(jsonData)
    ├─ status != 200? → setError(message)
    └─ always: setLoading(false)
```

---

## Performance Optimization

### Query Optimization
```typescript
// Single query with strategic includes
prisma.projet.findMany({
  include: {
    client: true,        // Only client data
    service: true,       // Only service data
    taches: {
      include: {
        paiements: true  // Nested include
      }
    }
  },
  orderBy: {
    dateCreation: 'desc' // Sort at DB level
  }
})
// Benefits: No N+1 query problem, sorted at DB
```

### Frontend Caching
```typescript
// Module-level cache
let projectStatsCache: ProjectsStatistics | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000

// Benefits: < 5ms for cached data, reduces API load
```

### Data Transfer
```
- Single API endpoint (not 9 separate ones)
- JSON payload: 3-5KB (gzipped: < 1KB)
- Benefits: Minimal network overhead
```

---

## Deployment Considerations

### Required for Production
- [x] TypeScript strict mode
- [x] Error handling
- [x] Type definitions
- [x] Cache strategy
- [x] Logging

### Optional Enhancements
- [ ] Monitoring/alerting
- [ ] Rate limiting
- [ ] Database connection pooling
- [ ] GraphQL alternative
- [ ] Incremental Static Regeneration (ISR)

---

## Integration Points

```
┌─────────────────────────────────────────────┐
│ Current Integrations                         │
├─────────────────────────────────────────────┤
│                                               │
│ ✅ /projets (page exists)                   │
│    └─ KPI Cards using useProjectsStatistics │
│                                               │
│ 🔄 Potential Integrations                   │
│    ├─ /dashboard/manager                    │
│    ├─ /dashboard/employe                    │
│    ├─ Charts & Graphs                       │
│    └─ Custom Reports                        │
│                                               │
└─────────────────────────────────────────────┘
```

---

## Scalability Path

```
Current:
  └─ One endpoint: /api/dashboard/projets-stats
  └─ 11 projects ~3-5KB response

If 100+ projects:
  ├─ Pagination: /api/dashboard/projets-stats?page=1
  ├─ Filtering: /api/dashboard/projets-stats?statut=EN_COURS
  └─ Caching: Redis for distributed cache

If 1000+ projects:
  ├─ Elasticsearch for search
  ├─ Data warehouse for analytics
  └─ GraphQL for flexible querying
```

---

## Version Evolution

```
v1.0.0 - Initial Enum Infrastructure
  └─ 9 enum tables created
  └─ /api/enums/[type] endpoint

v2.0.0 - React Hook & Components
  └─ useEnums hook with caching
  └─ EnumSelect component
  └─ SubmitTaskForm migration

v2.1.0 - Server-side Utils
  └─ serverEnums.ts utilities
  └─ Documentation & guides

v2.2.0 - Project Stats Dashboard ← YOU ARE HERE
  └─ /api/dashboard/projets-stats
  └─ useProjectsStatistics hook
  └─ /projets page integration
```

---

**Architecture Status:** ✅ Production Ready  
**Last Updated:** 2024-12-27
