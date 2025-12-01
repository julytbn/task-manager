# 📖 Guide d'utilisation - Dashboard Employé

## 🎯 Accès au Dashboard

```
URL: /dashboard/employe
Autorisation: EMPLOYE, ADMIN
```

---

## 📌 Sections du Dashboard

### 1️⃣ Résumé de l'équipe (EmployeeTeamInfo)

#### Vue d'ensemble
Affiche le résumé rapide de l'équipe :
- **Nom de l'équipe** : ex. "Marketing Kekeli"
- **Description** : Objectifs et contexte
- **Chef d'équipe** : Nom du responsable

#### Statistiques
- 👥 **Membres** : Nombre total de membres
- 📁 **Projets** : Nombre de projets assignés
- 📊 **Tâches** : Total des tâches

#### Progression des tâches
- 🟢 **Terminées** : Nombre de tâches achevées
- 🔵 **En cours** : Tâches actuellement en travail
- ⚫ **À faire** : Tâches non commencées

#### Members Section
Affiche tous les membres de l'équipe avec :
- Initiales (dans un avatar)
- Nom complet
- Email
- Rôle dans l'équipe (optionnel)

**Exemple** :
```
JM: Julie Martin
    julie.martin@company.com
    Rôle: Manager

PA: Pierre Albert
    pierre.albert@company.com
    Rôle: Développeur
```

#### Projects et Tâches
Chaque projet est affichable/masquable (accordéon) :

**Fermé** :
```
▶ Projet "Refonte Site Web"
  [EN_COURS] - 75% - 3/4 tâches
```

**Ouvert** :
```
▼ Projet "Refonte Site Web"
  [EN_COURS] - 75% - 3/4 tâches
  
  • Créer les maquettes
    ✅ [TERMINE] [HAUTE] 📅 15/11/2025
  
  • Intégrer les styles CSS
    🕐 [EN_COURS] [HAUTE] 📅 20/11/2025
  
  • Tester responsive
    ⏳ [A_FAIRE] [MOYENNE] 📅 25/11/2025
  
  • Déploiement
    🟣 [EN_REVISION] [URGENTE] 📅 27/11/2025
```

---

### 2️⃣ Tâches par Projet (EmployeeProjectTasks)

#### Statistiques rapides
```
┌──────────┬───────────┬──────────┬──────────┐
│  TOTAL   │ TERMINÉES │ EN COURS │ EN RETARD│
│    12    │     4     │    5     │    2     │
└──────────┴───────────┴──────────┴──────────┘
```

#### Barre de filtrage
```
[🔍 Rechercher une tâche...] [Tous les projets ▼]
[Tous les statuts ▼] [Toutes priorités ▼]
```

**Options disponibles** :
- **Projets** : Tous les projets | Projet A | Projet B | ...
- **Statuts** : Tous | Terminée | En cours | En révision | À faire
- **Priorités** : Toutes | Urgente | Haute | Moyenne | Basse

#### Résultats des tâches
Chaque tâche affiche :
- ✅/🕐/⚠️ Icône de statut
- **Titre** en gras
- **Statut** (badge coloré)
- **Priorité** (badge coloré)
- Description (si disponible)
- **Projet** : lien vers le projet
- **Date d'échéance** : formatée en français

**Exemple d'affichage** :
```
✅ Créer les maquettes
   [TERMINE] [HAUTE] 📁 Refonte Site | 📅 15/11/2025
   
   Description: Créer les maquettes haute fidélité
   pour la page d'accueil et le catalogue produits

🕐 Intégrer les styles CSS
   [EN_COURS] [HAUTE] 📁 Refonte Site | 📅 20/11/2025

🟣 Déploiement en production
   [EN_REVISION] [URGENTE] 📁 Refonte Site | ⚠️ 27/11/2025 (RETARD!)
```

---

## 🎨 Guide des couleurs

### Statuts
```
🟢 TERMINE     : Tâche achevée
🔵 EN_COURS    : Tâche en cours de travail
🟣 EN_REVISION : En attente d'approbation
⚫ A_FAIRE     : Non commencée
```

### Priorités
```
🔴 URGENTE : À faire immédiatement
🟠 HAUTE   : Important, à faire en priorité
🟡 MOYENNE : Normal, dans le flux habituel
🔵 BASSE   : Peut être reporté
```

