# Task Manager - Kekeli

Plateforme de gestion de tâches, projets et salaires pour les équipes.

## 🚀 Quick Start

```bash
# Installation
npm install

# Configuration
cp .env.example .env.local
# Remplir les variables d'environnement

# Développement
npm run dev

# Build production
npm run build
npm start
```

## 📋 Prérequis

- Node.js 18+
- PostgreSQL/MySQL
- npm ou yarn

## 🔧 Configuration

Les variables d'environnement essentielles :

```env
# Database
DATABASE_URL=postgresql://...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Cron
CRON_SECRET=your-cron-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Structure du projet

```
├── app/                      # Next.js App Router
│   ├── api/                 # API endpoints (REST)
│   ├── auth/                # Pages d'authentification
│   └── ...                  # Pages de l'application
├── components/              # Composants React réutilisables
├── lib/                     # Utilitaires et services
│   ├── services/           # Logique métier
│   ├── email/              # Configuration email
│   └── prisma/             # Client Prisma
├── prisma/                  # Schéma et migrations DB
├── scripts/                 # Scripts utilitaires
└── public/                  # Assets statiques
```

## 🗄️ Base de données

```bash
# Initialiser la base
npx prisma migrate dev

# Voir les données
npx prisma studio

# Générer le client
npx prisma generate
```

## ⏱️ Crons disponibles

Les crons sont configurés dans `vercel.json` :

| Endpoint | Horaire | Description |
|----------|---------|-------------|
| `/api/cron/generate-invoices` | 08:00 | Générer les factures |
| `/api/cron/salary-notifications` | 09:00 | Notifications salaires |
| `/api/cron/check-late-payments` | 10:00 | Vérifier paiements retardés |
| `/api/cron/check-late-tasks` | 11:00 | Vérifier tâches retardées |
| `/api/cron/create-daily-timesheets` | 00:00 | Créer timesheets obligatoires du jour |
| `/api/cron/timesheet-reminder` | 17:00 | Rappeler de créer le timesheet |
| `/api/cron/timesheet-progressive-reminders` | 18:00, 19:00 | Rappels progressifs (urgent) |
| `/api/cron/salary/forecast-calculated` | J31 00:00 | Notifier prévisions salaires |
| `/api/cron/salary/payment-due` | J1 08:00 | Rappel paiement salaires |
| `/api/cron/salary/payment-late` | J3 09:00 | Alerte paiement retardé |

**Test local :**
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_CRON_SECRET" }
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/salary/forecast-calculated" -Headers $headers -UseBasicParsing
```

## 📧 Emails

Les emails sont envoyés via SMTP (Gmail par défaut).

**Services email :**
- Notification salaires
- Paiement retardé
- Tâches retardées
- Réinitialisation mot de passe

## 🔐 Authentification

- **NextAuth.js** pour la gestion des sessions
- Support email/password
- Réinitialisation de mot de passe par email

## 🚢 Déploiement

### Vercel

```bash
# Push vers GitHub
git push

# Vercel se déploie automatiquement
# Ajouter les variables d'env dans Settings → Environment Variables
```

**Checklist déploiement :**
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] Crons testés en local
- [ ] Build réussit (`npm run build`)

### Vérifier le déploiement

```bash
# Logs en temps réel
vercel logs

# Status des crons
# → Dashboard Vercel → Deployments → Crons tab
```

## 🧪 Tests

```bash
# Linter
npm run lint

# Build production
npm run build

# Tests crons localement
npm run dev
# Puis tester les endpoints API
```

## 📝 Scripts disponibles

```bash
npm run dev                 # Serveur de développement
npm run build              # Build production
npm start                  # Serveur production
npm run lint               # Linter ESLint
npm run prisma:migrate     # Migrer la DB
npm run prisma:studio      # Interface Prisma
npm run cron:invoices      # Générer les factures
npm run billing:dev        # Billing en développement
```

## 🐛 Dépannage

**Le build échoue :**
- Vérifier les erreurs TypeScript : `npm run build`
- Vérifier les imports manquants
- Regénérer le client Prisma : `npx prisma generate`

**Les crons ne s'exécutent pas :**
- Vérifier le `CRON_SECRET` dans Vercel
- Vérifier la route existe : `/api/cron/...`
- Voir les logs Vercel

**Erreurs email :**
- Vérifier les credentials SMTP
- Autoriser les "app passwords" Gmail
- Vérifier SMTP_PORT (587 pour Gmail)

## 📚 Documentation

- [Guide test crons Vercel](GUIDE_TEST_CRON_VERCEL.md)
- Documentation archivée : [DOCS_ARCHIVE/](DOCS_ARCHIVE/)

## 📄 License

Propriétaire - Kekeli

## 👥 Support

Pour les questions ou problèmes, ouvrir une issue ou contacter l'équipe.

---

**Dernière mise à jour :** 17 Décembre 2025
**Status :** ✅ Production Ready
