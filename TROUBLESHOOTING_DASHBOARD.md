# 🔧 Guide de Dépannage - Dashboard Employé

## ❌ Le dashboard ne s'affiche pas

### 1️⃣ Vérifier l'authentification

**Étapes** :
```
1. Allez sur http://localhost:3001/dashboard/employe
2. Si vous êtes redirigé vers /connexion → Vous n'êtes pas authentifié
3. Connectez-vous avec les identifiants corrects
4. Vérifiez que votre rôle est EMPLOYE (pas ADMIN ou autre)
```

### 2️⃣ Vérifier les erreurs en console (DevTools)

```
1. F12 → Console tab
2. Regardez les erreurs rouges
3. Notez le message d'erreur complet
```

**Erreurs courantes** :
```
❌ "Cannot read property 'equipe' of undefined"
   → L'API /api/me ne retourne pas de données
   
❌ "fetch failed"
   → Le serveur API ne répond pas
   
❌ "404 /api/me"
   → La route API n'existe pas
```

### 3️⃣ Vérifier l'API /api/me

**Via DevTools** :
```
1. F12 → Network tab
2. Recharger la page
3. Chercher l'appel "me" ou "api/me"
4. Cliquer dessus
5. Voir la réponse (Response tab)
```

**Via Terminal** :
```powershell
# Testé directement (risqué car pas d'authentification)
Invoke-WebRequest -Uri "http://localhost:3001/api/me"

# Résultat attendu: 401 Not authenticated (normal)
```

**Via Postman/Insomnia** :
```
1. Ouvrir Postman
2. GET http://localhost:3001/api/me
3. Aller à Cookies et importer les cookies de la session
4. Envoyer la requête
5. Vérifier la réponse
```

### 4️⃣ Vérifier les données en base de données

```bash
# Ouvrir Prisma Studio
npx prisma studio

# Vérifier:
# 1. Utilisateurs: créé avec un compte EMPLOYE
# 2. Equipes: créée
# 3. MembreEquipe: l'utilisateur est associé à une équipe
# 4. Projets: au moins un projet dans l'équipe
# 5. Taches: au moins une tâche dans un projet
```

---

## 🚨 Erreurs spécifiques et solutions

### ❌ "Vous n'appartenez à aucune équipe"

**Cause** : L'utilisateur n'a pas d'équipe assignée

**Solution** :
```sql
-- 1. Vérifier via Prisma Studio
SELECT * FROM membres_equipes WHERE utilisateurId = 'YOUR_USER_ID';

-- 2. Si vide, créer une association
-- Via l'interface d'admin, assigner l'utilisateur à une équipe

-- 3. Ou via script SQL (au besoin)
INSERT INTO membres_equipes (id, equipeId, utilisateurId, role)
VALUES (cuid(), 'TEAM_ID', 'USER_ID', 'Employé');
```

### ❌ "Aucun projet assigné"

**Cause** : L'équipe n'a pas de projet

**Solution** :
```
1. Allez sur http://localhost:3001/dashboard/manager/equipes
2. Cliquez sur l'équipe
3. Assignez des projets à l'équipe
```

### ❌ "Aucune tâche trouvée"

**Cause** : Les projets de l'équipe n'ont pas de tâches

**Solution** :
```
1. Allez sur http://localhost:3001/dashboard/employe/mes-taches
2. Ou allez à http://localhost:3001/taches
3. Créez des tâches
4. Assignez les projets de votre équipe
```

### ❌ Erreur "Dynamic server usage"

**Cause** : Problème de configuration Next.js

**Solution** :
```
1. Redémarrer le serveur: Ctrl+C puis npm run dev
2. Effacer le cache: rm -r .next
3. Rebâtir: npm run build
```

### ❌ Composants n'affichent rien (page blanche)

**Cause** : Erreur de chargement silencieuse

**Solution** :
```
1. F12 → Console
2. Vérifier les erreurs (même sans message visible)
3. Vérifier Network → chercher les appels API
4. Vérifier que les appels retournent 200 OK
```

---

## 🔍 Checklist de diagnostic

### ✅ Authentification
- [ ] Je suis connecté (pas de redirection vers /connexion)
- [ ] Mon compte existe dans la base de données
- [ ] Mon rôle est EMPLOYE
- [ ] La session est valide (cookie nextauth.session-token présent)

### ✅ Données en base
- [ ] Une équipe existe (SELECT * FROM equipes)
- [ ] Je suis membre de l'équipe (SELECT * FROM membres_equipes WHERE utilisateurId = ?)
- [ ] L'équipe a au moins 1 projet (SELECT * FROM projets WHERE equipeId = ?)
- [ ] Le projet a au moins 1 tâche (SELECT * FROM taches WHERE projetId = ?)

