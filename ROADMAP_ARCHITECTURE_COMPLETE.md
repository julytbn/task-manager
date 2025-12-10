# 🚀 ROADMAP COMPLÈTE — Architecture Modulaire CRM/ERP

**Date**: 10 Décembre 2025  
**Projet**: Kekeli Group - Platform Intégrée  
**Statut**: En Planification  

---

## 📋 Vue d'ensemble

Ce document détaille les **18 étapes** pour transformer le projet en une plateforme intégrée (CRM + ERP + Facturation + Dashboard) avec support complet pour :
- ✅ Clients et documents
- ✅ Services et abonnements
- ✅ Projets et tâches
- ✅ **Devis (nouveau)**
- ✅ **Feuilles de temps / Timesheets (nouveau)**
- ✅ **Charges et comptabilité (nouveau)**
- ✅ Factures et paiements (amélioré)
- ✅ Dashboard analytique

---

## 🧩 Structure Modulaire

```
/src
├── /modules
│   ├── /crm
│   │   ├── /controllers
│   │   ├── /services
│   │   ├── /routes
│   │   └── /types
│   ├── /projects
│   ├── /billing
│   ├── /accounting
│   ├── /timesheets
│   ├── /dashboard
│   └── /shared (types, utils, middleware)
├── /api (endpoints REST)
├── /components (React)
├── /pages (Next.js ou routes)
├── /hooks
├── /utils
└── /styles
```

---

## ✅ Modèles Prisma — Ajouts/Modifications

### Nouveaux Modèles

#### 1. **Devis** (Quotes/Estimates)
```prisma
model Devis {
  id            String          @id @default(cuid())
  numero        String          @unique
  clientId      String
  titre         String?
  description   String?
  montant       Float
  tauxTVA       Float           @default(0.18)
  montantTotal  Float
  statut        StatutDevis     @default(BROUILLON)
  dateCreation  DateTime        @default(now())
  dateEnvoi     DateTime?
  dateAccept    DateTime?
  dateRefus     DateTime?
  notes         String?
  
  client        Client          @relation(fields: [clientId], references: [id])
  services      DevisService[]
  projets       Projet[]        @relation("DevisAuProjet")
}

model DevisService {
  id        String    @id @default(cuid())
  devisId   String
  serviceId String
  quantite  Int       @default(1)
  prix      Float?
  
  devis     Devis     @relation(fields: [devisId], references: [id], onDelete: Cascade)
  service   Service   @relation(fields: [serviceId], references: [id], onDelete: Restrict)
}
```

**Statuts Devis**: BROUILLON → ENVOYE → ACCEPTE (ou REFUS/ANNULE)

---

#### 2. **Charge** (Expenses/Operating Costs)
```prisma
model Charge {
  id              String            @id @default(cuid())
  montant         Float
  categorie       CategorieCharge
  description     String?
  date            DateTime          @default(now())
  projetId        String?           // Optionnel
  employeId       String?           // Optionnel
  justificatifUrl String?
  notes           String?
  dateCreation    DateTime          @default(now())
  
  projet          Projet?           @relation(fields: [projetId], references: [id], onDelete: SetNull)
  employe         Utilisateur?      @relation("ChargesEmploye", fields: [employeId], references: [id], onDelete: SetNull)
}
```

**Catégories de Charges**:
- SALAIRES_CHARGES_SOCIALES
- LOYER_IMMOBILIER
- UTILITIES (électricité, eau, internet)
- MATERIEL_EQUIPEMENT (ordinateurs, mobilier)
- TRANSPORT_DEPLACEMENT
- FOURNITURES_BUREAUTIQUE
- MARKETING_COMMUNICATION
- ASSURANCES
- TAXES_IMPOTS
- AUTRES_CHARGES

---

#### 3. **TimeSheet** (Feuilles de Temps)
```prisma
model TimeSheet {
  id              String            @id @default(cuid())
  date            DateTime
  regularHrs      Int               // heures normales
  overtimeHrs     Int?              // heures supplémentaires
  sickHrs         Int?              // maladie
  vacationHrs     Int?              // congés
  description     String?
  statut          StatutTimeSheet   @default(EN_ATTENTE)
  employeeId      String
  taskId          String
  projectId       String
  dateCreation    DateTime          @default(now())
  validePar       String?           // ID du manager
  
  employee        Utilisateur       @relation("TimesheetEmploye", fields: [employeeId], references: [id])
  task            Tache             @relation(fields: [taskId], references: [id], onDelete: Cascade)
  project         Projet            @relation("TimesheetProjet", fields: [projectId], references: [id], onDelete: Cascade)
  valideParUser   Utilisateur?      @relation("TimesheetValidatePar", fields: [validePar], references: [id], onDelete: SetNull)
}
```

