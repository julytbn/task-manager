# 🔧 GUIDE DE DÉBOGAGE - TÂCHES SOUMISES

**Date:** 8 Décembre 2025

---

## ✅ CE QUI A ÉTÉ FAIT

1. ✅ Ajout de logs de debug dans `/app/api/taches/route.ts`
2. ✅ Ajout de logs de debug dans `/app/kanban/page.tsx`
3. ✅ Diagnostic complet créé dans `DIAGNOSTIC_TACHES_SOUMISES.md`

---

## 🚀 ÉTAPES DE DÉBOGAGE

### ÉTAPE 1: Démarrer l'Application

```bash
npm run dev
```

Attendez que le serveur soit prêt (affiche: "▲ Ready in X ms")

---

### ÉTAPE 2: Soumettre une Tâche

1. **Ouvrir deux navigateurs (ou deux onglets):**
   - Onglet 1: Connecté en tant qu'employé
   - Onglet 2: Connecté en tant que manager

2. **En tant qu'employé (Onglet 1):**
   - Aller sur Dashboard → Soumettre une Tâche
   - Remplir le formulaire:
     ```
     Titre: TEST_TACHE_SOUMISE
     Projet: [Sélectionner un projet]
     Description: Test pour déboguer les tâches soumises
     Priorité: HAUTE
     Date d'échéance: [Demain ou plus tard]
     Heures estimées: 8
     Montant: 1000 FCFA
     Facturable: OUI
     [NE PAS ASSIGNER À QUELQU'UN]
     ```
   - Cliquer sur "Soumettre"

3. **Vérifier les logs (console du serveur):**
   ```
   Vous devriez voir:
   📝 [Soumission] Tâche créée: TEST_TACHE_SOUMISE
   📝 [Soumission] Statut: SOUMISE
   ```

---

### ÉTAPE 3: Vérifier en BDD

Ouvrir une autre terminal et lancer:

```bash
# Si PostgreSQL est en local:
psql -U postgres -d task_manager -c "SELECT id, titre, statut, \"assigneAId\" FROM taches WHERE titre LIKE '%TEST_TACHE_SOUMISE%' ORDER BY \"dateCreation\" DESC LIMIT 1;"

# Ou utiliser Prisma Studio:
npx prisma studio
# → Naviguer vers "Tache"
# → Chercher "TEST_TACHE_SOUMISE"
# → Vérifier que:
#   - statut = "SOUMISE" ✓
#   - assigneAId = NULL ✓
```

**Résultat attendu:**
```
 id                  | titre                | statut  | assigneAId
 cmix7jfvr0000...   | TEST_TACHE_SOUMISE   | SOUMISE | null
```

---

### ÉTAPE 4: Vérifier le GET /api/taches (Manager)

1. **En tant que manager (Onglet 2):**
   - Ouvrir DevTools (F12)
   - Aller sur l'onglet "Network"
   - Aller sur page Kanban: `/kanban`

2. **Vérifier la requête:**
   - Chercher la requête `GET /api/taches`
   - Cliquer dessus
   - Onglet "Response" → Chercher "TEST_TACHE_SOUMISE"

3. **Vérifier les logs serveur:**
   ```
   Vous devriez voir:
   📋 [GET /api/taches] User role: MANAGER
   📋 [GET /api/taches] Filtre MANAGER/ADMIN - Returning ALL tasks
   📋 [GET /api/taches] Total tasks returned: X
   📋 [GET /api/taches] Task statuses: ..., TEST_TACHE_SOUMISE(SOUMISE), ...
   ```

