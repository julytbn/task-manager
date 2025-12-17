# 🧪 GUIDE TESTS MANUELS - SALARY FEATURES

## 📌 SETUP INITIAL (Local Development)

### 1. Démarrer le serveur local
```bash
npm run dev
# ou
yarn dev
```

L'app devrait être accessible à http://localhost:3000

### 2. Préparer les données de test
```bash
# Ouvrir Prisma Studio
npx prisma studio

# Créer/vérifier:
# 1. Un utilisateur ADMIN (pour tester admin access)
# 2. Un utilisateur MANAGER (pour manager dashboard)
# 3. Au moins 2 utilisateurs EMPLOYE avec tarifHoraire
# 4. Une PrevisionSalaire pour le mois courant
```

### 3. Login
- Aller à http://localhost:3000/login
- Login comme MANAGER pour tester le dashboard

---

## 🧪 TEST 1: WIDGET AFFICHAGE

### Étape 1: Ouvrir le Manager Dashboard
```
1. Login comme MANAGER
2. Naviguer vers /dashboard
3. Scroller jusqu'à la section "PRÉVISIONS SALARIALES"
```

### Étape 2: Vérifier le Widget
```
✅ À voir:
   - Titre "Prévisions Salariales du Mois"
   - 3 KPI cards:
     * "Montant Total" (ex: 15,000,000 XOF)
     * "Employés" (nombre)
     * "Délai Paiement" (5)
   - Statut badge (Payé/À régler/Retard)
   - Liste des employés avec montants
   - Bouton "Marquer comme payé"
```

### Étape 3: Vérifier les données
```
✅ Montant total doit = somme des montantPrevu
✅ Nombre d'employés correct
✅ Aucune erreur console (F12)
✅ Pas de NaN ou undefined
```

### Échecs possibles:
```
❌ Widget ne charge pas?
   → Check que PrevisionSalaire existe pour ce mois
   → Vérifier user est MANAGER ou ADMIN
   → Vérifier API répond: GET /api/dashboard/salary-widget

❌ Données incorrectes?
   → Vérifier les records en Prisma Studio
   → Check les calculs manuellement
```

---

## 🧪 TEST 2: GRAPHIQUE COUVERTURE

### Étape 1: Observer le Graphique
```
À voir sur le même dashboard:
- Titre "Couverture Salariale (12 mois)"
- Graphique avec:
  * Barres bleues = Charges salariales
  * Barres vertes = Recettes
  * Ligne orange = Couverture %
- 3 stats cards:
  * Total Charges
  * Total Recettes
  * Couverture Moyenne %
```

### Étape 2: Vérifier les données
```
✅ 12 mois d'historique affichés
✅ Les montants en XOF
✅ Pourcentage de couverture logique (0-100%)
✅ Légende lisible
✅ Tooltip au hover
```

### Test du responsive
```
✅ Sur desktop: graphique large
✅ Sur mobile (F12 responsive): graphique ajusté
✅ Pas de scroll horizontal
```

---

## 🧪 TEST 3: MODAL PAIEMENT

### Étape 1: Ouvrir la Modal
```
1. Sur le widget, cliquer "Marquer comme payé"
2. Une modal doit s'ouvrir avec un form
```

### Étape 2: Remplir le formulaire
```
Champs à voir:
✅ Montant (number input, doit être > 0)
✅ Moyen de paiement (select avec options)
✅ Référence (text input)

Options moyens de paiement:
  - Virement Bancaire
  - Chèque
  - Mobile Money
  - Espèces
  - Carte Bancaire
```

### Étape 3: Tester validations
```
Test 1: Submit sans rien remplir
  → Doit afficher erreur "Tous les champs requis"

Test 2: Remplir montant = 0
  → Doit afficher erreur "Montant doit être > 0"

Test 3: Remplir référence vide
  → Doit afficher erreur "Référence requise"

Test 4: Remplir correctement
  → Doit activer le bouton Confirmer
```

### Étape 4: Soumettre valide
```
1. Remplir:
   - Montant: 15,000,000
   - Moyen: "Virement Bancaire"
   - Référence: "TEST-001"

2. Click "Confirmer Paiement"

3. À voir:
   ✅ Loading spinner le temps du traitement
   ✅ Success alert: "✅ Paiement enregistré avec succès!"
   ✅ Modal se ferme
   ✅ Widget se rafraîchit

4. Vérifier en Prisma Studio:
   ✅ Nouveau record Paiement créé
   ✅ Nouvelle Notification créée
```

