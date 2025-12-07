# 🚀 PLAN D'IMPLÉMENTATION FRONT-END

## 📊 RÉSUMÉ DE LA SITUATION

Le schéma Prisma a été optimisé (✅ Étapes 1-3 complétées) **MAIS** le front-end n'a pas été mise à jour pour utiliser les nouvelles relations.

**Impact:** Les fonctionnalités de paiement/facture **ne marchent PAS correctement** avec la nouvelle architecture.

---

## 🎯 OBJECTIF

Synchroniser le front-end avec le nouveau schema Prisma pour que :
1. ✅ Les paiements DOIVENT être liés à une facture (factureId NOT NULL)
2. ✅ Les factures affichent leurs paiements associés
3. ✅ Les abonnements génèrent automatiquement leurs factures
4. ✅ La logique Abonnement ⊕ Projet fonctionne

---

## 📋 CORRECTIONS À FAIRE

### I. CORRIGER LES API ENDPOINTS

#### 1️⃣ **API Paiements GET** (`app/api/paiements/route.ts`)
```typescript
// AVANT
include: { client: true, tache: true, projet: true }

// APRÈS
include: { 
  client: true, 
  tache: true, 
  projet: true,
  facture: true  // ✅ AJOUTER
}
```

**Fichier à modifier:**
```
c:\Users\DELL G15\Desktop\ReactProjet\task-log - Copie\task-manager\app\api\paiements\route.ts
```

**Lignes:** 26 et 49

---

#### 2️⃣ **API Factures GET** (`app/api/factures/route.ts`)
```typescript
// AVANT
include: {
  client: { select: { id: true, nom: true } },
  projet: { select: { id: true, titre: true } }
}

// APRÈS
include: {
  client: true,
  projet: true,
  abonnement: true,      // ✅ AJOUTER
  paiements: true,       // ✅ AJOUTER
  taches: true           // ✅ AJOUTER
}
```

**Fichier à modifier:**
```
c:\Users\DELL G15\Desktop\ReactProjet\task-log - Copie\task-manager\app\api\factures\route.ts
```

---

#### 3️⃣ **API Factures POST** (`app/api/factures/route.ts`)
**AJOUTER la relation abonnement dans la création:**

```typescript
// AJOUTER ce champ
abonnement: data.abonnementId ? { connect: { id: data.abonnementId } } : undefined

// Complet:
const facture = await prisma.facture.create({
  data: {
    numero: data.numero,
    client: { connect: { id: data.clientId } },
    projet: data.projetId ? { connect: { id: data.projetId } } : undefined,
    abonnement: data.abonnementId ? { connect: { id: data.abonnementId } } : undefined,  // ✅ AJOUTER
    // ... autres champs
  }
})
```

---

#### 4️⃣ **API Paiements POST** - VALIDATION COMPLÈTE

**CRÉER CETTE VALIDATION:**

```typescript
// Vérifier que factureId existe
if (!body.factureId) {
  return NextResponse.json(
    { error: 'factureId est obligatoire' },
    { status: 400 }
  )
}

// Vérifier que la facture existe
const facture = await prisma.facture.findUnique({
  where: { id: body.factureId }
})

if (!facture) {
  return NextResponse.json(
    { error: 'Facture introuvable' },
    { status: 404 }
  )
}
```

---

### II. CORRIGER LES PAGES REACT

#### 1️⃣ **Page Paiements** (`app/paiements/page.tsx`)

**REMPLACER** les mock data par un fetch réel:

```typescript
// ✅ AJOUTER
const [paiements, setPaiements] = useState<any[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchPaiements = async () => {
    try {
      const res = await fetch('/api/paiements?all=true')
      if (!res.ok) throw new Error('Erreur récupération')
      const data = await res.json()
      setPaiements(data.payments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }
  
  fetchPaiements()
}, [])

if (loading) return <div>Chargement...</div>
if (error) return <div>Erreur: {error}</div>
```

**Lignes à remplacer:** 12-39 (mockPaiements)

---

#### 2️⃣ **Page Factures** (`app/factures/page.tsx`)

**METTRE À JOUR le type Facture:**

```typescript
type Facture = {
  id: string
  numero: string
  client: { id: string; nom: string }
  abonnement?: { id: string; nom: string }  // ✅ AJOUTER
  projet?: { id: string; titre: string }
  paiements?: Array<{                         // ✅ AJOUTER
    id: string
    montant: number
    statut: string
  }>
  statut: string
  montant: number
  montantTotal: number
  dateEmission: string
  dateEcheance?: string | null
}
```

**Ajouter logique pour calculer montantDu:**

```typescript
const totalPayes = facture.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0
const montantDu = facture.montantTotal - totalPayes

// Afficher dans le tableau
<td>{totalPayes}€ / {montantDu}€</td>
```

