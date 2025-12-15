# 🔥 COMMANDES READY-TO-COPY - Production Completion

## ✅ ÉTAPE 1: Test SMTP (Copier-coller)

### Option A: Via CLI
```bash
node scripts/test-smtp.js
```

### Option B: Via API (dev server en cours)
```bash
# Dans un autre terminal
curl -X POST http://localhost:3000/api/admin/test-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"julietetebenissan@gmail.com"}'
```

### Résultat attendu:
```
✅ Email SMTP envoyé à: julietetebenissan@gmail.com | Message ID: ...
```

---

## ✅ ÉTAPE 2: Test Permissions (Copier-coller)

### Tester authentification requise
```bash
# Sans token → 401
curl -X GET http://localhost:3000/api/taches
# Résultat: {"error":"Non autorisé"} (401)

# Avec token valide → 200
curl -X GET http://localhost:3000/api/taches \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Résultat: [...tâches...]
```

### Tester isolation EMPLOYE
```bash
# Avec token EMPLOYE → voir seulement SES tâches
curl -X GET http://localhost:3000/api/taches/mes-taches \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
# Résultat: [tâches de cet employé uniquement]

# Essayer accéder autre EMPLOYE → 403
curl -X GET "http://localhost:3000/api/taches?userId=OTHER_USER_ID" \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
# Résultat: 403 Forbidden
```

### Test complet sécurité
```bash
npm run test:security
# Lance tous les tests RBAC
```

---

## ✅ ÉTAPE 3: Test Uploads (Copier-coller)

### 1. Créer structure répertoires
```bash
mkdir -p storage/uploads/{tasks,clients,projects}
chmod 755 storage
```

### 2. Tester upload basique
```bash
# Créer test file
echo "Test document" > test.txt

# Upload
curl -X POST \
  -F "file=@test.txt" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/uploads/tasks/123/test.txt
```

### 3. Tester accès
```bash
# Accéder le fichier
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/uploads/tasks/123/test.txt
# Résultat: Contenu du fichier

# Sans token → 401
curl -X GET http://localhost:3000/api/uploads/tasks/123/test.txt
# Résultat: 401 Unauthorized

# Autre USER → 403
curl -X GET \
  -H "Authorization: Bearer OTHER_USER_TOKEN" \
  http://localhost:3000/api/uploads/tasks/123/test.txt
# Résultat: 403 Forbidden
```

---

## ✅ ÉTAPE 4: Test Crons (Copier-coller)

### Vérifier CRON_SECRET dans .env
```bash
grep CRON_SECRET .env
# Résultat: CRON_SECRET=your-secret-value
```

### Tester cron manuellement
```bash
# Générer factures (1st of month)
curl -X POST http://localhost:3000/api/cron/generate-invoices \
  -H "x-cron-secret: development-secret"

# Vérifier paiements en retard
curl -X POST http://localhost:3000/api/cron/check-late-payments \
  -H "x-cron-secret: development-secret"

# Envoyer notifications salaires
curl -X POST http://localhost:3000/api/cron/salary-notifications \
  -H "x-cron-secret: development-secret"

# Vérifier tâches en retard
curl -X POST http://localhost:3000/api/cron/check-late-tasks \
  -H "x-cron-secret: development-secret"
```

### Résultat attendu
```json
{
  "success": true,
  "message": "Cron executed successfully",
  "timestamp": "2025-12-15T10:30:00Z"
}
```

---

## ✅ ÉTAPE 5: Test PDF (Copier-coller)

### Tester téléchargement facture
```bash
# Remplacer FACTURE_ID par un vrai ID
FACTURE_ID="550e8400-e29b-41d4-a716-446655440000"

# Télécharger comme HTML (actuel - fonctionne)
curl -X GET http://localhost:3000/api/factures/$FACTURE_ID/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o facture.html

# Télécharger comme PDF (si puppeteer installé)
curl -X GET http://localhost:3000/api/factures/$FACTURE_ID/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/pdf" \
  -o facture.pdf
```

### Installer PDF support (optionnel)
```bash
npm install puppeteer

# Après installation, tester PDF
curl -X GET http://localhost:3000/api/factures/$FACTURE_ID/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/pdf" \
  -o facture.pdf

# Vérifier fichier créé
file facture.pdf
# Résultat: PDF document, version 1.4
```

---

## 🔑 OBTENIR UN TOKEN POUR TESTER

### Option A: Via login API
```bash
# Créer compte test
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@test.com",
    "password": "password123"
  }'

# Réponse:
# {"token":"eyJhbG...", "user":{"id":"...","role":"MANAGER"}}

# Utiliser le token dans requests:
TOKEN="eyJhbG..."
```

