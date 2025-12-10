# 🛣️ ROADMAP - PROCHAINES ÉTAPES

**Date:** 9 décembre 2025  
**Phase:** 2/3 - Frontend Synchronization

---

## 📍 OÙ NOUS EN SOMMES

```
Phase 1: Backend ✅ COMPLÉTÉ
  ├─ Schema Prisma ✅
  ├─ Migration BD ✅
  ├─ Données test ✅
  └─ Tests ✅

Phase 2: Frontend ⏳ EN COURS
  ├─ Types TypeScript (À faire)
  ├─ NouveauProjetModal (À faire)
  ├─ ProjetDetails (À faire)
  └─ Routes API (À faire)

Phase 3: Production ⏳ À PLANIFIER
  ├─ Tests complets
  ├─ Code review
  ├─ Déploiement staging
  ├─ Formation équipe
  └─ Production
```

---

## 🎯 TIMELINE RECOMMANDÉE

### **Semaine 1 (Jour 1-2)**

#### Jour 1: Préparation
**Temps: 4 heures**

```bash
# Tâches
[ ] 1. Lire: GUIDE_FRONTEND_IMPLEMENTATION.md (1h)
[ ] 2. Lire: IMPLEMENTATION_AUDIT_COMPLET.md - requêtes (1h)
[ ] 3. Exécuter: test-projet-service.js (0.5h)
[ ] 4. Revoir: DIAGRAMMES_VISUELS_ARCHITECTURE.md (0.5h)
[ ] 5. Planifier implémentation avec l'équipe (1h)
```

#### Jour 2: Types & API
**Temps: 6 heures**

```bash
# Tâches Backend
[ ] 1. Créer/modifier interface ProjetService (0.5h)
  └─ Voir exemple dans GUIDE_FRONTEND_IMPLEMENTATION.md
  
[ ] 2. Modifier POST /api/projets (1.5h)
  └─ Accepter serviceIds[]
  └─ Créer ProjetServices
  └─ Calculer montantTotal
  └─ Code complet dans IMPLEMENTATION_AUDIT_COMPLET.md
  
[ ] 3. Modifier GET /api/projets/[id] (1h)
  └─ Inclure projetServices
  └─ Inclure client, factures
  
[ ] 4. Tester avec Postman/curl (1.5h)
  └─ Créer projet avec 3 services
  └─ Vérifier montantTotal
  └─ Récupérer projet
  
[ ] 5. Code review interne (0.5h)

# Tâches Frontend
[ ] 6. Mettre à jour types TypeScript (1h)
  └─ Ajouter ProjetService interface
  └─ Modifier CreateProjetInput
```

### **Semaine 1 (Jour 3-4)**

#### Jour 3: Frontend Priorité 1
**Temps: 6 heures**

```bash
# NouveauProjetModal - Multi-sélection services
[ ] 1. Planifier UI (0.5h)
  └─ Voir mockup dans DIAGRAMMES_VISUELS_ARCHITECTURE.md
  
[ ] 2. Implémenter multi-sélection (2h)
  └─ Créer composant ServiceSelect (multiple)
  └─ Afficher services sélectionnés
  └─ Afficher total en temps réel
  
[ ] 3. Intégrer avec API (1.5h)
  └─ Tester création projet
  └─ Vérifier API appelle correctement
  
[ ] 4. Tests unitaires (1.5h)
  └─ Mock API
  └─ Vérifier multi-sélection
  └─ Vérifier affichage total
  
[ ] 5. Code review (0.5h)
```

#### Jour 4: Frontend Priorité 1 (suite)
**Temps: 6 heures**

```bash
# ProjetDetails - Afficher N services + montantTotal
[ ] 1. Modifier layout (1h)
  └─ Ajouter section "Services du projet"
  └─ Voir exemple dans GUIDE_FRONTEND_IMPLEMENTATION.md
  
[ ] 2. Afficher services (1.5h)
  └─ Boucle sur projetServices[]
  └─ Afficher: nom, categorie, montant
  └─ Trier par ordre
  
[ ] 3. Afficher montantTotal (1h)
  └─ Box prominent avec total
  └─ Voir mockup DIAGRAMMES_VISUELS_ARCHITECTURE.md
  
[ ] 4. Tests (1.5h)
  └─ Mock API
  └─ Vérifier affichage services
  └─ Vérifier montantTotal calculé
  
[ ] 5. Code review (0.5h)
```

