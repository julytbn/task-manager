# 📊 Analyse Complète du Projet Task-Manager

## 🎯 Vue d'ensemble

**Task-Manager** est une application web de gestion d'entreprise multi-fonctionnelle construite avec **Next.js 14** et **Prisma**. C'est un système complet de gestion de projets, tâches, facturation, abonnements et ressources humaines pour un cabinet comptable (Kekeli Group).

---

## 🏗️ Architecture Technique

### Stack Technologique
```
Frontend:
  - Next.js 14.2.33 (App Router)
  - React 18
  - TypeScript
  - TailwindCSS + Radix UI
  - Chart.js (visualisations)

Backend:
  - Next.js API Routes
  - Prisma 5.10.2 (ORM)
  - PostgreSQL
  - NextAuth 4.24.11 (authentification)

Services:
  - NodeMailer (emails)
  - Google APIs (Gmail, OAuth2)
  - PDF Kit (génération PDF)
  - Node Cron (tâches planifiées)
  - Multer/Busboy (uploads)
```

---

## 📂 Structure des Dossiers

```
task-manager/
├── app/                          # Application Next.js (App Router)
│   ├── api/                      # Routes API
│   │   ├── auth/                # Authentification (NextAuth)
│   │   ├── projets/             # Gestion des projets
│   │   ├── taches/              # Gestion des tâches
│   │   ├── factures/            # Facturation
│   │   ├── paiements/           # Paiements
│   │   ├── abonnements/         # Abonnements récurrents
│   │   ├── clients/             # Clients
│   │   ├── utilisateurs/        # Utilisateurs
│   │   ├── equipes/             # Équipes
│   │   ├── services/            # Services (catalogue)
│   │   ├── devis/               # Devis
│   │   ├── timesheets/          # Feuilles de temps
│   │   ├── charges/             # Charges/dépenses
│   │   ├── notifications/       # Notifications
│   │   ├── enums/               # Énumérations
│   │   ├── billing/             # Facturation automatique
│   │   ├── cron/                # Tâches cron
│   │   ├── debug/               # Endpoints de debug
│   │   └── uploads/             # Gestion des uploads
│   ├── dashboard/               # Pages tableau de bord
│   ├── projets/                 # Pages gestion projets
│   ├── taches/                  # Pages gestion tâches
│   ├── factures/                # Pages facturation
│   ├── paiements/               # Pages paiements
│   ├── clients/                 # Pages clients
│   ├── equipes/                 # Pages équipes
│   ├── utilisateurs/            # Pages utilisateurs
│   ├── timesheets/              # Pages timesheets
│   ├── abonnements/             # Pages abonnements
│   ├── connexion/               # Authentification
│   ├── inscription/             # Inscription
│   ├── kanban/                  # Vue Kanban
│   ├── agenda/                  # Agenda
│   ├── accounting/              # Comptabilité
│   ├── parametres/              # Paramètres
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Redirection vers connexion
│   └── globals.css              # Styles globaux
│
├── components/                  # Composants React réutilisables
│   ├── ui/                      # Composants UI (dialog, button, etc.)
│   ├── layouts/                 # Layouts (Header, Sidebar, etc.)
│   ├── dashboard/               # Composants dashboard
│   ├── *Modal.tsx               # Modales fonctionnelles
│   ├── *List.tsx                # Listes de données
│   ├── *Table.tsx               # Tableaux de données
│   └── *Form.tsx                # Formulaires
│
├── src/
│   ├── modules/timesheets/      # Module métier timesheets
│   └── types/                   # Types TypeScript personnalisés
│
├── lib/                         # Utilitaires et services
│   ├── auth.ts                  # Configuration NextAuth
│   ├── prisma.ts                # Instance Prisma
│   └── autres utilitaires
│
├── prisma/                      # Base de données
│   ├── schema.prisma            # Schéma Prisma (modèles)
│   ├── migrations/              # Migrations de schéma
│   ├── seed.js                  # Données de test
│   └── seed-empty.js            # Seed vide
│
├── scripts/                     # Scripts utilitaires
│   ├── run-recurring-billing.ts # Facturation automatique récurrente
│   ├── generate-invoices.ts     # Génération de factures
│   └── autres scripts
│
├── public/                      # Fichiers statiques
├── styles/                      # Styles TailwindCSS/CSS
├── hooks/                       # Hooks React personnalisés
├── types/                       # Types TypeScript globaux
├── data/                        # Données statiques
├── tests/                       # Tests
├── next.config.js               # Configuration Next.js
├── tsconfig.json                # Configuration TypeScript
├── tailwind.config.ts           # Configuration TailwindCSS
└── package.json                 # Dépendances et scripts
```