**Si vous ne voyez PAS la tâche SOUMISE:**
- ❌ Problème dans le GET /api/taches
- → Aller à [SOLUTION #1](#solution-1-problème-dans-le-get)

**Si vous VOYEZ la tâche SOUMISE:**
- ✅ Le GET fonctionne
- → Continuer à ÉTAPE 5

---

### ÉTAPE 5: Vérifier le Kanban (Frontend)

1. **Toujours en tant que manager:**
   - Ouvrir la Console (F12 → Console)
   - Aller/Rafraîchir la page Kanban

2. **Vérifier les logs:**
   ```
   Vous devriez voir:
   📊 [Kanban] Tâches récupérées: X
   📊 [Kanban] Raw statuts: ..., TEST_TACHE_SOUMISE(SOUMISE), ...
   📊 [Kanban] Tâches mappées: ..., TEST_TACHE_SOUMISE(submitted), ...
   📊 [Kanban] Tasks with SOUMISE status: 1
   ```

**Si vous voyez le log:**
- ✅ La tâche est bien mappée en 'submitted'
- → Aller à [ÉTAPE 6](#étape-6-vérifier-laffichage)

**Si vous NE voyez pas le log ou le compte est 0:**
- ❌ Problème dans le mapping ou le filtre Kanban
- → Aller à [SOLUTION #2](#solution-2-problème-dans-le-kanban-frontend)

---

### ÉTAPE 6: Vérifier l'Affichage

1. **En tant que manager:**
   - Vérifier que la page Kanban affiche:
     - Stat "Soumises": compte doit être au moins 1 ✅
     - Onglet "Tâches soumises": la tâche doit apparaître ✅

2. **Vérifier les stats:**
   - Chercher le badge "Soumises" en haut
   - Le nombre doit être > 0

3. **Vérifier l'onglet:**
   - Cliquer sur le bouton "Tâches soumises"
   - "TEST_TACHE_SOUMISE" devrait apparaître dans la table

**Si elle apparaît:**
- ✅ **LE PROBLÈME EST RÉSOLU** 🎉
- → Continuer à [ÉTAPE 7](#étape-7-tester-la-validation)

**Si elle n'apparaît pas:**
- ❌ Problème dans l'affichage/filtre
- → Aller à [SOLUTION #3](#solution-3-problème-daffichage)

---

### ÉTAPE 7: Tester la Validation

1. **En tant que manager:**
   - Cliquer sur la tâche "TEST_TACHE_SOUMISE"
   - Une modal devrait s'ouvrir

2. **Dans la modal:**
   - Vérifier que vous pouvez:
     - Voir tous les détails ✓
     - Ajouter un commentaire ✓
     - Cliquer sur "Valider" ✓
     - Cliquer sur "Rejeter" ✓

3. **Tester la validation:**
   - Cliquer sur "Valider"
   - Ajouter commentaire: "Test de validation"
   - Cliquer "Confirmer"

4. **Vérifier:**
   - Modal devrait se fermer ✓
   - Tâche devrait disparaître de "Tâches soumises" ✓
   - Tâche devrait apparaître dans la liste correcte ✓

---

## 🐛 SOLUTIONS AUX PROBLÈMES

### SOLUTION #1: Problème dans le GET

**Symptôme:** La tâche SOUMISE n'apparaît pas dans la réponse du GET

**Debug:**
1. Vérifier les logs serveur
2. Copier l'ID de la tâche depuis la console
3. Appeler manuellement:
   ```bash
   curl http://localhost:3000/api/taches | grep "TEST_TACHE_SOUMISE"
   ```

**Causes possibles:**
- [ ] La tâche n'a pas été créée (vérifier en BDD)
- [ ] Le filtre GET supprime la tâche SOUMISE
- [ ] La session n'est pas chargée correctement
- [ ] Le rôle du manager n'est pas correct

**Fix:**
- Vérifier que le statut en BDD est exactement "SOUMISE" (pas "soumise" ou autre)
- Vérifier que le session.user.role est "MANAGER"
- Ajouter plus de logs pour débogguer

---

### SOLUTION #2: Problème dans le Kanban Frontend

**Symptôme:** La tâche apparaît dans le GET mais pas dans les logs Kanban

**Debug:**
1. Vérifier que le fetch retourne bien la tâche
2. Ajouter des logs dans mapStatus():
   ```typescript
   const mapStatus = (statut?: string): TaskStatus => {
     console.log('📊 [mapStatus] Input:', statut)
     switch (statut) {
       case 'A_FAIRE': return 'todo'
       case 'EN_COURS': return 'in_progress'
       case 'EN_REVISION': return 'review'
       case 'SOUMISE': 
         console.log('📊 [mapStatus] SOUMISE → submitted')
         return 'submitted'
       case 'TERMINE': return 'done'
       default: 
         console.log('📊 [mapStatus] Default case for:', statut)
         return 'todo'
     }
   }
   ```

**Causes possibles:**
- [ ] Le statut en BDD n'est pas exactement "SOUMISE"
- [ ] Le mapping n'est pas correct
- [ ] La réponse du fetch est vide

**Fix:**
- Vérifier le statut exact en BDD (case-sensitive!)
- Vérifier que mapStatus retourne bien 'submitted'

---

### SOLUTION #3: Problème d'Affichage

**Symptôme:** Les logs disent que la tâche est mappée, mais elle n'apparaît pas à l'écran

**Debug:**
1. Ajouter logs dans le filtre:
   ```typescript
   if (activeTab === 'tâches soumises') {
     console.log('📊 [Filter] Filtering for submitted tasks')
     result = result.filter(t => {
       console.log(`📊 [Filter] Task: ${t.title}, Status: ${t.status}, Match: ${t.status === 'submitted'}`)
       return t.status === 'submitted'
     })
     console.log('📊 [Filter] Result after filter:', result.length)
   }
   ```

2. Vérifier la comparaison:
   - activeTab doit être exactement "tâches soumises" (minuscules!)
   - t.status doit être exactement "submitted"

**Causes possibles:**
- [ ] activeTab n'est pas "tâches soumises"
- [ ] t.status n'est pas "submitted"
- [ ] Erreur d'orthographe ou d'espace
- [ ] Casse incorrecte

**Fix:**
- Vérifier la casse exacte
- Vérifier que les espaces sont corrects
- Ajouter des logs pour valider les valeurs

---

## 📋 CHECKLIST DE DÉBOGAGE

- [ ] Tâche créée en statut SOUMISE
- [ ] Tâche stockée en BDD (SELECT)
- [ ] GET /api/taches retourne la tâche
- [ ] Manager connecté en tant que MANAGER
- [ ] Kanban reçoit la tâche dans le JSON
- [ ] mapStatus mappe SOUMISE → submitted
- [ ] filteredTasks filtre correctement
- [ ] Tâche affichée à l'écran
- [ ] Manager peut cliquer sur la tâche
- [ ] Modal de validation s'ouvre
- [ ] Manager peut valider/rejeter

---

## 🎯 RÉSUMÉ DU FLUX

```
1. Employé soumet tâche
   ↓ [VÉRIFIER: Logs "Soumission"]
2. Tâche créée avec statut SOUMISE
   ↓ [VÉRIFIER: En BDD]
3. GET /api/taches retourne la tâche
   ↓ [VÉRIFIER: DevTools Network / Logs serveur]
4. Kanban reçoit et mappe la tâche
   ↓ [VÉRIFIER: Logs console]
5. Tâche affichée dans Kanban
   ↓ [VÉRIFIER: Visuel]
6. Manager peut valider/rejeter
   ↓ [VÉRIFIER: Modal + Changement de statut]
```

---

## 💡 TIPS DE DEBUG

### Pour voir tous les logs:
```bash
# Dans la console du serveur, activez verbose logging:
# Ajouter au début de route.ts:
process.env.DEBUG = 'task-manager:*'
```

### Pour tester rapidement:
```bash
# Terminal: créer une tâche en statut SOUMISE
curl -X POST http://localhost:3000/api/taches \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "TEST_QUICK",
    "statut": "SOUMISE",
    "priorite": "HAUTE",
    "projet": "PROJECT_ID_HERE",
    "montant": 1000
  }'
```

### Pour surveiller en temps réel:
```bash
# Terminal 1: npm run dev (serveur)
# Terminal 2: npm run dev (hot reload)
# Terminal 3: Vérifier BDD
#   → npx prisma studio
```

---

## 📞 SI VOUS ÊTES BLOQUÉ

1. Vérifiez les 3 logs principaux:
   - ✅ Logs serveur (GET /api/taches)
   - ✅ Logs console (Kanban)
   - ✅ Données en BDD (Prisma Studio)

2. Posez-vous:
   - Où la tâche est-elle perdue?
   - Quelle étape échoue?

3. Activez les logs de toutes les fonctions critiques

---

**Document de débogage complet** 🔧

