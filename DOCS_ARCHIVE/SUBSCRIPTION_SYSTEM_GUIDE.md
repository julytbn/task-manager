# 📋 Guide d'Intégration: Système d'Abonnements avec Facturation Automatique

## 📌 Vue d'ensemble

Ce guide explique comment utiliser le système d'abonnements avec facturation automatique selon les fréquences (mensuel, trimestriel, semestriel, annuel).

---

## 🏗️ Architecture du système

### 1. **Modèles Prisma**

#### Modèle `Abonnement`
```prisma
model Abonnement {
  id                    String              @id @default(cuid())
  nom                   String
  description           String?
  client                Client              @relation(fields: [clientId], references: [id])
  clientId              String
  service               Service             @relation(fields: [serviceId], references: [id])
  serviceId             String
  montant               Float               // Montant par période
  frequence             FrequencePaiement   @default(MENSUEL)
  statut                StatutAbonnement    @default(ACTIF)
  dateDebut             DateTime
  dateFin               DateTime?           // Null si illimité
  dateProchainFacture   DateTime            // Calculée automatiquement
  dernierPaiement       DateTime?           // Date du dernier paiement
  notificationEnvoyee   Boolean             @default(false)
  nombrePaiementsEffectues Int               @default(0)
  dateCreation          DateTime            @default(now())
  dateModification      DateTime            @updatedAt

  factures Facture[]
}
```

#### Énumérations
```prisma
enum FrequencePaiement {
  PONCTUEL
  MENSUEL
  TRIMESTRIEL
  SEMESTRIEL
  ANNUEL
}

enum StatutAbonnement {
  ACTIF
  SUSPENDU
  EN_RETARD
  ANNULE
  TERMINE
}
```

---

## 🔌 API Endpoints

### GET `/api/abonnements`
Récupère tous les abonnements (avec filtrage optionnel par client)

```bash
GET /api/abonnements?clientId=<client-id>
```

**Réponse:**
```json
[
  {
    "id": "abc123",
    "nom": "Abonnement Mensuel",
    "montant": 50000,
    "frequence": "MENSUEL",
    "statut": "ACTIF",
    "dateProchainFacture": "2025-12-15T00:00:00.000Z",
    "nombrePaiementsEffectues": 3,
    "client": {...},
    "service": {...},
    "factures": [...]
  }
]
```

### POST `/api/abonnements`
Crée un nouvel abonnement

```bash
POST /api/abonnements
Content-Type: application/json

{
  "nom": "Abonnement Trimestriel ABC",
  "description": "Service mensuel pour la société ABC",
  "clientId": "client-123",
  "serviceId": "service-456",
  "montant": 150000,
  "frequence": "TRIMESTRIEL",
  "dateDebut": "2025-12-01"
}
```

### PUT `/api/abonnements/:id`
Modifie un abonnement

```bash
PUT /api/abonnements/abc123
Content-Type: application/json

{
  "montant": 160000,
  "statut": "SUSPENDU"
}
```

### DELETE `/api/abonnements/:id`
Annule un abonnement

```bash
DELETE /api/abonnements/abc123
```

---

## 🔄 Logique de génération de factures

### Calcul de la prochaine date de facturation

Lors de la création d'un abonnement:

```javascript
const dateDebut = new Date("2025-12-01");
const frequence = "MENSUEL";

// Ajouter la période à la date de début
dateProchainFacture = dateDebut + (30 jours pour MENSUEL)
// → "2026-01-01"
```

### Fréquences supportées

| Fréquence | Jours | Exemple |
|-----------|-------|---------|
| PONCTUEL | 7 | Paiement unique après 7j |
| MENSUEL | 30 | Tous les 30 jours |
| TRIMESTRIEL | 90 | Tous les 3 mois |
| SEMESTRIEL | 180 | Tous les 6 mois |
| ANNUEL | 365 | Tous les ans |

### Processus de génération

1. **Chaque jour** (via CRON job à 00:00 UTC):
   - Vérifier les abonnements avec `dateProchainFacture <= aujourd'hui`
   - Pour chaque abonnement à facturer:
     - Générer une nouvelle facture
     - Définir `dateEcheance = dateEmission + (fréquence)`
     - Mettre à jour `dateProchainFacture = ancienne_date + (fréquence)`
     - Incrémenter `nombrePaiementsEffectues`

2. **Détection des retards**:
   - Si `facture.statut = EN_ATTENTE` ET `facture.dateEcheance < aujourd'hui`
   - Passer l'abonnement au statut `EN_RETARD`
   - Créer une notification pour le manager

---

## 🔧 Services utilitaires (`lib/abonnementService.ts`)

### Fonctions disponibles

#### `createSubscription(data)`
Crée un nouvel abonnement

```typescript
const abonnement = await createSubscription({
  nom: "Service ABC",
  clientId: "client-123",
  serviceId: "service-456",
  montant: 50000,
  frequence: "MENSUEL",
  dateDebut: new Date("2025-12-01")
});
```

#### `generateDueInvoices()`
Génère les factures dues aujourd'hui

```typescript
const invoices = await generateDueInvoices();
// → Retourne les factures générées
```

