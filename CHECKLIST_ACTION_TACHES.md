# ⚡ CHECKLIST ACTION - TÂCHES SOUMISES

**Date:** 8 Décembre 2025

---

## 📋 RÉSUMÉ RAPIDE

**Problème:** Les tâches soumises par l'employé n'apparaissent pas au manager sur le Kanban

**Statut:** Logs de debug ajoutés ✅

**Actions à faire:** Suivre le guide de debug

---

## 🎯 PLAN D'ACTION IMMÉDIAT

### Phase 1: Démarrage (5 min)
- [ ] Ouvrir terminal
- [ ] Exécuter: `npm run dev`
- [ ] Ouvrir 2 navigateurs: 1 employé, 1 manager

### Phase 2: Test (10 min)
- [ ] Employé: Soumettre une tâche "TEST_SOUMISE"
  - Titre: `TEST_SOUMISE`
  - Projet: Sélectionner
  - Priorité: HAUTE
  - PAS d'assigné
  - Cliquer "Soumettre"

### Phase 3: Debug Backend (5 min)
- [ ] Regarder console serveur:
  ```
  Chercher: 📋 [GET /api/taches] Task statuses: ...
  Doit inclure: TEST_SOUMISE(SOUMISE)
  ```
- [ ] Si visible → Backend OK ✓
- [ ] Si absent → Problème API ❌

### Phase 4: Debug Frontend (5 min)
- [ ] Manager: Ouvrir F12 → Console
- [ ] Manager: Aller/Rafraîchir sur `/kanban`
- [ ] Chercher logs:
  ```
  📊 [Kanban] Tasks with SOUMISE status: 1
  ```
- [ ] Si visible → Frontend OK ✓
- [ ] Si 0 ou absent → Problème Kanban ❌

### Phase 5: Vérifier BDD (3 min)
- [ ] Ouvrir terminal: `npx prisma studio`
- [ ] Aller à "Tache"
- [ ] Chercher "TEST_SOUMISE"
- [ ] Vérifier: statut = `SOUMISE` et assigneAId = `null`

### Phase 6: Identifier le Problème (2 min)
Selon vos résultats:

**Cas A - Backend n'a pas la tâche:**
- [ ] Problème dans POST /api/taches
- [ ] Aller à DIAGNOSTIC → Solution #1

**Cas B - Backend OK, Frontend pas de logs:**
- [ ] Problème dans fetch Kanban
- [ ] Aller à DIAGNOSTIC → Solution #2

**Cas C - Logs indiquent 0 tâches SOUMISE:**
- [ ] Problème dans mapStatus() ou filtre
- [ ] Aller à DIAGNOSTIC → Solution #2

**Cas D - Tout OK mais tâche pas visible:**
- [ ] Problème d'affichage/CSS
- [ ] Aller à DIAGNOSTIC → Solution #3

---

## 🔍 COMMANDES DE DEBUG RAPIDES

```bash
# Terminal 1: Démarrer le serveur
npm run dev

# Terminal 2: Ouvrir Prisma Studio (voir la BDD)
npx prisma studio

# Terminal 3: Checker une tâche spécifique
curl http://localhost:3000/api/taches | grep "TEST_SOUMISE"
```

---

## 📊 POINTS DE CONTRÔLE

```
[ Étape 1 ] Employé soumet tâche
    ↓ (Chercher logs: "Soumission" ou "Tâche créée")
[ Étape 2 ] Tâche en BDD avec statut SOUMISE
    ↓ (Vérifier: Prisma Studio ou SELECT)
[ Étape 3 ] GET /api/taches retourne la tâche
    ↓ (Vérifier logs: 📋 [GET /api/taches])
[ Étape 4 ] Kanban reçoit la tâche
    ↓ (Vérifier: DevTools Network, réponse JSON)
[ Étape 5 ] Kanban mappe SOUMISE → submitted
    ↓ (Vérifier logs: 📊 [Kanban] Tâches mappées)
[ Étape 6 ] Tâche filtrée correctement
    ↓ (Vérifier logs: 📊 [Kanban] Tasks with SOUMISE status)
[ Étape 7 ] Tâche affichée à l'écran
    ↓ (Vérifier: Onglet "Tâches soumises")
[ Étape 8 ] Manager peut cliquer et valider
    ↓ (Tester: Cliquer sur tâche, modal s'ouvre)
```

