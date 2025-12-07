# 🔍 DIAGNOSTIC DÉTAILLÉ - SYNCHRONISATION FRONTEND/BACKEND

**Date:** Décembre 3, 2025  
**Type:** Audit Technique  
**Sévérité:** 🔴 CRITIQUE (Mock data), 🟠 MAJEUR, 🟡 MINEUR

---

## 🔴 PROBLÈMES CRITIQUES

### 1. PAIEMENTS: Mock Data au lieu d'API
**Fichier:** `/app/paiements/page.tsx`  
**Ligne:** 11-44  
**Sévérité:** 🔴 CRITIQUE

```tsx
// ❌ ACTUEL - Mock Data hardcodée
const mockPaiements = [
  {
    id: '1',
    client: 'Entreprise ABC',  // ❌ String au lieu d'objet
    projet: 'App Mobile',      // ❌ String au lieu d'objet
    // ... etc
  },
  // ... 3 autres paiements hardcodés
]
```

**Impact:** 
- ❌ Données jamais synchronisées avec BD
- ❌ Modifications perdues au rechargement
- ❌ Impossible de gérer paiements réels
- ❌ Statuts pas vérifiés

**Correction requise:**
```tsx
const [paiements, setPaiements] = useState<Paiement[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchPaiements()
}, [])

const fetchPaiements = async () => {
  try {
    const res = await fetch('/api/paiements')
    if (!res.ok) throw new Error('Erreur')
    const data = await res.json()
    setPaiements(data)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

**Action:** 🟠 URGENT - Commencer ici

---

### 2. CLIENTS: Type `type` hardcodé
**Fichier:** `/app/clients/page.tsx`  
**Ligne:** 11-13  
**Sévérité:** 🟠 MAJEUR

```tsx
// ⚠️ ACTUEL - Type hardcodé comme union
type: 'PARTICULIER' | 'ENTREPRISE' | 'ORGANISATION'
```

**Problème:** 
- ❌ Si on ajoute un nouveau type dans BD, code cassé
- ❌ Pas de synchronisation automatique
- ❌ Dupliqué plusieurs endroits

**Correction requise:**
```tsx
// ✅ MEILLEUR - Depuis enum BD
const typeOptions = useEnums('types-clients')
// ou
const typeOptions = await serverEnums.getTypesClients()
```

**Action:** 🟡 À faire après paiements

---

### 3. FACTURES: Statut hardcodé
**Fichier:** `/app/factures/page.tsx`  
**Ligne:** 65-71  
**Sévérité:** 🟠 MAJEUR

```tsx
// ⚠️ ACTUEL - Statuts hardcodés
const colors: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  PAYEE: 'bg-green-100 text-green-800',
  REMBOURSEE: 'bg-blue-100 text-blue-800',
  ANNULEE: 'bg-red-100 text-red-800'
}
```

**Problème:**
- ❌ Dupliqué (même code probablement ailleurs)
- ❌ Pas synchro si on ajoute statut
- ❌ Pas testable

**Correction requise:**
```tsx
// ✅ MEILLEUR - Depuis enum BD
const statutOptions = useEnums('statuts-factures')
// Utiliser un mapping centralisé
const getStatusColors = (statut: string) => {
  const mapping = statusColorMap[statut] || defaultColor
  return mapping
}
```

---

## 🟠 PROBLÈMES MAJEURS

### 4. TÂCHES: Enum Priorités hardcodé
**Fichier:** `/components/dashboard/SubmitTaskForm.tsx`  
**Sévérité:** 🟠 MAJEUR

**État:** ⚠️ Partiellement migré (selon ENUM_SUMMARY.md)

```tsx
// ⚠️ Avant: Hardcodé
const priorites = ['HAUTE', 'NORMALE', 'BASSE']

