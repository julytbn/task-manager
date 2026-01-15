# 🚀 GUIDE DÉPLOIEMENT VERCEL - Task Manager

## 📋 Checklist Pré-Déploiement

- [ ] Compte Vercel créé (https://vercel.com)
- [ ] Repo GitHub connecté
- [ ] PostgreSQL en production accessible
- [ ] Email SMTP configuré
- [ ] Domaine personnalisé (optionnel)

## 🔐 Variables d'Environnement à Configurer

### Essentielles:

```
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=https://ton-app.vercel.app
DATABASE_URL=postgresql://user:password@host:5432/db_name
FRONTEND_URL=https://ton-app.vercel.app
NODE_ENV=production
```

### Email (pour les notifications):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton-email@gmail.com
SMTP_PASS=ton-app-password (Google App Password)
SMTP_FROM=noreply@ton-domaine.com
```

### Sécurité (Crons):

```
X_CRON_SECRET=<générer avec: openssl rand -base64 32>
X_INTERNAL_SECRET=<générer avec: openssl rand -base64 32>
```

### Optionnels:

```
GOOGLE_ID=<si tu utilises Google OAuth>
GOOGLE_SECRET=<si tu utilises Google OAuth>
SENTRY_DSN=<pour le monitoring>
```

## 📱 Étapes de Déploiement

### 1. Sur Vercel Dashboard

1. Aller à https://vercel.com/new
2. Cliquer "Import Git Repository"
3. Connecter ton repo GitHub
4. Sélectionner Next.js comme framework
5. Dans "Environment Variables", ajouter toutes les variables ci-dessus
6. Cliquer "Deploy"

### 2. Après le Déploiement

```bash
# Exécuter les migrations Prisma
npx prisma migrate deploy

# Vérifier les logs
vercel logs
```

### 3. Tester la Connexion

- Aller à https://ton-app.vercel.app
- Vérifier que la page charge
- Essayer de se connecter
- Vérifier que les emails sont envoyés

## 🔄 Crons Automatiques

Les crons suivants s'exécutent automatiquement (configurés dans vercel.json):

- `/api/cron/generate-invoices` → Quotidien 8:00
- `/api/cron/salary-notifications` → Quotidien 9:00
- `/api/cron/check-late-payments` → Quotidien 10:00
- `/api/cron/check-late-tasks` → Quotidien 11:00

⚠️ **Important**: Les crons vont faire des requêtes avec le header `x-vercel-cron-secret`
Assure-toi que `X_CRON_SECRET` est bien configuré!

## 📚 Ressources

- Docs Vercel: https://vercel.com/docs
- Docs Next.js: https://nextjs.org/docs
- Docs Prisma: https://www.prisma.io/docs/

## ❓ Troubleshooting

**Erreur "Cannot find module"**
→ Exécute: `npm install` avant de pousser sur GitHub

**Erreur Database Connection**
→ Vérifie que DATABASE_URL est correct et la DB est accessible

**Crons ne s'exécutent pas**
→ Vérifie que X_CRON_SECRET est configuré dans Vercel

**Emails ne sont pas envoyés**
→ Vérifie SMTP_* et que le compte Gmail a activé "Less secure apps"
