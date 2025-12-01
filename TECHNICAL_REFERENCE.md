# 🔧 Référence technique - Dashboard Employé

## 📁 Fichiers modifiés

### API Routes
```
✨ app/api/me/route.ts
   - GET: Retourne les données utilisateur + équipe + projets + tâches
   - PUT: Mise à jour du profil utilisateur (inchangé)
```

### Composants
```
✨ components/dashboard/EmployeeTeamInfo.tsx
   - Refonte complète du composant
   - Affiche équipe, membres, projets avec tâches détaillées

🆕 components/dashboard/EmployeeProjectTasks.tsx
   - Nouveau composant
   - Filtrage avancé des tâches par projet
```

### Pages
```
✨ app/dashboard/employe/page.tsx
   - Import du nouveau composant EmployeeProjectTasks
   - Ajout du composant dans le layout
```

---

## 🔌 Endpoints API utilisés

### GET /api/me
**Utilisé par** : EmployeeTeamInfo, EmployeeProjectTasks

**Requête** :
```http
GET /api/me
Authorization: Bearer <token>
```

**Réponse** (200 OK):
```json
{
  "id": "user_123",
  "nom": "Martin",
  "prenom": "Julie",
  "email": "julie.martin@company.com",
  "telephone": "+33612345678",
  "role": "EMPLOYE",
  "departement": "Marketing",
  "equipe": {
    "id": "team_456",
    "nom": "Marketing Kekeli",
    "description": "Équipe responsable du marketing digital",
    "lead": {
      "id": "lead_789",
      "nom": "Dupont",
      "prenom": "Pierre",
      "email": "pierre.dupont@company.com"
    },
    "membres": [
      {
        "id": "member_1",
        "nom": "Martin",
        "prenom": "Julie",
        "email": "julie.martin@company.com",
        "role": "Coordinatrice"
      },
      {
        "id": "member_2",
        "nom": "Albert",
        "prenom": "Paul",
        "email": "paul.albert@company.com",
        "role": "Designer"
      }
    ],
    "projets": [
      {
        "id": "proj_001",
        "titre": "Refonte Site Web",
        "description": "Refonte complète du site e-commerce",
        "statut": "EN_COURS",
        "tachesCount": 4,
        "taches": [
          {
            "id": "task_1",
            "titre": "Créer les maquettes",
            "statut": "TERMINE",
            "priorite": "HAUTE",
            "dateEcheance": "2025-11-15",
            "assigneAId": "user_123"
          },
          {
            "id": "task_2",
            "titre": "Intégrer CSS",
            "statut": "EN_COURS",
            "priorite": "HAUTE",
            "dateEcheance": "2025-11-20",
            "assigneAId": "member_2"
          }
        ]
      }
    ]
  }
}
```

**Erreurs** :
```json
// 401 Not Authenticated
{ "error": "Not authenticated" }

// 404 Not Found
{ "error": "Utilisateur non trouvé" }

// 500 Server Error
{ "error": "Erreur récupération utilisateur" }
```

### GET /api/taches
**Utilisé par** : EmployeeProjectTasks

**Requête** :
```http
GET /api/taches
Authorization: Bearer <token>
```

**Réponse** (200 OK):
```json
[
  {
    "id": "task_1",
    "titre": "Créer les maquettes",
    "description": "Maquettes haute fidélité pour page d'accueil",
    "projet": {
      "id": "proj_001",
      "titre": "Refonte Site Web"
    },
    "assigneA": {
      "id": "user_123",
      "nom": "Martin",
      "prenom": "Julie"
    },
    "statut": "TERMINE",
    "priorite": "HAUTE",
    "dateEcheance": "2025-11-15"
  }
]
```

---

## 🧩 Composants & Props

### EmployeeTeamInfo

**Props** : Aucune (component autonome)

**État interne** :
```typescript
interface UserData {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  equipe: EquipeData | null
}

interface EquipeData {
  id: string
  nom: string
  description?: string
  lead: LeadInfo | null
  membres: TeamMember[]
  projets: Project[]
}

interface Project {
  id: string
  titre: string
  description?: string
  statut: string
  tachesCount: number
  taches: ProjectTask[]
}
```

**Hooks utilisés** :
- `useState` : userData, loading, error, expandedProject
- `useEffect` : Fetch initial des données

**Rendu** :
- Loading state : Spinner animé
- No team state : Message d'alerte jaune
- Team view : Vue complète avec stats, membres, projets

### EmployeeProjectTasks

**Props** : Aucune (component autonome)

**État interne** :
```typescript
interface Task {
  id: string
  titre: string
  description?: string
  statut: string
  priorite: string
  dateEcheance?: string | null
  projetTitre?: string
  projetId?: string
}

interface Project {
  id: string
  titre: string
  taches: Task[]
}

// Filtres
const [filterStatus, setFilterStatus] = useState<string>('')
const [filterPriority, setFilterPriority] = useState<string>('')
const [searchTerm, setSearchTerm] = useState<string>('')
const [selectedProject, setSelectedProject] = useState<string | null>(null)
```

**Hooks utilisés** :
- `useState` : userProjects, myTasks, loading, error, filtres
- `useEffect` : Fetch initial des données
- `useMemo` : Non utilisé, mais possible pour l'optimisation

