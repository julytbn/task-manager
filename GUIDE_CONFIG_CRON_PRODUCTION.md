# ⏰ CONFIGURATION CRON JOBS - PRODUCTION

## 📋 Endpoints Existants

### 1. `POST /api/cron/generate-invoices`
**Fréquence:** 1er du mois
**Fonction:** Génère les factures d'abonnement mensuels
**Données:** Abonnements ACTIFS → Factures automatiques

### 2. `GET /api/cron/check-late-payments`
**Fréquence:** Quotidienne (08:00 AM)
**Fonction:** Détecte les factures impayées > 15j
**Action:** Envoie notifications email rappel

### 3. `GET /api/cron/salary-notifications`
**Fréquence:** Quotidienne (09:00 AM)
**Fonction:** Notifie les prévisions salariales
**Action:** 5 jours avant date de paiement

### 4. `GET /api/cron/check-late-tasks`
**Fréquence:** Quotidienne (10:00 AM)
**Fonction:** Détecte les tâches en retard
**Action:** Envoie alertes assignés et managers

---

## 🔐 Protection par CRON_SECRET

Tous les cron jobs vérifient le header `x-cron-secret`:

```typescript
const authHeader = request.headers.get('x-cron-secret')
const expectedSecret = process.env.CRON_SECRET

if (process.env.NODE_ENV === 'production' && authHeader !== expectedSecret) {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}
```

---

## 📦 OPTIONS DE DÉPLOIEMENT

### OPTION 1: Vercel Crons (Recommandé)

**Avantages:** 
- Inclus avec Vercel
- Pas de config externe
- Monitoring intégré

**Installation:**
```bash
# 1. Créer vercel.json
cat > vercel.json << 'EOF'
{
  "crons": [
    {
      "path": "/api/cron/generate-invoices",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/check-late-payments",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/salary-notifications",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/check-late-tasks",
      "schedule": "0 10 * * *"
    }
  ]
}
EOF

# 2. Configuration .env.production
CRON_SECRET=$(openssl rand -base64 32)
echo "CRON_SECRET=$CRON_SECRET" >> .env.production

# 3. Push vers Vercel
git push
```

**Vérification:**
```bash
# Voir les cron jobs actifs
vercel cron list

# Voir les logs
vercel logs --follow
```

---

### OPTION 2: GitHub Actions Workflow

**Installation:**
```bash
# 1. Créer .github/workflows/cron.yml
mkdir -p .github/workflows

cat > .github/workflows/cron.yml << 'EOF'
name: Kekeli Cron Jobs

on:
  schedule:
    - cron: '0 0 1 * *'  # 1er du mois
    - cron: '0 8 * * *'  # 08:00 quotidien
    - cron: '0 9 * * *'  # 09:00 quotidien
    - cron: '0 10 * * *' # 10:00 quotidien

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run generate-invoices
        if: github.event.schedule == '0 0 1 * *'
        run: |
          curl -X POST ${{ secrets.CRON_BASE_URL }}/api/cron/generate-invoices \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
      
      - name: Run check-late-payments
        if: github.event.schedule == '0 8 * * *'
        run: |
          curl -X GET ${{ secrets.CRON_BASE_URL }}/api/cron/check-late-payments \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
      
      - name: Run salary-notifications
        if: github.event.schedule == '0 9 * * *'
        run: |
          curl -X GET ${{ secrets.CRON_BASE_URL }}/api/cron/salary-notifications \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
      
      - name: Run check-late-tasks
        if: github.event.schedule == '0 10 * * *'
        run: |
          curl -X GET ${{ secrets.CRON_BASE_URL }}/api/cron/check-late-tasks \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
EOF

# 2. Ajouter secrets GitHub
# Aller sur: https://github.com/yourrepo/settings/secrets
# Ajouter:
#   - CRON_BASE_URL: https://votreapp.com
#   - CRON_SECRET: (même valeur que env)
```

---

### OPTION 3: AWS Lambda + EventBridge

**Installation:**
```bash
# 1. Installer SAM CLI
brew install aws-sam-cli

# 2. Créer template.yaml
cat > template.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  GenerateInvoicesCron:
    Type: AWS::Events::Rule
    Properties:
      ScheduleExpression: "cron(0 0 1 * ? *)"
      State: ENABLED
      Targets:
        - Arn: !Sub "https://${API_ENDPOINT}/api/cron/generate-invoices"
          RoleArn: !GetAtt CronRole.Arn
          HttpParameters:
            HeaderParameters:
              x-cron-secret: !Sub "{{resolve:secretsmanager:kekeli:SecretString:CRON_SECRET}}"
EOF

# 3. Deploy
sam deploy --guided
```

---

### OPTION 4: Self-hosted (Node.js + PM2)

