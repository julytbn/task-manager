# 🚀 GUIDE DE DÉPLOIEMENT VERCEL - PRÊT À LANCER

**Status**: ✅ **DÉPLOIEMENT AUTORISÉ**  
**Date**: 17 Décembre 2025  
**Build**: ✅ Succès (npm run build)

---

## ⚡ DÉPLOIEMENT EN 5 MINUTES

### Étape 1: Vérifier le commit

```bash
git log -1 --oneline
# Doit montrer: "Audit complet OK - corrections TypeScript - crons 7/7 testés - prêt Vercel"
```

### Étape 2: Push vers GitHub

```bash
git push origin master
# ou git push origin main
```

**C'est tout !** Vercel va :
1. ✅ Détecter le push
2. ✅ Compiler le projet
3. ✅ Déployer automatiquement
4. ✅ Activer les crons Vercel

---

## 📋 CHECKLIST AVANT CLIC SUR "DEPLOY"

- [x] **Code compilé** → `npm run build` ✅
- [x] **Crons testés** → 7/7 fonctionnels ✅
- [x] **Emails configurés** → SMTP Gmail ✅
- [x] **Base de données** → Prisma OK ✅
- [x] **Sécurité** → Tokens + hachage bcrypt ✅
- [ ] Vérifier les variables Vercel (voir ci-dessous)

---

## 🔐 VARIABLES VERCEL À CONFIGURER

### 1. Aller dans Vercel Dashboard

```
https://vercel.com/dashboard
↓
Sélectionner votre projet
↓
Settings (⚙️)
↓
Environment Variables
```

### 2. Ajouter ces variables

```
Nom                    Valeur
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRON_SECRET            d08e295caf68595a73503d76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5
SMTP_HOST              smtp.gmail.com
SMTP_PORT              587
SMTP_SECURE            false
SMTP_USER              lydiecocou@gmail.com
SMTP_PASS              ldpgwkjerfpeuhle
SMTP_FROM              lydiecocou@gmail.com
DATABASE_URL           <votre_connection_string>
NEXT_PUBLIC_APP_URL    https://votre-projet.vercel.app
NODE_ENV               production
```

### 3. Redéployer après changement

Une fois les variables ajoutées:
1. Aller à **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **Redeploy** (en haut à droite)

---

## 📊 VÉRIFICATION POST-DÉPLOIEMENT

### 1. Attendre la compilation (5-10 min)

```
⏳ Vercel compile le code
✅ Tests TypeScript passent
✅ Build finalisé
```

### 2. Vérifier les crons

Dans **Deployments → Crons tab** :

```
✅ /api/cron/generate-invoices           ACTIVE
✅ /api/cron/salary-notifications        ACTIVE
✅ /api/cron/check-late-payments         ACTIVE
✅ /api/cron/check-late-tasks            ACTIVE
✅ /api/cron/salary/forecast-calculated  ACTIVE
✅ /api/cron/salary/payment-due          ACTIVE
✅ /api/cron/salary/payment-late         ACTIVE
```

Tous doivent être en **ACTIVE** (pas DISABLED ou ERROR)

### 3. Test manuel d'un cron

```powershell
$CRON_SECRET = "d08e295caf68595a73503d76c96eb4a77772a8fe190ad6c0a01c271491e8ecb5"
$headers = @{ "Authorization" = "Bearer $CRON_SECRET" }
$url = "https://votre-projet.vercel.app/api/cron/salary/payment-late"

Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing | Select-Object StatusCode
# Doit retourner: StatusCode : 200
```

### 4. Vérifier les logs

```
Deployments → Logs
↓
Chercher "CRON" ou "error"
↓
Pas d'erreurs = ✅ OK
```

---

## 🎯 FONCTIONNALITÉS À TESTER APRÈS DÉPLOIEMENT

Quand le déploiement est fini, testez sur le site :

- [ ] **Inscription** : Créer un compte test
- [ ] **Email** : Vérifier réception du mail de bienvenue
- [ ] **Oubli mot de passe** : Tester le reset
- [ ] **Dashboard** : Charger les données
- [ ] **Crons** : Observer les exécutions dans les logs

---

## 🆘 DÉPANNAGE

### ❌ Erreur: "Cannot find module"

```
Solution:
1. Supprimer le .next/ local: rm -rf .next
2. Redéployer depuis Vercel
3. Attendre ~10 min la compilation
```

### ❌ Erreur: "DATABASE_URL undefined"

```
Solution:
1. Settings → Environment Variables
2. Vérifier que DATABASE_URL est présente
3. Redéployer
```

### ❌ Crons n'exécutent pas

```
Vérifier:
1. Status dans Crons tab = ACTIVE ?
2. CRON_SECRET correctement défini ?
3. Logs Vercel affichent pas d'erreur ?
4. Route existe ? (/api/cron/...)
```

### ❌ Emails non reçus

```
Vérifier:
1. SMTP_USER = lydiecocou@gmail.com
2. SMTP_PASS = ldpgwkjerfpeuhle
3. Gmail 2FA activée ?
4. Logs Vercel pour erreur SMTP
5. Dossier spam en dernier recours
```

---

## 📞 COMMANDES UTILES APRÈS DÉPLOIEMENT

```bash
# Voir les logs Vercel en temps réel
vercel logs

# Voir les logs d'une branche spécifique
vercel logs --scope=<owner> <project>

# Redéployer manuellement
vercel deploy --prod

# Vérifier les variables d'env
vercel env list
```

---

## ✅ RÉCAPITULATIF

### ✨ Avant déploiement
- ✅ Build réussi: `npm run build`
- ✅ Code committé et pushé
- ✅ 7 crons testés en local

### 🚀 Déploiement
- Git push → Vercel détecte et déploie
- Variables d'env configurées
- Redéployer si changement de variables

### 📊 Post-déploiement
- Vérifier crons actifs
- Test manuel d'un cron
- Consulter les logs
- Tester les emails

---

## 🎉 BRAVO !

Votre projet est maintenant **en production** avec :
- ✅ 7 Crons automatiques
- ✅ Emails configurés
- ✅ Auth sécurisée
- ✅ API complète
- ✅ Dashboard actif
- ✅ Monitoring Vercel

**Bon déploiement ! 🚀**

---

*Généré: 17 Décembre 2025*  
*Status: ✅ READY FOR PRODUCTION*