---

## 🧪 TEST 4: ENDPOINTS API

### Test 4a: GET /api/dashboard/salary-widget
```bash
# Avec curl (en local):
curl http://localhost:3000/api/dashboard/salary-widget \
  -H "Cookie: session=YOUR_SESSION"

# Expected response:
{
  "montantTotal": 15000000,
  "nombreEmployes": 2,
  "dateLimite": "2024-01-05T00:00:00Z",
  "isPaid": false,
  "totalPaid": 0,
  "prévisions": [
    {
      "id": "uuid-123",
      "nomEmploye": "Jean Dupont",
      "montantPrevu": 1250000
    }
  ]
}

# Test error:
curl http://localhost:3000/api/dashboard/salary-widget
# → Doit retourner 401 Unauthorized (pas de session)
```

### Test 4b: GET /api/dashboard/salary-coverage
```bash
curl http://localhost:3000/api/dashboard/salary-coverage \
  -H "Cookie: session=YOUR_SESSION"

# Expected response:
[
  {
    "label": "Décembre 2023",
    "salaires": 15000000,
    "recettes": 45000000,
    "couverture": 33.33
  },
  ...
]
```

### Test 4c: POST /api/salary/mark-paid
```bash
curl -X POST http://localhost:3000/api/salary/mark-paid \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{
    "montant": 15000000,
    "moyenPaiement": "Virement Bancaire",
    "reference": "TEST-CURL-001"
  }'

# Expected response:
{
  "success": true,
  "paiement": {
    "id": "uuid-456",
    "montant": 15000000,
    "statut": "CONFIRME",
    "datePaiement": "2024-01-20T10:30:00Z"
  }
}

# Test error - mauvais montant:
curl -X POST http://localhost:3000/api/salary/mark-paid \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{"montant": 0, "moyenPaiement": "Virement", "reference": "X"}'
# → Doit retourner 400 Bad Request avec message d'erreur
```

---

## 🧪 TEST 5: CRON ROUTES (Local Testing)

### Test 5a: GET /api/cron/salary/forecast-calculated
```bash
# Besoin du CRON_SECRET
export CRON_SECRET="test-secret-123"

# Configurer en .env.local:
# CRON_SECRET=test-secret-123

# Puis tester:
curl http://localhost:3000/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer test-secret-123"

# Expected:
{
  "success": true,
  "message": "Salary forecast notifications sent",
  "timestamp": "2024-01-31T00:00:00Z"
}

# Sans secret:
curl http://localhost:3000/api/cron/salary/forecast-calculated
# → 401 Unauthorized
```

### Test 5b: GET /api/cron/salary/payment-due
```bash
curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer test-secret-123"

# Expected:
{
  "success": true,
  "message": "Salary payment reminders sent and charges created",
  "charges": {
    "created": 2,
    "total": 15000000,
    "errors": []
  },
  "timestamp": "2024-01-01T08:00:00Z"
}

# Vérifier en Prisma que charges créées:
# ✅ 2 records Charge créés
# ✅ Montants = montantPrevu des previsions
# ✅ Date = 5 du mois
```

### Test 5c: GET /api/cron/salary/payment-late
```bash
curl http://localhost:3000/api/cron/salary/payment-late \
  -H "Authorization: Bearer test-secret-123"

# Expected (si paiement pas fait):
{
  "success": true,
  "message": "Late payment alerts sent",
  "alertsSent": 1,
  "timestamp": "2024-01-03T09:00:00Z"
}
```

---

## 🧪 TEST 6: NOTIFICATIONS

### Test 6a: Vérifier records Notification créés
```bash
# Dans Prisma Studio:
1. Naviguer vers "Notification" model
2. Après chaque test, vérifier que records créés:
   - Type: INFO/ALERTE/SUCCES
   - sourceType: SALAIRE
   - titre: "Prévisions salariales...", "Salaires à payer...", etc
   - message: contient montants + détails
   - utilisateurId: correspondant à ADMIN/MANAGER
```

### Test 6b: Email (si SMTP configuré)
```bash
# Avant test, configurer .env.local:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@test.com

# Après appeler CRON:
1. Attendre 5-10 secondes
2. Vérifier la boîte email configurée
3. À voir:
   ✅ Email reçu
   ✅ Sujet correct
   ✅ HTML format lisible
   ✅ Montants affichés correctement
```

---

## 🧪 TEST 7: AUTO-CREATE CHARGES