**Installation:**
```bash
# 1. Installer node-cron
npm install node-cron

# 2. Créer cron-server.js
cat > cron-server.js << 'EOF'
const cron = require('node-cron')
const fetch = require('node-fetch')

const BASE_URL = process.env.CRON_BASE_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET

async function callCron(endpoint, method = 'GET') {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'x-cron-secret': CRON_SECRET }
    })
    console.log(`✅ ${endpoint}: ${response.status}`)
    return response.ok
  } catch (error) {
    console.error(`❌ ${endpoint}: ${error.message}`)
    return false
  }
}

// 1er du mois à 00:00
cron.schedule('0 0 1 * *', () => {
  console.log('⏰ Running: generate-invoices')
  callCron('/api/cron/generate-invoices', 'POST')
})

// Quotidien 08:00
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Running: check-late-payments')
  callCron('/api/cron/check-late-payments')
})

// Quotidien 09:00
cron.schedule('0 9 * * *', () => {
  console.log('⏰ Running: salary-notifications')
  callCron('/api/cron/salary-notifications')
})

// Quotidien 10:00
cron.schedule('0 10 * * *', () => {
  console.log('⏰ Running: check-late-tasks')
  callCron('/api/cron/check-late-tasks')
})

console.log('✅ Cron server started')
EOF

# 3. Ajouter à PM2
npm install -g pm2
pm2 start cron-server.js --name "kekeli-crons"
pm2 save

# 4. Redémarrer après crash
pm2 startup
```

---

## 🧪 TESTS CRON JOBS

### Test 1: Vérifier Protection
```bash
# Sans header → 401
curl -X GET http://localhost:3000/api/cron/check-late-payments
# Expected: 401 Unauthorized

# Avec mauvais header → 401
curl -X GET \
  -H "x-cron-secret: wrong-secret" \
  http://localhost:3000/api/cron/check-late-payments
# Expected: 401

# Avec bon header → 200
curl -X GET \
  -H "x-cron-secret: $CRON_SECRET" \
  http://localhost:3000/api/cron/check-late-payments
# Expected: 200 OK
```

### Test 2: Exécution Manuelle
```bash
# Générer les factures d'abonnement
CRON_SECRET=$(grep CRON_SECRET .env | cut -d= -f2)

curl -X POST \
  -H "x-cron-secret: $CRON_SECRET" \
  http://localhost:3000/api/cron/generate-invoices

# Vérifier les logs
tail -f .next/server.log | grep "CRON"
```

### Test 3: Trigger depuis Node.js
```javascript
// scripts/test-crons.js
const cronSecret = process.env.CRON_SECRET

async function testCron(endpoint) {
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    headers: { 'x-cron-secret': cronSecret }
  })
  console.log(`${endpoint}: ${response.status}`)
  return response.json()
}

// Exécuter tous les crons
Promise.all([
  testCron('/api/cron/generate-invoices'),
  testCron('/api/cron/check-late-payments'),
  testCron('/api/cron/salary-notifications'),
  testCron('/api/cron/check-late-tasks')
]).then(console.log)
```

---

## 📊 MONITORING CRONS

### Vérifier Exécution Réussie

```sql
-- Factures créées aujourd'hui
SELECT COUNT(*) FROM Facture 
WHERE DATE(createdAt) = CURRENT_DATE;

-- Notifications envoyées
SELECT COUNT(*) FROM Notification 
WHERE DATE(createdAt) = CURRENT_DATE;

-- Paiements en retard détectés
SELECT COUNT(*) FROM Facture 
WHERE statut = 'IMPAYEE' 
AND daysLate > 15;
```

### Logs Recommandés

```typescript
// À ajouter à chaque cron endpoint:
console.log(`[CRON ${endpoint}] START: ${new Date().toISOString()}`)
console.log(`[CRON ${endpoint}] Traités: ${count} items`)
console.log(`[CRON ${endpoint}] Emails envoyés: ${emailCount}`)
console.log(`[CRON ${endpoint}] FINISH: ${new Date().toISOString()} (+${elapsed}ms)`)
```

### Alertes Production

```typescript
// Envoyer alerte si cron échoue:
if (!success) {
  await sendEmail({
    to: 'admin@kekeligroup.com',
    subject: `🚨 ALERTE: Cron ${endpoint} échoué`,
    html: `...erreur...`
  })
}
```

---

## ✅ CHECKLIST DEPLOIEMENT CRONS

- [ ] CRON_SECRET généré et sécurisé: `openssl rand -base64 32`
- [ ] .env.production configuré avec CRON_SECRET
- [ ] vercel.json créé avec horaires corrects
- [ ] Tests manuels réussis (401 sans secret, 200 avec)
- [ ] Logs configurés pour monitoring
- [ ] Alertes email en cas d'erreur
- [ ] Vérification post-exécution (factures, notifications créées)
- [ ] Retention policy définie (combien de temps garder historique?)
- [ ] Backup des données avant crons
- [ ] Documentation pour équipe ops

---

## ⏱️ TEMPS ESTIMÉ

- **Vercel Crons:** 30 min (PLUS FACILE)
- **GitHub Actions:** 45 min
- **AWS Lambda:** 1.5 h
- **Self-hosted PM2:** 1 h
- **Tests + validation:** 30 min
- **Total: ~2-2.5 heures**

### Recommandation: ✅ **Utiliser Vercel Crons** (inclus, zéro config infra)

