# 📊 IMPLÉMENTATION: PRÉVISION SALARIALE

**Date:** 17 Décembre 2025  
**Statut:** ✅ **Complètement Implémenté en Production**

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Modèle de données](#modèle-de-données)
4. [Flux de traitement](#flux-de-traitement)
5. [Code & Implémentation](#code--implémentation)
6. [Frontend](#frontend)
7. [API Endpoints](#api-endpoints)
8. [CRON Jobs](#cron-jobs)
9. [Configuration](#configuration)
10. [Points Clés](#points-clés)

---

## VUE D'ENSEMBLE

### Objectif
Calculer automatiquement la **prévision de salaire mensuelle** pour chaque employé basée sur:
- ✅ Heures travaillées validées (timesheets)
- ✅ Tarif horaire de l'employé
- ✅ Notifications automatiques 5 jours avant paiement

### Flux Simplifié
```
Employé soumet Timesheet (heures)
        ↓
Manager valide Timesheet (VALIDEE)
        ↓
Service recalcule PrevisionSalaire
        ↓
Formule: montantPrevu = heures_validees × tarif_horaire
        ↓
Stockage en base (model PrevisionSalaire)
        ↓
Employé voit la prévision dans son Dashboard
        ↓
5 jours avant paiement: Email + Notification
```

---

## ARCHITECTURE

### Composants Principaux

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND REACT                     │
├─────────────────────────────────────────────────────┤
│ • Dashboard Employé: /dashboard/salary-forecasts    │
│ • Panel Admin: /admin/salary-settings               │
│ • Affichage prévisions + statistiques               │
│ • Configuration tarifs                              │
└─────────────────────────────────────────────────────┘
                        ↕ HTTP
┌─────────────────────────────────────────────────────┐
│                   BACKEND API                        │
├─────────────────────────────────────────────────────┤
│ • GET /api/salary-forecasts                         │
│ • POST /api/salary-forecasts/recalculate            │
│ • GET /api/salary-forecasts/statistics              │
│ • POST /api/employees/update-tariff                 │
│ • GET /api/cron/salary-notifications (CRON)        │
└─────────────────────────────────────────────────────┘
                        ↕ SQL
┌─────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                   │
├─────────────────────────────────────────────────────┤
│ • Model: PrevisionSalaire                           │
│ • Relations: Utilisateur (tarifHoraire)             │
│ • TimeSheet (heures validées)                       │
└─────────────────────────────────────────────────────┘
                        ↕ Cron
┌─────────────────────────────────────────────────────┐
│         CRON JOB (Vercel Cron)                       │
├─────────────────────────────────────────────────────┤
│ • Exécuté quotidiennement                           │
│ • Vérifie les prévisions 5 jours avant              │
│ • Envoie emails + notifications                     │
└─────────────────────────────────────────────────────┘
```

---

## MODÈLE DE DONNÉES

### Table: PrevisionSalaire

```prisma
model PrevisionSalaire {
  id               String   @id @default(cuid())
  employeId        String   // FK vers Utilisateur
  mois             Int      // 1-12
  annee            Int      // 2025, 2026, etc.
  montantPrevu     Float    // Montant calculé
  montantNotifie   Float?   // Montant au moment notif
  dateNotification DateTime? // Date d'envoi notif
  dateGeneration   DateTime @default(now())
  dateModification DateTime @updatedAt
  
  employe          Utilisateur @relation(fields: [employeId], references: [id], onDelete: Cascade)

  @@unique([employeId, mois, annee])
  @@index([employeId])
  @@index([mois, annee])
  @@map("previsions_salaires")
}
```

### Relation Utilisateur

```prisma
model Utilisateur {
  // ... autres champs ...
  tarifHoraire      Float?              // Tarif horaire (FCFA/h)
  previsionsSalaires PrevisionSalaire[]  // Prévisions liées
  timesheets        TimeSheet[]          // Timesheets de cet employé
}
```

### Relation TimeSheet

```prisma
model TimeSheet {
  id               String          @id @default(cuid())
  date             DateTime        // Date du timesheet
  regularHrs       Int             // Heures normales
  overtimeHrs      Int?            // Heures supplémentaires
  sickHrs          Int?            // Heures maladie
  vacationHrs      Int?            // Heures congé
  statut           StatutTimeSheet @default(EN_ATTENTE)
  employeeId       String
  projectId        String
  taskId           String
  
  employee         Utilisateur     @relation("TimesheetEmploye", fields: [employeeId], references: [id])
  project          Projet          @relation("TimesheetProjet", fields: [projectId], references: [id])
  task             Tache           @relation(fields: [taskId], references: [id])

  @@map("timesheets")
}

enum StatutTimeSheet {
  EN_ATTENTE    // Soumis en attente de validation
  VALIDEE       // Validé par le manager ✓ DÉCLENCHE CALCUL
  REJETEE       // Rejeté
  CORRIGEE      // Modifié après rejet
}
```

---

## FLUX DE TRAITEMENT

### Flux 1: Création & Validation Timesheet

```
1. EMPLOYÉ crée TimeSheet
   ├─ Sélectionne date
   ├─ Rentre heures (régulières, supp, maladie, congé)
   ├─ POST /api/timesheets
   └─ TimeSheet créé avec statut: EN_ATTENTE

2. API retourne: { id, statut: "EN_ATTENTE" }

3. MANAGER valide TimeSheet
   ├─ Accède à /timesheets/validation
   ├─ Examine le timesheet EN_ATTENTE
   ├─ Clique "Valider"
   ├─ PATCH /api/timesheets/{id}/validate
   └─ TimeSheet.statut = VALIDEE

4. BACKEND (dans route /api/timesheets/{id}/validate):
   ├─ Récupère le TimeSheet
   ├─ Met à jour: statut = VALIDEE
   └─ APPELLE: calculateSalaryForecast(employeeId, month, year)

5. SERVICE: calculateSalaryForecast()
   ├─ Récupère employé (avec tarifHoraire)
   ├─ Récupère TOUS les TimeSheet VALIDEES du mois
   ├─ Additionne les heures validées
   ├─ Calcule: montant = totalHeures × tarifHoraire
   ├─ Cherche PrevisionSalaire existante (mois/année/employé)
   ├─ Si existe: UPDATE montantPrevu
   ├─ Si n'existe pas: CREATE nouvelle prévision
   └─ Retourne: { montantPrevu, mois, annee }

6. EMPLOYÉ voit la mise à jour
   ├─ Dashboard se rafraîchit
   ├─ Affiche: "Prévision: 2 400€ pour Décembre 2025"
   └─ Historique mise à jour
```

### Flux 2: Notification 5 Jours Avant Paiement

```
CRON JOB (exécution quotidienne):

1. GET /api/cron/salary-notifications
   └─ Récupère TOUTES les PrevisionSalaires

2. FOR EACH prévision:
   ├─ Calcule: datePaiement = dateNotification + 5 jours
   ├─ SI dateNotification = TODAY - 5 jours:
   │  ├─ ET dateNotification est null:
   │  │  └─ Prépare notification
   │  └─ SINON: saute
   └─ ELSE: continue

3. SI notification à envoyer:
   ├─ Crée Notification (in-app)
   │  ├─ titre: "Prévision salariale"
   │  ├─ message: "Votre salaire du mois xxx est estimé à xxxxx FCFA"
   │  ├─ type: INFO
   │  └─ utilisateurId: employeeId
   │
   ├─ Envoie Email (Nodemailer)
   │  ├─ To: employe.email
   │  ├─ Subject: "Prévision Salariale - Janvier 2025"
   │  └─ Body: "Bonjour XXX, votre salaire est estimé à xxx FCFA..."
   │
   ├─ Met à jour PrevisionSalaire
   │  ├─ dateNotification = TODAY
   │  ├─ montantNotifie = montantPrevu (snapshot)
   │  └─ Marque comme notifiée
   │
   └─ Log: "Notification envoyée pour XXX - xxx€"

4. Retour: { success: true, notified: N }
```

---

## CODE & IMPLÉMENTATION

### 1. Service: SalaryForecastService

**Fichier:** `lib/services/salaryForecasting/salaryForecastService.ts`

```typescript
// Interface
interface SalaryForecastData {
  employeeId: string
  month: number        // 1-12
  year: number         // 2025
  montantPrevu: number // Calculé
  tarifHoraire: number
  totalHours: number
}

// Fonction principale
export async function calculateSalaryForecast(
  employeeId: string,
  month: number,
  year: number
): Promise<SalaryForecastData> {
  
  // 1. Récupérer l'employé avec tarif horaire
  const employee = await prisma.utilisateur.findUnique({
    where: { id: employeeId },
    select: { 
      id: true, 
      email: true,
      prenom: true,
      nom: true,
      tarifHoraire: true 
    }
  })
  
  if (!employee || !employee.tarifHoraire) {
    throw new Error('Employee or hourly rate not found')
  }

  // 2. Récupérer tous les timesheets VALIDEES du mois
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  const timesheets = await prisma.timeSheet.findMany({
    where: {
      employeeId: employeeId,
      statut: 'VALIDEE',
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // 3. Calculer le total des heures
  const totalHours = timesheets.reduce((sum, ts) => {
    return sum + 
      (ts.regularHrs || 0) + 
      (ts.overtimeHrs || 0) + 
      (ts.sickHrs || 0) + 
      (ts.vacationHrs || 0)
  }, 0)

  // 4. Calculer le montant
  const montantPrevu = totalHours * employee.tarifHoraire

  // 5. Créer ou mettre à jour la prévision en base
  const prevision = await prisma.previsionSalaire.upsert({
    where: {
      employeId_mois_annee: {
        employeId,
        mois: month,
        annee: year
      }
    },
    update: {
      montantPrevu,
      dateModification: new Date()
    },
    create: {
      employeId,
      mois: month,
      annee: year,
      montantPrevu,
      dateGeneration: new Date()
    }
  })

  return {
    employeeId,
    month,
    year,
    montantPrevu,
    tarifHoraire: employee.tarifHoraire,
    totalHours
  }
}

// Fonction pour envoyer notifications
export async function sendSalaryNotifications() {
  // Récupérer les prévisions pas encore notifiées 5 jours avant
  const prévisions = await prisma.previsionSalaire.findMany({
    where: {
      dateNotification: null
    },
    include: {
      employe: { select: { email: true, prenom: true, nom: true } }
    }
  })

  const now = new Date()
  let notified = 0

  for (const prev of prévisions) {
    // Calculer la date de notification (5 jours avant paiement)
    const paymentDate = calculatePaymentDate(prev.mois, prev.annee)
    const notificationDate = new Date(paymentDate)
    notificationDate.setDate(notificationDate.getDate() - 5)

    if (isSameDay(now, notificationDate)) {
      // Envoyer email
      await sendEmail({
        to: prev.employe.email,
        subject: `Prévision Salariale - ${getMonthName(prev.mois)}`,
        body: `Votre salaire estimé: ${prev.montantPrevu} FCFA`
      })

      // Créer notification in-app
      await prisma.notification.create({
        data: {
          utilisateurId: prev.employeId,
          titre: 'Prévision Salariale',
          message: `Votre prévision salariale pour ${getMonthName(prev.mois)} est ${prev.montantPrevu} FCFA`,
          type: 'INFO',
          sourceId: prev.id,
          sourceType: 'PREVISION_SALAIRE'
        }
      })

      // Marquer comme notifiée
      await prisma.previsionSalaire.update({
        where: { id: prev.id },
        data: {
          dateNotification: now,
          montantNotifie: prev.montantPrevu
        }
      })

      notified++
    }
  }

  return { success: true, notified }
}
```

### 2. API Route: POST /api/timesheets/{id}/validate

**Fichier:** `app/api/timesheets/[id]/validate/route.ts`

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Récupérer le timesheet
    const timesheet = await prisma.timeSheet.findUnique({
      where: { id: params.id },
      include: { employee: { select: { tarifHoraire: true } } }
    })

    if (!timesheet) {
      return NextResponse.json({ error: 'TimeSheet not found' }, { status: 404 })
    }

    // 2. Mettre à jour le statut
    const updated = await prisma.timeSheet.update({
      where: { id: params.id },
      data: { statut: 'VALIDEE' }
    })

    // 3. DÉCLENCHER LE CALCUL DE PRÉVISION SALARIALE
    const month = updated.date.getMonth() + 1
    const year = updated.date.getFullYear()

    const forecast = await calculateSalaryForecast(
      updated.employeeId,
      month,
      year
    )

    return NextResponse.json({
      success: true,
      timesheet: updated,
      forecast: forecast
    })

  } catch (error) {
    console.error('Error validating timesheet:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 3. API Route: GET /api/cron/salary-notifications

**Fichier:** `app/api/cron/salary-notifications/route.ts`

```typescript
export async function GET(request: Request) {
  // Vérifier CRON_SECRET pour sécurité
  const secret = request.headers.get('authorization')
  
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Appeler le service
    const result = await sendSalaryNotifications()
    
    return NextResponse.json({
      success: true,
      notified: result.notified,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
```

### 4. API Route: GET /api/salary-forecasts

**Fichier:** `app/api/salary-forecasts/route.ts`

```typescript
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer toutes les prévisions de l'employé courant
    const forecasts = await prisma.previsionSalaire.findMany({
      where: {
        employeId: session.user.id
      },
      orderBy: [
        { annee: 'desc' },
        { mois: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: forecasts,
      count: forecasts.length
    })

  } catch (error) {
    console.error('Error fetching forecasts:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## FRONTEND

### 1. Dashboard Employé: /dashboard/salary-forecasts

**Fichier:** `app/dashboard/salary-forecasts/page.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function SalaryForecastsPage() {
  const { data: session } = useSession()
  const [forecasts, setForecasts] = useState<PrevisionSalaire[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    currentMonth: 0,
    nextMonth: 0,
    total3Months: 0,
    average: 0
  })

  useEffect(() => {
    fetchForecasts()
  }, [])

  const fetchForecasts = async () => {
    try {
      const res = await fetch('/api/salary-forecasts')
      const data = await res.json()
      
      setForecasts(data.data)
      
      // Calculer les stats
      calculateStats(data.data)
    } catch (error) {
      console.error('Error fetching forecasts:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (forecasts: PrevisionSalaire[]) => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const current = forecasts.find(
      f => f.mois === currentMonth && f.annee === currentYear
    )?.montantPrevu || 0

    const next = forecasts.find(
      f => f.mois === (currentMonth % 12) + 1 && 
          f.annee === (currentMonth === 12 ? currentYear + 1 : currentYear)
    )?.montantPrevu || 0

    const last3 = forecasts
      .slice(0, 3)
      .reduce((sum, f) => sum + f.montantPrevu, 0)

    const average = last3 / Math.min(3, forecasts.length)

    setStats({
      currentMonth: current,
      nextMonth: next,
      total3Months: last3,
      average
    })
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className="salary-forecasts">
      <h1>Mes Prévisions Salariales</h1>

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatCard 
          label="Ce mois" 
          value={`${stats.currentMonth} FCFA`}
          icon="📅"
        />
        <StatCard 
          label="Mois prochain" 
          value={`${stats.nextMonth} FCFA`}
          icon="📆"
        />
        <StatCard 
          label="Total 3 mois" 
          value={`${stats.total3Months} FCFA`}
          icon="💰"
        />
        <StatCard 
          label="Moyenne" 
          value={`${stats.average.toFixed(2)} FCFA`}
          icon="📊"
        />
      </div>

      {/* Tableau */}
      <div className="forecasts-table">
        <table>
          <thead>
            <tr>
              <th>Mois</th>
              <th>Année</th>
              <th>Montant Prévu</th>
              <th>Notifié</th>
              <th>Date Notification</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map((forecast) => (
              <tr key={`${forecast.mois}-${forecast.annee}`}>
                <td>{getMonthName(forecast.mois)}</td>
                <td>{forecast.annee}</td>
                <td className="amount">{forecast.montantPrevu} FCFA</td>
                <td>{forecast.dateNotification ? '✅' : '⏳'}</td>
                <td>{forecast.dateNotification ? 
                  new Date(forecast.dateNotification).toLocaleDateString('fr-FR')
                  : 'À venir'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 2. Panel Admin: /admin/salary-settings

**Fichier:** `app/admin/salary-settings/page.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react'

export default function SalarySettingsPage() {
  const [employees, setEmployees] = useState([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tariff, setTariff] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleUpdateTariff = async (employeeId: string) => {
    try {
      const res = await fetch('/api/employees/update-tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          tarifHoraire: parseFloat(tariff)
        })
      })

      if (res.ok) {
        alert('Tarif mis à jour!')
        setEditingId(null)
        fetchEmployees()
      }
    } catch (error) {
      console.error('Error updating tariff:', error)
    }
  }

  return (
    <div className="salary-settings">
      <h1>Configuration des Tarifs Horaires</h1>

      <table>
        <thead>
          <tr>
            <th>Employé</th>
            <th>Email</th>
            <th>Tarif Horaire (FCFA/h)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp: any) => (
            <tr key={emp.id}>
              <td>{emp.prenom} {emp.nom}</td>
              <td>{emp.email}</td>
              <td>
                {editingId === emp.id ? (
                  <input 
                    type="number"
                    value={tariff}
                    onChange={(e) => setTariff(e.target.value)}
                    placeholder="Ex: 15.50"
                  />
                ) : (
                  emp.tarifHoraire || 'Non défini'
                )}
              </td>
              <td>
                {editingId === emp.id ? (
                  <>
                    <button onClick={() => handleUpdateTariff(emp.id)}>
                      ✅ Sauvegarder
                    </button>
                    <button onClick={() => setEditingId(null)}>
                      ❌ Annuler
                    </button>
                  </>
                ) : (
                  <button onClick={() => {
                    setEditingId(emp.id)
                    setTariff(emp.tarifHoraire || '')
                  }}>
                    ✏️ Modifier
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## API ENDPOINTS

### GET /api/salary-forecasts
Récupère les prévisions de l'employé courant

**Paramètres:** Aucun  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "employeId": "xxx",
      "mois": 12,
      "annee": 2025,
      "montantPrevu": 2400,
      "montantNotifie": 2400,
      "dateNotification": "2025-12-20T10:30:00Z",
      "dateGeneration": "2025-12-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/salary-forecasts/recalculate
Recalcule la prévision pour un mois spécifique (Admin)

**Body:**
```json
{
  "employeeId": "xxx",
  "month": 12,
  "year": 2025
}
```

**Response:**
```json
{
  "success": true,
  "forecast": {
    "employeeId": "xxx",
    "month": 12,
    "year": 2025,
    "montantPrevu": 2400,
    "tarifHoraire": 15,
    "totalHours": 160
  }
}
```

### GET /api/salary-forecasts/statistics/[employeeId]
Récupère les statistiques d'un employé

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalForecasts": 12,
    "averageMonthly": 2350,
    "maxMonth": 2500,
    "minMonth": 2000,
    "notifiedCount": 8,
    "pendingCount": 4
  }
}
```

### POST /api/employees/update-tariff
Met à jour le tarif horaire d'un employé (Admin)

**Body:**
```json
{
  "employeeId": "xxx",
  "tarifHoraire": 15.50
}
```

**Response:**
```json
{
  "success": true,
  "employee": {
    "id": "xxx",
    "email": "xxx",
    "tarifHoraire": 15.50
  }
}
```

### GET /api/cron/salary-notifications
Envoie les notifications 5 jours avant (CRON only)

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "notified": 5,
  "timestamp": "2025-12-17T10:30:00Z"
}
```

---

## CRON JOBS

### Configuration Vercel

**Fichier:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/salary-notifications",
      "schedule": "0 0 * * *"  // Quotidiennement à minuit
    }
  ]
}
```

### Exécution Locale

Pour tester localement:
```bash
# Définir le secret
export CRON_SECRET="your-secret-key"

# Exécuter via cURL
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/salary-notifications
```

---

## CONFIGURATION

### 1. Ajouter CRON_SECRET au .env

```bash
# .env.local
CRON_SECRET=your-secret-generated-key

# Générer une clé
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Exécuter les migrations

```bash
npx prisma migrate dev --name add_salary_forecast
```

### 3. Configurer les tarifs horaires

Accéder à `/admin/salary-settings` et remplir les tarifs pour chaque employé.

### 4. Tester le système

```bash
# Créer un timesheet de test
# Valider le timesheet
# Vérifier que la prévision est calculée
# Vérifier le dashboard de l'employé
```

---

## POINTS CLÉS

### ✅ Points d'Implémentation

1. **Déclenchement Automatique**
   - La prévision se calcule AUTOMATIQUEMENT quand le manager valide le timesheet
   - Aucune action supplémentaire requise

2. **Formule de Calcul**
   ```
   montantPrevu = (regularHrs + overtimeHrs + sickHrs + vacationHrs) × tarifHoraire
   ```

3. **Notifications 5 Jours Avant**
   - CRON job quotidien
   - Envoie email + notification in-app
   - Marque comme notifiée pour éviter les doublons

4. **Sécurité**
   - CRON_SECRET protège l'endpoint
   - Utilisateurs ne voient que leurs propres prévisions
   - Admins peuvent voir/modifier les tarifs

5. **Performance**
   - Indexes sur employeId, mois, annee
   - Query optimisée (upsert en une transaction)
   - Caching possible au niveau frontend

### ⚠️ Limitations & Cas Limites

| Cas | Comportement |
|-----|-------------|
| Employé sans tarif | ❌ Erreur au calcul - Admin doit remplir |
| Mois sans timesheet | ✓ Prévision = 0 FCFA |
| Timesheet rejeté | ✓ Heures pas comptabilisées |
| Modification après notification | ✓ Montant notifié sauvegardé, montantPrevu mis à jour |
| Tarif modifié mid-mois | ✓ Recalcul avec nouveau tarif à la prochaine validation |

### 🔄 Flux de Données Complet

```
TimeSheet validation
       ↓ (VALIDEE)
Appel calculateSalaryForecast()
       ↓
Récup timesheets validées du mois
       ↓
Somme des heures
       ↓
Multiplier par tarif horaire
       ↓
Upsert PrevisionSalaire
       ↓
Dashboard employé affiche prévision
       ↓ (5 jours avant paiement)
Cron détecte date notif
       ↓
Envoie email + notification
       ↓
Marque dateNotification + montantNotifie
```

---

**Document complet sur l'implémentation de la prévision salariale - 17 Décembre 2025**
