# 📝 Code Snippet: Intégrer le composant au Dashboard

## Étape 1: Importer le composant

```tsx
// app/dashboard/manager-dashboard.tsx

"use client"
import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, Clock, DollarSign, TrendingUp } from 'lucide-react'
import DashboardAgenda from '@/components/dashboard/DashboardAgenda'
import DashboardTasks from '@/components/dashboard/DashboardTasks'
import DashboardPayments from '@/components/dashboard/DashboardPayments'
import DashboardPerformance from '@/components/dashboard/DashboardPerformance'
import LatePaymentAlerts from '@/components/dashboard/LatePaymentAlerts'  // ← AJOUTER CETTE LIGNE
import { useProjectsStatistics } from '@/lib/useProjectsStatistics'
```

## Étape 2: Ajouter le composant dans le JSX

```tsx
export default function ManagerDashboard() {
  // ... code existant ...

  return (
    <div className="p-6">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      </div>

      {/* Cards statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ... statistic cards ... */}
      </div>

      {/* ✅ AJOUTER: Alertes de paiements en retard */}
      <div className="mb-8">
        <LatePaymentAlerts 
          compact={false}
          onRefresh={() => console.log('Paiements rafraîchis')}
        />
      </div>

      {/* Sections existantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DashboardTasks compact={true} />
        <DashboardPayments compact={true} />
      </div>

      {/* ... autres composants ... */}
    </div>
  )
}
```

## Variantes d'affichage

### Variant 1: Compact (Mode tableau de bord complet)

```tsx
<LatePaymentAlerts compact={true} />
```

**Affiche:**
- 3 paiements maximum
- Cropped view
- Badge de retard coloré

### Variant 2: Full (Mode détaillé)

```tsx
<LatePaymentAlerts compact={false} />
```

**Affiche:**
- Tableau complet
- Tous les paiements en retard
- Bouton "Relancer" pour chaque

### Variant 3: Avec callback

```tsx
<LatePaymentAlerts 
  compact={false}
  onRefresh={() => {
    // Faire quelque chose quand on rafraîchit
    console.log('Paiements vérifiés!')
    // Par exemple: afficher un toast
    // toast.success('Vérification effectuée')
  }}
/>
```

---

## Configuration du CRON Job (Optionnel)

### Fichier 1: Créer l'API endpoint

**File:** `app/api/cron/check-late-payments.ts`

```typescript
import { NextResponse } from 'next/server'
import { checkAndNotifyLatePayments } from '@/lib/paymentLateService'

/**
 * CRON job endpoint pour vérifier les paiements en retard
 * Appelé automatiquement par Vercel chaque jour à 09:00 UTC
 */
export async function GET(request: Request) {
  // Sécurité: vérifier le secret
  const authHeader = request.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
  
  if (authHeader !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('🔔 [CRON] Vérification des paiements en retard...')
    
    const result = await checkAndNotifyLatePayments()
    
    console.log(`✅ [CRON] ${result.latePaymentsCount} paiements en retard détectés`)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Vérification effectuée: ${result.latePaymentsCount} paiements en retard détectés`,
      latePaymentsCount: result.latePaymentsCount,
      details: result.latePayments,
    })
  } catch (error) {
    console.error('❌ [CRON] Erreur:', error)
    return NextResponse.json(
      { error: 'Failed to check late payments', details: error },
      { status: 500 }
    )
  }
}

// Important pour que Vercel reconnaisse ceci comme CRON endpoint
export const runtime = 'nodejs'
```

### Fichier 2: Configuration Vercel

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check-late-payments",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Explications:**
- `path`: Route de l'API à appeler
- `schedule`: Format cron (0 9 * * * = 9h00 UTC, tous les jours)

### Fichier 3: Variables d'environnement

**File:** `.env.local`

```env
# CRON job security token
CRON_SECRET=your_secure_random_string_here_min_32_chars
```

### Fichier 4: Documentation

Ajouter à votre documentation interne:

```markdown
## CRON Job Configuration

