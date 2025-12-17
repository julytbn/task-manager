# 🎯 COMMANDES PRÊTES À UTILISER - SALARY FEATURES

## 📌 TEST LOCAL (npm run dev)

### 1️⃣ Tester le Widget Affichage
```bash
# Ouvrir http://localhost:3000/dashboard
# Login comme MANAGER
# Scroller jusqu'à "PRÉVISIONS SALARIALES"
# Vérifier que les 2 widgets affichent correctement
```

### 2️⃣ Tester l'API Widget en Curl
```bash
# Get CRON_SECRET depuis .env.local
export CRON_SECRET="votre-secret"

# Tester avec session (besoin d'être loggé d'abord)
curl http://localhost:3000/api/dashboard/salary-widget \
  -H "Cookie: session=YOUR_SESSION_ID"

# Expected: JSON avec montantTotal, nombreEmployes, prévisions array
```

### 3️⃣ Tester l'API Coverage
```bash
curl http://localhost:3000/api/dashboard/salary-coverage \
  -H "Cookie: session=YOUR_SESSION_ID"

# Expected: Array de 12 mois avec salaires, recettes, couverture%
```

### 4️⃣ Tester Enregistrement Paiement (POST)
```bash
curl -X POST http://localhost:3000/api/salary/mark-paid \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_ID" \
  -d '{
    "montant": 15000000,
    "moyenPaiement": "Virement Bancaire",
    "reference": "TEST-LOCAL-001"
  }'

# Expected: { success: true, paiement: { id, montant, statut } }
```

### 5️⃣ Tester CRON Forecast Calculated
```bash
# Générer token avant
export CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d= -f2)

curl http://localhost:3000/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected: { success: true, message: "Salary forecast notifications sent" }
```

### 6️⃣ Tester CRON Payment Due (+ auto-charges)
```bash
export CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d= -f2)

curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected: { success: true, charges: { created: X, total: Y } }
# Vérifier en Prisma que charges créées
```

### 7️⃣ Tester CRON Payment Late
```bash
export CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d= -f2)

curl http://localhost:3000/api/cron/salary/payment-late \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected: { success: true, alertsSent: X }
```

### 8️⃣ Tester sans Authorization (doit échouer)
```bash
# Sans le header Bearer token
curl http://localhost:3000/api/cron/salary/forecast-calculated

# Expected: 401 Unauthorized
```

---

## 🔧 SETUP & CONFIGURATION

### 1️⃣ Générer CRON_SECRET
```bash
# Générer une clé sécurisée
openssl rand -hex 32

# Copier dans .env.local
# CRON_SECRET=<generated-token>
```

### 2️⃣ Setup .env.local (Email)
```bash
# Pour tester les notifications email localement:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@test.com
```

### 3️⃣ Prisma Studio (Vérifier données)
```bash
# Ouvrir interface pour voir/éditer la base
npx prisma studio

# Naviguer vers les modèles pour vérifier:
# - Utilisateur (créer test users)
# - PrevisionSalaire (créer pour ce mois)
# - Charge (vérifier créées par CRON)
# - Paiement (vérifier créés par API)
# - Notification (vérifier l'audit trail)
```

### 4️⃣ Démarrer Dev Server
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Prisma Studio (optionnel)
npx prisma studio

# Terminal 3: Tests curl
# ... exécuter les commandes ci-dessus
```

---

## 🧪 SCÉNARIO COMPLET DE TEST

### Pré-requisites
```bash
# 1. Créer en Prisma Studio:
#    - 1 user MANAGER (pour dashboard)
#    - 2 users EMPLOYE avec tarifHoraire
#    - 1 PrevisionSalaire pour ce mois (montantPrevu = heure × tarif)

# 2. Configurer .env.local avec CRON_SECRET
```

### Étape 1: Vérifier Widget Affichage
```bash
# Naviguer à http://localhost:3000/dashboard
# Login comme MANAGER
# Vérifier widgets affichent données correctes
# Screenshot pour validation
```

### Étape 2: Test API Widget
```bash
curl http://localhost:3000/api/dashboard/salary-widget \
  -H "Cookie: session=MANAGER_SESSION"

# Vérifier: montantTotal, nombreEmployes, prévisions array
```

### Étape 3: Tester Modal Paiement
```bash
# UI: Cliquer "Marquer comme payé" sur le widget
# Remplir form:
#   - Montant: 1250000
#   - Moyen: "Virement Bancaire"
#   - Référence: "TEST-MODAL-001"
# Click Confirmer
# Vérifier success notification affichée
```

### Étape 4: Vérifier Paiement Créé
```bash
# Via curl (simuler la même action)
curl -X POST http://localhost:3000/api/salary/mark-paid \
  -H "Content-Type: application/json" \
  -H "Cookie: session=MANAGER_SESSION" \
  -d '{
    "montant": 1250000,
    "moyenPaiement": "Virement Bancaire",
    "reference": "TEST-CURL-001"
  }'

# Vérifier response success=true
```

### Étape 5: Vérifier Records en Base
```bash
# Prisma Studio
npx prisma studio

# 1. Naviguer à Paiement
#    → Vérifier 2 records créés (modal + curl)

# 2. Naviguer à Notification
#    → Vérifier 2 notifications "Paiement enregistré"

# 3. Naviguer à Charge
#    → Pas d'auto-création sans CRON payment-due
```

### Étape 6: Tester CRON Payment Due
```bash
# Simuler le CRON du 1er du mois
export CRON_SECRET="votre-secret"

curl http://localhost:3000/api/cron/salary/payment-due \
  -H "Authorization: Bearer $CRON_SECRET"

