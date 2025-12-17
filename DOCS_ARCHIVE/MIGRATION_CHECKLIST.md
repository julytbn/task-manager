# Checklist - Migration Complète des Énumérations

## Phase 1: Infra (✅ COMPLÈTE)
- [x] Tables de BD créées (9 tables d'énumérations)
- [x] Migration Prisma appliquée
- [x] Données initiales insérées (seedEnums.js)
- [x] API endpoints créés (/api/enums/[type])
- [x] Hooks React créés (useEnums)
- [x] Composant réutilisable créé (EnumSelect)

## Phase 2: Documentation (✅ COMPLÈTE)
- [x] ENUM_MIGRATION.md - Guide technique complet
- [x] ENUM_SUMMARY.md - Résumé des changements
- [x] QUICK_START_ENUMS.md - Guide pour développeurs
- [x] Fichier serverEnums.ts pour requêtes côté serveur

## Phase 3: Composants à Migrer (🔄 EN COURS)

### Groupe 1: Formss & Modals (6 composants)
- [ ] `EmployeeProjectTasks.tsx` - Selectss statuts/priorités (ligne 208-224)
- [ ] `NouvelleTacheModal.tsx` - Modal création tâche
- [ ] `TaskDetailsModal.tsx` - Détails tâche éditable
- [ ] `PaiementEditModal.tsx` - Édition paiements
- [ ] `PaiementsTable.tsx` - Tableau paiements
- [ ] `DashboardAgenda.tsx` - Agenda avec statuts

### Groupe 2: Composants Dashboard (4 composants)
- [ ] `EmployeePayments.tsx` - Filtres paiements
- [ ] `manager-dashboard.tsx` - Dashboard gestionnaire
- [ ] `EmployeeCalendar.tsx` - Calendrier employé
- [ ] `DashboardTasks.tsx` - Tâches dashboard

### Groupe 3: Comparaisons Hardcodées (Multi-fichiers)
- [ ] Remplacer les `.includes('TERMINE')` par comparaison avec enum
- [ ] Remplacer les `.includes('EN_COURS')` par comparaison avec enum
- [ ] Remplacer les `.includes('HAUTE')` par comparaison avec enum
- [ ] Mettre à jour tous les fichiers utilisant hardcoded enums

## Phase 4: Tests (🔄 EN COURS)
- [ ] Tester `/api/enums/priorites` - OK ✓
- [ ] Tester `/api/enums/statuts-taches` - OK ✓
- [ ] Tester `/api/enums/statuts-projets`
- [ ] Tester `/api/enums/categories-services`
- [ ] Tester SubmitTaskForm.tsx - OK ✓
- [ ] Tester chaque composant migré

## Phase 5: Validation en Production (⏳ À FAIRE)
- [ ] Build sans erreurs
- [ ] Vérifier que toutes les énumérations s'affichent
- [ ] Tester les filtres
- [ ] Tester la création d'entités (tâches, paiements, etc.)
- [ ] Vérifier les performances (cache OK?)

## Exemple de Migration

### Template pour migrer un composant:

```typescript
// AVANT
const priorites = ['Haute', 'Moyenne', 'Basse', 'Urgente']
<select>
  {priorites.map(p => <option key={p} value={p}>{p}</option>)}
</select>

// APRÈS
import { EnumSelect } from '@/components/EnumSelect'

<EnumSelect
  type="priorites"
  value={selectedPriority}
  onChange={setPriority}
  label="Priorité"
/>
```

## Commandes Utiles

```bash
# Vérifier les données en BD
npx prisma studio

# Régénérer le client Prisma
npx prisma generate

# Réinitialiser les énumérations
node scripts/seedEnums.js

# Builder et tester
npm run build
npm run dev

# Tester une API
curl http://localhost:3000/api/enums/priorites
```

## Checklist pour Chaque Migration

Pour chaque composant à migrer:
- [ ] Identifier tous les selects avec enums hardcodés
- [ ] Importer `EnumSelect` ou `useEnums`
- [ ] Remplacer les hardcoded values par l'API
- [ ] Remplacer les `.includes()` comparaisons
- [ ] Tester le composant dans le navigateur
- [ ] Vérifier que le formulaire fonctionne
- [ ] Vérifier que l'affichage est correct
- [ ] Commit avec message: "chore: migrate [ComponentName] to use database enums"

## Points d'Attention

⚠️ **IMPORTANT**:
1. Utiliser TOUJOURS la `clé` dans le code (pas le `label`)
2. Les labels sont pour l'affichage utilisateur uniquement
3. Le cache de `useEnums` s'initialise une fois - rien à faire
4. Pour côté serveur, utiliser `lib/serverEnums.ts`

⚠️ **À ÉVITER**:
```typescript
// ❌ NE PAS FAIRE
if (task.statut === 'Terminée') { }  // Comparaison sur label
if (s.includes('TERMINE')) { }       // String includes

// ✅ FAIRE
if (task.statut === 'TERMINE') { }   // Comparaison sur clé
```

## Statut de Complétion

```
Infra ████████████████████ 100%
Documentation ████████████████████ 100%
Migrations: [SubmitTaskForm.tsx] ████░░░░░░░░░░░░░░░░ 12%

Global: ███████░░░░░░░░░░░░░░░░ 32%
```

## Prochaines Étapes (Priorité)

1. **Haute** - Migrer EmployeeProjectTasks.tsx (interface principale)
2. **Haute** - Migrer NouvelleTacheModal.tsx (création tâches)
3. **Moyenne** - Migrer tous les `.includes()` par comparaisons propres
4. **Moyenne** - Migrer les modals de paiements
5. **Basse** - Nettoyer le code restant

## Contact/Questions

Pour les questions ou blocages:
1. Consulter `QUICK_START_ENUMS.md`
2. Regarder l'exemple: `SubmitTaskForm.tsx`
3. Consulter `ENUM_MIGRATION.md` pour tech details

---

**Fait le**: 27 Novembre 2025
**État**: ✅ Infra complète, documentation prête, 1 composant migré, 8 en attente