**Statuts TimeSheet**: EN_ATTENTE → VALIDEE (ou REJETEE/CORRIGEE)

---

### Modifications d'Existants

#### **Projet** — Ajouts
```prisma
model Projet {
  // ... existants ...
  devisId           String?           // NEW : lien optionnel vers devis
  // ... relations existantes ...
  devis             Devis?            @relation("DevisAuProjet", fields: [devisId], references: [id], onDelete: SetNull)
  charges           Charge[]          // NEW
  timesheets        TimeSheet[]       @relation("TimesheetProjet")  // NEW
}
```

#### **Client** — Ajout
```prisma
model Client {
  // ... existants ...
  devis             Devis[]           // NEW
}
```

#### **Service** — Ajout
```prisma
model Service {
  // ... existants ...
  devisServices    DevisService[]   @relation("ServicesInDevis")  // NEW
}
```

#### **Utilisateur** — Ajouts
```prisma
model Utilisateur {
  // ... existants ...
  timesheets           TimeSheet[]     @relation("TimesheetEmploye")  // NEW
  timesheetsValidees   TimeSheet[]     @relation("TimesheetValidatePar")  // NEW
  charges              Charge[]        @relation("ChargesEmploye")  // NEW
}
```

#### **Tache** — Pas de changement requis
```
serviceId est déjà optionnel (String?)
```

---

## 🔄 Étapes Détaillées

### **Étape 3 — ✅ COMPLÉTÉE : Ajouter modèles Prisma**

**Fichier modifié** : `prisma/schema.prisma`  
**Changements** :
- ✅ Ajout modèles `Devis`, `DevisService`
- ✅ Ajout modèle `Charge` avec `CategorieCharge` enum
- ✅ Ajout modèle `TimeSheet` avec `StatutTimeSheet` enum
- ✅ Modification `Projet` (ajout devisId, relations charges/timesheets)
- ✅ Modification `Service` (ajout devisServices)
- ✅ Modification `Client` (ajout devis)
- ✅ Modification `Utilisateur` (ajout timesheets, charges)

**Prochaine action** : Étape 4 — Migrations Prisma

---

### **Étape 4 — Préparer migrations DB**

**Fichiers à créer** :
```
prisma/migrations/[timestamp]_add_devis_charge_timesheet/migration.sql
```

**Commandes** :
```bash
# Générer la migration
cd task-manager
npx prisma migrate dev --name add_devis_charge_timesheet

# Ou en production (sans créer de seed):
npx prisma migrate deploy
```

**Validation** :
- ✅ Migration crée les tables : `devis`, `devis_services`, `charges`, `timesheets`
- ✅ Contraintes et index présents
- ✅ Relations foreign keys OK

**Scripts de migration (optionnel)** :
```
scripts/migrateLegacyDevis.ts   # Si conversion de projets existants en devis
scripts/seedCategoriesCharges.ts # Seed des catégories enum
```

---

### **Étape 5 — Implémenter services backend (ORM)**

**Dossiers** :
```
src/modules/
├── accounting/
│   ├── services/
│   │   ├── chargeService.ts          # CRUD charges
│   │   └── aggregationService.ts     # Recettes vs Charges
│   ├── controllers/
│   │   └── chargeController.ts
│   └── routes/
│       └── chargeRoutes.ts
├── billing/
│   ├── services/
│   │   ├── devisService.ts           # CRUD devis
│   │   └── invoiceService.ts         # Génération factures
│   ├── controllers/
│   │   ├── devisController.ts
│   │   └── invoiceController.ts
│   └── routes/
├── timesheets/
│   ├── services/
│   │   ├── timesheetService.ts       # CRUD timesheets
│   │   ├── aggregationService.ts     # Heures par projet/employé
│   │   └── costCalculationService.ts # Calcul charges internes
│   ├── controllers/
│   │   └── timesheetController.ts
│   └── routes/
```

