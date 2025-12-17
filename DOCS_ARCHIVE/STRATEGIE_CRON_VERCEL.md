# 🔄 STRATÉGIE CRON UNIFIÉE - VERCEL

## 📋 Décision: Utiliser Vercel CRON pour TOUS les CRON

**Raison:** Cohérence - tous les CRON au même endroit

---

## 🎯 Configuration Finale (vercel.json)

```json
{
  "crons": [
    // INVOICES
    {
      "path": "/api/cron/generate-invoices",
      "schedule": "0 8 * * *",
      "description": "Générer les factures quotidiennement (08:00)"
    },

    // SALARIES NOTIFICATIONS
    {
      "path": "/api/cron/salary-notifications",
      "schedule": "0 9 * * *",
      "description": "Notifications salaires quotidiennes (09:00)"
    },

    // PAYMENTS - Check for late payments
    {
      "path": "/api/cron/check-late-payments",
      "schedule": "0 10 * * *",
      "description": "Vérifier les paiements retard (10:00)"
    },

    // TASKS - Check for late tasks
    {
      "path": "/api/cron/check-late-tasks",
      "schedule": "0 11 * * *",
      "description": "Vérifier les tâches retard (11:00)"
    },

    // SALARY FORECASTS - 31st at midnight
    {
      "path": "/api/cron/salary/forecast-calculated",
      "schedule": "0 0 31 * *",
      "description": "Prévisions salariales calculées (31 minuit)"
    },

    // SALARY PAYMENT DUE - 1st at 08:00
    {
      "path": "/api/cron/salary/payment-due",
      "schedule": "0 8 1 * *",
      "description": "Rappel paiement salaires (1er 08:00)"
    },

    // SALARY PAYMENT LATE ALERT - 3rd at 09:00
    {
      "path": "/api/cron/salary/payment-late",
      "schedule": "0 9 3 * *",
      "description": "Alerte paiement retard (3 09:00)"
    }
  ]
}
```

---

## 📅 Timeline des CRON par Jour

### Chaque Jour (Quotidien)
```
08:00 → /api/cron/generate-invoices
09:00 → /api/cron/salary-notifications
10:00 → /api/cron/check-late-payments
11:00 → /api/cron/check-late-tasks
```

### Jours Spécifiques du Mois
```
31st at 00:00 → /api/cron/salary/forecast-calculated
1st  at 08:00 → /api/cron/salary/payment-due
3rd  at 09:00 → /api/cron/salary/payment-late
```

---

## ✅ Avantages de Vercel CRON pour TOUS

### 1. Simplicité
- ✅ Une seule source de vérité (vercel.json)
- ✅ Pas de duplication
- ✅ Configuration centralisée

### 2. Fiabilité
- ✅ Vercel gère les retry automatiques
- ✅ Monitoring natif
- ✅ Logs intégrés

### 3. Cohérence
- ✅ Même pattern pour tous
- ✅ Pas de conflits avec GitHub Actions
- ✅ Facile à maintenir

### 4. Pas de Coûts Supplémentaires
- ✅ Vercel CRON inclus dans le plan Pro
- ✅ GitHub Actions gratuit mais moins fiable
- ✅ Une seule solution à gérer

---

## 🔒 Sécurité

Tous les CRON utilisent **CRON_SECRET** Bearer token:

```bash
# .env.local (local dev)
CRON_SECRET=your-generated-token

# Vercel (production)
# Settings → Environment Variables
# CRON_SECRET=your-generated-token
```

