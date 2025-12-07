# ✅ Checklist de Déploiement - Génération Automatique de Factures

## Avant le Déploiement (Développement Local)

### 1. Installation et Configuration
- [ ] Fichiers créés:
  - [ ] `lib/invoice-generator.ts`
  - [ ] `app/api/cron/generate-invoices/route.ts`
  - [ ] `scripts/generate-invoices.ts`
  - [ ] `vercel.json`
- [ ] `package.json` contient `"cron:invoices": "ts-node scripts/generate-invoices.ts"`
- [ ] `app/api/abonnements/route.ts` importe `generateInitialInvoiceForSubscription`
- [ ] `.env.example` mis à jour avec `CRON_SECRET`

### 2. Tests Locaux
- [ ] Créer un client de test
- [ ] Créer un service de test
- [ ] Créer un abonnement mensuel
  - [ ] Vérifier qu'une facture initiale est générée automatiquement
  - [ ] Vérifier le numéro: `FACT-YYYYMM-0001`
  - [ ] Vérifier montantTotal = montant * 1.18
  
- [ ] Tester le cron job manuellement:
  ```bash
  npm run cron:invoices
  ```
  - [ ] Pas d'erreurs dans les logs
  - [ ] Factures générées correctement
  
- [ ] Tester l'API:
  ```bash
  curl "http://localhost:3000/api/cron/generate-invoices?secret=development-secret"
  ```
  - [ ] Réponse 200 OK
  - [ ] JSON valide avec `success: true`

### 3. Vérifications Base de Données
- [ ] Schema Prisma à jour avec modèles `Abonnement` et `Facture`
- [ ] Énums présents: `FrequencePaiement`, `StatutAbonnement`, `StatutFacture`
- [ ] Champs présents sur `Abonnement`:
  - [ ] `dateProchainFacture`
  - [ ] `nombrePaiementsEffectues`
  - [ ] `frequence`
  - [ ] `statut`
- [ ] Champs présents sur `Facture`:
  - [ ] `abonnementId`
  - [ ] `numero` (UNIQUE)
  - [ ] `montant`, `montantTotal`, `tauxTVA`
  - [ ] `dateEmission`, `dateEcheance`

---

## Déploiement sur Vercel

### 1. Configuration Vercel
- [ ] `vercel.json` est présent avec configuration crons
- [ ] Project Settings → Environment Variables:
  - [ ] `CRON_SECRET` = secret fort (générer avec `openssl rand -base64 32`)
  - [ ] `DATABASE_URL` = URL PostgreSQL Vercel
  - [ ] Autres variables existantes maintenues

### 2. Déploiement
- [ ] Code pushed vers GitHub
- [ ] Vercel détecte automatiquement et déploie
- [ ] Build réussi (vérifier Deployments)

### 3. Test Post-Déploiement
- [ ] Vérifier les logs Vercel:
  ```
  Vercel Dashboard → [Project] → Logs
  ```
- [ ] Vérifier les Cron Jobs:
  ```
  Vercel Dashboard → [Project] → Settings → Cron Jobs
  ```
  - [ ] `GET /api/cron/generate-invoices` listed
  - [ ] Schedule: `0 8 * * *` (08:00 UTC daily)
  
- [ ] Appeler manuellement pour tester:
  ```bash
  curl "https://votre-domaine.com/api/cron/generate-invoices?secret=YOUR_SECRET"
  ```
  - [ ] Réponse 200 OK
  - [ ] Factures générées

- [ ] Créer un test d'abonnement en production
  - [ ] Vérifier qu'une facture initiale est créée
  - [ ] Vérifier dans le dashboard

---

## Déploiement sur Linux/VPS

### 1. Installation
- [ ] Code clonéURL repo sur le serveur
- [ ] `npm install`
- [ ] `.env` copié de `.env.example` et configuré:
  ```bash
  CRON_SECRET=$(openssl rand -base64 32)
  ```

### 2. Configuration Cron
- [ ] Ajouter à `crontab -e`:
  ```bash
  0 8 * * * cd /chemin/vers/task-manager && npm run cron:invoices >> /var/log/invoices.log 2>&1
  ```
