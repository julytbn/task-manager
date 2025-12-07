# 🚀 Guide d'Intégration: Génération Automatique de Factures

## Résumé

Votre système Task Manager dispose maintenant d'une **génération automatique de factures** basée sur les abonnements des clients. Ce guide vous montre comment l'utiliser et l'intégrer dans votre infrastructure.

## ✨ Nouvelles Fonctionnalités

### 1. Génération Initiale Automatique
Quand vous créez un abonnement, une **première facture est générée automatiquement**:

```bash
POST /api/abonnements
{
  "nom": "Forfait Web Mensuel",
  "clientId": "client_123",
  "serviceId": "service_456",
  "montant": 100000,
  "frequence": "MENSUEL",
  "dateDebut": "2025-12-03"
}

# Résultat: 
# - L'abonnement est créé
# - Une facture FACT-202412-0001 est générée automatiquement
```

### 2. Génération Périodique Automatique
Chaque jour, le système vérifie quels abonnements doivent être facturés et crée les factures:

```
08:00 UTC (chaque jour) → Vérifier tous les abonnements actifs
                       ↓
                 Trouver ceux dont dateProchainFacture <= aujourd'hui
                       ↓
              Générer une facture pour chacun
                       ↓
           Mettre à jour dateProchainFacture pour le prochain cycle
```

## 📋 Fichiers Créés/Modifiés

### Nouveaux fichiers
```
lib/invoice-generator.ts                    # Service principal
app/api/cron/generate-invoices/route.ts    # Endpoint API
scripts/generate-invoices.ts                # Script CLI
AUTO_INVOICE_GENERATION.md                  # Documentation détaillée
INTEGRATION_GUIDE_AUTO_INVOICES.md         # Ce guide
vercel.json                                 # Config Vercel
```

### Fichiers modifiés
```
app/api/abonnements/route.ts               # Import du générateur
package.json                                # Ajout du script npm
```

## 🎯 Comment Ça Fonctionne

### Scénario 1: Création d'un Client avec Abonnement Mensuel

```
1. Manager crée un client "ACME Inc"
2. Manager ajoute un abonnement mensuel (100,000 FCFA)
   → ✅ Facture FACT-202412-0001 créée automatiquement
   → Date prochaine facture: 03 Janvier 2025

3. Le 03 Janvier 2025 à 08:00 UTC:
   → ✅ Cron job s'exécute
   → ✅ Facture FACT-202501-0001 créée automatiquement
   → Date prochaine facture: 03 Février 2025

4. Et cela continue chaque mois...
```

### Scénario 2: Contenu d'une Facture Auto-Générée

```json
{
  "id": "fact_789",
  "numero": "FACT-202412-0001",
  "clientId": "client_123",
  "abonnementId": "sub_456",
  "montant": 100000,           // Montant HT
  "tauxTVA": 0.18,             // 18%
  "montantTotal": 118000,      // Montant TTC
  "statut": "EN_ATTENTE",
  "dateEmission": "2025-12-03",
  "dateEcheance": "2025-12-18",
  "notes": "Facture générée automatiquement pour l'abonnement: Forfait Web Mensuel"
}
```

## 🔧 Configuration Pour Votre Infrastructure

### Option A: Vercel (Recommandé si vous êtes sur Vercel)

**Déjà configuré!** Le fichier `vercel.json` contient:

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

- ✅ Le cron job s'exécute automatiquement tous les jours à 08:00 UTC
- ✅ Aucune configuration supplémentaire nécessaire
- ✅ Accédez à Vercel Dashboard → Settings → Cron Jobs pour voir l'historique

### Option B: Linux/VPS On-Premise

Ajouter à `crontab -e`:

```bash
# Générer les factures chaque jour à 8h du matin
0 8 * * * cd /chemin/vers/task-manager && npm run cron:invoices >> /var/log/invoices.log 2>&1
```

Tester:
```bash
npm run cron:invoices
```

### Option C: Docker Compose

Ajouter ce service à votre `docker-compose.yml`:

```yaml
invoice-cron:
  image: node:18-alpine
  working_dir: /app
  volumes:
    - .:/app
    - /app/node_modules
  environment:
    - NODE_ENV=production
    - DATABASE_URL=postgresql://user:pass@postgres:5432/task_manager
    - CRON_SECRET=${CRON_SECRET}
  command: |
    sh -c "
      npm install &&
      while true; do
        npm run cron:invoices
        sleep 86400
      done
    "
  depends_on:
    - postgres
  restart: unless-stopped
```

### Option D: AWS Lambda (Serverless)

1. Déployer votre API sur AWS Lambda (via Vercel ou Serverless Framework)
2. Créer une Lambda function qui appelle:
   ```
   POST https://votre-domaine.com/api/cron/generate-invoices
   Header: X-CRON-SECRET: votre-secret
   ```
3. Configurer CloudWatch Events pour déclencher la Lambda à 08:00 UTC

### Option E: Appel Manuel via API

Pour tester ou déclencher manuellement:

