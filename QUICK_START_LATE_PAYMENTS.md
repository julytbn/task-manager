# 🔔 Guide rapide: Intégrer les Paiements en Retard au Dashboard

## Étape 1: Ajouter le composant au Dashboard Manager

Ouvrez `app/dashboard/manager-dashboard.tsx` et ajoutez l'import:

```tsx
import LatePaymentAlerts from '@/components/dashboard/LatePaymentAlerts'
```

## Étape 2: Intégrer le composant dans le JSX

Ajoutez ceci après les statistiques ou avant les paiements existants:

```tsx
<div className="mt-8">
  <LatePaymentAlerts compact={false} />
</div>
```

### Options:

```tsx
// Affichage compact (3 paiements max)
<LatePaymentAlerts compact={true} />

// Affichage complet (tableau)
<LatePaymentAlerts compact={false} />

// Avec callback de rafraîchissement
<LatePaymentAlerts 
  compact={false}
  onRefresh={() => console.log('Paiements rafraîchis')}
/>
```

## Étape 3: Configurer le monitoring automatique

### Option A: CRON Job (recommandé pour production)

Créez `app/api/cron/check-late-payments.ts`:

```typescript
import { NextResponse } from 'next/server'
import { checkAndNotifyLatePayments } from '@/lib/paymentLateService'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await checkAndNotifyLatePayments()
    return NextResponse.json({
      success: true,
      message: `Vérification effectuée: ${result.latePaymentsCount} paiements en retard détectés`,
      result
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check late payments' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
```

Ajoutez à `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/check-late-payments",
    "schedule": "0 9 * * *"
  }]
}
```

### Option B: Manuel via un bouton

```tsx
const [checking, setChecking] = useState(false)

const handleCheckPayments = async () => {
  setChecking(true)
  try {
    const response = await fetch('/api/paiements/check-late')
    const data = await response.json()
    alert(`Vérification effectuée: ${data.latePaymentsCount} paiements en retard`)
  } finally {
    setChecking(false)
  }
}

return (
  <button 
    onClick={handleCheckPayments}
    disabled={checking}
    className="px-4 py-2 bg-blue-600 text-white rounded"
  >
    {checking ? 'Vérification...' : 'Vérifier les retards'}
  </button>
)
```

## Étape 4: Variables d'environnement

Ajoutez à `.env.local`:

```env
# CRON job security
CRON_SECRET=your_secure_random_secret_here
```

## Étape 5: Test

Exécutez:

```bash
node scripts/testPaymentLateDetection.js
```

## 📊 Résultat attendu

**Vue du Manager:**
- 🔔 Notification dans le header avec badge rouge
- 📊 Widget "Paiements en retard" sur le dashboard
- 📋 Tableau des clients à relancer
- 🔄 Bouton pour rafraîchir la liste

**Notification:**
```
Titre: "Paiement en retard - Acme Corp"
Message: "Le paiement de 500,000 FCFA pour le projet 'Projet X' 
          est en retard de 15 jours. Client: Acme Corp"
Type: ALERTE
Lien: /dashboard/manager/paiements
```

## 🎯 Architecture du flux

```
1. Client crée un projet avec frequencePaiement = MENSUEL
2. Paiement créé: datePaiement = 01 Nov, statut = EN_ATTENTE
3. CRON job execute chaque jour à 9h00
4. checkAndNotifyLatePayments() détecte si retard
5. Notification créée pour managers
6. Notification s'affiche dans le header
7. Manager clique → Va dans la section paiements
8. Manager click "Relancer" → Contact client
```

## 📝 Structure de la notification créée

```typescript
{
  id: "notification-id",
  utilisateurId: "manager-id",
  titre: "Paiement en retard - Acme Corp",
  message: "Le paiement de 500000 FCFA pour le projet \"Projet X\" est en retard de 15 jours. Client: Acme Corp",
  type: "ALERTE",
  lien: "/dashboard/manager/paiements",
  lu: false,
  dateCreation: "2025-12-16T09:00:00.000Z"
}
```

## ✅ Checklist d'implémentation

- [ ] Ajouter import du composant au dashboard manager
- [ ] Intégrer le composant dans le JSX
- [ ] Créer l'API endpoint CRON (optionnel)
- [ ] Configurer vercel.json avec le CRON job
- [ ] Ajouter CRON_SECRET à .env
- [ ] Tester avec `testPaymentLateDetection.js`
- [ ] Vérifier que les notifications s'affichent
- [ ] Tester la relance de clients en retard

## 🚀 Déploiement

```bash
# 1. Commit des changements
git add .
git commit -m "feat: add late payment notifications system"

# 2. Push vers main
git push origin main

# 3. Vercel redéploiera automatiquement
# et activera le CRON job si configuré
```

## 🆘 Troubleshooting

**Q: Les notifications ne s'affichent pas?**
A: Vérifier que les managers existent et que leur role = 'MANAGER'

**Q: Aucun paiement en retard détecté?**
A: Vérifier que les paiements ont le statut EN_ATTENTE et qu'il y a des projets avec frequencePaiement

**Q: CRON job ne s'exécute pas?**
A: Vérifier CRON_SECRET dans .env et la syntaxe du schedule dans vercel.json

---

**Documentation complète:** `LATE_PAYMENT_NOTIFICATIONS.md`