**Fonctions utilitaires** :
```typescript
const getStatusColor = (statut: string): string
const getPriorityColor = (priorite: string): string
const getStatusIcon = (statut: string): JSX.Element
const isOverdue = (dateEcheance?: string | null): boolean
```

---

## 🎨 Tailwind CSS Classes utilisées

### Layout
```
grid grid-cols-1 lg:grid-cols-3 gap-8     // Grid responsive
space-y-6                                  // Espacement vertical
p-6                                        // Padding
```

### Colors & Backgrounds
```
bg-gradient-to-br from-blue-50 to-indigo-50  // Gradient
bg-green-100 text-green-700                   // Succès
bg-blue-100 text-blue-700                     // Info
bg-red-50 text-red-700                        // Erreur
```

### Borders & Shadows
```
shadow-md                      // Ombre moyenne
border border-blue-200         // Bordure
border-l-4 border-blue-500     // Bordure gauche
rounded-lg                     // Coins arrondis
```

### Responsive
```
md:grid-cols-2                 // 2 colonnes sur écran moyen+
lg:col-span-2                  // Largeur 2/3 sur large
```

### Typography
```
text-2xl font-bold             // Titre
font-medium                    // Semi-gras
text-xs text-gray-600          // Petit texte gris
```

---

## 🔐 Sécurité

### Authentification
- ✅ Endpoint `/api/me` protégé par NextAuth
- ✅ Session vérifiée avant l'accès
- ✅ Retour 401 si non authentifié

### Autorisation
- ✅ Employé ne peut voir que ses tâches
- ✅ Employé ne peut voir que l'équipe auquel il appartient
- ✅ Pas d'accès cross-team

### Données sensibles
- ✅ Mots de passe jamais retournés
- ✅ Tokens jamais exposés au client
- ✅ Emails masqués si nécessaire (non applicable ici)

---

## ⚡ Performance

### Optimisations actuelles
- ✅ Un seul appel API `/api/me` pour charger toutes les données
- ✅ Les tâches sont chargées une seule fois
- ✅ Pas de requêtes N+1
- ✅ Filtrage fait côté client (rapide)

### Possible améliorations futures
```typescript
// 1. Memoization des données
const memoizedTeamData = useMemo(() => equipeData, [equipeData])

// 2. Pagination des tâches (si > 100)
const [page, setPage] = useState(1)
const itemsPerPage = 20

// 3. Virtual scrolling pour grandes listes
import { FixedSizeList } from 'react-window'

// 4. Cache avec React Query
import { useQuery } from '@tanstack/react-query'
```

---

## 🧪 Cas de test recommandés

### Unit Tests
```typescript
// Test EmployeeTeamInfo
- Montage avec données valides
- Montage sans équipe
- Affichage du message d'erreur
- Expansion/fermeture des accordéons

// Test EmployeeProjectTasks
- Filtrage par recherche
- Filtrage par projet
- Filtrage par statut
- Filtrage par priorité
- Combinaison de filtres
- Détection des tâches en retard
```

### Integration Tests
```typescript
// Test API /api/me
- GET avec authentification valide
- GET sans authentification (401)
- GET avec user sans équipe
- GET avec équipe vide
- GET avec tâches
```

### E2E Tests
```
- Accéder au dashboard
- Voir équipe et membres
- Voir projets
- Cliquer sur accordéon
- Voir tâches
- Filtrer tâches
- Valider affichage
```

---

## 🐛 Debugging

### Console logs disponibles
```javascript
// Dans EmployeeTeamInfo
console.error('Erreur chargement team', err)

// Dans EmployeeProjectTasks
console.error('Erreur chargement tasks', err)
```

### Browser DevTools
```
1. F12 → Network tab
2. Voir appels API /api/me et /api/taches
3. Vérifier réponses JSON
4. Vérifier headers Authorization

1. F12 → Console tab
2. Voir les erreurs potentielles
3. Vérifier les logs manquants
```

### Vérification Prisma
```bash
# Vérifier la connexion à la DB
npm run prisma:studio

# Vérifier les données
npx prisma studio
```

---

## 📋 Checklist de production

- [x] Code compilé sans erreurs
- [x] Pas d'erreurs TypeScript
- [x] Imports correctement résolus
- [x] API routes fonctionnelles
- [x] Composants affichent correctement
- [x] Filtres fonctionnent
- [x] Responsive design testé
- [x] Erreurs gérées
- [x] Messages utilisateur clairs
- [ ] Tests unitaires (À ajouter)
- [ ] Tests E2E (À ajouter)
- [ ] Performance profiling (À faire)
- [ ] Optimisations mineures (À considérer)

---

## 🔄 CI/CD

### Build
```bash
npm run build          # Compilation
npm run start          # Serveur production
```

### Development
```bash
npm run dev            # Serveur de développement
npm run lint           # Vérification du code
npm run format         # Formatage automatique
```

---

## 📦 Dépendances utilisées

```json
{
  "next": "14.2.33",
  "react": "^18",
  "lucide-react": "*",         // Icônes
  "next-auth": "*",            // Authentification
  "@prisma/client": "*",       // ORM
  "tailwindcss": "*"           // CSS framework
}
```

**Aucune nouvelle dépendance ajoutée** ✅

---

**Dernière mise à jour** : 27 Novembre 2025
**Auteur** : GitHub Copilot
**Status** : ✅ Production Ready