```bash
# GET (le plus simple pour tester)
curl "http://localhost:3000/api/cron/generate-invoices?secret=development-secret"

# POST (plus sécurisé)
curl -X POST "http://localhost:3000/api/cron/generate-invoices" \
  -H "X-CRON-SECRET: development-secret" \
  -H "Content-Type: application/json"
```

## 🔐 Sécurité

### Définir le Secret en Production

1. Générer un secret fort:
   ```bash
   openssl rand -base64 32
   # Résultat: kA9lm+BvX2jK8nP/q3Rs7tU9vW0xYz4aB+cD=
   ```

2. Ajouter à vos variables d'environnement:
   ```env
   # .env.local (ne pas commiter!)
   CRON_SECRET=kA9lm+BvX2jK8nP/q3Rs7tU9vW0xYz4aB+cD=
   ```

3. En Vercel, ajouter dans Project Settings → Environment Variables

4. Utiliser le secret dans les requêtes:
   ```bash
   curl -X POST "https://votre-domaine.com/api/cron/generate-invoices" \
     -H "X-CRON-SECRET: kA9lm+BvX2jK8nP/q3Rs7tU9vW0xYz4aB+cD=" \
     -H "Content-Type: application/json"
   ```

## 🧪 Tests

### Test 1: Créer un Abonnement
```bash
curl -X POST "http://localhost:3000/api/abonnements" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Abonnement",
    "clientId": "YOUR_CLIENT_ID",
    "serviceId": "YOUR_SERVICE_ID",
    "montant": 100000,
    "frequence": "MENSUEL"
  }'
```

Résultat attendu:
- ✅ L'abonnement est créé
- ✅ Une facture est générée automatiquement
- Vérifier: `GET /api/factures` pour voir la nouvelle facture

### Test 2: Déclencher Manuellement le Cron Job
```bash
# Via API
curl "http://localhost:3000/api/cron/generate-invoices?secret=development-secret"

# Via Script
npm run cron:invoices
```

Résultat attendu:
```json
{
  "success": true,
  "invoicesGenerated": 5,
  "details": [
    {
      "subscriptionId": "sub_123",
      "clientName": "ACME Inc",
      "invoiceNumber": "FACT-202412-0001",
      "amount": 118000,
      "status": "success",
      "message": "Facture créée avec succès"
    }
  ]
}
```

## 📊 Monitoring et Logs

### Vérifier les Logs (Vercel)
```bash
# En développement
npm run cron:invoices

# En production, voir les logs Vercel:
# Dashboard → Project → Logs → Function Logs
```

### Ajouter du Monitoring Sentry (Optionnel)
```typescript
// lib/invoice-generator.ts (ajouter en haut)
import * as Sentry from "@sentry/nextjs"

// Dans la fonction generateSubscriptionInvoices()
Sentry.captureMessage(
  `Invoices generated: ${result.invoicesGenerated}`,
  'info'
)
```

## ❓ FAQ

### Q: Et si j'oublie de configurer le cron job?
R: Les factures ne seront pas générées automatiquement. Vous devrez appeler manuellement `/api/cron/generate-invoices` ou configurer un cron job externe.

### Q: Les factures manuelles vont-elles interferer?
R: Non, les factures manuelles et auto-générées coexistent. Elles ont juste des numéros différents.

### Q: Puis-je modifier la fréquence de facturation après la création?
R: Oui, modifiez la fréquence de l'abonnement. La prochaine facture sera générée selon la nouvelle fréquence.

### Q: Que se passe-t-il si l'abonnement est suspendu?
R: Si le statut est `SUSPENDU` ou autre que `ACTIF`, aucune facture n'est générée.

### Q: Comment puis-je voir les factures générées automatiquement?
R: Toutes les factures sont dans `/api/factures`. Cherchez le champ `abonnementId` pour identifier celles auto-générées.

### Q: Puis-je désactiver la génération automatique?
R: Oui, il suffit de ne pas configurer le cron job. Les factures peuvent toujours être créées manuellement.

## 🚨 Dépannage

### Problème: Les factures ne se génèrent pas

**Vérifications:**
1. L'abonnement a le statut `ACTIF`?
   ```bash
   # Vérifier en base
   SELECT id, nom, statut, dateProchainFacture FROM abonnements WHERE id = 'YOUR_ID'
   ```

2. `dateProchainFacture` n'est pas dans le futur?
   ```bash
   # Doit être <= aujourd'hui pour se générer
   ```

3. Tester manuellement:
   ```bash
   npm run cron:invoices
   ```

4. Vérifier les logs Vercel ou console

### Problème: "Unauthorized" sur l'API

**Solution:**
- En production, vérifier que `CRON_SECRET` est défini
- En développement, utiliser `secret=development-secret`

### Problème: Numéros de facture dupliqués

**Solution:**
- Cela ne devrait pas survenir (contrainte UNIQUE)
- Si c'est le cas, contactez le support

## 📞 Support

Pour des questions ou problèmes:
1. Consulter `AUTO_INVOICE_GENERATION.md` pour la doc complète
2. Vérifier les logs en Vercel Dashboard
3. Tester manuellement via le script: `npm run cron:invoices`

---

**Version**: 1.0.0  
**Date**: Décembre 2025  
**Environnement**: Next.js 14 + Prisma + PostgreSQL