### ✅ API fonctionnelle
- [ ] GET /api/me retourne 200 OK (avec authentification)
- [ ] La réponse contient le champ "equipe"
- [ ] L'équipe a "membres" (array non vide)
- [ ] L'équipe a "projets" (array non vide)
- [ ] Chaque projet a "taches" (array)

### ✅ Composants React
- [ ] EmployeeTeamInfo affiche le titre de l'équipe
- [ ] Les statistiques s'affichent (Membres, Projets, Tâches)
- [ ] Les accordéons des projets fonctionnent (cliquer = expand/collapse)
- [ ] EmployeeProjectTasks affiche les tâches filtrées
- [ ] Les filtres marchent (recherche, projet, statut, priorité)

### ✅ Erreurs JavaScript
- [ ] F12 → Console tab: Aucune erreur rouge
- [ ] F12 → Console tab: Les console.log affichent les données
- [ ] F12 → Network tab: Les appels API retournent 200

---

## 🧪 Script de test complet

```bash
# 1. Vérifier que le serveur tourne
curl http://localhost:3001

# 2. Tester l'endpoint /api/me (en ligne de commande, sans auth -> 401)
curl http://localhost:3001/api/me

# 3. Via le navigateur:
# - F12
# - Console
# - Taper: fetch('/api/me').then(r => r.json()).then(console.log)
# - Voir la réponse
```

---

## 📋 Structure de données requise

Pour que le dashboard fonctionne, la base de données doit avoir:

```
utilisateurs
└─ id: user_123
   nom: "Martin"
   prenom: "Julie"
   email: "julie@company.com"
   role: "EMPLOYE"
   
   ↓ (via MembreEquipe)
   
   equipes
   └─ id: team_456
      nom: "Marketing"
      description: "Équipe marketing"
      leadId: lead_789 (optionnel)
      
      ├─ membres_equipes
      │  ├─ utilisateur: user_123 (vous)
      │  └─ role: "Coordinatrice"
      │
      ├─ projets
      │  └─ id: proj_001
      │     titre: "Site Web"
      │     description: "Refonte du site"
      │     
      │     └─ taches
      │        ├─ id: task_1
      │        │  titre: "Maquettes"
      │        │  statut: "TERMINE"
      │        │  priorite: "HAUTE"
      │        │  assigneAId: user_123
      │        │
      │        └─ id: task_2
      │           titre: "Intégration CSS"
      │           statut: "EN_COURS"
      │           priorite: "HAUTE"
      │           assigneAId: someone_else
      │
      └─ lead (optionnel)
         └─ utilisateur avec rôle MANAGER ou ADMIN
```

---

## 🔧 Solutions rapides

### Page blanche
```bash
# 1. Redémarrer le serveur
npm run dev

# 2. Forcer le rechargement
Ctrl+Shift+R (vider le cache du navigateur)

# 3. Si ça persiste
rm -r .next node_modules
npm install
npm run dev
```

### API retourne 500
```bash
# 1. Vérifier les logs du serveur (stdout du terminal)
# 2. Vérifier la connexion à la base de données
# 3. Vérifier la syntaxe Prisma

# Diagnostiquer Prisma
npx prisma validate

# Regénérer le client Prisma
npx prisma generate
```

### Données ne se chargent pas
```bash
# 1. Vérifier la base de données
npx prisma studio

# 2. Créer des données de test
node scripts/seed.js

# 3. Vérifier avec console.log
# Ajouter dans EmployeeTeamInfo.tsx:
console.log('userData fetched:', userData)
```

---

## 📞 Informations utiles

### Fichiers importants
- `app/api/me/route.ts` - Endpoint API
- `components/dashboard/EmployeeTeamInfo.tsx` - Composant équipe
- `components/dashboard/EmployeeProjectTasks.tsx` - Composant tâches
- `app/dashboard/employe/page.tsx` - Page du dashboard
- `prisma/schema.prisma` - Schéma de la base de données

### Ports
- Development: http://localhost:3001 (si 3000 occupé)
- Prisma Studio: http://localhost:5555 (si `npx prisma studio`)

### Commandes utiles
```bash
npm run dev              # Démarrer le serveur
npm run build            # Compiler la production
npm run prisma:studio    # Ouvrir Prisma Studio
npx prisma migrate dev  # Migrer la base de données
npx prisma validate    # Valider le schéma
```

---

**Version** : 1.0
**Date** : 27 Novembre 2025
**Statut** : 🚀 À utiliser si le dashboard ne fonctionne pas