### Option B: Via NextAuth (si configuré)
```bash
# Aller sur http://localhost:3000/connexion
# Se logger
# Vérifier cookie session
```

### Option C: Debug token (développement)
```bash
# Dans les logs du dev server
# Voir les tokens générés
npm run dev 2>&1 | grep -i token
```

---

## 📊 VÉRIFICATION COMPLÈTE (Script)

### Copier ce script et exécuter
```bash
#!/bin/bash

echo "🧪 TEST PRODUCTION READINESS"

# 1. SMTP
echo "1️⃣ SMTP..."
curl -s -X POST http://localhost:3000/api/admin/test-smtp \
  -H "Content-Type: application/json" \
  -d '{}' | grep -q "success" && echo "✅ SMTP OK" || echo "❌ SMTP FAIL"

# 2. Auth
echo "2️⃣ Auth..."
curl -s -X GET http://localhost:3000/api/taches | grep -q "error" && echo "✅ Auth required" || echo "❌ Auth not enforced"

# 3. Uploads
echo "3️⃣ Uploads..."
[ -d "storage/uploads" ] && echo "✅ Upload dir exists" || echo "❌ Missing upload dir"

# 4. Crons
echo "4️⃣ Crons..."
grep -q "generate-invoices" vercel.json && echo "✅ Crons configured" || echo "❌ Crons not configured"

echo "Done!"
```

Sauvegarder dans `check-ready.sh` et exécuter:
```bash
chmod +x check-ready.sh
./check-ready.sh
```

---

## 🚀 DÉPLOIEMENT PRODUCTION

### Git (Vercel)
```bash
# 1. Ajouter fichiers
git add -A

# 2. Commit
git commit -m "chore: complete 5% production setup

- SMTP testing endpoint
- Security audit RBAC
- Crons configuration
- Upload validation
- PDF generation ready"

# 3. Push
git push origin main

# 4. Vercel auto-déploie
# Attendre notification Vercel
```

### Ou déployer manuellement
```bash
# Build
npm run build

# Test
npm run test:security

# Deploy
vercel deploy --prod
```

### Post-déploiement (vérification)
```bash
# Tester SMTP en production
curl -X POST https://kekeli.example.com/api/admin/test-smtp

# Tester auth
curl -X GET https://kekeli.example.com/api/taches
# Devrait retourner 401

# Vérifier crons (Vercel dashboard)
# Voir les 4 crons actifs
```

---

## 📋 CHECKLIST FINAL

Avant d'appuyer sur le bouton DEPLOY:

```bash
# 1. SMTP
[_] SMTP_HOST configuré
[_] SMTP_USER configuré  
[_] SMTP_PASS configuré
[_] test-smtp.js fonctionnel

# 2. Security
[_] Authentification requise partout
[_] Permissions isolées par rôle
[_] Cron jobs protégés par secret

# 3. Uploads
[_] storage/uploads/ existe
[_] Permissions fichiers correctes
[_] Rate limiting actif

# 4. Crons
[_] vercel.json a les 4 crons
[_] CRON_SECRET en .env
[_] Endpoints crons testés

# 5. Git
[_] Pas de secrets en git
[_] .env.local en .gitignore
[_] Tous les fichiers commitées

# 6. Deploy
[_] Build production réussi
[_] Tests passent
[_] Prêt pour Vercel
```

---

## 💬 TROUBLESHOOTING RAPIDE

### SMTP ne fonctionne pas
```bash
# 1. Vérifier credentials
grep SMTP .env

# 2. Test avec telnet
telnet smtp.gmail.com 587

# 3. Vérifier App Password Gmail
# https://myaccount.google.com/apppasswords

# 4. Lancer script debug
node -e "
  require('dotenv').config()
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
  transporter.verify((err, ok) => {
    err ? console.error('❌', err) : console.log('✅ SMTP OK')
  })
"
```

### Upload ne fonctionne pas
```bash
# 1. Vérifier permissions
ls -la storage/

# 2. Créer répertoires
mkdir -p storage/uploads/{tasks,clients,projects}
chmod 755 storage

# 3. Vérifier logs
npm run dev 2>&1 | grep -i upload
```

### Crons ne s'exécutent pas
```bash
# 1. Vérifier vercel.json
cat vercel.json | grep -A 2 path

# 2. Vérifier secret
echo $CRON_SECRET

# 3. Tester manuellemant
curl -H "x-cron-secret: $CRON_SECRET" \
  http://localhost:3000/api/cron/generate-invoices
```

---

## ✅ VOUS ÊTES PRÊT!

Tous les commandes et tests sont ci-dessus.

**Prochaine étape:** `npm run dev` puis exécutez les tests 🚀

