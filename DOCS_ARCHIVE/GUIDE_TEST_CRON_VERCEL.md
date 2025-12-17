# Guide de Test des Crons avec Vercel

## 🔍 État de la Configuration

### ✅ Configuration Vercel.json
La configuration Vercel est déjà en place avec 6 crons configurés :

```
1. /api/cron/generate-invoices      → 08:00 quotidiennement
2. /api/cron/salary-notifications   → 09:00 quotidiennement
3. /api/cron/check-late-payments    → 10:00 quotidiennement
4. /api/cron/check-late-tasks       → 11:00 quotidiennement
5. /api/cron/salary/forecast-calculated → 31 du mois à 00:00
6. /api/cron/salary/payment-due     → 1er du mois à 08:00
7. /api/cron/salary/payment-late    → À configurer
```

### ✅ Sécurité
Tous les endpoints Cron utilisent une validation par Bearer Token :
```
Authorization: Bearer {CRON_SECRET}
```
Le `CRON_SECRET` est défini dans `.env.local`

---

## 📋 Options de Test

### Option 1️⃣ : Test en Local (Avant Déploiement)

```bash
# 1. Démarrer le serveur de développement
npm run dev

# 2. Tester un endpoint (exemple forecast-calculated)
curl http://localhost:3000/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer d08e295caf68595a73503d76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5"

# Tester d'autres endpoints
curl http://localhost:3000/api/cron/generate-invoices \
  -H "Authorization: Bearer d08e295caf68595a73503d76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5"

curl http://localhost:3000/api/cron/salary-notifications \
  -H "Authorization: Bearer d08e295caf68595a73503d76c96eb4a77502f76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5"
```

---

### Option 2️⃣ : Déploiement et Test sur Vercel

#### Étape 1 : Préparer le déploiement

```bash
# Assurez-vous que tout est commité
git add .
git commit -m "Préparation test Cron Vercel"
git push
```

#### Étape 2 : Configuration Vercel (Dashboard)

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner votre projet
3. Aller à **Settings** → **Environment Variables**
4. Ajouter/Vérifier :
   ```
   CRON_SECRET = d08e295caf68595a73503d76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_SECURE = false
   SMTP_USER = lydiecocou@gmail.com
   SMTP_PASS = ldpgwkjerfpeuhle
   SMTP_FROM = lydiecocou@gmail.com
   DATABASE_URL = <votre_connection_string>
   ```

#### Étape 3 : Vérifier les Crons dans Vercel

Dans le Dashboard Vercel :
- Aller à **Deployments** → dernier déploiement
- Vérifier la section **Crons** pour voir les crons configurés
- Vercel affiche :
  - ✅ Status (active/inactive)
  - ⏰ Prochaine exécution
  - 📊 Historique des exécutions

#### Étape 4 : Tester Manuellement

```bash
# Obtenir l'URL de votre déploiement Vercel
# Format: https://votre-projet.vercel.app

# Test manuel d'un endpoint
curl https://votre-projet.vercel.app/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer d08e295caf68595a73503d76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5"

# Vérifier la réponse (status 200 = succès)
```

---

### Option 3️⃣ : Test Avancé avec Vercel CLI

```bash
# 1. Installer Vercel CLI (si non installé)
npm install -g vercel

# 2. Se connecter à Vercel
vercel login

# 3. Lancer un déploiement local de preview
vercel dev

# 4. Tester les crons comme en local
curl http://localhost:3000/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer d08e295caf68595a73503d76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5"
```

---

## ✅ Checklist de Vérification

### Avant le Déploiement
- [ ] Tous les endpoints Cron sont définis dans [vercel.json](vercel.json)
- [ ] Les variables d'environnement sont correctes dans `.env.local`
- [ ] Le `CRON_SECRET` est confidentiel et n'est pas en git
- [ ] Tester les endpoints en local avec `npm run dev`

### Après le Déploiement
- [ ] Vercel Dashboard affiche les 6 crons comme "Active"
- [ ] Test manuel réussit (response 200)
- [ ] Les logs Vercel n'affichent pas d'erreurs
- [ ] Les notifications sont envoyées correctement

### Monitoring
- [ ] Vérifier les logs Vercel : Dashboard → Deployments → Logs
- [ ] Surveiller les erreurs CRON dans les logs
- [ ] Vérifier que les tâches s'exécutent à l'heure prévue

---

## 🔧 Dépannage

### Problème : "Unauthorized" (401)
```
➜ Le CRON_SECRET ne correspond pas
Vérifier : 
- .env.local locale vs Vercel Environment Variables
- Le Bearer token dans la requête
```

### Problème : Cron ne s'exécute pas
```
➜ Vérifier :
1. Status du deployment (doit être "Ready")
2. Que la route /api/cron/... existe
3. Les logs Vercel pour les erreurs
4. La configuration vercel.json
```

### Problème : Erreur 500 dans le cron
```
➜ Vérifier :
1. La connexion à la base de données
2. Les variables d'environnement manquantes
3. Les logs Vercel pour le stack trace
4. Que les services (email, etc.) sont accessibles
```

---

## 📊 URLs Utiles

- **Dashboard Vercel** : https://vercel.com/dashboard
- **Logs en temps réel** : Dashboard → Deployments → Logs
- **Variables d'env** : Dashboard → Settings → Environment Variables
- **Crons status** : Dashboard → Deployments → Crons tab

---

## 🚀 Commandes Rapides

```bash
# Test local d'un cron
npm run dev
curl http://localhost:3000/api/cron/salary/forecast-calculated \
  -H "Authorization: Bearer $CRON_SECRET"

# Déployer sur Vercel (si git est connecté)
git push

# Voir les logs Vercel
vercel logs

# Test preview Vercel
vercel dev
```

---

## 📝 Notes

- Les crons Vercel s'exécutent en UTC. Ajustez si nécessaire.
- Les crons gratuits Vercel se réveillent après 30s d'inactivité (cold start)
- Vercel Crons Pro offre une meilleure résilience
- Monitoring recommandé : Sentry, DataDog, ou Vercel Analytics

---

**Dernière mise à jour** : 17 Décembre 2025
**Statut** : ✅ Prêt pour test Vercel