The late payment check runs automatically:
- **Time:** Every day at 9:00 AM UTC
- **Endpoint:** `/api/cron/check-late-payments`
- **Security:** Bearer token authentication

### Testing locally
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/check-late-payments
```

---

## Layout Example avec intégration

```
┌─────────────────────────────────────────────────┐
│           MANAGER DASHBOARD                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Statistics Cards - 4 cards]                   │
│  - Total Projects | In Progress | Budget | ...  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  🔴 3 Late Payments                       │  │
│  │  Clients to follow up                     │  │
│  ├───────────────────────────────────────────┤  │
│  │  [Refresh button]                         │  │
│  │  Client    │ Late    │ Amount    │ Action │  │
│  │  Acme Corp │ 15 days │ 500k FCFA │ Follow │  │
│  │  Beta Inc  │ 22 days │ 200k FCFA │ Follow │  │
│  │  Gamma Ltd │  8 days │ 150k FCFA │ Follow │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [DashboardTasks] [DashboardPayments]           │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [DashboardAgenda]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Test Manual (Sans CRON)

Pour tester manuellement sans attendre le CRON job:

### Option 1: Via le script

```bash
npm run test:payment-late
```

### Option 2: Via curl

```bash
# Déclencher le check-late endpoint
curl http://localhost:3000/api/paiements/check-late

# Récupérer les paiements en retard
curl -X POST http://localhost:3000/api/paiements/check-late
```

### Option 3: Via le composant

Le composant se rafraîchit automatiquement toutes les 5 minutes.

---

## Debugging Tips

### 1. Vérifier que le composant charge

```tsx
<LatePaymentAlerts 
  compact={false}
/>
```

Devrait afficher soit:
- ✅ "Tous les paiements sont à jour"
- 🔴 "X paiements en retard"
- ⚠️ "Erreur lors de la récupération"

### 2. Vérifier les logs API

```typescript
// Dans check-late.ts, ajouter des logs:
console.log('Récupération des paiements...')
const result = await checkAndNotifyLatePayments()
console.log('Résultat:', result)
```

### 3. Vérifier la base de données

```bash
# Ouvrir Prisma Studio
npm run prisma:studio

# Vérifier les tables:
# - projets (frequencePaiement)
# - paiements (datePaiementAttendu, notificationEnvoyee)
# - notifications (créées automatiquement)
```

### 4. Vérifier le CRON job

```bash
# Voir les logs dans Vercel dashboard
# ou tester manuellement:
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/check-late-payments
```

---

## Troubleshooting

### "Composant ne s'affiche pas"
- [ ] Vérifier l'import
- [ ] Vérifier le chemin du fichier
- [ ] Vérifier la syntaxe du JSX

### "Aucun paiement détecté"
- [ ] Vérifier qu'il y a des paiements EN_ATTENTE dans la DB
- [ ] Vérifier que frequencePaiement est défini
- [ ] Vérifier la date du serveur (pour calcul des retards)

### "Notifications ne s'affichent pas"
- [ ] Vérifier que des managers existent (role = 'MANAGER')
- [ ] Vérifier les logs API
- [ ] Vérifier la table notifications

### "CRON job ne s'exécute pas"
- [ ] Vérifier CRON_SECRET dans .env
- [ ] Vérifier le schedule dans vercel.json (format cron)
- [ ] Vérifier les logs Vercel
- [ ] Redéployer le projet

---

## Production Checklist

- [ ] Tester en local avec `npm run test:payment-late`
- [ ] Intégrer le composant au dashboard
- [ ] Configurer le CRON job (optionnel)
- [ ] Ajouter CRON_SECRET à .env
- [ ] Tester sur staging
- [ ] Déployer en production
- [ ] Monitorer les logs
- [ ] Valider que les notifications arrivent

---

**Ready to implement?** Start with `QUICK_START_LATE_PAYMENTS.md`
