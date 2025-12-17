# 📄 Migration : Suppression des Devis → Facture Professionnelle

## 📅 Date : 11 Décembre 2025

### 🎯 Résumé
Selon les instructions du chef de projet, l'entreprise ne fait **pas de devis** mais directement des **factures au format professionnel**. Cette migration supprime le modèle `Devis` et enrichit le modèle `Facture` pour supporter tous les champs nécessaires.

---

## ✅ Changements Effectués

### 1. **Schéma Prisma** (`prisma/schema.prisma`)

#### ✂️ Suppression
- `model Devis` - Entièrement supprimé
- `model DevisService` - Entièrement supprimé
- `enum StatutDevis` - Supprimé (BROUILLON, ENVOYE, ACCEPTE, REFUSE, ANNULE)
- Références `devis` dans modèle `Client` - Supprimée
- Références `devisServices` dans modèle `Service` - Supprimée
- Références `devisId` et relation `devis` dans modèle `Projet` - Supprimées

#### ➕ Enrichissement du modèle `Facture`

**Nouveaux champs ajoutés:**
```prisma
description          String?       // Description générale de la facture
conditionsPaiement   String?       // Ex: "Net 30 jours", "À la réception"
valideeParId         String?       // ID du manager/admin qui valide
dateValidation       DateTime?     // Date de validation de la facture
dateEnvoi            DateTime?     // Date d'envoi au client
reference            String?       // Référence client ou interne
```

**Nouvelle relation:**
```prisma
valideeParUser       Utilisateur?  @relation("FacturesValidees", ...)
```

**Indices ajoutés:**
```prisma
@@index([statut])
@@index([clientId])
```

#### ➕ Enrichissement du modèle `Utilisateur`

**Nouvelle relation:**
```prisma
facturesValidees     Facture[]     @relation("FacturesValidees")
```

#### 📝 Enum `StatutFacture` mis à jour
**Ajout du statut `VALIDEE`:**
```prisma
enum StatutFacture {
  BROUILLON
  EN_ATTENTE
  VALIDEE              // 👈 NOUVEAU
  PARTIELLEMENT_PAYEE
  PAYEE
  RETARD
  ANNULEE
}
```

---

### 2. **Base de Données**

**Migration créée:** `20251211083924_facture_pro_format`

#### Actions:
- ✅ Suppression des tables `devis` et `devis_services`
- ✅ Suppression des foreign keys associées
- ✅ Ajout des colonnes à la table `factures`:
  - `description`
  - `conditions_paiement`
  - `validee_par_id`
  - `date_validation`
  - `date_envoi`
  - `reference`
  - `statut` enrichi avec `VALIDEE`
- ✅ Création d'indices pour performance

---

### 3. **API Routes** (`app/api/`)

**Suppression:**
- ❌ `/api/devis` - Dossier entier supprimé
- ❌ `/api/devis/[id]/route.ts`
- ❌ `/api/devis/route.ts` (GET, POST, etc.)

---

### 4. **Pages Frontend** (`app/billing/devis/`)

**Suppression:**
- ❌ `/billing/devis/page.tsx` - Liste des devis
- ❌ `/billing/devis/[id]/page.tsx` - Détail devis
- ❌ `/billing/devis/new/page.tsx` - Création devis

---

### 5. **Composants & Navigation**

**Mise à jour:**
- `components/ManagerSidebar.tsx`
  - ❌ Suppression du lien `/billing/devis` (avec icône FileText)
  - Conservé: Lien `/factures` pour gestion des factures

---

## 🔄 Nouveau Workflow

### Avant (avec Devis)
```
Devis (BROUILLON)
  ↓
Devis (ENVOYE)
  ↓
Devis (ACCEPTE)
  ↓
Conversion → Projet
  ↓
Factures générées
```

### Après (Facture Pro Format)
```
Facture (BROUILLON)
  ↓
Facture enrichie (description, conditions, etc.)
  ↓
Facture (VALIDEE) ← Validation par manager
  ↓
Facture (EN_ATTENTE) ← Prête pour envoi
  ↓
Facture (PAYEE) ← Après paiement
```

---

## 📊 Champs de la Facture Professionnelle