---

## 🗄️ Modèle de Données (Prisma)

### Entités Principales

#### 1. **Gestion Clients**
- `Client` - Clients (particuliers/entreprises)
- `DocumentClient` - Documents associés aux clients
- `TypeClient` enum - PARTICULIER, ENTREPRISE, ORGANISATION

#### 2. **Services & Offres**
- `Service` - Catalogue de services (comptabilité, audit, etc.)
- `CategorieService` enum - COMPTABILITE, AUDIT_FISCALITE, MARKETING, etc.
- `ProjetService` - Liaison projet-services (many-to-many)
- `DevisService` - Liaison devis-services

#### 3. **Facturation**
- `Facture` - Factures clients
- `StatutFacture` enum - BROUILLON, EN_ATTENTE, PAYEE, etc.
- `Paiement` - Enregistrements de paiements
- `MoyenPaiement` enum - ESPECES, VIREMENT, CARTE, etc.
- `StatutPaiement` enum - EN_ATTENTE, CONFIRME, REFUSE

#### 4. **Abonnements**
- `Abonnement` - Abonnements récurrents clients
- `FrequencePaiement` enum - MENSUEL, TRIMESTRIEL, etc.
- `StatutAbonnement` enum - ACTIF, SUSPENDU, EN_RETARD
- Génère automatiquement des factures à chaque cycle

#### 5. **Projets & Tâches**
- `Projet` - Projets clients
- `StatutProjet` enum - EN_COURS, TERMINE, EN_RETARD, etc.
- `Tache` - Tâches dans les projets
- `StatutTache` enum - A_FAIRE, EN_COURS, SOUMISE, TERMINE, etc.
- `Priorite` enum - BASSE, MOYENNE, HAUTE, URGENTE
- `DocumentTache` - Documents associés aux tâches

#### 6. **Devis**
- `Devis` - Devis pour clients
- `StatutDevis` enum - BROUILLON, ENVOYE, ACCEPTE, REFUSE
- Peut être lié à un projet

#### 7. **Ressources Humaines**
- `Utilisateur` - Utilisateurs/Employés
- `RoleUtilisateur` enum - ADMIN, MANAGER, EMPLOYE, CONSULTANT
- `Equipe` - Équipes de travail
- `MembreEquipe` - Membres dans les équipes
- `TimeSheet` - Feuilles de temps (heures travaillées)
- `StatutTimeSheet` enum - EN_ATTENTE, VALIDEE, REJETEE

#### 8. **Charges/Dépenses**
- `Charge` - Charges d'exploitation
- `CategorieCharge` enum - SALAIRES, LOYER, UTILITIES, etc.

#### 9. **Notifications & Souhaits**
- `Notification` - Notifications utilisateurs
- `TypeNotification` enum - INFO, EQUIPE, TACHE, ALERTE
- `Souhait` - Messages de souhaits (anniversaires, etc.)
- `TypeSouhait` enum - ANNIVERSAIRE, BONNE_ANNEE, FETE

#### 10. **Énumérations**
- `EnumStatutTache`, `EnumPriorite`, etc. - Tables pour énumérations paramétrables

### Relations Clés
```
Client -> Factures, Paiements, Projets, Devis, Abonnements
Projet -> Tâches, Factures, Services, Paiements, Charges, TimeSheets
Utilisateur -> Équipes (lead), Membres équipes, Tâches, Notifications
Abonnement -> Factures automatiques (récurrence)
Tâche -> TimeSheets, Documents, Paiements
```

---

## 🔑 Fonctionnalités Principales

### 1. **Gestion des Projets**
- ✅ Créer/modifier/supprimer projets
- ✅ Lier services aux projets
- ✅ Tracker la progression (% basé sur les tâches)
- ✅ Assigner des équipes
- ✅ Calculer montants totaux

### 2. **Gestion des Tâches**
- ✅ Créer tâches (A_FAIRE, EN_COURS, SOUMISE, TERMINE)
- ✅ Assigner à des utilisateurs
- ✅ Priorités
- ✅ Estimer et tracker les heures
- ✅ Upload de documents
- ✅ Facturation (montant, estPayee)

### 3. **Facturation Complète**
- ✅ Factures uniques
- ✅ **Facturation récurrente** (abonnements)
- ✅ Génération automatique via cron
- ✅ Tracking des paiements
- ✅ Notifications de retard de paiement
- ✅ Calcul TVA
- ✅ Support des devis

### 4. **Gestion des Paiements**
- ✅ Multiples moyens de paiement
- ✅ Suivi du statut (EN_ATTENTE, CONFIRME, etc.)
- ✅ Rattachement à factures/projets/tâches
- ✅ Notifications de retard
- ✅ Preuve de paiement (documents)