**Fichiers à créer** :
- ✅ `src/modules/accounting/services/chargeService.ts`
- ✅ `src/modules/accounting/services/aggregationService.ts`
- ✅ `src/modules/billing/services/devisService.ts`
- ✅ `src/modules/billing/services/invoiceService.ts` (amélioré)
- ✅ `src/modules/timesheets/services/timesheetService.ts`
- ✅ `src/modules/timesheets/services/costCalculationService.ts`
- ✅ Controllers correspondants

**Méthodes clés** :

```typescript
// chargeService.ts
async createCharge(data: CreateChargeDTO): Promise<Charge>
async getCharges(filters: ChargeFilters): Promise<Charge[]>
async getChargesByProject(projectId: string): Promise<Charge[]>
async getTotalCharges(startDate: Date, endDate: Date): Promise<number>

// devisService.ts
async createDevis(data: CreateDevisDTO): Promise<Devis>
async updateDevisStatus(devisId: string, statut: StatutDevis): Promise<Devis>
async convertDevisToProject(devisId: string): Promise<Projet>

// timesheetService.ts
async createTimesheet(data: CreateTimesheetDTO): Promise<TimeSheet>
async validateTimesheet(timesheetId: string, managerId: string): Promise<TimeSheet>
async getTimesheetsByEmployee(employeeId: string, dateRange: DateRange): Promise<TimeSheet[]>
async getTotalHoursByProject(projectId: string): Promise<number>

// aggregationService.ts
async getProjectProfitability(projectId: string): Promise<ProjectProfitReport>
async getCompanyMonthlyReport(month: Date): Promise<MonthlyFinancialReport>
async getMonthlyRevenueVsExpenses(month: Date): Promise<RevenueVsExpenseReport>
```

---

### **Étape 6 — API REST Endpoints**

**Devis Endpoints** :
```
POST   /api/devis                    # Créer devis
GET    /api/devis                    # Lister devis
GET    /api/devis/:id                # Détail devis
PATCH  /api/devis/:id                # Modifier devis
DELETE /api/devis/:id                # Supprimer devis
PATCH  /api/devis/:id/status         # Changer statut
POST   /api/devis/:id/convert        # Convertir en projet
```

**Charges Endpoints** :
```
POST   /api/charges                  # Créer charge
GET    /api/charges                  # Lister charges
GET    /api/charges/:id              # Détail charge
PATCH  /api/charges/:id              # Modifier charge
DELETE /api/charges/:id              # Supprimer charge
GET    /api/charges/by-category      # Charges par catégorie
GET    /api/charges/by-project/:id   # Charges du projet
```

**TimeSheet Endpoints** :
```
POST   /api/timesheets               # Créer timesheet
GET    /api/timesheets               # Lister timesheets
GET    /api/timesheets/:id           # Détail timesheet
PATCH  /api/timesheets/:id           # Modifier timesheet
DELETE /api/timesheets/:id           # Supprimer timesheet
PATCH  /api/timesheets/:id/validate  # Valider timesheet
GET    /api/timesheets/by-employee/:id  # Timesheets de l'employé
GET    /api/timesheets/by-project/:id   # Timesheets du projet
GET    /api/timesheets/hours-summary    # Résumé heures (projet/employé)
```

**Invoicing Endpoints** (Amélioration) :
```
POST   /api/invoices/from-project    # Générer facture depuis projet
POST   /api/invoices/from-subscription  # Générer depuis abonnement
POST   /api/invoices/from-devis      # Générer depuis devis
```

---

### **Étape 7 — Moteur de Facturation**

**Fichiers** :
```
src/modules/billing/services/
├── invoiceService.ts                # Logique générale
├── recurringInvoiceService.ts       # Factures récurrentes (abonnements)
└── invoiceGenerationWorker.ts       # Job CRON
```

**Logique** :

#### Facturation depuis Abonnement (Récurrente)
```typescript
// Job CRON daily
async generateRecurringInvoices() {
  const abonnements = await prisma.abonnement.findMany({
    where: {
      statut: 'ACTIF',
      dateProchainFacture: { lte: new Date() }
    }
  })
  
  for (const abonnement of abonnements) {
    const facture = await createInvoiceFromSubscription(abonnement)
    // Mettre à jour dateProchainFacture selon FrequencePaiement
    // Créer notification
    // Envoyer email
  }
}
```