---

### III. CORRIGER LES COMPOSANTS MODAUX

#### 1️⃣ **NouveauPaiementModal** (`components/NouveauPaiementModal.tsx`)

**REMPLACER formData:**

```typescript
// AVANT (INCORRECT)
const [formData, setFormData] = useState({
  client: '',
  clientId: '',
  projet: '',
  projetId: '',
  montantTotal: '',
  montantPayé: '',              // ❌ SUPPRIMER
  methodePaiement: '',          // ❌ SUPPRIMER
  statut: 'impayé',             // ❌ SUPPRIMER
  date: '',                     // ❌ SUPPRIMER
  reference: '',
  notes: '',
})

// APRÈS (CORRECT)
const [formData, setFormData] = useState({
  factureId: '',                // ✅ AJOUTER (OBLIGATOIRE)
  clientId: '',
  montant: '',
  moyenPaiement: '',            // ✅ Remplacer methodePaiement
  reference: '',
  datePaiement: new Date().toISOString().split('T')[0],
  statut: 'EN_ATTENTE',         // ✅ Statut paiement (pas client)
  notes: '',
})
```

**AJOUTER le chargement des factures:**

```typescript
const [factures, setFactures] = useState<any[]>([])

useEffect(() => {
  if (!isOpen) return
  
  const loadFactures = async () => {
    try {
      const res = await fetch('/api/factures')
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      
      // Filtrer factures non payées
      const unpaid = data.filter(f => 
        f.statut !== 'PAYEE' && 
        f.statut !== 'ANNULEE'
      )
      
      setFactures(unpaid)
    } catch (error) {
      console.error('Erreur chargement factures:', error)
    }
  }
  
  loadFactures()
}, [isOpen])
```

**METTRE À JOUR le formulaire:**

```tsx
// ✅ AJOUTER select facture
<select
  name="factureId"
  value={formData.factureId}
  onChange={(e) => setFormData({ ...formData, factureId: e.target.value })}
  required
>
  <option value="">Sélectionner une facture</option>
  {factures.map(f => (
    <option key={f.id} value={f.id}>
      {f.numero} - {f.client.nom} - {f.montantTotal}€
    </option>
  ))}
</select>

// ✅ REMPLACER methodePaiement par moyenPaiement
<select name="moyenPaiement" value={formData.moyenPaiement} onChange={...}>
  <option value="VIREMENT_BANCAIRE">Virement bancaire</option>
  <option value="CHEQUE">Chèque</option>
  <option value="ESPECES">Espèces</option>
  <option value="CARTE_BANCAIRE">Carte bancaire</option>
  <option value="PAYPAL">PayPal</option>
</select>
```

**AJOUTER validation:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  
  // ✅ Valider factureId
  if (!formData.factureId) {
    setError('Vous devez sélectionner une facture')
    return
  }
  
  // ✅ Valider montant
  if (!formData.montant || parseFloat(formData.montant) <= 0) {
    setError('Montant invalide')
    return
  }
  
  // ... reste du code
}
```

---

#### 2️⃣ **NouveauFactureModal** (`components/NouveauFactureModal.tsx`)

**AJOUTER champ abonnementId:**

```typescript
const [formData, setFormData] = useState({
  numero: '',
  client: '',
  clientId: '',
  abonnement: '',           // ✅ AJOUTER
  abonnementId: '',         // ✅ AJOUTER
  projet: '',
  projetId: '',
  montant: '',
  tauxTVA: 18,
  dateEmission: '',
  dateEcheance: '',
  statut: 'EN_ATTENTE',
  notes: '',
})
```

**AJOUTER select abonnement:**

```tsx
<select
  name="abonnement"
  value={formData.abonnement}
  onChange={(e) => {
    const selected = abonnements.find(a => a.id === e.target.value)
    setFormData(prev => ({
      ...prev,
      abonnement: e.target.value,
      abonnementId: selected?.id || '',
      // Auto-fill montant si abonnement
      montant: selected?.montant?.toString() || prev.montant
    }))
  }}
>
  <option value="">Aucun abonnement (Facture manuelle)</option>
  {abonnements.map(a => (
    <option key={a.id} value={a.id}>
      {a.nom} ({a.montant}€ - {a.frequence})
    </option>
  ))}
</select>
```

---

### IV. CORRIGER LES TABLES

#### 1️⃣ **PaiementsTable** (`components/PaiementsTable.tsx`)

**AJOUTER colonne Facture:**

```tsx
// Ajouter dans l'interface
interface Paiement {
  id: string
  facture: {                    // ✅ AJOUTER
    numero: string
    montantTotal: number
  }
  client: { nom: string }
  montant: number
  moyenPaiement: string
  statut: string
  datePaiement: string
}