---

## 💡 Cas d'utilisation

### 📌 Scénario 1 : Vérifier mon travail du jour
1. Accéder à `/dashboard/employe`
2. Regarder la section **"Tâches par projet"**
3. Filtrer par **Statut = "EN_COURS"**
4. Voir les tâches assignées
5. Modifier les statuts si nécessaire

### 📌 Scénario 2 : Trouver une tâche urgente
1. Accéder à `/dashboard/employe`
2. Aller à **"Tâches par projet"**
3. Filtrer par **Priorité = "URGENTE"**
4. Voir les tâches urgentes
5. Agir rapidement

### 📌 Scénario 3 : Collaborer avec des collègues
1. Accéder à `/dashboard/employe`
2. Regarder la section **"Mon Équipe"**
3. Voir les collègues et leurs emails
4. Contacter directement si besoin

### 📌 Scénario 4 : Vérifier les tâches en retard
1. Accéder à `/dashboard/employe`
2. Aller à **"Tâches par projet"**
3. Filtrer par **Priorité = "URGENTE"** (s'affichent en rouge si en retard)
4. Voir les dates d'échéance dépassées
5. Rattraper ou réajuster les priorités

### 📌 Scénario 5 : Rechercher une tâche spécifique
1. Accéder à `/dashboard/employe`
2. Aller à **"Tâches par projet"**
3. Utiliser le **🔍 Champ de recherche**
4. Entrer le titre ou une partie de la description
5. Les résultats se filtrent en temps réel

---

## 🔍 Filtres détaillés

### 1. Recherche textuelle
```
Recherche : "maquettes"
Cherche dans : Titre + Description
Résultat : Affiche toutes les tâches contenant "maquettes"
```

### 2. Filtre par Projet
```
Sélection : "Projet A"
Résultat : Affiche uniquement les tâches du Projet A
```

### 3. Filtre par Statut
```
Statuts disponibles :
- Tous les statuts (par défaut)
- Terminée (tâches achevées)
- En cours (en travail)
- En révision (attente approbation)
- À faire (non commencées)
```

### 4. Filtre par Priorité
```
Priorités disponibles :
- Toutes les priorités (par défaut)
- Urgente (à faire immédiatement)
- Haute (important)
- Moyenne (normal)
- Basse (peut être reporté)
```

---

## 📊 Données affichées

### Pour chaque tâche
```json
{
  "titre": "Créer les maquettes",
  "description": "Maquettes haute fidélité pour page d'accueil",
  "statut": "TERMINE",
  "priorite": "HAUTE",
  "dateEcheance": "2025-11-15",
  "projet": "Refonte Site Web",
  "assigneA": "Julie Martin"
}
```

### Pour chaque projet
```json
{
  "titre": "Refonte Site Web",
  "description": "Complète refonte du site e-commerce",
  "statut": "EN_COURS",
  "tachesCount": 4,
  "progression": "75%",
  "taches": [...]
}
```

### Pour chaque membre
```json
{
  "nom": "Martin",
  "prenom": "Julie",
  "email": "julie.martin@company.com",
  "role": "Manager"
}
```

---

## ⚙️ Paramètres du système

### Statuts des tâches (Enum)
- `A_FAIRE` : À faire
- `EN_COURS` : En cours
- `EN_REVISION` : En révision
- `TERMINE` : Terminé
- `ANNULE` : Annulé

### Priorités (Enum)
- `BASSE` : Basse priorité
- `MOYENNE` : Priorité moyenne
- `HAUTE` : Haute priorité
- `URGENTE` : Urgente

---

## 🔗 Intégration avec d'autres sections

| Section | Relation |
|---------|----------|
| Mes Tâches | Affiche toutes les tâches assignées |
| Paiements | Affiche les paiements des tâches |
| Performance | Stats générales de productivité |
| Agenda | Dates d'échéance des tâches |

---

## 📞 Support

- **Question sur une tâche** → Contactez le chef d'équipe
- **Problème technique** → Contactez l'IT
- **Changement de priorité** → Demandez au manager du projet

---

**Version** : 1.0
**Dernière mise à jour** : 27 Novembre 2025
**Statut** : ✅ Actif