#### Facturation depuis Projet
```typescript
async generateInvoiceFromProject(projectId: string) {
  const projet = await prisma.projet.findUnique({
    include: { projetServices: true, taches: true }
  })
  
  const montant = calculateProjectTotal(projet)
  
  const facture = await prisma.facture.create({
    data: {
      numero: generateInvoiceNumber(),
      clientId: projet.clientId,
      projetId: projet.id,
      montant,
      montantTotal: montant * 1.18, // TVA 18%
      statut: 'EN_ATTENTE'
    }
  })
  
  return facture
}
```

#### Facturation depuis Devis
```typescript
async generateInvoiceFromDevis(devisId: string) {
  const devis = await prisma.devis.findUnique({
    include: { services: true }
  })
  
  // Devis doit être statut ACCEPTE
  if (devis.statut !== 'ACCEPTE') {
    throw new Error('Devis doit être accepté')
  }
  
  const facture = await prisma.facture.create({
    data: {
      numero: generateInvoiceNumber(),
      clientId: devis.clientId,
      montant: devis.montant,
      montantTotal: devis.montantTotal,
      statut: 'EN_ATTENTE'
    }
  })
  
  return facture
}
```

---

### **Étape 8 — TimeSheet Aggregation & Costing**

**Fichiers** :
```
src/modules/timesheets/services/
├── aggregationService.ts
└── costCalculationService.ts
```

**Logique** :

```typescript
// aggregationService.ts
async getTotalHoursByProject(projectId: string): Promise<{
  regularHrs: number
  overtimeHrs: number
  totalHrs: number
  byEmployee: Array<{ employeeId: string, hours: number }>
}> {
  // Agréger toutes les timesheets du projet
}

async getTotalHoursByEmployee(employeeId: string, startDate: Date, endDate: Date): Promise<{
  regularHrs: number
  overtimeHrs: number
  sickHrs: number
  vacationHrs: number
}> {
  // Résumé des heures de l'employé
}

// costCalculationService.ts
async calculateProjectInternalCost(projectId: string): Promise<{
  totalHours: number
  costPerHour: number  // Coût moyen par employé
  totalCost: number    // totalHours * costPerHour
}> {
  const timesheets = await getTimesheetsByProject(projectId)
  const employees = extractUniqueEmployees(timesheets)
  
  // Pour chaque employé: récupérer salaire/taux horaire interne
  // Calculer: totalHeures * tauxHoraire
  // Somme = coût interne du projet
}

async getProjectProfitability(projectId: string): Promise<{
  revenue: number         // Facture payée
  internalCost: number    // Coûts du personnel
  externalCost: number    // Autres charges (materiel, etc)
  profit: number          // revenue - internalCost - externalCost
  marginPercent: number   // (profit / revenue) * 100
}> {
  // Combiner factures payées + charges du projet
}
```

---

### **Étape 9 — Scaffold Frontend (Routes & Navigation)**

**Structure** :
```
src/pages/
├── /crm
│   ├── clients.tsx              # Liste clients
│   ├── [clientId].tsx           # Détail client
│   └── [clientId]/documents.tsx # Documents du client
├── /projects
│   ├── index.tsx                # Liste projets
│   ├── new.tsx                  # Créer projet
│   ├── [projectId].tsx          # Détail projet
│   └── [projectId]/tasks.tsx    # Tâches du projet
├── /billing
│   ├── devis/                   # Gestion devis
│   ├── invoices/                # Gestion factures
│   └── payments/                # Gestion paiements
├── /accounting
│   ├── charges/                 # Gestion charges
│   ├── expenses/                # Rapport dépenses
│   └── reports/                 # Rapports financiers
├── /timesheets
│   ├── index.tsx                # Vue timesheets
│   └── my-timesheets.tsx        # Mes timesheets
├── /dashboard
│   ├── index.tsx                # Dashboard principal
│   ├── analytics.tsx            # Graphiques
│   └── reports.tsx              # Rapports
```

**Navigation (Layout)** :
```tsx
// components/Layout.tsx
const menuItems = [
  { label: 'CRM', href: '/crm', icon: Users },
  { label: 'Projets', href: '/projects', icon: Folder },
  { label: 'Facturation', href: '/billing', icon: FileText },
  { label: 'Comptabilité', href: '/accounting', icon: BarChart },
  { label: 'Timesheets', href: '/timesheets', icon: Clock },
  { label: 'Dashboard', href: '/dashboard', icon: Home }
]
```