// Ajouter dans l'en-tête du tableau
<th>Facture</th>

// Ajouter dans le corps du tableau
<td>{paiement.facture.numero}</td>
```

---

#### 2️⃣ **FacturesTable** (`components/FacturesTable.tsx`)

**CRÉER SI N'EXISTE PAS:** Afficher factures avec paiements

```tsx
interface Facture {
  id: string
  numero: string
  client: { nom: string }
  abonnement?: { nom: string }
  projet?: { titre: string }
  paiements: Array<{
    id: string
    montant: number
    statut: string
  }>
  montantTotal: number
  statut: string
}

export default function FacturesTable({ factures }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Numéro</th>
          <th>Client</th>
          <th>Origine</th>
          <th>Montant TTC</th>
          <th>Paiements</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {factures.map(f => {
          const totalPayes = f.paiements?.reduce((sum, p) => sum + p.montant, 0) || 0
          const montantDu = f.montantTotal - totalPayes
          
          return (
            <tr key={f.id}>
              <td>{f.numero}</td>
              <td>{f.client.nom}</td>
              <td>{f.abonnement?.nom || f.projet?.titre || 'Manuelle'}</td>
              <td>{f.montantTotal}€</td>
              <td>
                {f.paiements?.length || 0} paiements<br/>
                Reçu: {totalPayes}€ / Du: {montantDu}€
              </td>
              <td>{f.statut}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
```

---

## 📅 CALENDRIER D'IMPLÉMENTATION

### **Jour 1: APIs (2-3h)**
- [ ] Corriger GET `/api/paiements` - inclure facture
- [ ] Corriger GET `/api/factures` - inclure paiements, abonnement
- [ ] Corriger POST `/api/factures` - inclure abonnement
- [ ] Ajouter validations POST `/api/paiements`
- [ ] Tester toutes les requêtes avec Postman/Thunder Client

### **Jour 2: Pages (2-3h)**
- [ ] Mettre à jour `app/paiements/page.tsx`
- [ ] Mettre à jour `app/factures/page.tsx`
- [ ] Ajouter loading/error states
- [ ] Tester rendu des données

### **Jour 3: Composants (3-4h)**
- [ ] Refactorer `NouveauPaiementModal.tsx`
- [ ] Refactorer `NouveauFactureModal.tsx`
- [ ] Créer/Mettre à jour `FacturesTable.tsx`
- [ ] Tester les modaux

### **Jour 4: Intégration et Tests (2-3h)**
- [ ] Tester end-to-end: créer facture → paiement
- [ ] Tester automatisation abonnement → facture
- [ ] Vérifier statuts (EN_ATTENTE → PARTIELLEMENT_PAYEE → PAYEE)
- [ ] Tests dans toutes les pages

---

## ⚠️ ORDRE D'EXÉCUTION IMPORTANT

**NE PAS faire:**
```
❌ Modifier composants avant APIs
❌ Tester UI avant API fixes
❌ Deployer en production avant tests
```

**FAIRE:**
```
✅ 1. Fixer les APIs d'abord
✅ 2. Tester avec Postman
✅ 3. Mettre à jour les pages
✅ 4. Refactorer les composants
✅ 5. Tests end-to-end
✅ 6. Deploy
```

---

## 🧪 TESTS À EFFECTUER

### Test 1: Créer paiement sans facture → ERREUR
```
POST /api/paiements
Body: { clientId: "...", montant: 100 }
Expected: 400 Bad Request - "factureId est obligatoire"
```

### Test 2: Créer paiement avec facture valide → OK
```
POST /api/paiements
Body: { 
  factureId: "fac_123", 
  clientId: "cli_456", 
  montant: 100,
  moyenPaiement: "VIREMENT_BANCAIRE"
}
Expected: 201 Created + paiement complet
```

### Test 3: Récupérer facture avec paiements
```
GET /api/factures
Expected: Chaque facture inclut array paiements avec montants
```

### Test 4: Affichage UI
```
Page /paiements → Voir colonne Facture
Page /factures → Voir paiements et montants dus
```

---

## 📞 SUPPORT & QUESTIONS

**Besoin d'aide ?**
- Docs créés: `AUDIT_FRONTEND_MODIFICATIONS.md`
- Schema: `SCHEMA_RELATIONS_GUIDE.md`
- Validation: `VALIDATION_RELATIONS_SCHEMA.md`
- Code patterns: `RESTRUCTURATION_CODE_APPLICATIF.md`

---

## ✅ CHECKLIST FINAL

- [ ] Toutes les APIs corrigées
- [ ] Pages mises à jour
- [ ] Composants refactorisés
- [ ] Tests end-to-end passés
- [ ] UI synchronisée avec DB
- [ ] Documentation mise à jour
- [ ] Ready for production ✨
