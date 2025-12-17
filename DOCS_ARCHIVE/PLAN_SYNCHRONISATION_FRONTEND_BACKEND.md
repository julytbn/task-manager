# 🔄 PLAN SYNCHRONISATION FRONTEND ↔ BACKEND

**Date:** Décembre 3, 2025  
**Status:** 🟡 COMMENCE  
**Version:** 1.0.0

---

## 📊 AUDIT ÉTAT ACTUEL

### ✅ Backend: Complètement Opérationnel

**Endpoints API Disponibles:**
```
✅ /api/clients              - CRUD Clients
✅ /api/projets              - CRUD Projets + Stats  
✅ /api/taches               - CRUD Tâches
✅ /api/factures             - CRUD Factures
✅ /api/paiements            - CRUD Paiements
✅ /api/abonnements          - CRUD Abonnements
✅ /api/equipes              - CRUD Équipes
✅ /api/utilisateurs         - CRUD Utilisateurs
✅ /api/services             - CRUD Services
✅ /api/enums/*              - 9 endpoints d'énumérations
✅ /api/dashboard/projets-stats - Statistiques temps réel
✅ /api/paiements/check-late - Détection paiements retards
```

### 🟡 Frontend: Partiellement Synchronisé

**État Pages:**

| Page | État | API Call | Données | Sync |
|------|------|----------|---------|------|
| `/clients` | ⚠️ Partiel | ✅ Fetch | Basique | 🔄 |
| `/projets` | ⚠️ Partiel | ✅ Fetch | Stats OK | 🔄 |
| `/taches` | ⚠️ Partiel | ✅ Fetch | Basique | 🔄 |
| `/factures` | ⚠️ Partiel | ✅ Fetch | Basique | 🔄 |
| `/paiements` | ❌ Mock Data | ❌ Fetch | Hardcodées | ❌ |
| `/abonnements` | ⚠️ Partiel | ✅ Fetch | Basique | 🔄 |
| `/equipes` | ⚠️ Partiel | ✅ Fetch | Basique | 🔄 |
| `/utilisateurs` | ✅ OK | ✅ Fetch | Complète | ✅ |
| `/dashboard` | ⚠️ Partiel | ✅ Stats | Partielle | 🔄 |

---

## 🎯 OBJECTIFS SYNCHRONISATION

### Phase 1: Audit Complet (MAINTENANT)
- [ ] Identifier toutes les pages frontend
- [ ] Vérifier l'état des appels API
- [ ] Lister les incohérences
- [ ] Documenter les formulaires

### Phase 2: Paiements & Factures (PRIORITÉ 1)
- [ ] Remplacer mock data par API réelle
- [ ] Synchroniser statuts avec base de données
- [ ] Implémenter filtres et tri
- [ ] Vérifier intégrité données

### Phase 3: Clients & Projets (PRIORITÉ 2)
- [ ] Compléter synchronisation données
- [ ] Implémenter recherche/filtres avancés
- [ ] Ajouter validations côté client
- [ ] Tests d'intégration

