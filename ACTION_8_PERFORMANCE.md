# ⚡ Performance Profiling - Action 8

## Objectif
Optimiser la performance du système pour:
- ✅ Emails envoyés rapidement
- ✅ CRON s'exécute en < 5 secondes
- ✅ API queries optimisées

---

## 🔍 Points de Mesure

### 1. Envoi d'Email
**Métrique**: Temps entre `generateLatePaymentEmail()` et `sendEmail()` completion

#### Code à profiler
```typescript
// lib/paymentLateService.ts ligne 130-165
console.time('email-latepayment');

const emailTemplate = generateLatePaymentEmail({...})
const result = await sendEmail({...})

console.timeEnd('email-latepayment');  // Affiche: email-latepayment: Xms
```

#### Target
- ✅ Ethereal: < 1 second (dev/test)
- ✅ SMTP Production: < 2 seconds
- ⚠️ Si > 5s: vérifier connexion SMTP

---

### 2. Détection Paiements Retard
**Métrique**: Temps total `checkAndNotifyLatePayments()`

#### Code à profiler
```typescript
// lib/paymentLateService.ts ligne 70
console.time('check-late-payments');

const result = await checkAndNotifyLatePayments()

console.timeEnd('check-late-payments');
```

#### Target
- ✅ < 3 seconds pour 100 paiements
- ✅ < 10 seconds pour 1000 paiements
- ⚠️ Si plus: optimiser requête Prisma

---

### 3. Requête Prisma Paiements
**Métrique**: Temps `prisma.paiement.findMany()`

#### Code à profiler
```typescript
console.time('prisma-pending-payments');

const pendingPayments = await prisma.paiement.findMany({
  where: { statut: 'EN_ATTENTE' },
  include: { projet: true, client: true, facture: true, tache: true }
})

console.timeEnd('prisma-pending-payments');
```

#### Target
- ✅ < 500ms pour 100 paiements
- ⚠️ Si 500ms-1s: vérifier indexes
- ❌ Si > 1s: ajouter indexes manquants

---

### 4. Appels API
**Métrique**: Temps de réponse HTTP

#### Endpoints critiques
```bash
# Mesurer avec curl
time curl -X POST http://localhost:3000/api/paiements/check-late

# Ou avec ab (Apache Bench)
ab -n 10 -c 1 http://localhost:3000/api/paiements/check-late
```

#### Target
- ✅ GET /api/factures: < 200ms
- ✅ POST /api/paiements: < 300ms
- ✅ POST /api/cron/check-late-payments: < 5000ms

---

## 🚀 Guide d'Optimisation

### Problème 1: Email envoi lent

**Symptôme**: Emails prennent > 2 secondes

**Solutions**:
```typescript
// ❌ AVANT: Serial (lent)
for (const manager of managers) {
  await sendEmail({...})  // Attendre chaque email
}

// ✅ APRÈS: Parallel (rapide)
await Promise.all(
  managers.map(manager => 
    sendEmail({...}).catch(err => {
      console.error(`Email failed: ${err}`)
      // Continue anyway
    })
  )
)
```

### Problème 2: Requête Prisma lente

**Symptôme**: `prisma.paiement.findMany()` prend > 1 second

**Solutions**:
```typescript
// ✅ Ajouter indexes au schema
model Paiement {
  ...
  statut      String  // ← Ajouter index
  
  @@index([statut])   // ← Index composite
  @@index([clientId])
  @@index([factureId])
}

// ✅ Migration Prisma
npx prisma migrate dev --name add_payment_indexes
```

### Problème 3: API timeout

**Symptôme**: API répond après 5+ secondes

**Solutions**:
```typescript
// ✅ Ajouter timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 10000)  // 10s max
);

const result = await Promise.race([
  checkAndNotifyLatePayments(),
  timeoutPromise
])
```

---

## 📊 Benchmark Local

### Setup
```bash
# 1. Démarrer le serveur
npm run dev

# 2. Dans un autre terminal
cd scripts
```

### Test 1: Email Performance
```bash
# Créer un script de test
cat > test-email-perf.js << 'EOF'
const fetch = require('node-fetch');

async function testEmail() {
  console.time('email-test');
  
  // Déclencher la vérification
  const res = await fetch('http://localhost:3000/api/paiements/check-late', {
    method: 'POST',
    headers: { 'X-Internal-Secret': 'development-secret' }
  });
  
  const data = await res.json();
  
  console.timeEnd('email-test');
  console.log('Result:', data);
}

testEmail().catch(console.error);
EOF

node test-email-perf.js
```

### Test 2: Load Testing
```bash
# Installer Apache Bench (si pas déjà)
# Ubuntu: sudo apt install apache2-utils
# macOS: brew install httpd

# Test de charge
ab -n 10 -c 5 \
  -H "X-Internal-Secret: development-secret" \
  -X POST \
  http://localhost:3000/api/paiements/check-late

# Résultat:
# Time per request: Xms (moyenne)
# Requests per second: X
```

### Test 3: Profiling avec Node
```bash
# Créer script de profiling
cat > profile-payments.js << 'EOF'
const { performance } = require('perf_hooks');
const fetch = require('node-fetch');

async function profile() {
  const start = performance.now();
  
  const res = await fetch('http://localhost:3000/api/paiements/check-late', {
    method: 'POST',
    headers: { 'X-Internal-Secret': 'development-secret' }
  });
  
  const data = await res.json();
  const elapsed = performance.now() - start;
  
  console.log(`Total time: ${elapsed.toFixed(2)}ms`);
  console.log(`Payments found: ${data.latePaymentsCount}`);
  console.log(`Avg time per payment: ${(elapsed / data.latePaymentsCount).toFixed(2)}ms`);
}

profile().catch(console.error);
EOF

node profile-payments.js
```

---

## 📈 Résultats Attendus

### Avant Optimisation
```
Email envoyé: 1500ms ⚠️
Check late payments: 8000ms ⚠️
Prisma query: 1200ms ⚠️
```

### Après Optimisation
```
Email envoyé: 300ms ✅
Check late payments: 2000ms ✅
Prisma query: 400ms ✅
```

---

## ✅ Checklist Performance

```
[ ] 1. Mesurer temps email avant optimisation
[ ] 2. Mesurer temps CRON avant optimisation
[ ] 3. Ajouter console.time() aux endroits clés
[ ] 4. Identifier les goulots (> 1s)
[ ] 5. Appliquer optimisations parallèles
[ ] 6. Ajouter indexes Prisma si nécessaire
[ ] 7. Tester avec ab ou load testing
[ ] 8. Mesurer à nouveau après optimisation
[ ] 9. Comparer avant/après
[ ] 10. Documenter les gains de performance
```

---

## 🔧 Optimisations Recommandées

### À faire maintenant
1. ✅ Paralléliser les emails
   ```typescript
   await Promise.all(managers.map(m => sendEmail(...)))
   ```

2. ✅ Ajouter indexes Prisma
   ```prisma
   @@index([statut])
   @@index([clientId])
   ```

### À faire selon résultats
3. ⚠️ Cache résultats si > 3 secondes
4. ⚠️ Pagination si > 1000 paiements
5. ⚠️ Worker thread pour CRON lourd

---

**Prochain**: Action 9 (Documentation Mise à Jour)
