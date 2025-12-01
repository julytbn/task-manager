# 📋 Guide: Système de Notifications pour Retards de Paiement

## Vue d'ensemble

Le système détecte automatiquement les **paiements en retard** basés sur la **fréquence de paiement** définie pour chaque projet et envoie des notifications aux managers pour qu'ils puissent relancer les clients.

---

## 🏗️ Architecture

### 1. **Modèle de données (Prisma)**

#### Champs ajoutés au modèle `Paiement`:
```prisma
model Paiement {
  // ... champs existants ...
  datePaiementAttendu   DateTime?      // Date d'échéance attendue
  notificationEnvoyee   Boolean        @default(false) // Flag pour éviter les doublons
}
```

#### Champs existants importants:
- `frequencePaiement` (sur le `Projet`): PONCTUEL | MENSUEL | TRIMESTRIEL | SEMESTRIEL | ANNUEL
- `statut`: EN_ATTENTE | CONFIRME | REFUSE | REMBOURSE

### 2. **Service de détection (`lib/paymentLateService.ts`)**

**Fonctions principales:**

| Fonction | Description |
|----------|-------------|
| `calculateDueDateFromFrequency()` | Calcule la date d'échéance basée sur la fréquence |
| `isPaymentLate()` | Vérifie si un paiement est en retard |
| `calculateDaysLate()` | Calcule le nombre de jours de retard |
| `checkAndNotifyLatePayments()` | **PRINCIPALE**: Détecte et notifie les retards |
| `getLatePayments()` | Récupère la liste des paiements en retard |

**Logique de calcul:**
- PONCTUEL → 7 jours
- MENSUEL → 30 jours
- TRIMESTRIEL → 90 jours  
- SEMESTRIEL → 180 jours
- ANNUEL → 365 jours

### 3. **API Endpoints (`app/api/paiements/check-late.ts`)**

#### GET - Vérifier et notifier les retards
```bash
GET /api/paiements/check-late
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "success": true,
  "latePaymentsCount": 2,
  "latePayments": [
    {
      "id": "paiement-id-1",
      "clientName": "Acme Corp",
      "montant": 500000,
      "daysLate": 15
    }
  ]
}
```

#### POST - Obtenir la liste des retards (sans notifier)
```bash
POST /api/paiements/check-late
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "success": true,
  "count": 2,
  "latePayments": [
    {
      "id": "paiement-id-1",
      "clientName": "Client A",
      "montant": 100000,
      "daysLate": 5,
      "dueDate": "2025-12-01T00:00:00Z",
      "projectName": "Projet X"
    }
  ]
}
```

---

## 🔧 Configuration et mise en place

### 1. **Migration de la base de données**
```bash
# Déjà effectuée automatiquement
npx prisma migrate dev
```

### 2. **Implémenter un monitoring automatique**

#### Option A: CRON Job (Vercel Crons)

Créer `app/api/cron/check-late-payments.ts`:
```typescript
import { NextResponse } from 'next/server'
import { checkAndNotifyLatePayments } from '@/lib/paymentLateService'

export async function GET(request: Request) {
  // Vérifier le header de sécurité Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await checkAndNotifyLatePayments()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
```

Ajouter dans `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-late-payments",
    "schedule": "0 9 * * *"
  }]
}
```

#### Option B: Node-Cron (Auto-hébergé)

```typescript
import cron from 'node-cron'
import { checkAndNotifyLatePayments } from '@/lib/paymentLateService'

// Vérifier chaque jour à 9h00
cron.schedule('0 9 * * *', async () => {
  console.log('🔔 Vérification des paiements en retard...')
  try {
    const result = await checkAndNotifyLatePayments()
    console.log(`✅ ${result.latePaymentsCount} paiements en retard détectés`)
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
})
```

#### Option C: Appeler l'API manuellement depuis le dashboard