# Response devrait indiquer: charges created = 2 (ou nombre de prévisions)
```

### Étape 7: Vérifier Charges Créées
```bash
# Prisma Studio
npx prisma studio → Naviguer à Charge

# Vérifier:
# - 2 nouvelles charges créées
# - montant = montantPrevu des prévisions
# - date = 5 du mois courant
# - categorie = 'SALAIRES_CHARGES_SOCIALES'
```

### Étape 8: Tester Graphique Coverage
```bash
# UI: Sur le dashboard, vérifier graphique "COUVERTURE SALARIALE"
# À voir:
# - 12 mois affichés
# - Barres bleues (charges)
# - Barres vertes (recettes)
# - Ligne orange (couverture %)
# - Stats cards avec totaux
```

---

## 📊 DONNÉES DE TEST RECOMMANDÉES

### Créer en Prisma Studio

#### Utilisateur MANAGER
```
nom: "Manager Test"
email: "manager@test.com"
role: "MANAGER"
tarifHoraire: null (pas nécessaire pour manager)
```

#### Utilisateur EMPLOYE 1
```
nom: "Jean Dupont"
email: "jean@test.com"
role: "EMPLOYE"
tarifHoraire: 12500 (exemple: 12,500 XOF par heure)
```

#### Utilisateur EMPLOYE 2
```
nom: "Marie Martin"
email: "marie@test.com"
role: "EMPLOYE"
tarifHoraire: 11000
```

#### PrevisionSalaire EMPLOYE 1
```
employeId: jean-uuid
mois: 1 (janvier)
annee: 2024
montantPrevu: 1250000 (100 heures × 12,500)
montantNotifie: 0
dateNotification: null
```

#### PrevisionSalaire EMPLOYE 2
```
employeId: marie-uuid
mois: 1
annee: 2024
montantPrevu: 1100000 (100 heures × 11,000)
montantNotifie: 0
dateNotification: null
```

---

## ✅ CHECKLIST VALIDATION

### Widget Display
- [ ] 2 widgets affichent sur dashboard
- [ ] Données correctes (montant, employés, deadline)
- [ ] Loading state fonctionne
- [ ] Pas d'erreur console (F12)

### API Endpoints
- [ ] GET /api/dashboard/salary-widget répond
- [ ] GET /api/dashboard/salary-coverage répond
- [ ] POST /api/salary/mark-paid crée paiement
- [ ] Toutes les réponses JSON valides

### Modal Paiement
- [ ] Modal s'ouvre au click
- [ ] Validation champs fonctionne
- [ ] Submit crée paiement en base
- [ ] Success notification affichée

### CRON Routes
- [ ] GET /api/cron/salary/forecast-calculated répond
- [ ] GET /api/cron/salary/payment-due répond + crée charges
- [ ] GET /api/cron/salary/payment-late répond

### Database
- [ ] Paiement records créés
- [ ] Charge records créés (après CRON)
- [ ] Notification records créés
- [ ] Timestamps correctes

### Sécurité
- [ ] API sans auth retourne 401
- [ ] CRON sans secret retourne 401
- [ ] Roles vérifiés (ADMIN/MANAGER)

---

## 🚀 AVANT DÉPLOIEMENT PRODUCTION

```bash
# 1. Push code
git add .
git commit -m "feat: implement complete salary management"
git push origin main

# 2. Attendre build Vercel (doit être vert)

# 3. Configurer env variables Vercel (dashboard)
# - CRON_SECRET
# - SMTP_*

# 4. Tester endpoints en prod
curl https://votre-site.com/api/dashboard/salary-widget

# 5. Vérifier CRON s'exécute
# → Logs Vercel après 1er/31 du mois

# 6. Vérifier emails reçus
# → Checklist email envoyés

# 7. Go live ✅
```

---

## 🐛 QUICK DEBUGGING

### Widget ne charge pas
```bash
# 1. Check console (F12)
# 2. Vérifier API répond
curl http://localhost:3000/api/dashboard/salary-widget

# 3. Vérifier PrevisionSalaire existe
npx prisma studio → PrevisionSalaire

# 4. Vérifier user est MANAGER
npx prisma studio → Utilisateur
```

### Paiement pas créé
```bash
# 1. Check response du POST
# 2. Vérifier en Prisma que record existe
# 3. Check console pour erreurs
# 4. Vérifier session valide
```

### CRON ne s'exécute pas
```bash
# 1. Vérifier vercel.json syntax
cat vercel.json | grep -A2 "salary"

# 2. Vérifier CRON_SECRET en env
# 3. Check Vercel Logs pour erreurs
# 4. Tester manuellement le endpoint
```

---

## 📚 DOCUMENTATION ASSOCIÉE

```
📄 README_SALAIRES_IMPLEMENTATION.md
   → Vue d'ensemble + architecture

📄 CHECKLIST_DEPLOIEMENT_SALAIRES.md
   → Étapes détaillées déploiement

📄 GUIDE_TESTS_MANUELS_SALAIRES.md
   → Tests complets pour chaque feature

📄 IMPLEMENTATION_SALAIRES_COMPLETE.md
   → Guide technique complet

📄 INDEX_FICHIERS_SALAIRES.md
   → Liste tous les fichiers créés
```

---

**Prêt à tester? Commence par:**
1. `npm run dev`
2. Naviguer à `/dashboard`
3. Tester les widgets
4. Utiliser les commandes curl ci-dessus

**Prêt à déployer? Consulter:**
CHECKLIST_DEPLOIEMENT_SALAIRES.md