### **Semaine 2 (Jour 5-6)**

#### Jour 5: Frontend Priorité 2
**Temps: 4 heures**

```bash
# NouveauFactureModal - Services du projet
[ ] 1. Ajouter affichage services (1.5h)
  └─ Quand projet sélectionné
  └─ Afficher services du projet
  └─ Voir code dans GUIDE_FRONTEND_IMPLEMENTATION.md
  
[ ] 2. Calculer montant facture (1h)
  └─ Peut être 50%, 100% ou autre
  └─ Afficher suggestion basée montantTotal
  
[ ] 3. Tests (1h)
  └─ Sélectionner projet
  └─ Vérifier services affichés
  
[ ] 4. Code review (0.5h)
```

#### Jour 6: Tests Complets
**Temps: 6 heures**

```bash
# Tests Intégration
[ ] 1. Workflow complet (2h)
  ├─ Créer projet avec services
  ├─ Afficher projet + services
  ├─ Créer facture
  ├─ Créer paiement
  └─ Vérifier tout correct
  
[ ] 2. Tests E2E (2h)
  └─ Cypress ou Playwright
  └─ Enregistrer workflow complet
  
[ ] 3. Tests de charge (0.5h)
  └─ Vérifier perf avec 10 services
  
[ ] 4. Code review final (1h)
  └─ Tous les PRs mergés
  └─ Documentation mise à jour
  
[ ] 5. Préparation staging (0.5h)
```

---

## ✅ CHECKLIST IMPLÉMENTATION DÉTAILLÉE

### Types TypeScript

**Fichier: `types/projet.ts` (À créer)**

```typescript
// ✅ Ajouter ces types

export interface ProjetService {
  id: string;
  projetId: string;
  serviceId: string;
  montant?: number;
  ordre: number;
  dateAjout: string;
  service?: Service;
}

export interface Projet {
  // Existants
  id: string;
  titre: string;
  clientId: string;
  budget?: number;
  
  // Nouveaux
  projetServices: ProjetService[];  // ← NOUVEAU
  montantTotal?: number;             // ← NOUVEAU
  
  // À supprimer
  // serviceId: string;  ← SUPPRIMÉ
  // montantEstime?: number;  ← SUPPRIMÉ
}

export interface CreateProjetInput {
  titre: string;
  clientId: string;
  serviceIds: string[];    // ← NOUVEAU (array)
  budget?: number;
}
```

### Routes API

**Fichier: `app/api/projets/route.ts` (À modifier)**

```typescript
// ✅ Modifier POST (voir GUIDE_FRONTEND_IMPLEMENTATION.md)

export async function POST(req: Request) {
  const { titre, clientId, serviceIds = [], budget } = await req.json();
  
  // Validation
  if (!serviceIds.length) {
    return Response.json({ error: "Au moins un service requis" }, { status: 400 });
  }
  
  // Créer projet
  // Créer ProjetServices
  // Calculer montantTotal
  // ← Code complet dans IMPLEMENTATION_AUDIT_COMPLET.md
}
```

**Fichier: `app/api/projets/[id]/route.ts` (À modifier)**

```typescript
// ✅ Modifier GET (voir IMPLEMENTATION_AUDIT_COMPLET.md)

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Include: projetServices avec service
  // Include: client
  // Include: factures
  // Include: taches
}
```

### Composants React

**Fichier: `components/NouveauProjetModal.tsx` (À modifier)**

```typescript
// ✅ Remplacer sélection service unique par multi

// AVANT:
// <FormField name="serviceId" render={() => <ServiceSelect single />} />

// APRÈS:
// <FormField name="serviceIds" render={() => <ServiceSelect multiple />} />
// Afficher services sélectionnés + total
```

**Fichier: `components/ProjetDetails.tsx` (À créer/modifier)**

```typescript
// ✅ Ajouter affichage services + montantTotal

// Boucle sur projet.projetServices[]
// Afficher montantTotal en évidence
// Voir code complet dans GUIDE_FRONTEND_IMPLEMENTATION.md
```

---

