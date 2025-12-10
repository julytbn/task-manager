# 🧪 GUIDE DE TEST - Statut TERMINE sur Dashboard Employé

## 🎯 Objectif
Vérifier que quand un manager valide une tâche, l'employé voit **automatiquement** le changement de statut en **TERMINE** sur son dashboard.

---

## 📋 Prérequis

- ✅ Serveur de développement en cours d'exécution (`npm run dev`)
- ✅ 2 comptes:
  - 1 compte **MANAGER** (pour valider les tâches)
  - 1 compte **EMPLOYE** (pour soumettre et voir les tâches)
- ✅ Un projet créé
- ✅ 2 onglets navigateur ouverts (Manager + Employé)

---

## 🚀 Étapes du Test

### ÉTAPE 1: Préparer les Comptes

#### Compte MANAGER
```
URL: http://localhost:3000/kanban
Role: MANAGER
Rester sur cette page
```

#### Compte EMPLOYE
```
URL: http://localhost:3000/dashboard/employe/mes-taches
Role: EMPLOYE
Ouvrir DevTools (F12) → Console
```

---

### ÉTAPE 2: Employé Soumet une Tâche

**Dans le navigateur EMPLOYE:**

1. Cliquer sur le menu (si nécessaire) → "Soumettre une tâche"
2. Remplir:
   - **Titre**: `TEST_STATUT_TERMINE`
   - **Projet**: Sélectionner un projet
   - **Description**: `Tâche de test pour vérifier le changement de statut`
   - **Priorité**: MOYENNE
   - **Statut**: SOUMISE (par défaut)
3. Cliquer "Soumettre"
4. Vérifier que la tâche apparaît dans "Mes Tâches" avec le statut **SOUMISE**

**Console attendue**:
```
📌 Changement détecté: TEST_STATUT_TERMINE - undefined → SOUMISE
(ou similaire lors du premier chargement)
```

---

### ÉTAPE 3: Manager Valide la Tâche

**Dans le navigateur MANAGER (Kanban):**

1. Actualiser la page (F5) si nécessaire
2. La tâche `TEST_STATUT_TERMINE` devrait apparaître dans la colonne "Soumises"
3. **Cliquer sur la tâche** → Une modal s'ouvre
4. Dans la modal:
   - Ajouter un commentaire (optionnel): `Test de validation`
   - Cliquer sur **"✓ Valider"** (bouton vert)
5. Confirmer si demandé
6. La modal devrait se fermer

**Vérifier**: La tâche disparaît de la colonne "Soumises"

---

### ÉTAPE 4: Vérifier le Changement chez l'Employé

**Dans le navigateur EMPLOYE (Dashboard):**

#### Attendre 5 Secondes
```
Temps: 0s - Manager a validé
Temps: 5s - Polling se déclenche
```

#### Vérifier Visuellement
L'une des deux choses devrait se produire:

**Option A - Animation Visible (dépend du timing)**
```
✅ La tâche TEST_STATUT_TERMINE:
   - Fond changé en VERT (bg-green-50)
   - Animation "pulse" visible
   - Statut passe de SOUMISE → TERMINE
   - Badge "✓ Mis à jour" visible à côté du statut
   - Animation dure ~3 secondes
```

**Option B - Changement Direct (si polling a passé 3s)**
```
✅ La tâche TEST_STATUT_TERMINE:
   - Statut affiche TERMINE
   - Pas d'animation (déjà passée)
   - Stats: "Terminées" augmenté de 1
```

---

## 🔍 Vérifications Détaillées

### Vérification 1: Changement de Statut

**Avant**:
```
Tâche: TEST_STATUT_TERMINE
Statut: SOUMISE
```

**Après** (5-8 secondes):
```
Tâche: TEST_STATUT_TERMINE
Statut: TERMINE
```

✅ **Succès**: Le statut a changé

---

### Vérification 2: Feedback Visuel

**Vérifier que la tâche affiche une surbrillance verte:**
```
<tr class="bg-green-50 animate-pulse">
  <!-- Tâche avec animation pulse -->
</tr>
```

✅ **Succès**: Surbrillance verte visible

---

### Vérification 3: Badge de Mise à Jour

**Vérifier la présence du badge:**
```
Statut: [TERMINE badge] ✓ Mis à jour
```

✅ **Succès**: Badge visible pendant ~3 secondes

---

