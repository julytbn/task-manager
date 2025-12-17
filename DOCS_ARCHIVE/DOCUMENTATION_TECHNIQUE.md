# 📚 Documentation Technique - Task Manager

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du projet](#architecture-du-projet)
3. [Technologies utilisées](#technologies-utilisées)
4. [Structure de la base de données](#structure-de-la-base-de-données)
5. [API REST](#api-rest)
6. [Structure des composants React](#structure-des-composants-react)
7. [Flux de données](#flux-de-données)
8. [Authentification](#authentification)
9. [Énumérations depuis la base de données](#énumérations-depuis-la-base-de-données)
10. [Déploiement et configuration](#déploiement-et-configuration)

---

## Vue d'ensemble

**Task Manager** est une application web complète de gestion de projets et de tâches conçue pour l'entreprise Kekeli Group. L'application permet de :

- Gérer les clients et leurs projets
- Créer et assigner des tâches aux équipes
- Tracker la progression des projets
- Gérer les factures et les paiements
- Fournir un dashboard personnalisé par rôle (Manager/Employé)

**Stack technique :** Next.js 14 + React 18 + TypeScript + Prisma ORM + PostgreSQL

---

## Architecture du projet

### Vue d'ensemble structurelle

```
task-manager/
├── app/                          # Répertoire principal Next.js (App Router)
│   ├── api/                      # Routes API backend
│   │   ├── auth/                 # Authentification NextAuth
│   │   ├── clients/              # Endpoints clients
│   │   ├── projets/              # Endpoints projets
│   │   ├── taches/               # Endpoints tâches
│   │   ├── services/             # Endpoints services
│   │   ├── equipes/              # Endpoints équipes
│   │   ├── paiements/            # Endpoints paiements
│   │   ├── factures/             # Endpoints factures
│   │   ├── utilisateurs/         # Endpoints utilisateurs
│   │   ├── enums/[type]/         # Endpoints énumérations
│   │   └── dashboard/            # Endpoints dashboard
│   ├── connexion/                # Page de connexion
│   ├── inscription/              # Page d'inscription
│   ├── dashboard/                # Dashboards (manager et employé)
│   ├── projets/                  # Gestion des projets
│   ├── taches/                   # Gestion des tâches
│   ├── clients/                  # Gestion des clients
│   ├── factures/                 # Gestion des factures
│   ├── paiements/                # Gestion des paiements
│   ├── equipes/                  # Gestion des équipes
│   ├── kanban/                   # Vue Kanban des tâches
│   ├── parametres/               # Paramètres utilisateur
│   ├── agenda/                   # Vue calendrier
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Page d'accueil
│   ├── providers.tsx             # Providers (Session, etc.)
│   └── globals.css               # Styles globaux
│
├── components/                   # Composants React réutilisables
│   ├── ui/                       # Composants UI de base (Button, Dialog, etc.)
│   ├── dashboard/                # Composants dashboard
│   ├── NouvelleTacheModal.tsx    # Modal de création de tâche
│   ├── ProjectModal.tsx          # Modal de création de projet
│   ├── NouveauClientModal.tsx    # Modal de création de client
│   ├── ManagerSidebar.tsx        # Barre latérale manager
│   ├── EmployeeHeader.tsx        # En-tête employé
│   └── EnumSelect.tsx            # Sélecteur d'énumérations
│
├── lib/                          # Utilitaires et services
│   ├── prisma.ts                 # Client Prisma (singleton)
│   ├── auth.ts                   # Configuration NextAuth
│   ├── session.ts                # Gestion des sessions
│   ├── permissions.ts            # Vérifications de permissions
│   ├── useEnums.ts               # Hook React pour énumérations
│   ├── useProjectsStatistics.ts  # Hook pour statistiques projets
│   ├── serverEnums.ts            # Utilitaires énumérations côté serveur
│   ├── enumUtils.ts              # Utilitaires énumérations côté client
│   └── paiementService.ts        # Service de gestion des paiements
│
├── types/                        # Types TypeScript
│   ├── index.ts                  # Types généraux
│   ├── task.ts                   # Types pour les tâches
│   └── next-auth.d.ts            # Types NextAuth
│
├── prisma/                       # Gestion de la base de données
│   ├── schema.prisma             # Schéma de la base de données
│   ├── migrations/               # Historique des migrations
│   └── seed.js                   # Script d'initialisation des données
│
├── scripts/                      # Scripts utilitaires
│   ├── seedEnums.js              # Initialisation des énumérations
│   └── verifyDatabaseStructure.js # Vérification de la DB
│
├── package.json                  # Dépendances du projet
├── tsconfig.json                 # Configuration TypeScript
├── tailwind.config.ts            # Configuration Tailwind CSS
├── next.config.js                # Configuration Next.js
└── README.md                     # Documentation utilisateur

```

---

## Technologies utilisées

### Framework Frontend
- **Next.js 14.2.33** - Framework React avec Server-Side Rendering et Static Generation
- **React 18** - Bibliothèque UI avec hooks et contexte
- **TypeScript** - Typage statique pour JavaScript

### Styling
- **Tailwind CSS 3.4.18** - Framework CSS utility-first
- **Radix UI** - Composants UI accessibles et non-stylisés
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-label`
  - `@radix-ui/react-toast`

### Icons
- **Lucide React 0.475.0** - Librairie d'icônes SVG

### Backend
- **Node.js** - Runtime JavaScript serveur

### Base de données
- **PostgreSQL** - Système de gestion de base de données relationnelle
- **Prisma 5.10.2** - ORM (Object-Relational Mapping)
  - Migration database
  - Prisma Studio pour visualiser les données
  - Prisma Client pour requêtes typées

### Authentification
- **NextAuth 4.24.11** - Solution d'authentification pour Next.js
  - `@auth/prisma-adapter` - Adaptateur Prisma pour NextAuth
  - Stratégie JWT
  - Provider Credentials
  - Sessions de 30 jours

### Sécurité
- **bcryptjs 3.0.3** - Hashage des mots de passe
- **Zod 3.24.1** - Validation de schémas TypeScript

### Communication
- **Nodemailer 7.0.11** - Envoi d'emails

### Charting
- **Chart.js 4.5.1** - Créer des graphiques
- **react-chartjs-2 5.3.1** - Wrapper React pour Chart.js

---

## Structure de la base de données

### Modèles principaux

#### 1. **Utilisateur**
```prisma
model Utilisateur {
  id           String
  email        String @unique
  nom          String
  prenom       String
  motDePasse   String
  role         Role              // MANAGER, EMPLOYE, ADMIN
  statut       String
  telephone    String?
  avatar       String?
  dateCreation DateTime @default(now())
  dateModification DateTime @updatedAt

  // Relations
  membreEquipes   MembreEquipe[]  // Équipes dont cet utilisateur est membre
  tachesAssignees Tache[]         // Tâches assignées à cet utilisateur
  notifications   Notification[]
}
```

#### 2. **Client**
```prisma
model Client {
  id               String
  nom              String
  prenom           String
  email            String?
  telephone        String?
  entreprise       String?
  adresse          String?
  type             TypeClient     // PARTICULIER, ENTREPRISE, ORGANISATION
  dateNaissance    DateTime?
  dateCreation     DateTime @default(now())
  dateModification DateTime @updatedAt

  // Relations
  projets          Projet[]
  factures         Facture[]
  paiements        Paiement[]
}
```

#### 3. **Service**
```prisma
model Service {
  id               String
  nom              String @unique
  description      String?
  categorie        CategorieService  // Enum: DEVELOPPEMENT, MARKETING, etc.
  prix             Float?
  dureeEstimee     Int?
  dateCreation     DateTime @default(now())
  dateModification DateTime @updatedAt

  // Relations
  projets          Projet[]
  taches           Tache[]
}
```

#### 4. **Projet**
```prisma
model Projet {
  id               String
  titre            String
  description      String?
  client           Client @relation(fields: [clientId], references: [id])
  clientId         String
  service          Service @relation(fields: [serviceId], references: [id])
  serviceId        String
  statut           StatutProjet   // EN_COURS, TERMINE, EN_RETARD
  budget           Float?
  dateDebut        DateTime?
  dateFin          DateTime?
  dateEcheance     DateTime?
  equipe           Equipe? @relation("ProjetAEquipe", fields: [equipeId])
  equipeId         String?
  dateCreation     DateTime @default(now())
  dateModification DateTime @updatedAt

  // Relations
  taches           Tache[]
  factures         Facture[]
  paiements        Paiement[] @relation("PaiementsDuProjet")
}
```

#### 5. **Tâche**
```prisma
model Tache {
  id               String
  titre            String
  description      String?
  projet           Projet @relation(fields: [projetId], references: [id])
  projetId         String
  service          Service? @relation(fields: [serviceId])
  serviceId        String?
  assigneA         Utilisateur? @relation(fields: [assigneAId])
  assigneAId       String?
  statut           StatutTache    // A_FAIRE, EN_COURS, TERMINE
  priorite         Priorite       // BASSE, MOYENNE, HAUTE
  dateEcheance     DateTime?
  heuresEstimees   Float?
  heuresReelles    Float?
  facturable       Boolean @default(true)
  estPayee         Boolean @default(false)
  montant          Float?
  equipe           Equipe? @relation("TacheEquipe", fields: [equipeId])
  equipeId         String?
  facture          Facture? @relation(fields: [factureId])
  factureId        String?
  dateCreation     DateTime @default(now())
  dateModification DateTime @updatedAt

  // Relations
  paiements        Paiement[]
}
```

#### 6. **Équipe**
```prisma
model Equipe {
  id               String
  nom              String
  description      String?
  dateCreation     DateTime @default(now())
  dateModification DateTime @updatedAt

  // Relations
  membres          MembreEquipe[]
  projets          Projet[] @relation("ProjetAEquipe")
  taches           Tache[] @relation("TacheEquipe")
}
```

#### 7. **Paiement**
```prisma
model Paiement {
  id               String
  tache            Tache @relation(fields: [tacheId])
  tacheId          String
  projet           Projet @relation("PaiementsDuProjet", fields: [projetId])
  projetId         String
  client           Client @relation(fields: [clientId])
  clientId         String
  facture          Facture? @relation(fields: [factureId])
  factureId        String?
  montant          Float
  moyenPaiement    MoyenPaiement  // VIR, CHQ, ESP, MOB
  reference        String?
  datePaiement     DateTime @default(now())
  dateReception    DateTime?
  statut           StatutPaiement // EN_ATTENTE, CONFIRMÉ, REJETÉ
  notes            String?
  preuvePaiement   String?
  dateCreation     DateTime @default(now())
  dateModification DateTime @updatedAt
}
```

#### 8. **Facture**
```prisma
model Facture {
  id               String
  numero           String @unique
  client           Client @relation(fields: [clientId])
  clientId         String
  projet           Projet? @relation(fields: [projetId])
  projetId         String?
  taches           Tache[]
  paiements        Paiement[]
  statut           StatutFacture  // EN_ATTENTE, ENVOYÉE, PAYÉE
  montant          Float
  tauxTVA          Float @default(0.18)
  montantTotal     Float
  dateCreation     DateTime @default(now())
  dateModification DateTime @updatedAt
}
```

### Énumérations dans la base de données

Les énumérations suivantes sont stockées en base de données pour permettre une gestion flexible :

```prisma
model EnumStatutTache {
  id    String @id @default(cuid())
  cle   String @unique          // A_FAIRE, EN_COURS, TERMINE
  label String                  // Libellé en français
  ordre Int @default(0)
  actif Boolean @default(true)
}

model EnumPriorite {
  id    String @id @default(cuid())
  cle   String @unique          // BASSE, MOYENNE, HAUTE
  label String
  ordre Int @default(0)
  actif Boolean @default(true)
}

model EnumStatutProjet {
  id    String @id @default(cuid())
  cle   String @unique          // EN_COURS, TERMINE, EN_RETARD
  label String
  ordre Int @default(0)
  actif Boolean @default(true)
}

// Autres énumérations: 
// - EnumCategorieService
// - EnumTypeClient
// - EnumStatutFacture
// - EnumStatutPaiement
// - EnumMoyenPaiement
// - EnumTypeNotification
```

---

## API REST

### Endpoints disponibles

#### **Authentification**
```
POST   /api/auth/callback/credentials    # Login
POST   /api/auth/signin                   # Signin page
GET    /api/auth/session                  # Récupérer la session actuelle
POST   /api/auth/signout                  # Logout
```

#### **Utilisateurs**
```
GET    /api/utilisateurs                  # Lister tous les utilisateurs
GET    /api/utilisateurs?role=MANAGER     # Filtrer par rôle
GET    /api/me                            # Récupérer l'utilisateur actuel
POST   /api/utilisateurs                  # Créer un utilisateur
PUT    /api/utilisateurs                  # Mettre à jour un utilisateur
DELETE /api/utilisateurs                  # Supprimer un utilisateur
```

#### **Projets**
```
GET    /api/projets                       # Lister tous les projets
GET    /api/projets?statut=EN_COURS       # Filtrer par statut
GET    /api/projets/[id]                  # Récupérer un projet
POST   /api/projets                       # Créer un projet
PUT    /api/projets                       # Mettre à jour un projet
DELETE /api/projets                       # Supprimer un projet
GET    /api/dashboard/projets-stats       # Statistiques des projets
```

#### **Tâches**
```
GET    /api/taches                        # Lister toutes les tâches
GET    /api/taches?projetId=123           # Filtrer par projet
GET    /api/taches?assigneAId=456         # Filtrer par assigné
GET    /api/taches/[id]                   # Récupérer une tâche
POST   /api/taches                        # Créer une tâche
PUT    /api/taches                        # Mettre à jour une tâche
DELETE /api/taches                        # Supprimer une tâche
```

#### **Clients**
```
GET    /api/clients                       # Lister tous les clients
POST   /api/clients                       # Créer un client
PUT    /api/clients                       # Mettre à jour un client
DELETE /api/clients                       # Supprimer un client
```

#### **Services**
```
GET    /api/services                      # Lister tous les services
POST   /api/services                      # Créer un service
PUT    /api/services                      # Mettre à jour un service
DELETE /api/services                      # Supprimer un service
```

#### **Équipes**
```
GET    /api/equipes                       # Lister toutes les équipes
POST   /api/equipes                       # Créer une équipe
PUT    /api/equipes                       # Mettre à jour une équipe
DELETE /api/equipes                       # Supprimer une équipe
POST   /api/equipes/[id]/members          # Ajouter un membre
DELETE /api/equipes/[id]/members          # Retirer un membre
```

#### **Paiements**
```
GET    /api/paiements                     # Lister tous les paiements
GET    /api/paiements?statut=EN_ATTENTE   # Filtrer par statut
POST   /api/paiements                     # Créer un paiement
PUT    /api/paiements                     # Mettre à jour un paiement
DELETE /api/paiements                     # Supprimer un paiement
```

#### **Factures**
```
GET    /api/factures                      # Lister toutes les factures
POST   /api/factures                      # Créer une facture
PUT    /api/factures                      # Mettre à jour une facture
DELETE /api/factures                      # Supprimer une facture
GET    /api/factures/[id]                 # Récupérer une facture
```

#### **Énumérations**
```
GET    /api/enums/priorites               # Récupérer toutes les priorités
GET    /api/enums/statuts-taches          # Récupérer tous les statuts de tâche
GET    /api/enums/statuts-projets         # Récupérer tous les statuts de projet
GET    /api/enums/categories-services     # Récupérer toutes les catégories
GET    /api/enums/types-clients           # Récupérer tous les types de client
GET    /api/enums/statuts-factures        # Récupérer tous les statuts de facture
GET    /api/enums/statuts-paiements       # Récupérer tous les statuts de paiement
GET    /api/enums/moyens-paiement         # Récupérer tous les moyens de paiement
GET    /api/enums/types-notifications     # Récupérer tous les types de notification
```

### Format des réponses

**Succès (200)**
```json
{
  "data": [...],
  "message": "Succès"
}
```

**Erreur (400/500)**
```json
{
  "error": "Description de l'erreur",
  "status": 400
}
```

**Création (201)**
```json
{
  "id": "cuid_unique",
  "message": "Ressource créée avec succès"
}
```

---

## Structure des composants React

### Pages principales

#### **Dashboard (/dashboard)**
- **Manager Dashboard** : Vue d'ensemble des équipes, projets et performances
- **Employee Dashboard** : Affiche les tâches assignées et le calendrier

#### **Projets (/projets)**
- Liste des projets avec statistiques (en cours, terminés, budget)
- Bouton "Créer nouveau projet"
- Bouton "Nouvelle tâche" sur chaque projet
- Filtrage par statut et recherche

#### **Tâches (/taches)**
- Vue liste de toutes les tâches
- Création de tâche via `NouvelleTacheModal`
- Statut: A_FAIRE, EN_COURS, TERMINE

#### **Vue Kanban (/kanban)**
- Tableau Kanban avec colonnes par statut
- Drag & drop pour changer le statut
- Vue d'ensemble des tâches

#### **Clients (/clients)**
- Liste des clients
- Création/modification de clients
- Visualisation des projets liés

#### **Factures (/factures)**
- Gestion des factures
- Statuts: EN_ATTENTE, ENVOYÉE, PAYÉE
- Lien avec projets et paiements

#### **Paiements (/paiements)**
- Tableau de suivi des paiements
- Statuts: EN_ATTENTE, CONFIRMÉ, REJETÉ
- Moyens de paiement: VIR, CHQ, ESP, MOB

### Composants réutilisables

#### **Modals**
- `NouvelleTacheModal.tsx` - Création/édition de tâche
- `ProjectModal.tsx` - Création/édition de projet
- `NouveauClientModal.tsx` - Création/édition de client
- `TeamDetailModal.tsx` - Détails d'une équipe
- `CreateTeamModal.tsx` - Création d'équipe
- `EditTeamModal.tsx` - Édition d'équipe

#### **Headers**
- `ManagerHeader.tsx` - En-tête pour les managers
- `EmployeeHeader.tsx` - En-tête pour les employés
- `LoginHeader.tsx` - En-tête page connexion
- `TopNavbar.tsx` - Barre de navigation principale

#### **Navigation**
- `ManagerSidebar.tsx` - Barre latérale manager avec liens vers projets, tâches, paiements, équipes
- `ConditionalTopNavbar.tsx` - Barre supérieure conditionnelle

#### **Dashboard Components**
- `DashboardPerformance.tsx` - Graphiques de performance
- `DashboardTasks.tsx` - Affichage des tâches
- `DashboardPayments.tsx` - Suivi des paiements
- `DashboardAgenda.tsx` - Calendrier des tâches

#### **Autres**
- `EnumSelect.tsx` - Sélecteur pour énumérations (priorités, statuts)
- `ProjectCard.tsx` - Carte affichant un projet
- `TeamCard.tsx` - Carte affichant une équipe

---

## Flux de données

### Flux d'authentification

```
1. Utilisateur accède /connexion
2. Remplit email + motDePasse
3. POST /api/auth/callback/credentials
4. NextAuth vérifie dans DB via Prisma
5. Hashing du mot de passe avec bcryptjs
6. Création d'une session JWT
7. Redirection vers /dashboard
```

### Flux de création de tâche

```
1. Manager clique "Nouvelle tâche" sur ProjectCard
2. setTaskProjectId(project.id) et setIsTaskModalOpen(true)
3. NouvelleTacheModal s'ouvre avec projetId pré-rempli
4. Modal charge projets, services, utilisateurs
5. Manager remplit formulaire (titre, assigneA, priorite, etc.)
6. Submit → handleSave dans app/projets/page.tsx
7. POST /api/taches avec payload
8. API vérifie permissions (team membership)
9. Prisma crée la tâche en DB
10. Modal se ferme
11. fetchProjects() rafraîchit la liste
12. refreshStatistics() met à jour KPIs
```

### Flux de gestion des énumérations

```
Frontend:
1. Composant importe useEnums()
2. Hook appelle GET /api/enums/[type]
3. Réponse stockée en cache (5 min)
4. EnumSelect affiche les options
5. Utilisateur sélectionne une valeur
6. Valeur envoyée au serveur

Backend:
1. GET /api/enums/[type]
2. Prisma requête prisma.enumPriorite.findMany()
3. Filtre actif: true
4. Trie par ordre
5. Retourne JSON avec clé et label
```

### Flux de récupération des statistiques

```
1. App /projets/page.tsx use useProjectsStatistics()
2. Hook appelle GET /api/dashboard/projets-stats
3. API récupère:
   - Tous les StatutProjet actifs
   - Tous les Projet avec relations
   - Calcule:
     * totalProjets = count(Projet)
     * projetsEnCours = count(Projet where statut=EN_COURS)
     * projetsTermines = count(Projet where statut=TERMINE)
     * budgetTotal = sum(Projet.budget)
4. Retourne JSON structuré
5. KPI Cards affichent les données
```

---

## Authentification

### Configuration NextAuth

**Provider:** Credentials (email + mot de passe)
**Adaptateur:** Prisma
**Stratégie session:** JWT
**Durée session:** 30 jours

### Fichier clé: `lib/auth.ts`

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        motDePasse: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        // Vérifier email et mot de passe dans la base de données
        // Hasher le mot de passe avec bcryptjs
        // Retourner l'utilisateur ou null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      // Ajouter infos utilisateur au token
    },
    async session({ session, token }) {
      // Ajouter infos du token à la session
    }
  }
}
```

### Récupérer l'utilisateur actuel

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
const userId = session?.user?.id
```

### Vérifier les permissions

**Fichier:** `lib/permissions.ts`

Exemple de vérifications :
- Utilisateur a accès au projet
- Utilisateur est dans la même équipe
- Utilisateur a le rôle MANAGER
- Utilisateur a le rôle ADMIN

---

## Énumérations depuis la base de données

### Pourquoi cette approche ?

- **Flexibilité** : Ajouter/modifier des énumérations sans redéployer
- **Maintenabilité** : Gestion centralisée en base de données
- **Scalabilité** : Support de multiples énumérations
- **Performance** : Cache côté client avec TTL

### Architecture

#### 1. Base de données
9 tables `Enum*` stockent les énumérations :
- EnumStatutTache (A_FAIRE, EN_COURS, TERMINE)
- EnumPriorite (BASSE, MOYENNE, HAUTE)
- EnumStatutProjet (EN_COURS, TERMINE, EN_RETARD)
- EnumCategorieService
- EnumTypeClient
- EnumStatutFacture
- EnumStatutPaiement
- EnumMoyenPaiement
- EnumTypeNotification

#### 2. API dynamique
**Route:** `app/api/enums/[type]/route.ts`

Exemple requête:
```
GET /api/enums/priorites
```

Réponse:
```json
{
  "priorites": [
    { "cle": "BASSE", "label": "Basse" },
    { "cle": "MOYENNE", "label": "Moyenne" },
    { "cle": "HAUTE", "label": "Haute" }
  ]
}
```

#### 3. Hook React
**Fichier:** `lib/useEnums.ts`

```typescript
const { data, loading, error, refresh } = useEnums('priorites')
```

**Fonctionnalités:**
- Cache côté client (5 minutes)
- Gestion du loading
- Gestion des erreurs
- Fonction refresh()

#### 4. Composant Select
**Fichier:** `components/EnumSelect.tsx`

Usage:
```jsx
<EnumSelect 
  type="priorites"
  value={selectedPriorite}
  onChange={setPriorite}
  label="Priorité"
/>
```

### Initialisation des énumérations

**Script:** `scripts/seedEnums.js`

Crée les énumérations initiales en base de données:
```bash
node scripts/seedEnums.js
```

---

## Déploiement et configuration

### Prérequis

- Node.js 18+
- PostgreSQL (local ou cloud)
- Variables d'environnement configurées

### Variables d'environnement

Créer un fichier `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/task_manager"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_aleatoire_tres_long"

# Email (optionnel)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre_email@gmail.com"
SMTP_PASS="votre_mot_de_passe"
```

### Installation et démarrage

```bash
# Cloner le repo
git clone <repo>
cd task-manager

# Installer les dépendances
npm install

# Configurer la base de données
npx prisma migrate dev

# Initialiser les énumérations
node scripts/seedEnums.js

# Générer le client Prisma
npx prisma generate

# Lancer en développement
npm run dev

# Accéder à l'application
# http://localhost:3000
```

### Prisma Studio (Visualiser la DB)

```bash
npx prisma studio
# Ouvre http://localhost:5555
```

### Build de production

```bash
# Compiler le projet
npm run build

# Lancer en production
npm start
```

### Migration de base de données

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name <nom_migration>

# Appliquer les migrations
npx prisma migrate deploy
```

### Dépannage courant

**Erreur: Database connection failed**
- Vérifier DATABASE_URL
- Vérifier que PostgreSQL est actif
- Vérifier les identifiants

**Erreur: Prisma client not generated**
```bash
npx prisma generate
```

**Erreur: Migration not found**
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

**Application blanche au chargement**
```bash
# Redémarrer le serveur
npm run dev

# Vider le cache
rm -rf .next
npm run dev
```

---

## Diagramme d'architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                        Navigateur                           │
│  (Next.js Frontend - React Components)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Server                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ API Routes (/api/*)                                 │   │
│  │ - Authentication (NextAuth)                         │   │
│  │ - CRUD Operations (Projets, Tâches, etc.)          │   │
│  │ - Enums Dynamique                                   │   │
│  │ - Dashboard Stats                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pages & Layouts                                     │   │
│  │ - Server Components                                 │   │
│  │ - Client Components with Hooks                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Core Tables:                                         │  │
│  │ - utilisateurs, clients, services, projets, taches  │  │
│  │ - equipes, paiements, factures, notifications       │  │
│  │ - enum_* (énumérations)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Conclusion

Task Manager est une application complète et modulaire conçue pour gérer efficacement les projets et les tâches d'une entreprise de services. L'architecture en couches permet une maintenance facile et une scalabilité optimale.

Pour plus d'informations ou des modifications, consultez la documentation des composants individuels ou les fichiers de configuration.

**Dernière mise à jour:** Novembre 2025
**Version:** 1.0.0