### 5. **Abonnements Récurrents**
- ✅ Créer abonnements (mensuel, trimestriel, etc.)
- ✅ Génération automatique de factures
- ✅ Suivi des paiements effectués
- ✅ Suspension/annulation

### 6. **Ressources Humaines**
- ✅ Gestion des équipes
- ✅ Feuilles de temps (timesheets)
- ✅ Validation par manager
- ✅ Charges/dépenses
- ✅ Suivi heures normales, supplémentaires, congés

### 7. **Devis**
- ✅ Création de devis
- ✅ Historique des statuts (BROUILLON → ENVOYE → ACCEPTE)
- ✅ Conversion en projet
- ✅ Détails lignes avec services

### 8. **Notifications**
- ✅ Notifications utilisateurs
- ✅ Alertes de retard de paiement
- ✅ Messages de souhaits
- ✅ Marquage comme lu

### 9. **Uploads de Documents**
- ✅ Upload pour clients
- ✅ Upload pour tâches
- ✅ Preuve de paiement
- ✅ Justificatifs de charges

---

## 🔐 Authentification & Autorisation

### NextAuth
- **Provider**: Credentials (email/mot de passe)
- **Adapter**: Prisma
- **Session**: JWT
- **Roles**: ADMIN, MANAGER, EMPLOYE, CONSULTANT
- Verification d'email avec token
- Reset mot de passe

### Protections
- Routes API protégées avec `getServerSession()`
- Vérification des rôles
- Validation des données (Zod)

---

## 🚀 Scripts Clés

### Scripts NPM
```bash
npm run dev                    # Démarrage développement
npm run build                  # Build production
npm run start                  # Démarrage production
npm run lint                   # ESLint

# Prisma
npm run prisma:generate       # Génération client Prisma
npm run prisma:migrate        # Migration
npm run prisma:studio         # Interface graphique BD
npm run prisma:seed           # Données test

# Facturation
npm run billing:run            # Facturation manuelle
npm run billing:dev            # Dev avec NODE_ENV=development
npm run billing:prod           # Production avec NODE_ENV=production

# Scripts utilitaires
npm run upload-server          # Serveur d'upload
npm run cron:invoices          # Génération factures cron
npm run test:payment-late      # Test notifications retard paiement
```

### Scripts Serveur
- `scripts/run-recurring-billing.ts` - Facturation automatique
- `scripts/generate-invoices.ts` - Génération des factures
- `scripts/testPaymentLateDetection.js` - Test paiements en retard

---

## 📡 Endpoints API Principaux

```
POST   /api/auth/signin                  # Connexion
POST   /api/auth/signup                  # Inscription
POST   /api/auth/callback/credentials    # Callback auth

GET    /api/projets                      # Lister projets
POST   /api/projets                      # Créer projet
PUT    /api/projets/[id]                 # Modifier projet
DELETE /api/projets/[id]                 # Supprimer projet

GET    /api/taches                       # Lister tâches
POST   /api/taches                       # Créer tâche
PUT    /api/taches/[id]                  # Modifier tâche

GET    /api/factures                     # Lister factures
POST   /api/factures                     # Créer facture
GET    /api/factures/[id]                # Détail facture

POST   /api/paiements                    # Créer paiement
GET    /api/paiements                    # Lister paiements

POST   /api/abonnements                  # Créer abonnement
GET    /api/abonnements                  # Lister abonnements

GET    /api/clients                      # Lister clients
POST   /api/clients                      # Créer client

GET    /api/equipes                      # Lister équipes
POST   /api/equipes                      # Créer équipe

GET    /api/timesheets                   # Lister timesheets
POST   /api/timesheets                   # Créer timesheet

GET    /api/billing/recurring            # Status facturation récurrente
POST   /api/billing/process-recurring    # Traiter abonnements

GET    /api/enums/[type]                 # Lister énumérations
```

---

## 🎨 Pages Principales

### Public
- `/connexion` - Connexion
- `/inscription` - Inscription
- `/mot-de-passe-oublie` - Reset mot de passe