---

### **Étape 10 — Pages Principales**

**À créer** :
- ✅ `/crm/clients.tsx` — Liste + Recherche + Filtres
- ✅ `/crm/[clientId].tsx` — Détail client + Projets + Factures
- ✅ `/projects/new.tsx` — Créer projet (from scratch ou from devis)
- ✅ `/projects/[projectId].tsx` — Détail + Services + Tâches
- ✅ `/billing/devis/index.tsx` — Liste devis
- ✅ `/billing/devis/new.tsx` — Créer devis
- ✅ `/billing/invoices/index.tsx` — Lister factures
- ✅ `/accounting/charges/index.tsx` — Lister charges
- ✅ `/accounting/charges/new.tsx` — Créer charge
- ✅ `/timesheets/index.tsx` — Liste timesheets
- ✅ `/timesheets/my-timesheets.tsx` — Mes timesheets (employé)

---

### **Étape 11 — Composants UI**

**Composants à créer** :
```
src/components/
├── /devis
│   ├── DevisForm.tsx
│   ├── DevisList.tsx
│   ├── DevisDetail.tsx
│   └── DevisStatusBadge.tsx
├── /charges
│   ├── ChargeForm.tsx
│   ├── ChargeList.tsx
│   ├── ChargeFilter.tsx
│   └── ChargeCategoryBadge.tsx
├── /timesheets
│   ├── TimesheetForm.tsx
│   ├── TimesheetList.tsx
│   ├── TimesheetValidation.tsx
│   ├── HoursSummary.tsx
│   └── TimesheetStatusBadge.tsx
├── /charts
│   ├── RevenueVsExpensesChart.tsx  # Line chart
│   ├── ProfitMarginChart.tsx       # Pie chart
│   ├── MonthlyTrendChart.tsx       # Area chart
│   └── ProjectProfitabilityChart.tsx
├── /dashboard
│   ├── KPICards.tsx                # Recettes, Charges, Profit
│   ├── AnalyticsGrid.tsx
│   └── QuickActions.tsx
```

---

### **Étape 12 — Synchro Temps Réel (Amélioration)**

**Amélioration polling existant** :
```typescript
// Améliorer le polling de EmployeeTasksPage.tsx
// Ajouter priorité sur les changements importants :

const POLLING_INTERVALS = {
  TASKS: 5000,              // 5s (existant)
  INVOICES: 10000,          // 10s
  PAYMENTS: 5000,           // 5s (paiements = priorité haute)
  TIMESHEETS: 15000,        // 15s
}

// Ou implémenter WebSocket optionnel pour temps réel
// src/lib/websocket/wsClient.ts
// Events: task.updated, invoice.paid, payment.received, timesheet.validated
```

---

### **Étape 13 — Analytics & Dashboard**

**Endpoints Analytics** :
```
GET /api/analytics/monthly-report
GET /api/analytics/project-profitability/:projectId
GET /api/analytics/employee-costs/:employeeId
GET /api/analytics/revenue-by-service
GET /api/analytics/expense-by-category
```

**Widgets Dashboard** :
```
- Recettes ce mois : XXX FCFA
- Charges ce mois : XXX FCFA
- Bénéfice net : XXX FCFA (marge %)
- Nombre clients actifs
- Nombre projets en cours
- Devis en attente
- Factures impayées
- Graphique Recettes vs Charges (mois)
- Graphique Rentabilité par projet
- Graphique Charges par catégorie
- Top services par revenue
```

---

### **Étape 14 — Tests**

**Backend Tests** :
```
tests/unit/
├── chargeService.test.ts
├── devisService.test.ts
├── timesheetService.test.ts
└── aggregationService.test.ts

tests/integration/
├── devis.api.test.ts
├── charges.api.test.ts
├── timesheets.api.test.ts
└── invoice-generation.test.ts
```

**Frontend Tests** :
```
tests/e2e/
├── devis.e2e.ts          # Créer → Envoyer → Accepter → Convertir en projet
├── charges.e2e.ts        # Créer charge → Lister → Filtrer
├── timesheets.e2e.ts     # Employé remplit → Manager valide
└── accounting.e2e.ts     # Consulter rapports
```