## 🧪 TESTS À IMPLÉMENTER

### Tests Unitaires React

```bash
npm run test -- NouveauProjetModal.test.tsx
npm run test -- ProjetDetails.test.tsx
```

**Cas de test:**
- [ ] Multi-sélection services fonctionne
- [ ] Total affiché correctement
- [ ] API appelée avec serviceIds[]
- [ ] Erreur si 0 service sélectionné
- [ ] ProjetDetails affiche services
- [ ] ProjetDetails affiche montantTotal

### Tests Intégration API

```bash
npm run test:integration -- api/projets.test.ts
```

**Cas de test:**
- [ ] POST /api/projets crée projet + services
- [ ] GET /api/projets/[id] inclut services
- [ ] montantTotal calculé correct
- [ ] Pas de doublon serviceId

### Tests E2E

```bash
npm run test:e2e
```

**Scenario:**
1. Créer projet "Audit" avec 3 services
2. Voir projet avec services affichés
3. Vérifier montantTotal = 550k
4. Créer facture pour ce projet
5. Vérifier services dans facture

---

## 📊 TÂCHES & RESPONSABILITÉS

| Tâche | Durée | Responsable | Statut |
|---|---|---|---|
| Types TypeScript | 1h | Frontend lead | ⏳ |
| API POST /projets | 1.5h | Backend lead | ⏳ |
| API GET /projets/[id] | 1h | Backend lead | ⏳ |
| NouveauProjetModal | 3h | Frontend dev 1 | ⏳ |
| ProjetDetails | 2h | Frontend dev 1 | ⏳ |
| NouveauFactureModal | 1.5h | Frontend dev 2 | ⏳ |
| Tests unitaires | 3h | QA/Dev | ⏳ |
| Tests E2E | 2h | QA | ⏳ |
| Code review | 2h | Tech leads | ⏳ |
| **TOTAL** | **~17h** | | |

---

## 📚 RESSOURCES

| Besoin | Ressource |
|---|---|
| Code TypeScript | `GUIDE_FRONTEND_IMPLEMENTATION.md` |
| Code Prisma | `IMPLEMENTATION_AUDIT_COMPLET.md` |
| Code React | `GUIDE_FRONTEND_IMPLEMENTATION.md` |
| Diagrammes | `DIAGRAMMES_VISUELS_ARCHITECTURE.md` |
| Tests | `test-projet-service.js` (pattern) |
| Overview | `RAPPORT_FINAL_IMPLEMENTATION.md` |

---

## 🚀 GO LIVE CHECKLIST

**Avant production:**

```
[ ] Tous les types TypeScript mis à jour
[ ] API POST /projets fonctionne
[ ] API GET /projets/[id] inclut services
[ ] NouveauProjetModal multi-sélection
[ ] ProjetDetails affiche services + montantTotal
[ ] Tests unitaires passants
[ ] Tests intégration passants
[ ] Tests E2E passants
[ ] Code review approuvée
[ ] Staging déployé
[ ] Équipe formée
[ ] Rollout plan ready
[ ] Production déployée
```

---

## 💡 TIPS & TRUCS

1. **Commencez petit:** Types → API → UI
2. **Testez au fur et à mesure:** Pas de surprise à la fin
3. **Utilisez les exemples:** Copier-coller > écrire from scratch
4. **Documentez:** Chaque commit explique le pourquoi
5. **Code review:** 2 paires d'yeux = moins de bugs

---

## ⚠️ PIÈGES À ÉVITER

❌ Oublier `onDelete: Cascade` pour ProjetService  
❌ Calculer montantTotal manuellement au lieu de SUM()  
❌ Oublier serviceIds[] dans le form  
❌ Supprimer serviceId sans migration  
❌ Afficher 1 service au lieu de tous  

---

## 🎯 KPI DE SUCCÈS

✅ Créer projet avec 5 services en < 1 minute  
✅ montantTotal correct (pas d'erreur)  
✅ Facture générée automatiquement pour le montant  
✅ Tests: > 90% coverage  
✅ Perf: < 200ms pour afficher projet  
✅ Zéro bug en staging  

---

**Créé le:** 9 décembre 2025  
**Prochaine review:** Fin de l'implémentation  
**Questions?** Consultez la documentation spécifique