### Authentifiées
- `/dashboard` - Tableau de bord (vue d'ensemble)
- `/projets` - Gestion projets
- `/taches` - Gestion tâches (Kanban)
- `/factures` - Facturation
- `/paiements` - Gestion paiements
- `/clients` - Gestion clients
- `/equipes` - Gestion équipes
- `/mes-equipes` - Mes équipes (employé)
- `/utilisateurs` - Gestion utilisateurs
- `/timesheets` - Feuilles de temps
- `/abonnements` - Abonnements
- `/agenda` - Calendrier
- `/accounting` - Comptabilité
- `/parametres` - Paramètres

---

## 🧩 Composants React Clés

### Modales
- `AbonnementModal` - Gestion abonnements
- `NouveauClientModal` - Création client
- `NouveauFactureModal` - Création facture
- `NouveauPaiementModal` - Enregistrement paiement
- `NouvelleTacheModal` - Création tâche
- `ProjectModal` - Gestion projet
- `ProjectTasksModal` - Tâches du projet
- `ProjectInvoicesModal` - Factures du projet
- `EditProjectModal` - Modification projet

### Tableaux & Listes
- `DataTable` - Tableau générique
- `PaiementsTable` - Tableau paiements
- `PaiementsOverview` - Vue d'ensemble paiements
- `EquipesList` - Liste équipes
- `AbonnementsList` - Liste abonnements

### Autres
- `Navbar` / `TopNavbar` - Navigation
- `ManagerSidebar` - Sidebar manager
- `MainLayout` - Layout principal
- `Spinner` - Loader
- `Toast` - Notifications
- `StatCard` - Cartes statistiques

---

## 🔄 Flux Métier Clés

### 1. Création d'une Facture Automatique (Abonnement)
```
Utilisateur crée Abonnement
  ↓
Cron job quotidien: /api/billing/recurring
  ↓
Vérifie si dateProchainFacture <= aujourd'hui
  ↓
Crée une Facture automatiquement
  ↓
Met à jour dateProchainFacture
  ↓
Envoie notification client
```

### 2. Gestion Paiement en Retard
```
Facture créée avec dateEcheance
  ↓
Cron job: Détecte paiements en retard
  ↓
Crée Notification "Paiement en retard"
  ↓
Peut envoyer email de relance
```

### 3. Workflow Tâche
```
Tâche créée (A_FAIRE)
  ↓
Assignée à utilisateur
  ↓
En cours (EN_COURS)
  ↓
Soumise pour révision (SOUMISE)
  ↓
Validée (TERMINE)
  ↓
Peut être facturée (facturable + montant)
```

### 4. Workflow Devis → Projet
```
Devis créé (BROUILLON)
  ↓
Envoyé au client (ENVOYE)
  ↓
Accepté (ACCEPTE)
  ↓
Conversion en Projet
  ↓
Services dupliqués → ProjetServices
```

---

## 📊 Points Importants

### Configuration
- **Base de données**: PostgreSQL (via `DATABASE_URL`)
- **NextAuth Secret**: `NEXTAUTH_SECRET` (gestion sessions)
- **NextAuth URL**: `NEXTAUTH_URL` (pour callbacks)

### Énumérations
- 10 tables `Enum*` pour paramétrabilité
- Permet modification des listes déroulantes sans code

### Facturation Récurrente
- Critère: `abonnement.dateProchainFacture <= today`
- Calcul date prochaine: basedate + fréquence
- Automatisation via cron + script Node

### Documents & Uploads
- Upload serveur Express dans `scripts/upload-server.js`
- Multer/Busboy pour traitement
- Stockage dossier `storage/` (configurable)

### Sécurité
- Validation Zod sur tous les inputs API
- Vérification rôle/permissions
- Tokens JWT pour sessions

---

## 🎯 Utilisation Métier

**Cas d'usage principal**: Gestion complète d'un cabinet comptable
- Suivi des clients et leurs projets
- Facturation avec support abonnements
- Gestion des équipes et heures travaillées
- Suivi des paiements et alertes
- Devis et conversion en projet
- Documents et justificatifs

**Utilisateurs types**:
- **Admin**: Tous les accès, configuration
- **Manager**: Gestion équipes, validation timesheets, vue projets
- **Employé**: Tâches assignées, saisie timesheets
- **Consultant**: Accès limité à données

---

## 🚨 Points d'Attention

1. **Facturation Récurrente**: Dépend du cron job, à vérifier en prod
2. **Uploads**: Stockage local en développement, configurer CDN/S3 en prod
3. **Notifications Email**: Nodemailer configuré, vérifier secrets SMTP
4. **Timesheets**: Liaison obligatoire à projet + tâche
5. **Enum**: Tables flexibles mais requièrent migration de données

---

## 📈 Évolutions Possibles

- ✅ Intégration bancaire pour import automatique paiements
- ✅ PDF générés pour factures/devis
- ✅ Export Excel pour tableaux
- ✅ API mobile
- ✅ Webhook pour intégrations externes
- ✅ BI/Analytics dashboard
- ✅ Mobile app native

---

**Dernière mise à jour**: 11 Décembre 2025
**Stack**: Next.js 14 + Prisma 5.10 + PostgreSQL
