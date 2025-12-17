# Guide Rapide - Utiliser les Énumérations depuis la Base de Données

## Situation Actuelle
✅ Tous les statuts, priorités, et énumérations sont maintenant stockés dans la base de données.
✅ Des APIs sont disponibles pour récupérer ces données.
✅ Un hook React `useEnums()` centralise l'accès côté client.

## Qui Dois-je Utiliser?

### Pour un SELECT/DROPDOWN dans un Formulaire
```tsx
import { EnumSelect } from '@/components/EnumSelect'

<EnumSelect
  type="priorites"  // ou "statuts-taches", "categories-services", etc.
  value={selectedValue}
  onChange={(newValue) => setSelectedValue(newValue)}
  label="Choisir une priorité"  // optionnel
  required={true}
/>
```

### Pour Accéder aux Données Manuelle ment
```tsx
'use client'
import { useEnums } from '@/lib/useEnums'

export function MyComponent() {
  const { data: priorites, loading, error } = useEnums('priorites')
  
  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>
  
  return (
    <ul>
      {priorites.map(p => (
        <li key={p.id}>{p.label} ({p.cle})</li>
      ))}
    </ul>
  )
}
```

### Pour les Conditions/Comparaisons
```tsx
// Utiliser TOUJOURS la clé (pas le label!)
if (task.statut === 'TERMINE') {
  // C'est bon
}

// MAUVAIS:
if (task.statut === 'Terminée') {
  // ❌ Ne pas faire ça!
}
```

## Types d'Énumérations Disponibles

| Type | Clés | Exemple |
|------|------|---------|
| `priorites` | BASSE, MOYENNE, HAUTE, URGENTE | `{ cle: 'HAUTE', label: 'Haute' }` |
| `statuts-taches` | A_FAIRE, EN_COURS, EN_REVISION, TERMINE, ANNULE | `{ cle: 'EN_COURS', label: 'En cours' }` |
| `statuts-projets` | PROPOSITION, EN_ATTENTE, EN_COURS, TERMINE, EN_RETARD, ANNULE | - |
| `categories-services` | COMPTABILITE, MARKETING, FORMATION, ... | - |
| `types-clients` | PARTICULIER, ENTREPRISE, ORGANISATION | - |
| `statuts-factures` | BROUILLON, EN_ATTENTE, PAYEE, RETARD, ... | - |
| `statuts-paiements` | EN_ATTENTE, CONFIRME, REFUSE, REMBOURSE | - |
| `moyens-paiement` | ESPECES, CHEQUE, VIREMENT_BANCAIRE, ... | - |
| `types-notifications` | INFO, EQUIPE, TACHE, ALERTE, SUCCES | - |

## Structure des Données

Chaque énumération retourne:
```typescript
{
  id: string          // UUID unique
  cle: string         // Clé machine (utilisée dans le code)
  label: string       // Libellé pour l'utilisateur
  ordre: number       // Ordre d'affichage
  actif: boolean      // Si l'énumération est active
}
```

## Exemples Réels

### Exemple 1: Ajouter une Tâche
```tsx
const submit = async () => {
  const payload = {
    titre: "Ma tâche",
    priorite: "HAUTE",  // Utiliser la clé!
    statut: "A_FAIRE",  // Utiliser la clé!
    // ...
  }
  await fetch('/api/taches', { method: 'POST', body: JSON.stringify(payload) })
}
```

### Exemple 2: Filtrer par Statut
```tsx
const { data: statusList } = useEnums('statuts-taches')
const termineeStatus = statusList.find(s => s.cle === 'TERMINE')

const completedTasks = tasks.filter(t => t.statut === termineeStatus?.cle)
```

### Exemple 3: Afficher le Label
```tsx
import { useEnums, getLabelFromCle } from '@/lib/useEnums'

const { data: priorites } = useEnums('priorites')
const label = getLabelFromCle(priorites, task.priorite)

console.log(`Priorité: ${label}`)  // Priorité: Haute
```

## Comment Mettre à Jour un Composant

### Avant (Mauvais ❌)
```tsx
<select>
  <option value="HAUTE">Haute</option>
  <option value="MOYENNE">Moyenne</option>
  <option value="BASSE">Basse</option>
</select>
```

### Après (Bon ✅)
```tsx
import { EnumSelect } from '@/components/EnumSelect'

<EnumSelect
  type="priorites"
  value={priorite}
  onChange={setPriorite}
/>
```

## Tests Rapides

### Via curl
```bash
# Tester l'API des priorités
curl http://localhost:3000/api/enums/priorites

# Tester l'API des statuts de tâches
curl http://localhost:3000/api/enums/statuts-taches
```

### Via le navigateur
```
http://localhost:3000/api/enums/priorites
http://localhost:3000/api/enums/statuts-taches
```

## Modifications en BD

Si vous devez AJOUTER une nouvelle énumération:

1. Ajouter la table dans `prisma/schema.prisma`
2. Migration: `npx prisma migrate dev --name add_enum_xxx`
3. Ajouter les données dans `scripts/seedEnums.js`
4. Exécuter: `node scripts/seedEnums.js`

Si vous devez MODIFIER le label (ex: "Haute" → "Priorité Haute"):
1. Accéder à Prisma Studio: `npx prisma studio`
2. Modifier directement dans l'interface
3. ✅ Les changements s'appliquent immédiatement

## Composants à Mettre à Jour (TODO)

- [ ] EmployeeProjectTasks.tsx
- [ ] NouvelleTacheModal.tsx
- [ ] TaskDetailsModal.tsx
- [ ] PaiementEditModal.tsx
- [ ] PaiementsTable.tsx
- [ ] DashboardAgenda.tsx
- [ ] EmployeePayments.tsx
- [ ] Autres composants avec hardcoded values

## Support

Pour des questions:
1. Consulter `ENUM_MIGRATION.md` pour les détails d'architecture
2. Consulter `ENUM_SUMMARY.md` pour le résumé
3. Regarder `SubmitTaskForm.tsx` comme exemple de migration complète

## Performance

- Les données sont cachées côté client dans `useEnums`
- Les requêtes sont faites une seule fois par type d'énumération
- Les API routes utilisent les performances optimales de Prisma

✨ **Tout est prêt pour être utilisé!**