### Phase 4: Énumérations (PRIORITÉ 3)
- [ ] Utiliser API /api/enums/* partout
- [ ] Remplacer hardcoded values
- [ ] Valider types et contraintes
- [ ] Tester sélection dynamique

### Phase 5: Formulaires (PRIORITÉ 4)
- [ ] Auditer tous les formulaires
- [ ] Implémenter validations Zod
- [ ] Tester soumissions
- [ ] Implémenter erreurs globales

---

## 📋 AUDIT PAGES FRONTEND

### 1. CLIENT: `/app/clients/page.tsx`
**État:** ⚠️ Partiellement synchronisé
```
✅ Fetch: GET /api/clients
✅ Affichage: Liste avec filtres
⚠️ Manquant: CRUD via modals
⚠️ Manquant: Validation formulaires
📊 Données: Basiques (nom, prenom, email, type)
```

**Améliorations à faire:**
- [ ] Implémenter `NouveauClientModal` avec POST /api/clients
- [ ] Implémenter édition avec PUT /api/clients
- [ ] Implémenter suppression avec DELETE /api/clients
- [ ] Ajouter validations Zod
- [ ] Ajouter gestion erreurs robuste

---

### 2. PROJETS: `/app/projets/page.tsx`
**État:** ✅ Bien synchronisé
```
✅ Fetch: GET /api/projets + stats
✅ Affichage: Liste avec stats en temps réel
✅ Utilisé: useProjectsStatistics hook
✅ Données: Complètes (titre, client, budget, statut, etc)
✅ Énums: Statuts depuis BD
```

**À améliorer:**
- [ ] Implémenter filtres avancés
- [ ] Ajouter recherche par client
- [ ] Implémenter tri multiples
- [ ] Ajouter pagination si nécessaire

---

### 3. TÂCHES: `/app/taches/page.tsx`
**État:** ⚠️ Synchronisé avec des problèmes
```
✅ Fetch: GET /api/taches
✅ POST: Création via formulaire
⚠️ Problème: Données brutes sans structuration
⚠️ Manquant: Filtres par priorité/statut
📊 Données: Basiques
```

**À corriger:**
- [ ] Standardiser structure des données
- [ ] Implémenter enum priority/status depuis BD
- [ ] Ajouter filtres avancés
- [ ] Améliorer formulaire de création

---

### 4. FACTURES: `/app/factures/page.tsx`
**État:** ⚠️ Synchronisé
```
✅ Fetch: GET /api/factures
✅ Affichage: Liste des factures
⚠️ Manquant: Modification en ligne
⚠️ Manquant: Filtres statut
📊 Données: Complètes
```

**À implémenter:**
- [ ] Formulaire édition complete
- [ ] Filtres par statut (EN_ATTENTE, PAYEE, etc)
- [ ] Téléchargement PDF
- [ ] Statuts depuis énums BD

---

### 5. PAIEMENTS: `/app/paiements/page.tsx`
**État:** ❌ NON SYNCHRONISÉ - MOCK DATA
```
❌ Fetch: Pas d'appel API
❌ Données: Hardcodées (mockPaiements)
❌ Critique: À corriger en PRIORITÉ
⚠️ Manquant: Tout!
```

**À faire IMMÉDIATEMENT:**
- [ ] Remplacer mockPaiements par fetch(/api/paiements)
- [ ] Implémenter pagination/filtres
- [ ] Synchroniser statuts avec BD
- [ ] Vérifier intégrité données (factureId NOT NULL)

---

### 6. ABONNEMENTS: `/app/abonnements/page.tsx`
**État:** ⚠️ Partiellement synchronisé
```
✅ Fetch: Via AbonnementsList component
⚠️ Affichage: Basique
⚠️ Manquant: Édition en ligne
📊 Données: Complètes
```

**À améliorer:**
- [ ] Implémenter édition d'abonnement
- [ ] Ajouter renouvellement manuel de facture
- [ ] Afficher historique factures générées
- [ ] Ajouter filtres (actif/inactif)

---

### 7. ÉQUIPES: `/app/equipes/page.tsx`
**État:** ⚠️ Partiellement synchronisé
```
✅ Fetch: GET /api/equipes
⚠️ Affichage: Basique
⚠️ Manquant: CRUD complet
```

**À faire:**
- [ ] Synchroniser avec API POST/PUT/DELETE
- [ ] Implémenter gestion membres d'équipe
- [ ] Ajouter formulaire édition

---

### 8. UTILISATEURS: `/app/utilisateurs/page.tsx`
**État:** ✅ Bien synchronisé
```
✅ Fetch: GET /api/utilisateurs
✅ Affichage: Liste avec filtres
✅ Données: Complètes
```

**État idéal - pas de changement nécessaire**

---

### 9. DASHBOARD: `/app/dashboard/page.tsx`
**État:** ⚠️ Partiellement synchronisé
```
✅ Fetch: Stats en temps réel
⚠️ Affichage: À améliorer
⚠️ Manquant: Notifications paiements retards
```

**À ajouter:**
- [ ] Intégrer `LatePaymentAlerts` component
- [ ] Afficher alerts paiements retards
- [ ] Ajouter statistiques manquantes

---

## 🔧 COMPOSANTS À VÉRIFIER

### Formulaires
- [ ] `NouveauClientModal` - POST /api/clients
- [ ] `NouveauFactureModal` - POST /api/factures
- [ ] `NouveauPaiementModal` - POST /api/paiements
- [ ] `ProjectModal` - POST/PUT /api/projets
- [ ] `SubmitTaskForm` - POST /api/taches
- [ ] `EditFactureModal` - PUT /api/factures
- [ ] `PaiementEditModal` - PUT /api/paiements

### Modals
- [ ] Vérifier que tous utilisent fetch API
- [ ] Vérifier gestion erreurs
- [ ] Vérifier validations Zod
- [ ] Vérifier actualisation liste après action

### Composants Affichage
- [ ] `PaiementsTable` - Données depuis API
- [ ] `ClientsList` - Données depuis API
- [ ] `ProjectsList` - Données depuis API
- [ ] `FacturesList` - Données depuis API

---

## 🎨 PRIORITÉS DE TRAVAIL

### 🔴 URGENT (Bugs/Mock Data)
1. **Paiements:** Remplacer mock data par API réelle
2. **Vérifier intégrité:** Tous les statuts depuis énums BD
3. **Vérifier FK:** factureId NOT NULL dans paiements

### 🟠 IMPORTANT (Fonctionnalités incomplètes)
1. **Clients:** Implémenter créer/éditer/supprimer
2. **Factures:** Implémenter édition complète
3. **Abonnements:** Implémenter édition et renouvellement
4. **Équipes:** Implémenter CRUD complet

### 🟡 NORMAL (Améliorations)
1. **Filtres avancés:** Tous les modules
2. **Recherche:** Tous les modules
3. **Tri:** Tous les modules
4. **Pagination:** Modules avec beaucoup de données

### 🟢 SOUHAITABLE (Optimisations)
1. **Hooks réutilisables:** useFetch, useList, etc
2. **Cache:** React Query ou SWR
3. **Validations:** Zod + React Hook Form
4. **Erreurs globales:** Toast notifications

---

## ✅ CHECKLIST SYNCHRONISATION

### Avant de commencer
- [ ] Vérifier tous les endpoints API fonctionnent
- [ ] Vérifier schema Prisma cohérent
- [ ] Vérifier énums BD bien populés
- [ ] Vérifier intégrité FK dans BD

### Pour chaque page
- [ ] [ ] Vérifier fetch API est appelé
- [ ] [ ] Vérifier structure données cohérente
- [ ] [ ] Vérifier énums depuis BD (pas hardcodés)
- [ ] [ ] Vérifier CRUD complet si applicable
- [ ] [ ] Vérifier validations Zod
- [ ] [ ] Vérifier gestion erreurs
- [ ] [ ] Tester créer/éditer/supprimer
- [ ] [ ] Tester filtres/tri/recherche

### Tests finaux
- [ ] [ ] Tous les modules chargent correctement
- [ ] [ ] Pas de console errors
- [ ] [ ] Pas de données hardcodées
- [ ] [ ] Données cohérentes entre pages
- [ ] [ ] Statuts depuis énums BD
- [ ] [ ] ForeignKey intégrité vérifiée

---

## 📁 FICHIERS À CONSULTER

**Schema Base de Données:**
- `prisma/schema.prisma` - Structure des données

**Documentation Existante:**
- `SCHEMA_RELATIONS_GUIDE.md` - Guide des relations
- `VALIDATION_RELATIONS_SCHEMA.md` - Validation schema
- `DOCUMENTATION_TECHNIQUE.md` - API documentation
- `ENUM_SUMMARY.md` - Énumérations disponibles

**Code Frontend:**
- `app/*/page.tsx` - Pages principales
- `components/*/Modal.tsx` - Formulaires
- `lib/useEnums.ts` - Hook énumérations

**Code Backend:**
- `app/api/*/route.ts` - Endpoints API

---

## 🚀 PROCHAINES ÉTAPES

**Étape 1:** Corriger PAIEMENTS (remplacer mock data)  
**Étape 2:** Auditer et fixer CLIENTS, FACTURES, ABONNEMENTS  
**Étape 3:** Harmoniser énums partout (depuis BD, pas hardcodés)  
**Étape 4:** Ajouter validations Zod globales  
**Étape 5:** Tests intégration complets

---

## 📞 Questions Clés

1. **Paiements:** Sont-ils bien liés à factures (factureId NOT NULL)?
2. **Statuts:** Tous les statuts viennent-ils des énums BD?
3. **Énums:** Y a-t-il des hardcoded values à remplacer?
4. **Validations:** Zod est-il utilisé partout?
5. **Erreurs:** Gestion erreurs cohérente partout?

---

**Prêt à commencer la synchronisation! ✅**