### Vérification 4: Logs de Console

**Dans la console DevTools (EMPLOYE), vous devriez voir:**
```
📌 Changement détecté: TEST_STATUT_TERMINE - SOUMISE → TERMINE
```

✅ **Succès**: Log de changement visible

---

### Vérification 5: Stats Mises à Jour

**Avant**: Terminées: X  
**Après**: Terminées: X+1

✅ **Succès**: Compteur augmenté

---

## 🐛 Dépannage

### Problème: La tâche ne change pas

**Cause possible**: Le polling n'a pas pris les dernières données

**Solution**:
```
1. Attendre 10 secondes (2 cycles de polling)
2. Actualiser manuellement: F5
3. Vérifier que le manager a bien cliqué "Valider"
4. Vérifier dans DevTools que le changement est en BDD
```

---

### Problème: Pas de logs en console

**Cause possible**: Console minimisée ou erreur

**Solution**:
```
1. Ouvrir DevTools: F12
2. Aller à l'onglet "Console"
3. Chercher les logs commençant par "📌"
4. S'il n'y a pas de logs, rafraîchir: F5
```

---

### Problème: Animation n'apparaît pas

**Cause possible**: Polling a passé les 3 secondes avant de recharger

**Solution**:
```
1. C'est normal si le changement apparaît sans animation
2. Répéter le test et vérifier plus rapidement
3. Ou réduire le délai de polling (5000 → 3000 ms)
```

---

### Problème: Les stats ne changent pas

**Cause possible**: Le filtre masque la tâche

**Solution**:
```
1. Réinitialiser tous les filtres
2. Vérifier que le statut TERMINE n'est pas filtré
3. Vérifier que le projet de la tâche n'est pas filtré
```

---

## 📊 Résultats Attendus

### ✅ Succès Complet
```
Manager valide tâche
       ↓ (0-5s)
Employé attend polling
       ↓ (5s)
Changement détecté
       ↓ (5-8s)
Animation + Badge visibles
       ↓ (8s+)
Statut reste TERMINE
       ↓
Stats mises à jour
```

### ⚠️ Succès Partiel
```
Changement de statut visible ✅
Mais pas d'animation         ❌ (OK si >3s après validation)
Ou pas de badge              ❌ (OK si >3s après validation)
```

### ❌ Échec
```
Le statut reste SOUMISE      ❌
Console montre des erreurs   ❌
Stats ne changent pas        ❌
Pas de changement après 15s  ❌
```

---

## 📝 Cas de Test Supplémentaires

### Test 2: Tâche Rejetée
```
1. Soumettre une tâche
2. Manager clique "Rejeter" (ANNULE)
3. Vérifier que le statut passe à ANNULE
4. Vérifier l'animation verte
```

### Test 3: Plusieurs Tâches
```
1. Soumettre 3 tâches
2. Valider la 1ère et la 3ème
3. Vérifier que seulement celles-ci sont mises à jour
```

### Test 4: Polling Continu
```
1. Laisser le dashboard ouvert 30 secondes
2. Valider une tâche du manager
3. Vérifier la mise à jour automatique
```

---

## 🎬 Enregistrement du Test

Pour documenter le succès:

```bash
# 1. Prendre une capture avant
screenshot_avant_validation.png

# 2. Valider la tâche

# 3. Prendre une capture après (5-8s)
screenshot_apres_validation.png

# 4. Prendre une capture finale (8s+)
screenshot_final_statut.png
```

---

## ✅ Checklist de Validation

- [ ] Tâche soumise par employé
- [ ] Statut = SOUMISE
- [ ] Tâche visible chez manager
- [ ] Manager valide
- [ ] Attendre 5 secondes
- [ ] Changement détecté chez employé
- [ ] Fond vert visible (si <3s)
- [ ] Badge "✓ Mis à jour" visible (si <3s)
- [ ] Statut = TERMINE
- [ ] Stats "Terminées" augmenté
- [ ] Pas d'erreurs en console

---

## 📞 Résultats

Après avoir complété le test, vérifiez:

✅ Tous les éléments de la checklist cochés = **Succès Complet**
⚠️ Changement de statut mais pas d'animation = **Succès Partiel** (OK)
❌ Statut ne change pas = **Problème** (à debugger)

---

**Date Test**: [Date]  
**Status**: [À compléter]  
**Notes**: [Vos observations]

---

*Bon test! 🚀*
