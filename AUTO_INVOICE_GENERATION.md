# 📋 Système de Génération Automatique de Factures

## Vue d'ensemble

Ce système génère automatiquement les factures des abonnements selon une fréquence définie (mensuelle, trimestrielle, semestrielle, annuelle).

## 🎯 Fonctionnalités

### 1. Génération Automatique au Moment Opportun
- ✅ Lors de la création d'un abonnement (première facture)
- ✅ À chaque échéance de renouvellement automatique
- ✅ Sans intervention manuelle requise

### 2. Contenu des Factures Générées
Chaque facture contient:
- 🔢 **Numéro unique**: `FACT-YYYYMM-0001`
- 👤 **ID Client**: Référence automatique
- 📦 **Type d'abonnement**: Nom du service
- 📅 **Période couverte**: Dates de début et fin
- 💰 **Montant total**: Montant + TVA (18%)
- 📝 **Date d'émission**: Date du jour
- ⏰ **Date d'échéance**: Calculée automatiquement
- 🏷️ **Statut**: "En attente"

### 3. Calcul Automatique des Échéances
```
Mensuel     → Prochaine facture dans 30 jours
Trimestriel → Prochaine facture dans 90 jours
Semestriel  → Prochaine facture dans 180 jours
Annuel      → Prochaine facture dans 365 jours
```

## 🔧 Configuration

### Variables d'environnement
```env
# Clé secrète pour les cron jobs (optionnel en développement)
CRON_SECRET=your-secret-key-here

# URL de la base de données
DATABASE_URL=postgresql://user:password@host:port/dbname
```

## 🚀 Utilisation

### Option 1: Cron Job Vercel (Recommandé)

Le système est automatiquement configuré pour s'exécuter tous les jours à **08:00 UTC**.

Configuration dans `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-invoices",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Option 2: Appel Manuel via API

**Requête GET:**
```bash
curl -X GET "http://localhost:3000/api/cron/generate-invoices?secret=development-secret"
```

**Requête POST:**
```bash
curl -X POST "http://localhost:3000/api/cron/generate-invoices" \
  -H "X-CRON-SECRET: development-secret" \
  -H "Content-Type: application/json"
```

### Option 3: Script Local (Développement)

```bash
# Avec npm
npm run cron:invoices

# Avec ts-node
ts-node scripts/generate-invoices.ts

# Avec node directement (après compilation)
node scripts/generate-invoices.js
```

### Option 4: Cron Linux (Production On-Premise)

Ajouter à `crontab -e`:
```cron
# Générer les factures chaque jour à 8h du matin
0 8 * * * cd /chemin/vers/app && npm run cron:invoices >> /var/log/invoices.log 2>&1
```

### Option 5: Docker Compose (Production)

Ajouter un service dans `docker-compose.yml`:
```yaml
invoice-generator:
  image: node:18-alpine
  working_dir: /app
  volumes:
    - .:/app
  environment:
    - NODE_ENV=production
    - DATABASE_URL=postgresql://user:pass@postgres:5432/db
    - CRON_SECRET=${CRON_SECRET}
  entrypoint: |
    sh -c "
      while true; do
        npm run cron:invoices
        sleep 86400
      done
    "
  depends_on:
    - postgres
```

## 📁 Structure des fichiers

```
lib/
├── invoice-generator.ts          # Service de génération
└── prisma.ts                     # Client Prisma

app/api/
└── cron/
    └── generate-invoices/
        └── route.ts              # Endpoint API

scripts/
└── generate-invoices.ts          # Script exécutable

vercel.json                        # Config Cron Vercel
```

## 🔄 Flux de Génération

```
1. Le cron job se déclenche (ou API appelée)
   ↓
2. Récupérer tous les abonnements ACTIFS
   dont dateProchainFacture <= aujourd'hui
   ↓
3. Pour chaque abonnement:
   - Valider que l'abonnement est toujours actif
   - Générer un numéro de facture unique
   - Créer la facture avec:
     * Montant + TVA
     * Dates d'émission et d'échéance
     * Statut "EN_ATTENTE"
   - Mettre à jour dateProchainFacture
   - Incrémenter nombrePaiementsEffectues
   ↓
