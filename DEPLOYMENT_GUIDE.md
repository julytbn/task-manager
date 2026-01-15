# 🚀 GUIDE DE DÉPLOIEMENT VERCEL - KEKELI GROUP

## 📋 Étapes Pré-Déploiement

### 1. Préparation locale
```bash
# Vérifier que tout compile
npm run build

# Vérifier les types
npm run type-check

# Vérifier les linting errors
npm run lint
```

### 2. Générer les secrets sécurisés
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32
# Copier la sortie

# CRON_SECRET  
openssl rand -base64 32
# Copier la sortie
```

### 3. Commit final
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

---

## 🔧 Configuration Vercel

### Étape 1: Créer le projet Vercel
1. Aller sur https://vercel.com
2. Cliquer "Add New Project"
3. Importer le repository GitHub: `ReactProjet/task-manager`
4. Sélectionner la branche `main`

### Étape 2: Configurer les variables d'environnement

Dans le dashboard Vercel, aller à **Settings** → **Environment Variables**

Ajouter les variables suivantes:

```env
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=[SECRET_GÉNÉRÉ]

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# CRON Security
CRON_SECRET=[SECRET_GÉNÉRÉ]

# Configuration
NODE_ENV=production
LOG_LEVEL=error
```

**Important:** Ces variables doivent être disponibles dans les environnements:
- ✅ Production
- ✅ Preview
- ✅ Development (optionnel)

### Étape 3: Vérifier la configuration du build

Dans **Settings** → **Build & Development Settings**:
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`

### Étape 4: Configuration des Domains

Dans **Settings** → **Domains**:
1. Ajouter votre domaine personnalisé
2. Configurer les DNS records (fournisseur de domaine)
3. Vérifier que le domaine pointe vers Vercel

---

## ✅ Déploiement

### Option 1: Déploiement automatique
- Les pushs sur `main` déploient automatiquement
- Les pull requests créent des preview deployments

### Option 2: Déploiement manuel
1. Aller au dashboard Vercel
2. Cliquer sur le projet
3. Cliquer "Deploy"
4. Vérifier le build logs

---

## 🧪 Vérifications Post-Déploiement

### 1. Santé du déploiement
```bash
# Vérifier les logs Vercel
# Dashboard → Deployments → Voir les logs

# Chercher les erreurs:
# ❌ Database connection errors
# ❌ Missing environment variables
# ❌ Build errors
```

### 2. Tester les features critiques
- [ ] Page d'accueil accessible
- [ ] Login/Logout fonctionne
- [ ] Créer un client fonctionne
- [ ] Page accounting affiche les charges
- [ ] Email test (si SMTP configuré)
- [ ] Graphiques se chargent correctement

### 3. Vérifier les bases de données
```bash
# Vérifier que les migrations ont tourné
# Dashboard → Deployments → Logs

# Si migrations ont échoué:
npx prisma migrate deploy --skip-generate
```

### 4. Monitorer les erreurs
- Configurer Sentry pour les erreurs
- Configurer les notifications d'erreurs Vercel
- Vérifier les logs d'application

---

## 🔒 Sécurité Post-Déploiement

- [ ] HTTPS activé (automatique sur Vercel)
- [ ] Pas d'API keys visibles en public
- [ ] CORS configuré correctement
- [ ] Rate limiting activé
- [ ] Sessions sécurisées (cookies httpOnly)
- [ ] Secrets non commités en git

---

## 🛠️ Rollback Plan

Si quelque chose se basse mal:

### Rollback vers version précédente
```bash
# Dans Vercel dashboard:
# 1. Aller à Deployments
# 2. Trouver le déploiement stable précédent
# 3. Cliquer sur les 3 points → "Promote to Production"
```

### Rollback en code
```bash
# Localement
git revert HEAD
git push origin main
# Vercel redéploiera automatiquement
```

---

## 📊 Monitoring & Maintenance

### Vérifications régulières
- [ ] Logs Vercel pour les erreurs
- [ ] Performance metrics (Core Web Vitals)
- [ ] Database health
- [ ] Email delivery (SMTP)
- [ ] CRON jobs exécutés

### Analytics
- Accéder à https://vercel.com/[project]/analytics
- Vérifier les Core Web Vitals
- Monitorer les erreurs 5xx

---

## 🚨 Dépannage Courant

### Erreur: "Can't reach database server"
- Vérifier que DATABASE_URL est correct
- Vérifier que le firewall DB accepte Vercel IPs
- Vérifier les logs Vercel

### Erreur: "Missing NEXTAUTH_SECRET"
- Ajouter NEXTAUTH_SECRET dans les env variables Vercel
- Redéployer avec le bouton "Redeploy"

### Erreur: "SMTP connection failed"
- Vérifier SMTP_USER et SMTP_PASS
- Vérifier que Gmail a un mot de passe d'application généré
- Vérifier les permissions SMTP

### Build fails avec "out of memory"
- Contacter le support Vercel
- Optimiser le bundle (réduire les dépendances)

---

## 📞 Support

- **Documentation Vercel:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/learn/basics/deploying-nextjs-app
- **Prisma & Vercel:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
