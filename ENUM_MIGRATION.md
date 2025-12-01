# Guide de Migration des Énumérations - Données depuis la Base de Données

## Vue d'ensemble

Toutes les énumérations du système (statuts, priorités, catégories, types) sont maintenant stockées dans la base de données, permettant une gestion flexible et centralisée.

## Architecture mise en place

### 1. Tables de base de données
- `enum_statuts_taches` - Statuts des tâches (À faire, En cours, En révision, Terminée, Annulée)
- `enum_priorites` - Priorités (Basse, Moyenne, Haute, Urgente)
- `enum_statuts_projets` - Statuts des projets
- `enum_categories_services` - Catégories de services
- `enum_types_clients` - Types de clients
- `enum_statuts_factures` - Statuts des factures
- `enum_statuts_paiements` - Statuts des paiements
- `enum_moyens_paiement` - Moyens de paiement
- `enum_types_notifications` - Types de notifications

### 2. API Endpoints
```
GET /api/enums/statuts-taches
GET /api/enums/priorites
GET /api/enums/statuts-projets
GET /api/enums/categories-services
GET /api/enums/types-clients
GET /api/enums/statuts-factures
GET /api/enums/statuts-paiements
GET /api/enums/moyens-paiement
GET /api/enums/types-notifications
```

### 3. Hooks et Composants

#### `useEnums` Hook
```typescript
import { useEnums } from '@/lib/useEnums'

const { data, loading, error } = useEnums('priorites')
// data: Array<{ id, cle, label, ordre, actif }>
// loading: boolean
// error: string | null
```

#### `EnumSelect` Component
```tsx
import { EnumSelect } from '@/components/EnumSelect'

<EnumSelect
  type="priorites"
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  label="Choisir une priorité"
  required
/>
```

## Fichiers déjà mis à jour

✅ `components/dashboard/SubmitTaskForm.tsx` - Utilise maintenant `useEnums` pour les priorités

## Composants à mettre à jour

### 🔴 Haute Priorité

1. **EmployeeProjectTasks.tsx** - Affiche les statuts et priorités hardcodées dans les filtres et sélections
   - Ligne: Options de select statut (208-211)
   - Ligne: Options de select priorité (221-224)

2. **NouvelleTacheModal.tsx** - Modal de création de tâche avec statuts/priorités hardcodés
   - À remplacer par composants utilisant `useEnums`

3. **TaskDetailsModal.tsx** - Affichage et édition des détails de tâche

### 🟡 Priorité Moyenne

4. **PaiementEditModal.tsx** - Édition des paiements avec statuts hardcodés

5. **PaiementsTable.tsx** - Tableau de paiements avec filtres statut

6. **DashboardAgenda.tsx** - Agenda avec statuts de tâches

7. **EmployeePayments.tsx** - Paiements avec filtres

### 🟢 Priorité Basse

8. **manager-dashboard.tsx** - Dashboard gestionnaire

9. **Tous les composants utilisant les hardcoded strings** dans les conditions

## Pattern de Migration

### Avant (Hardcoded)
```tsx
<select>
  <option>Haute</option>
  <option>Moyenne</option>
  <option>Basse</option>
  <option>Urgente</option>
</select>
```

### Après (Depuis la BD)
```tsx
import { EnumSelect } from '@/components/EnumSelect'

<EnumSelect
  type="priorites"
  value={form.priorite}
  onChange={(value) => setForm({ ...form, priorite: value })}
  label="Priorité"
  required
/>
```

## Utilisation dans les conditions

### Avant
```tsx
if (t.statut?.toUpperCase().includes('TERMINE')) {
  // ...
}
```

### Après (Recommandé avec cache)
```typescript
import { fetchEnumsOnce, getLabelFromCle } from '@/lib/useEnums'

// Dans un useEffect côté client
const statutsTaches = await fetchEnumsOnce('statuts-taches')
const terminedStatus = statutsTaches.find(s => s.cle === 'TERMINE')

if (t.statut === terminedStatus?.cle) {
  // ...
}
```

## Étapes de migration pour chaque composant

1. **Importer les hooks/composants**
   ```typescript
   import { useEnums } from '@/lib/useEnums'
   import { EnumSelect } from '@/components/EnumSelect'
   ```

2. **Pour les selects - Remplacer par EnumSelect**
   ```tsx
   <EnumSelect
     type="priorites"
     value={form.priorite}
     onChange={(v) => setForm({...form, priorite: v})}
   />
   ```

3. **Pour les conditions - Utiliser les clés de l'énumération**
   ```tsx
   if (task.statut === 'TERMINE') {
     // utiliser la clé, pas le label
   }
   ```

4. **Pour les affichages - Récupérer le label de la BD**
   ```tsx
   const label = getLabelFromCle(enums, clé)
   ```

## Scripts d'aide

### Initialiser les énumérations
```bash
node scripts/seedEnums.js
```

### Régénérer le client Prisma
```bash
npx prisma generate
```

## Notes importantes

- Les clés d'énumération (cle) restent en MAJUSCULES_AVEC_UNDERSCORES dans le code
- Les labels (label) sont en français lisible pour l'utilisateur
- Toutes les requêtes API utilisent le cache dans `useEnums`
- Pour les requêtes côté serveur, utiliser `prisma.enumStatutTache.findMany()`

## Points de données côté serveur

```typescript
// Dans les API routes (route.ts)
const priorites = await prisma.enumPriorite.findMany({
  where: { actif: true },
  orderBy: { ordre: 'asc' }
})
```

## Vérification

Pour vérifier que tout fonctionne:
```bash
# 1. Vérifier les énumérations en BD
npx prisma studio

# 2. Tester l'endpoint API
curl http://localhost:3000/api/enums/priorites

# 3. Vérifier les composants mis à jour
# Utiliser SubmitTaskForm.tsx comme référence
```

## FAQ

**Q: Pourquoi les clés restent en majuscules?**
A: Pour maintenir la compatibilité avec Prisma enums et éviter les migrations inutiles.

**Q: Comment ajouter une nouvelle énumération?**
A: 
1. Ajouter une table `EnumXXX` dans schema.prisma
2. Créer une migration `npx prisma migrate dev`
3. Ajouter les données dans seedEnums.js
4. Exécuter `node scripts/seedEnums.js`
5. Le hook `useEnums` reconnaîtra automatiquement la nouvelle clé

**Q: Puis-je modifier les énumérations via l'interface?**
A: Actuellement non. Il faut passer par la base de données directement ou créer un panel admin.