| Champ | Type | Description |
|-------|------|-------------|
| `numero` | String | Numéro unique de facture |
| `clientId` | String | Client concerné |
| `projetId` | String? | Projet optionnel lié |
| `description` | String? | **Description générale (NOUVEAU)** |
| `conditionsPaiement` | String? | **Conditions (Net 30, etc.) (NOUVEAU)** |
| `valideeParId` | String? | **Manager/Admin qui valide (NOUVEAU)** |
| `dateValidation` | DateTime? | **Date validation (NOUVEAU)** |
| `dateEnvoi` | DateTime? | **Date envoi au client (NOUVEAU)** |
| `reference` | String? | **Référence client/interne (NOUVEAU)** |
| `montant` | Float | Montant HT |
| `tauxTVA` | Float | Taux TVA (défaut 18%) |
| `montantTotal` | Float | Montant TTC |
| `dateEmission` | DateTime | Date d'émission |
| `dateEcheance` | DateTime? | Date limite de paiement |
| `datePaiement` | DateTime? | Date du paiement effectué |
| `statut` | StatutFacture | **BROUILLON, VALIDEE, EN_ATTENTE, PAYEE, etc.** |
| `notes` | String? | Notes internes |

---

## 🔧 Actions Nécessaires Frontend

Pour afficher les factures "professionnelles", il faut:

1. **Page Factures** - Ajouter colonnes:
   - Date de validation
   - Validée par (nom du manager)
   - Conditions de paiement

2. **Modal/Formulaire Facture** - Ajouter champs:
   - ✅ Description
   - ✅ Conditions de paiement
   - ✅ Référence client
   - ✅ Sélection validateur (manager)

3. **Workflow Validation**:
   - Permis de changer statut à `VALIDEE` uniquement si `valideeParId` + `dateValidation`
   - Permis de changer à `EN_ATTENTE` après validation

4. **PDF/Export** - Inclure:
   - Description de la facture
   - Conditions de paiement
   - Date de validation et nom validateur

---

## 🚀 Prochaines Étapes

### Urgent
- [ ] Mettre à jour le formulaire `NouveauFactureModal.tsx` pour les nouveaux champs
- [ ] Ajouter colonne "Validée par" dans `FacturesTable`
- [ ] Ajouter workflow validation (Admin/Manager seulement)

### Recommandé
- [ ] Générer PDF avec tous les champs pro (description, conditions, etc.)
- [ ] Ajouter notification "Facture validée" aux clients
- [ ] Ajouter historique des changements de statut
- [ ] Dashboard: Metrics sur factures validées vs en attente

### Optionnel
- [ ] Template de conditions de paiement paramétrables
- [ ] Audit trail complet (qui a validé, quand, modifications)
- [ ] Export Excel avec champs pro

---

## 💾 Données Existantes

**Attention:** Les données existantes `Devis` et `DevisService` ont été supprimées de la BD lors de la migration.

Si vous aviez des devis en cours:
1. Les devis ont été perdus (à archiver avant migration en prod)
2. Les projets liés à des devis ont conservé leurs données (la FK `devisId` a été nulle)

---

## 🔐 Sécurité

- ✅ Seul un Admin/Manager peut valider une facture (`valideeParId`)
- ✅ Validation à ajouter côté API: vérifier rôle avant mise à jour de `dateValidation`
- ⚠️ **À faire:** Ajouter permission check dans `app/api/factures/[id]/route.ts`

---

## ✨ Bénéfices

✅ **Simplification**: Un seul modèle (`Facture`) au lieu de deux (`Devis` + `Facture`)
✅ **Workflow direct**: Facture → Validation → Envoi → Paiement
✅ **Professionnel**: Tous les champs d'une facture d'entreprise
✅ **Flexible**: Description libre + conditions paramétrables
✅ **Traçabilité**: Qui valide, quand, date d'envoi

---

## 📝 Fichiers Modifiés

```
✅ prisma/schema.prisma
✅ prisma/migrations/20251211083924_facture_pro_format/migration.sql
✅ components/ManagerSidebar.tsx
❌ app/api/devis/ (SUPPRIMÉ)
❌ app/billing/devis/ (SUPPRIMÉ)
```

---

**Commit Message Recommandé:**
```
feat: remove devis model and upgrade facture to professional format

- Remove Devis and DevisService models (company doesn't use quotes)
- Enrich Facture model with professional fields (description, conditions, validation, etc.)
- Add VALIDEE status to StatutFacture enum
- Remove /api/devis routes and /billing/devis pages
- Update navigation sidebar
- Apply migration: facture_pro_format
```

---

**Questions? Contacte le lead technique.**