```typescript
// Dans le composant Manager Dashboard
const checkLatePayments = async () => {
  try {
    const response = await fetch('/api/paiements/check-late', {
      method: 'GET',
    })
    const data = await response.json()
    console.log(`Paiements en retard: ${data.latePaymentsCount}`)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

---

## 📊 Cas d'usage

### Scénario: Client paie mensuellement

1. **Création du paiement initial** (ex: 01 Nov 2025)
   - `datePaiement`: 01 Nov 2025
   - `frequencePaiement`: MENSUEL
   - `statut`: EN_ATTENTE

2. **Calcul de l'échéance**
   - Date d'échéance: 01 Déc 2025

3. **Après le 01 Déc si pas payé**
   - Fonction détecte: RETARD
   - Notification créée pour les managers
   - Peut être relancé via email

### Cas 2: Multiple paiements en retard

Le système crée **une notification par manager** pour chaque paiement en retard détecté.

---

## ⚙️ Variables d'environnement

```env
# Aucune variable spécifique requise
# Utilise la configuration existante de Prisma et NextAuth
```

---

## 🧪 Tests

### Exécuter le script de test:
```bash
npm run test:payment-late
```

ou

```bash
node scripts/testPaymentLateDetection.js
```

**Ce que teste le script:**
- ✅ Récupération des projets avec fréquence
- ✅ Récupération des paiements en attente  
- ✅ Calcul des jours de retard
- ✅ Détection des paiements en retard
- ✅ Vérification des notifications créées

---

## 📋 Checklist d'implémentation

- [x] Ajouter champs au modèle `Paiement`
- [x] Créer service `paymentLateService.ts`
- [x] Créer API endpoint `check-late.ts`
- [x] Migration Prisma
- [x] Script de test
- [ ] Intégrer CRON job (automatique ou manuel)
- [ ] Ajouter UI pour afficher les paiements en retard
- [ ] Configurer les emails de notification
- [ ] Documenter pour l'équipe

---

## 🔔 Intégration avec le système de notification existant

Les notifications sont créées dans la table `notifications`:

```typescript
await prisma.notification.create({
  data: {
    utilisateurId: manager.id,
    titre: `Paiement en retard - ${payment.client.nom}`,
    message: `Le paiement de ${payment.montant} FCFA pour le projet "${payment.projet.titre}" est en retard de ${daysLate} jours.`,
    type: 'ALERTE',  // Affichera l'icône d'alerte rouge
    lien: `/dashboard/manager/paiements`, // Lien vers les paiements
  },
})
```

Les notifications s'affichent:
- 🔔 Bell icon dans le header avec un badge rouge
- Dropdown avec la liste des notifications
- Chaque notification peut être marquée comme lue

---

## 📝 Notes importantes

1. **Un seul flag `notificationEnvoyee` par paiement** - Évite les notifications répétées pour le même retard

2. **Recalcul à chaque vérification** - La date d'échéance est recalculée basée sur `datePaiement + fréquence`

3. **Statut ignoré** - Les paiements CONFIRME ou REMBOURSE ne sont jamais considérés comme en retard

4. **Récurrence** - Recommandé d'exécuter le check quotidiennement (9h du matin par exemple)

---

## 🚀 Prochaines étapes optionnelles

1. **Email notifications** - Envoyer un email au manager + au client
2. **SMS alerts** - Pour les retards critiques (> 30 jours)
3. **Dashboard widget** - Afficher les paiements en retard sur le dashboard
4. **Rappel automatique** - Email de relance au client automatique
5. **Historique** - Logger tous les retards détectés

---

## 🆘 Troubleshooting

### Aucun paiement en retard détecté même si certains devraient l'être

**Vérifier:**
- [ ] La `frequencePaiement` est définie sur le projet
- [ ] Le paiement a le statut `EN_ATTENTE`
- [ ] La date d'aujourd'hui > date calculée d'échéance

### Les notifications ne s'affichent pas

**Vérifier:**
- [ ] Les managers existent dans la base de données
- [ ] La table `notifications` existe
- [ ] L'utilisateur est connecté (session active)

### Notifications en doublon

**Solution:**
- Vérifier que `notificationEnvoyee = true` après envoi
- Réinitialiser le flag manuellement si problème:
```sql
UPDATE paiements SET notificationEnvoyee = false WHERE id = 'payment-id'
```