- [ ] Tester:
  ```bash
  npm run cron:invoices
  ```
- [ ] Vérifier le log:
  ```bash
  tail -f /var/log/invoices.log
  ```

### 3. Monitoring
- [ ] Configurer logrotate pour `/var/log/invoices.log`
- [ ] Ajouter alertes si le cron job échoue

---

## Déploiement Docker Compose

### 1. Configuration
- [ ] `docker-compose.yml` mis à jour:
  - [ ] Service `invoice-cron` configuré
  - [ ] Variable `CRON_SECRET` définie
  - [ ] Dépendance `postgres` vérifiée
  
### 2. Build et Test
- [ ] `docker-compose up -d`
- [ ] Vérifier que le service démarre:
  ```bash
  docker-compose logs invoice-cron
  ```

### 3. Test
- [ ] Créer un abonnement de test
- [ ] Vérifier qu'une facture est générée
- [ ] Attendre 24h ou modifier le schedule pour test

---

## Post-Déploiement (Tous les Environnements)

### 1. Documentation
- [ ] `AUTO_INVOICE_GENERATION.md` dans le repo
- [ ] `INTEGRATION_GUIDE_AUTO_INVOICES.md` dans le repo
- [ ] Équipe informée du nouveau système
- [ ] README.md mis à jour si nécessaire

### 2. Monitoring et Alertes
- [ ] Logs configurés et accessibles:
  - [ ] Vercel: Dashboard Logs
  - [ ] Linux: `/var/log/invoices.log`
  - [ ] Docker: `docker-compose logs invoice-cron`
  
- [ ] Alertes configurées pour:
  - [ ] Cron job failure (Sentry, DataDog, etc.)
  - [ ] Erreurs de création de facture
  - [ ] Trop d'erreurs consécutives

### 3. Maintenance
- [ ] Vérifier mensuellement:
  - [ ] Cron job s'exécute correctement
  - [ ] Factures générées avec les bons montants
  - [ ] Pas de doublons (contrôle UNIQUE)
  
- [ ] Archiver les logs anciens:
  - [ ] Vercel: Conservation automatique (7 jours)
  - [ ] Linux: Configurer logrotate
  - [ ] Docker: Configurer log rotation

### 4. Validation Métier
- [ ] Manager valide que:
  - [ ] Les factures manuelles et auto-générées coexistent
  - [ ] Les montants sont corrects (+ TVA 18%)
  - [ ] Les dates d'échéance sont correctes (15j après)
  - [ ] Les clients reçoivent les factures
  
- [ ] Trésorier valide que:
  - [ ] Les factures apparaissent dans le dashboard
  - [ ] Les paiements sont traçables
  - [ ] Les rapports incluent les factures auto-générées

### 5. Rollback Plan
- [ ] Si problème, les factures manuelles peuvent toujours être créées
- [ ] Si cron job échoue, aucun impact sur l'app (exécution asynchrone)
- [ ] Désactiver le cron job:
  - [ ] Vercel: Supprimer `vercel.json` crons
  - [ ] Linux: Commenter la ligne crontab
  - [ ] Docker: Arrêter le service invoice-cron

---

## Problèmes Courants et Solutions

### Problème: "Unauthorized" sur l'API
```bash
# Solution: Ajouter le secret correct
curl "http://localhost:3000/api/cron/generate-invoices?secret=VOTRE_SECRET"
```

### Problème: Les factures ne se génèrent pas
```bash
# Vérifier que l'abonnement a le statut ACTIF
SELECT statut, dateProchainFacture FROM abonnements WHERE id='xxx'

# Vérifier les logs
npm run cron:invoices
```

### Problème: Erreur "abonnement est null"
```bash
# Le service prend le abonnement avec la relation include:
# Vérifier que le abonnement existe vraiment en base
```

---

## Sign-Off

- [ ] Développeur: ___________  Date: ___/___/___
- [ ] QA: ___________  Date: ___/___/___
- [ ] Manager: ___________  Date: ___/___/___

---

**Version**: 1.0.0  
**Dernière mise à jour**: Décembre 2025