### Test 7a: Vérifier création automatique
```bash
# Avant test:
1. Créer 2-3 PrevisionSalaire pour le mois courant
2. Appeler CRON payment-due:

curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer test-secret"

# Après, vérifier en Prisma:
1. Naviguer vers "Charge" model
2. Filter par categorie = 'SALAIRES_CHARGES_SOCIALES'
3. À voir:
   ✅ Nombre de charges = nombre de previsions
   ✅ Montants correspondent à montantPrevu
   ✅ Date = 5 du mois courant
   ✅ employeId correct pour chaque
```

### Test 7b: Éviter les doublons
```bash
# Appeler 2 fois le même CRON:
curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer test-secret"

# Attendre 2 secondes, relancer:
curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer test-secret"

# Vérifier:
✅ Pas de doublons créés
✅ Nombre de charges reste = nombre de previsions
✅ Response 2ème appel indique "already created"
```

---

## 📊 TEST 8: SCENARIO COMPLET WORKFLOW

### Day 1-30: Employee Timesheets
```bash
# 1. Créer TimeSheet pour janvier (EN_ATTENTE)
# 2. Manager valide TimeSheet → statut VALIDEE
# 3. Système calcule montantPrevu = heures_validees × tarifHoraire
# 4. Création auto de PrevisionSalaire pour janvier
```

### Day 31 à 23:59
```bash
# CRON 31 minuit s'exécute automatiquement en prod
# En local, tester manuellement:
curl http://localhost:3000/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer $CRON_SECRET"

# À vérifier:
✅ Notification "Prévisions salariales calculées" créée
✅ Email envoyé aux ADMINs (si SMTP configured)
```

### Day 1 à 08:00
```bash
# CRON payment-due s'exécute
curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer $CRON_SECRET"

# À vérifier:
✅ Notification "Salaires à payer avant le 5" créée
✅ Charges auto-créées en base
✅ Email envoyé aux ADMIN/MANAGER
```

### Day 2-4: Manager enregistre paiements
```bash
# Manager va sur dashboard
# Clique "Marquer comme payé"
# Remplit form avec détails paiement
# Submit → Paiement créé + Notification sent

# À vérifier:
✅ Record Paiement en base
✅ Notification "Paiement enregistré"
✅ Widget se met à jour (statut = Payé)
```

### Day 5: Deadline
```bash
# Les charges doivent être payées avant cette date
# Dashboard indique "Payé ✅"
```

### Day 3 à 09:00 (si paiement pas encore fait)
```bash
# CRON payment-late s'exécute
curl http://localhost:3000/api/cron/salary/payment-late \
  -H "Authorization: Bearer $CRON_SECRET"

# À vérifier (seulement si paiement pas fait):
✅ Email alerte rouge envoyé aux ADMINs
✅ Notification "Paiement en retard" créée
```

---

## 🐛 DEBUGGING TIPS

### Vérifier les logs
```bash
# Terminal dev server:
# Chercher les logs "CRON:", "✅", "❌"
# Voir les erreurs d'exécution

# Vercel production:
# https://vercel.com → Projet → Logs
# Filter par "salary" ou "cron"
```

### Utiliser Prisma Studio
```bash
npx prisma studio

# Consulter les tables:
# - Utilisateur (roles, tarifHoraire)
# - PrevisionSalaire (montantPrevu)
# - Charge (montants, dates)
# - Paiement (confirmations)
# - Notification (historique)
```

### Tester les services directement
```bash
# Créer un fichier test-salary.ts:
import { autoCreateSalaryCharges } from '@/lib/services/salaryForecasting/autoCreateChargesService'

async function test() {
  const result = await autoCreateSalaryCharges()
  console.log(result)
}

test()

# Puis: npx ts-node test-salary.ts
```

---

## ✅ CHECKLIST DE VALIDATION FINALE

- [ ] Widget s'affiche correctement
- [ ] Graphique affiche 12 mois de données
- [ ] Modal s'ouvre et se valide
- [ ] Paiement créé après submit
- [ ] API endpoints répondent correctement
- [ ] CRON routes authentifiées
- [ ] Notifications créées en base
- [ ] Charges auto-créées (si CRON exécuté)
- [ ] Pas d'erreurs console
- [ ] Pas d'erreurs Vercel logs
- [ ] Emails envoyés (si SMTP configured)
- [ ] Test error cases (montant 0, ref vide, etc)

---

**Status:** ✅ PRÊT À TESTER
**Tous les tests doivent passer avant production**
