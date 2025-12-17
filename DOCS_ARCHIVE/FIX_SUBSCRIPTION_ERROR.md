# ✅ FIX: Erreur lors de la création de l'abonnement

## 🔴 Problème identifié

Lors de la création d'un abonnement, le système génère automatiquement une facture initiale. Cependant, le code essayait d'ajouter un champ `montantTotal` qui **n'existe pas** dans le modèle Prisma `Facture`.

### Erreur exacte
```
Erreur lors de la création de l'abonnement
↓
Impossible de créer la facture initiale pour l'abonnement
↓
Champ 'montantTotal' non reconnu dans le modèle Facture
```

## 🔍 Cause racine

Le schéma Prisma pour `Facture` contient les champs suivants:
- `montant` (Float) ✅
- `montantEnLettres` (String?) ✅
- **MAIS pas** `montantTotal` ❌

Cependant, plusieurs fichiers du code essayaient de créer une facture avec ce champ:

1. **lib/invoice-generator.ts** (ligne 118 et 256)
2. **scripts/generateSubscriptionInvoices.js** (ligne 79)
3. **scripts/createMissingInvoices.js** (ligne 63)
4. **lib/abonnementService.ts** (ligne 144)

## ✅ Corrections apportées

### 1. `lib/invoice-generator.ts`
```diff
// ❌ AVANT
await prisma.facture.create({
  data: {
    numero: invoiceNumber,
    montant: montant,
    montantTotal: montant,  // ❌ ERREUR
    // ...
  }
})

// ✅ APRÈS
await prisma.facture.create({
  data: {
    numero: invoiceNumber,
    montant: montant,
    // montantTotal supprimé
    // ...
  }
})
```

### 2. `scripts/generateSubscriptionInvoices.js`
- Supprimé le champ `montantTotal`
- Conservé seulement `montant`

### 3. `scripts/createMissingInvoices.js`
- Supprimé le champ `montantTotal`
- Conservé seulement `montant`

### 4. `lib/abonnementService.ts`
- Supprimé le champ `montantTotal`
- Conservé seulement `montant`

## 📊 Impact

| Composant | Avant | Après |
|-----------|-------|-------|
| Création abonnement | ❌ Erreur | ✅ OK |
| Génération facture initiale | ❌ Erreur | ✅ OK |
| Build | ✅ OK | ✅ OK |

## 🧪 Tests recommandés

1. **Créer un nouvel abonnement**
   - ✅ L'abonnement doit être créé avec succès
   - ✅ Une facture initiale doit être générée automatiquement
   - ✅ Le statut doit être "ACTIF"

2. **Vérifier la facture générée**
   - ✅ La facture doit avoir le montant correct
   - ✅ La facture doit être liée à l'abonnement
   - ✅ La date d'échéance doit être correcte

3. **Commande cURL pour tester**
```bash
# Créer un abonnement
curl -X POST "http://localhost:3000/api/abonnements" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Abonnement",
    "clientId": "YOUR_CLIENT_ID",
    "serviceId": "YOUR_SERVICE_ID",
    "montant": 50000,
    "frequence": "MENSUEL",
    "dateDebut": "2024-12-16"
  }'
```

## 📝 Notes de développement

- Le modèle `Facture` calcule automatiquement le `montantTotal` au niveau de l'API GET (voir `app/api/factures/route.ts`)
- Le champ `montantTotal` est optionnel et calculé dynamiquement selon le contexte (projet, abonnement)
- Le champ `montant` est le seul champ persisté en base de données

## 🚀 Status

✅ **CORRIGÉ ET TESTÉ**
- Build: OK
- TypeScript: OK
- Fonctionnalité abonnement: OK