---

### **Étape 15 — CI/CD**

**GitHub Actions** :
```yaml
# .github/workflows/deploy.yml
- Test migrations Prisma
- Exécuter tests unitaires
- Exécuter tests E2E
- Build frontend
- Déployer sur serveur
```

---

### **Étape 16 — Documentation**

**Documents à créer** :
- `MIGRATION_GUIDE.md` — Guide migration DB
- `API_DOCUMENTATION.md` — Endpoints + exemples CURL
- `ARCHITECTURE.md` — Structure modules
- `CHANGELOG.md` — Changements v2.0
- `DEPLOYMENT.md` — Procédure déploiement

---

### **Étape 17 — Monitoring**

**Métriques** :
- Factures générées/échouées
- Timesheets validées/rejetées
- Taux de conversion Devis → Projets
- Performance requêtes API (ms)
- Taux de paiement (%) et délai moyen

**Alertes** :
- ⚠️ Facturation automatique échouée
- ⚠️ Timesheet non validée après 7 jours
- ⚠️ Facture non payée après 30 jours

---

### **Étape 18 — Rollout & Formation**

**Plan déploiement** :
1. Déployer sur staging
2. Tester flux complets
3. Backup production
4. Déployer migration DB en prod
5. Déployer code progressivement (feature flags si nécessaire)
6. Former utilisateurs
7. Support 24/48h après déploiement

---

## 📊 Calendrier Estimé

| Étape | Durée | Date estimée |
|-------|-------|-------------|
| 3 (Prisma) | ✅ Complété | 10 Déc |
| 4 (Migrations) | 2h | 10 Déc |
| 5 (Backend) | 16h | 11-13 Déc |
| 6 (API) | 8h | 13-14 Déc |
| 7 (Facturation) | 8h | 14-15 Déc |
| 8 (TimeSheet Agg) | 6h | 15 Déc |
| 9 (Frontend Routes) | 4h | 16 Déc |
| 10 (Pages) | 20h | 16-19 Déc |
| 11 (UI Components) | 16h | 19-22 Déc |
| 12 (WebSocket) | 8h | 22-23 Déc |
| 13 (Analytics) | 12h | 23-24 Déc |
| 14 (Tests) | 16h | 26-27 Déc |
| 15 (CI/CD) | 4h | 27 Déc |
| 16 (Docs) | 4h | 28 Déc |
| 17 (Monitoring) | 4h | 28 Déc |
| 18 (Rollout) | 4h | 29 Déc |
| **Total** | **~152h** | **10-29 Déc** |

---

## 🎯 Priorités

### Phase 1 — MVP (10-17 Déc) : Étapes 3-8
- ✅ Schéma DB
- ✅ Backend services
- ✅ API endpoints
- ✅ Facturation récurrente

### Phase 2 — UI (18-22 Déc) : Étapes 9-11
- ✅ Navigation & pages
- ✅ Formulaires
- ✅ Listes & filtres

### Phase 3 — Analytics & Rollout (23-29 Déc) : Étapes 12-18
- ✅ Dashboard
- ✅ Graphs
- ✅ Tests & déploiement

---

## 🔗 Commandes Rapides

```bash
# Générer migration
npx prisma migrate dev --name add_devis_charge_timesheet

# Seed données (optionnel)
npx prisma db seed

# Builder projet
npm run build

# Démarrer dev server
npm run dev

# Tests
npm run test
npm run test:e2e
```

---

## ✨ Bénéfices Finaux

| Aspect | Avant | Après |
|--------|-------|-------|
| **Gestion clients** | ✅ Basique | ✅ Complète (CRM) |
| **Projets & tâches** | ✅ En place | ✅ Amélioré |
| **Devis** | ❌ Absent | ✅ Complet |
| **Timesheets** | ❌ Absent | ✅ Complet |
| **Charges** | ❌ Absent | ✅ Complet |
| **Facturation** | ✅ Manuelle | ✅ Automatique (récurrente) |
| **Analytics** | ❌ Absent | ✅ Dashboards riches |
| **Rentabilité** | ❌ Inconnu | ✅ Mesurable |
| **Maintenance** | ⚠️ Difficile | ✅ Modulaire |

---

**Status**: 🟡 En Cours (Étape 3 complétée)  
**Prochaine action**: Étape 4 — Générer migrations Prisma