// ✅ Après: Depuis enum BD (devrait être fait)
const { priorites } = useEnums('priorites')
```

**À vérifier:** Confirmer que migration est complète

---

### 5. PROJETS: Statut hardcodé
**Fichier:** `/app/projets/page.tsx`  
**Ligne:** 48-57  
**Sévérité:** 🟠 MAJEUR

```tsx
// ⚠️ ACTUEL - Statuts locaux
const statusConfig = {
  en_cours: { color: 'bg-blue-500', label: 'En cours', badge: 'bg-blue-100 text-blue-800' },
  termine: { color: 'bg-green-500', label: 'Terminé', badge: 'bg-green-100 text-green-800' },
  en_retard: { color: 'bg-red-500', label: 'En retard', badge: 'bg-red-100 text-red-800' },
}
```

**Problème:**
- ⚠️ Pas synchro avec BD (enum `EnumStatutProjet`)
- ⚠️ Statuts en anglais/français mixte
- ✅ Utilise hook `useProjectsStatistics()` mais pas les énums

**Correction requise:**
```tsx
const statutsProjet = useEnums('statuts-projets')
// Remplacer statusConfig par mappage depuis BD
```

---

### 6. ABONNEMENTS: Fréquence hardcodée
**Fichier:** Probablement `/components/AbonnementsList.tsx`  
**Sévérité:** 🟠 MAJEUR

**Problème à vérifier:**
- [ ] Vérifier comment "fréquence" est codée
- [ ] Est-ce depuis enum BD ou hardcodé?
- [ ] Incohérence possible avec factures

---

## 🟡 PROBLÈMES MINEURS

### 7. FORMULAIRES: Validation Zod manquante
**Fichier:** Tous les formulaires  
**Sévérité:** 🟡 MINEUR

**État actuel:** ❌ Pas de validation Zod visible  
**Requis:** Ajouter Zod schemas pour:
- ClientForm
- ProjetForm
- TacheForm
- FactureForm
- PaiementForm
- AbonnementForm

**Exemple:**
```tsx
import { z } from 'zod'

const ClientSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  type: z.enum(['PARTICULIER', 'ENTREPRISE', 'ORGANISATION']),
  telephone: z.string().optional(),
})
```

---

### 8. COMPOSANTS: Accès direct aux données brutes
**Fichier:** Plusieurs composants  
**Sévérité:** 🟡 MINEUR

**Problème:**
```tsx
// ❌ Pas de typage
const data = await res.json()
// données utilisées sans vérification

// ✅ Meilleur
type PaiementResponse = {
  id: string
  statut: 'PAYÉ' | 'EN_ATTENTE'
  montant: number
  // ...
}
const data: PaiementResponse = await res.json()
```

---

### 9. FORMULAIRES: Pas de gestion erreurs uniforme
**Fichier:** Tous les modals  
**Sévérité:** 🟡 MINEUR

**Problème:**
- Erreurs API non affichées
- Pas de toast notifications
- Messages d'erreur incohérents

**À implémenter:**
```tsx
try {
  const res = await fetch('/api/...', { method: 'POST', body })
  if (!res.ok) {
    const error = await res.json()
    toast.error(error.message || 'Erreur')
    return
  }
  // ...
  toast.success('✅ Succès!')
} catch (error) {
  toast.error('Erreur réseau')
}
```

---

## 📊 RÉSUMÉ DES PROBLÈMES

### Par Sévérité

| Sévérité | Nombre | Exemples |
|----------|--------|----------|
| 🔴 CRITIQUE | 1 | Paiements mock data |
| 🟠 MAJEUR | 5+ | Clients, Factures, Tâches, Projets, Abonnements |
| 🟡 MINEUR | 3+ | Validation, Typage, Erreurs |

### Par Type

| Type | Nombre | Pages Affectées |
|------|--------|-----------------|
| Mock data | 1 | Paiements |
| Enum hardcodé | 5+ | Tâches, Factures, Projets, Clients, Équipes |
| Type hardcodé | 3+ | Clients, Projets, Abonnements |
| Validation manquante | 8+ | Tous les formulaires |
| Erreurs non gérées | 10+ | Tous les formulaires |

### Par Module

| Module | Critiques | Majeurs | Mineurs |
|--------|-----------|---------|---------|
| Paiements | 1 | 0 | 2 |
| Factures | 0 | 1 | 2 |
| Clients | 0 | 1 | 2 |
| Projets | 0 | 1 | 2 |
| Tâches | 0 | 1 | 2 |
| Abonnements | 0 | 1 | 2 |
| Autres | 0 | 1+ | 1+ |

---

## 🎯 PLAN D'ACTION PRIORISÉ

### PHASE 1: Corriger Paiements (URGENT - 1 jour)
```
🟠 Étape 1.1: Remplacer mockPaiements par fetch API
🟠 Étape 1.2: Vérifier statuts depuis énums BD
🟠 Étape 1.3: Tester CRUD complet
```

### PHASE 2: Harmoniser Énums (3 jours)
```
🟡 Étape 2.1: Vérifier useEnums hook fonctionne partout
🟡 Étape 2.2: Remplacer hardcoded values dans:
   - Clients (type)
   - Factures (statut)
   - Projets (statut)
   - Tâches (priorité) - Vérifier si fait
   - Abonnements (fréquence)