4. Retourner le résumé de l'opération
```

## 📊 Réponse API

```json
{
  "success": true,
  "invoicesGenerated": 5,
  "details": [
    {
      "subscriptionId": "sub_123",
      "clientName": "Entreprise ACME",
      "invoiceNumber": "FACT-202412-0001",
      "amount": 118000,
      "status": "success",
      "message": "Facture créée avec succès"
    },
    {
      "subscriptionId": "sub_124",
      "clientName": "Client B",
      "invoiceNumber": "FACT-202412-0002",
      "amount": 59000,
      "status": "success",
      "message": "Facture créée avec succès"
    }
  ]
}
```

## 🎯 Conditions de Génération

Une facture est générée **si et seulement si**:

✅ L'abonnement a le statut `ACTIF`
✅ La `dateProchainFacture` est aujourd'hui ou dans le passé
✅ L'abonnement n'a pas expiré (`dateFin` est null ou dans le futur)
✅ C'est la première facture OR la date de renouvellement est venue

## ⚠️ Gestion des Erreurs

Si une erreur survient lors de la création d'une facture:
1. L'erreur est enregistrée dans les logs
2. Les autres abonnements continuent d'être traités
3. Un statut d'erreur est retourné pour l'abonnement en question
4. Le champ `success` global est mis à `false` si au moins une erreur

## 🔐 Sécurité

### En Production
- Toutes les requêtes à `/api/cron/generate-invoices` nécessitent le header `X-CRON-SECRET`
- Le secret doit être fort et gardé secret
- Utiliser des variables d'environnement

### En Développement
- Le secret est optionnel
- Utiliser la valeur par défaut `"development-secret"`

## 📝 Exemple: Créer un Abonnement et Générer la Facture

```typescript
// 1. Créer l'abonnement
const subscription = await prisma.abonnement.create({
  data: {
    nom: "Forfait Web",
    clientId: "client_123",
    serviceId: "service_456",
    montant: 100000,
    frequence: "MENSUEL",
    dateDebut: new Date(),
    dateProchainFacture: addMonths(new Date(), 1)
  }
})

// 2. Générer la facture initiale (automatique si desired)
const { invoiceNumber, success } = await generateInitialInvoiceForSubscription(subscription)

console.log(`Facture créée: ${invoiceNumber}`)
```

## 🐛 Dépannage

### Les factures ne se génèrent pas
1. Vérifier que les abonnements ont le statut `ACTIF`
2. Vérifier que `dateProchainFacture` n'est pas dans le futur
3. Vérifier les logs: `npm run cron:invoices`
4. Tester l'API directement: `/api/cron/generate-invoices?secret=development-secret`

### Erreur "Unauthorized"
1. Vérifier que `CRON_SECRET` est défini et correct
2. En développement, utiliser `development-secret`

### Les numéros de facture se doublent
1. Cela ne devrait pas survenir (contrainte UNIQUE en base)
2. Si c'est le cas, vérifier les erreurs de concurrence
3. Augmenter le délai entre les exécutions

## 📈 Monitoring

Ajouter un monitoring pour:
- Nombre de factures générées par jour
- Erreurs lors de la génération
- Temps d'exécution du cron job

Exemple avec Sentry:
```typescript
import * as Sentry from "@sentry/nextjs"

const result = await generateSubscriptionInvoices()
Sentry.captureMessage(
  `Invoices generated: ${result.invoicesGenerated}`,
  'info'
)
```

## 🚀 Prochaines Étapes

1. ✅ Ajouter des notifications par email lors de la génération
2. ✅ Dashboard pour visualiser les factures générées automatiquement
3. ✅ Logs et audit trail complets
4. ✅ Webhooks pour l'intégration avec des systèmes externes
5. ✅ Retry automatique en cas d'échec

---

**Version**: 1.0.0  
**Dernière mise à jour**: Décembre 2025