Validation dans chaque route:
```typescript
const secret = request.headers.get('authorization');
if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 📊 Tous les CRON Routes

### Routes Existantes (À intégrer)
```
✅ /api/cron/generate-invoices
✅ /api/cron/salary-notifications
✅ /api/cron/check-late-payments
✅ /api/cron/check-late-tasks
```

### Routes Nouvelles (SALARY FEATURES)
```
✅ /api/cron/salary/forecast-calculated
✅ /api/cron/salary/payment-due
✅ /api/cron/salary/payment-late
```

---

## 🚀 Déploiement sur Vercel

### Étape 1: Configuration Locale
```bash
# .env.local
CRON_SECRET=$(openssl rand -hex 32)
```

### Étape 2: Vérifier vercel.json
```bash
cat vercel.json | jq '.crons'
# Doit montrer 7 CRON routes
```

### Étape 3: Push vers Vercel
```bash
git add .
git commit -m "feat: unified CRON strategy on Vercel"
git push origin main
# Vercel déploie automatiquement
```

### Étape 4: Configurer Vercel
```
Vercel Dashboard → Project Settings → Environment Variables

CRON_SECRET = <paste-your-generated-token>
```

### Étape 5: Vérifier Activation
```
Vercel Dashboard → Crons
# Devrait montrer 7 routes avec schedules
```

---

## 🧪 Tester les CRON (Local)

### Tester chaque route
```bash
export CRON_SECRET="your-token-from-.env.local"

# Invoice generation
curl http://localhost:3000/api/cron/generate-invoices \
  -H "Authorization: Bearer $CRON_SECRET"

# Salary notifications
curl http://localhost:3000/api/cron/salary-notifications \
  -H "Authorization: Bearer $CRON_SECRET"

# Check late payments
curl http://localhost:3000/api/cron/check-late-payments \
  -H "Authorization: Bearer $CRON_SECRET"

# Check late tasks
curl http://localhost:3000/api/cron/check-late-tasks \
  -H "Authorization: Bearer $CRON_SECRET"

# Salary forecast calculated
curl http://localhost:3000/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer $CRON_SECRET"

# Salary payment due
curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer $CRON_SECRET"

# Salary payment late
curl http://localhost:3000/api/cron/salary/payment-late \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Résultats attendus
```
✅ Chaque route retourne HTTP 200
✅ Response JSON avec { success: true, ... }
✅ Logs affichés dans la console
```

---

## 📌 GitHub Actions - Qu'en Faire?

### Option 1: Supprimer les workflows CRON
```bash
rm .github/workflows/salary-notifications-cron.yml
rm .github/workflows/recurring-billing.yml
rm .github/workflows/check-late.yml
rm .github/workflows/check-late-tasks.yml
rm .github/workflows/check-late-payments.yml
```

### Option 2: Les garder comme backup
```bash
# Renommer les fichiers
mv .github/workflows/salary-notifications-cron.yml \
   .github/workflows/_BACKUP_salary-notifications-cron.yml
```

**Recommandation:** Option 1 - Supprimer pour éviter la confusion

---

## ✨ Avantages FINAUX

```
✅ 1 source de vérité (vercel.json)
✅ 7 CRON routes gérées par Vercel
✅ Cohérence avec tous les autres CRON
✅ Pas de GitHub Actions CRON
✅ Pas de double exécution
✅ Configuration simple
✅ Monitoring natif Vercel
✅ Logs intégrés
✅ Retry automatiques
```

---

## 📋 Checklist Déploiement

- [ ] vercel.json mis à jour avec 7 CRON
- [ ] CRON_SECRET généré (openssl rand -hex 32)
- [ ] Code pushé vers main
- [ ] Vercel build réussi
- [ ] CRON_SECRET configuré dans Vercel
- [ ] Tous les endpoints testés localement
- [ ] Vercel Dashboard montre 7 CRON routes
- [ ] Tests CRON en production (attendre l'exécution)
- [ ] Logs Vercel vérifiés (pas d'erreurs)
- [ ] Notifications reçues (emails + in-app)

---

## 🎯 Résumé

**Stratégie:** Vercel CRON pour TOUS
**Routes:** 7 total (4 existantes + 3 nouvelles)
**Configuration:** vercel.json
**Sécurité:** CRON_SECRET Bearer token
**Monitoring:** Vercel Dashboard

---

**Status:** ✅ Configuration cohérente et unifiée
**Risk:** Très faible (Vercel géré)
**Ready:** YES ✅

Next: Push to production and verify in Vercel Dashboard