🟡 Étape 2.3: Créer mapping centralisé pour couleurs
```

### PHASE 3: Ajouter Validations (2 jours)
```
🟡 Étape 3.1: Créer Zod schemas pour tous formulaires
🟡 Étape 3.2: Intégrer React Hook Form
🟡 Étape 3.3: Afficher erreurs validation côté client
```

### PHASE 4: Gestion Erreurs Globale (2 jours)
```
🟡 Étape 4.1: Implémenter Toast notifications
🟡 Étape 4.2: Gestion erreurs uniformes
🟡 Étape 4.3: Tester tous les scénarios
```

### PHASE 5: Tests Intégration (2 jours)
```
✅ Étape 5.1: Tester tous les modules
✅ Étape 5.2: Vérifier cohérence données
✅ Étape 5.3: Documenter changements
```

---

## 💾 FICHIERS À CORRIGER - CHECKLIST

### 🔴 CRITIQUE
- [ ] `/app/paiements/page.tsx` - Remplacer mock data

### 🟠 MAJEUR
- [ ] `/app/clients/page.tsx` - Harmoniser enums
- [ ] `/app/factures/page.tsx` - Synchroniser statuts
- [ ] `/app/projets/page.tsx` - Vérifier statuts
- [ ] `/app/taches/page.tsx` - Vérifier enum priorités
- [ ] `/components/AbonnementsList.tsx` - Vérifier fréquence
- [ ] `/components/NouveauClientModal.tsx` - Ajouter validation
- [ ] `/components/NouveauPaiementModal.tsx` - Ajouter validation
- [ ] `/components/NouveauFactureModal.tsx` - Ajouter validation
- [ ] `/components/ProjectModal.tsx` - Ajouter validation
- [ ] `/components/SubmitTaskForm.tsx` - Vérifier enum

### 🟡 MINEUR
- [ ] `/lib/formSchemas.ts` - Créer (n'existe pas?)
- [ ] `/components/ui/FormError.tsx` - Créer composant erreur
- [ ] Ajouter Toast provider globalement
- [ ] Mapper couleurs centralisé

---

## 🔗 Ressources Existantes à Consulter

**Documentation:**
- `SCHEMA_RELATIONS_GUIDE.md` - Structure BD
- `ENUM_SUMMARY.md` - État énums (✅ Migration faite?)
- `DOCUMENTATION_TECHNIQUE.md` - API endpoints
- `CAHIER_DES_CHARGES.md` - Requirements

**Code Reference:**
- `lib/useEnums.ts` - Hook récupérer énums
- `lib/serverEnums.ts` - Utilitaires serveur
- `lib/enumUtils.ts` - Mapping énums → options

**Tests Existants:**
- `test-subscription-invoices.js` - Test paiements
- `scripts/testPaymentLateDetection.js` - Test détection retards

---

## ✅ Résumé Exécutif

**État Global:** ⚠️ **70% Synchronisé**

**Blockers:** 
1. 🔴 Paiements: Mock data (URGENT!)
2. 🟠 Énums: Plusieurs hardcodés
3. 🟡 Validation: Manquante partout

**Priorité #1:** Fixer paiements (1 jour)  
**Priorité #2:** Harmoniser énums (3 jours)  
**Priorité #3:** Ajouter validations (2 jours)

**Temps Estimé Total:** 8-10 jours  
**Ressources:** 1 dev senior (peut être parallélisé)

---

**Prêt à commencer par le diagnostic détaillé! ✅**