---

## 📁 FICHIERS CLÉS À CONSULTER

**Pour comprendre le problème:**
1. `RESUME_PROBLEME_TACHES_SOUMISES.md` ← Lisez ça d'abord

**Pour débogguer pas à pas:**
2. `GUIDE_DEBUG_TACHES_SOUMISES.md` ← Suivez ces étapes

**Pour l'analyse technique complète:**
3. `DIAGNOSTIC_TACHES_SOUMISES.md` ← Solutions techniques

**Code à vérifier:**
- `app/api/taches/route.ts` (ligne 9-35)
- `app/kanban/page.tsx` (ligne 73-98)
- `components/dashboard/SubmitTaskForm.tsx` (ligne 53-75)

---

## ✅ SUCCÈS CRITÈRES

La tâche SOUMISE est considérée comme "corrigée" si:

- [ ] Employé soumet une tâche
- [ ] Tâche a le statut `SOUMISE` en BDD
- [ ] Manager voit la tâche dans l'onglet "Tâches soumises"
- [ ] Manager peut cliquer sur la tâche
- [ ] Modal s'ouvre avec détails
- [ ] Manager peut ajouter un commentaire
- [ ] Manager peut cliquer "Valider" ou "Rejeter"
- [ ] Après validation, la tâche change de statut/disparaît

---

## 🚨 PROBLÈMES COURANTS

| Problème | Cause | Solution |
|----------|-------|----------|
| Tâche pas visible en BDD | Formulaire pas soumis | Chercher logs POST |
| GET retourne 0 tâches | Problème filtre | Chercher logs GET |
| Logs montrent tâche mais pas à l'écran | Filtre Kanban | Chercher logs mapStatus |
| Affichage vide | CSS ou données vides | Vérifier DevTools |
| Manager voit tâches assignées seules | Filtre incorrect | Vérifier WHERE clause |

---

## 💡 TIPS

1. **Les logs sont vos amis:**
   - Console serveur: `npm run dev`
   - DevTools browser: F12 → Console
   - Prisma Studio: `npx prisma studio`

2. **Testez avec des noms uniques:**
   - TEST_SOUMISE_001
   - TEST_SOUMISE_002
   - etc.

3. **Nettoyez avant de retester:**
   - Supprimer les anciennes tâches de test
   - Rafraîchir la page (F5 ou Ctrl+R)
   - Vider le cache (Ctrl+Shift+Delete)

4. **Testez les deux cas:**
   - Employé voit-il ses tâches assignées?
   - Manager voit-il TOUTES les tâches?

---

## 🎯 TIMELINE

| Temps | Action |
|------|--------|
| 0-5 min | Démarrage + test création |
| 5-10 min | Debug backend |
| 10-15 min | Debug frontend |
| 15-18 min | Vérifier BDD |
| 18-20 min | Identifier problème |
| 20-30 min | Appliquer fix |
| 30+ min | Re-tester complet |

---

## 📞 BESOIN D'AIDE?

**Si vous êtes bloqué à une étape, allez chercher dans:**

1. **DIAGNOSTIC_TACHES_SOUMISES.md** → Trouvez votre cas
2. **GUIDE_DEBUG_TACHES_SOUMISES.md** → Suivez les étapes
3. **Console serveur/browser** → Vérifiez les logs
4. **BDD Prisma Studio** → Vérifiez les données

---

## ✨ PROCHAINES ÉTAPES APRÈS FIX

1. Tester cycle complet: Soumettre → Valider → Voir changement
2. Tester tous les statuts: SOUMISE, EN_COURS, EN_REVISION, TERMINE
3. Tester permissions: Employé ≠ Manager ≠ Admin
4. Ajouter des tests unitaires
5. Déployer en production

---

**Créé:** 8 Décembre 2025  
**Status:** 🟡 Prêt pour debug