#### `getActiveSubscriptions()`
Récupère tous les abonnements actifs

```typescript
const subs = await getActiveSubscriptions();
```

#### `getClientSubscriptions(clientId)`
Récupère les abonnements d'un client

```typescript
const subs = await getClientSubscriptions("client-123");
```

#### `checkAndUpdateLateSubscriptions()`
Détecte et marque les abonnements en retard

```typescript
const late = await checkAndUpdateLateSubscriptions();
```

---

## ⏰ Configuration du CRON Job

### Option 1: Via Node.js Cron (Pour développement local)

```bash
npm install node-cron
```

```typescript
// app/api/cron/subscription-invoices/route.ts
import cron from 'node-cron';
import { generateDueInvoices, checkAndUpdateLateSubscriptions } from '@/lib/abonnementService';

// Chaque jour à minuit
cron.schedule('0 0 * * *', async () => {
  console.log('Exécution de la génération des factures...');
  await generateDueInvoices();
  await checkAndUpdateLateSubscriptions();
});
```

### Option 2: Via Script Node.js manuel

```bash
# Exécuter manuellemen chaque jour
node scripts/generateSubscriptionInvoices.js
```

### Option 3: Via Vercel Crons (Production)

```json
// next.config.mjs
export const crons = [
  {
    path: '/api/cron/subscription-invoices',
    schedule: '0 0 * * *'
  }
]
```

---

## 📊 Exemple complet de flux

### Scénario: Abonnement trimestriel

```
1. Création (01 Déc 2025)
   ├─ nom: "Gestion RH - ABC Corp"
   ├─ montant: 300,000 FCFA
   ├─ frequence: TRIMESTRIEL
   └─ dateDebut: 01/12/2025

2. Calcul de dateProchainFacture
   └─ 01/12/2025 + 90 jours = 01/03/2026

3. 01 Décembre 2025 à 00:00
   ├─ dateProchainFacture (01/12) <= aujourd'hui (01/12) ✅
   ├─ Facturation générée:
   │  ├─ Numéro: FAC-abc123-timestamp
   │  ├─ Montant HT: 300,000 FCFA
   │  ├─ TVA 18%: 54,000 FCFA
   │  ├─ Montant TTC: 354,000 FCFA
   │  └─ Échéance: 31/01/2026
   └─ dateProchainFacture = 01/03/2026

4. Après échéance (01 Février 2026)
   ├─ Si facture toujours EN_ATTENTE
   ├─ Abonnement passe à EN_RETARD
   └─ Notification envoyée au manager

5. 01 Mars 2026 à 00:00
   ├─ Nouvelle facturation générée
   ├─ dateProchainFacture = 01/06/2026
   └─ Cycle continue...
```

---

## 🧪 Scripts de test

### Test complet du système

```bash
node scripts/testSubscriptionSystem.js
```

**Crée:**
- 4 abonnements (1 par fréquence)
- Génère les factures dues
- Détecte les retards
- Affiche les statistiques

### Test de génération manuelle

```bash
node scripts/generateSubscriptionInvoices.js
```

**Effectue:**
- Recherche des abonnements à facturer
- Génère les factures
- Détecte les retards
- Crée des notifications

---

## 🎯 Statuts et transitions

### Statuts d'abonnement

```
ACTIF
  ├─ Abonnement en cours de fonctionnement
  ├─ Peut passer à: SUSPENDU, EN_RETARD, ANNULE
  └─ Factures générées régulièrement

SUSPENDU
  ├─ Abonnement momentanément gelé
  ├─ Aucune facture générée
  └─ Peut passer à: ACTIF, ANNULE

EN_RETARD
  ├─ Factures non payées au-delà d'un certain délai
  ├─ Manager notifié
  └─ Peut passer à: ACTIF (après paiement), ANNULE

ANNULE
  ├─ Abonnement arrêté définitivement
  └─ État terminal (dernière date = date d'annulation)

TERMINE
  ├─ Abonnement arrivé à sa date de fin
  └─ État terminal
```

---

## 📝 Points importants

1. **Une seule facture par période** - Même si le CRON s'exécute plusieurs fois, une seule facture est générée

2. **Récalcul automatique** - La prochaine date de facturation est toujours recalculée

3. **Statut ignoré pour les retards** - Les paiements CONFIRME/REMBOURSE ne sont jamais en retard

4. **Notifications groupées** - Tous les managers reçoivent les notifications

5. **Audit trail** - `nombrePaiementsEffectues` permet de suivre l'historique

---

## 🚀 Prochaines étapes

1. [ ] Configurer le CRON job en production
2. [ ] Ajouter l'UI pour gérer les abonnements
3. [ ] Implémenter les emails de notification
4. [ ] Ajouter les rapports de réconciliation
5. [ ] Créer des webhooks pour les paiements externes

---

## 📞 Support

Pour plus d'informations, consultez:
- `lib/abonnementService.ts` - Service utilitaire
- `app/api/abonnements/route.ts` - API endpoints
- `scripts/generateSubscriptionInvoices.js` - Script de facturation
- `scripts/testSubscriptionSystem.js` - Tests du système
