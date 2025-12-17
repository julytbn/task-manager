# ✅ PLAN DÉTAILLÉ DE REFACTORISATION DES MODALS

## 📌 PRINCIPES DIRECTEURS

### Avant de commencer
1. **Une entité = une responsabilité**
2. **Pas de redondance d'information**
3. **Les ForeignKeys guident les relations**
4. **Un modal ne doit pas contraindre l'utilisateur avec des données inutiles**

---

## 🎯 ÉTAPE 1: NETTOYER NouvelleTacheModal

### ❌ AVANT (Confus)

```tsx
// components/NouvelleTacheModal.tsx
const formData = {
  titre: '',
  description: '',
  projetId: '',      // ✅ Correct
  serviceId: '',     // ❌ À SUPPRIMER (redondant avec projet.serviceId)
  assigneAId: '',
  statut: 'A_FAIRE',
  priorite: 'MOYENNE',
  dateEcheance: '',
  montant: '',        // ❌ À SUPPRIMER (devrait être dans FactureItem)
  heuresEstimees: '', // ⚠️ Garder (interne) mais MASQUER du modal
  facturable: true    // ❌ À SUPPRIMER (toujours true)
}
```

### ✅ APRÈS (Propre)

```tsx
// components/NouvelleTacheModal.tsx
const formData = {
  titre: '',              // Obligatoire
  description: '',        // Optionnel
  projetId: '',           // Obligatoire (hérite du service via projet)
  assigneAId: '',         // Optionnel
  statut: 'A_FAIRE',     // Obligatoire
  priorite: 'MOYENNE',   // Obligatoire
  dateEcheance: '',      // Optionnel
  // ✅ Enlevés: serviceId, montant, facturable
  // Les données financières vont dans Facture/FactureItem
}

const handleSubmit = (e: React.FormEvent) => {
  const payload = {
    titre: formData.titre,
    description: formData.description || null,
    projetId: formData.projetId,           // ← Clé correcte
    assigneAId: formData.assigneAId || null,
    statut: formData.statut,
    priorite: formData.priorite,
    dateEcheance: formData.dateEcheance || null
    // ✅ Pas de: serviceId, montant, facturable
  }
  onSave(payload)
}
```

### 📝 Changements HTML

```tsx
// SUPPRIMER ces champs:
{/* <input name="serviceId" /> */}
{/* <input name="montant" /> */}
{/* <input name="heuresEstimees" /> */}
{/* <input name="facturable" type="checkbox" /> */}

// GARDER uniquement:
<input name="titre" required />
<input name="projetId" required />
<input name="assigneAId" />
<select name="statut" required />
<select name="priorite" required />
<input name="dateEcheance" type="date" />
```

### 🔧 Changement API

```typescript
// app/api/taches/route.ts - POST
export async function POST(request: Request) {
  const data = await request.json()
  
  // Validation correcte
  if (!data.titre || !data.projetId || !data.statut || !data.priorite) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const tache = await prisma.tache.create({
    data: {
      titre: data.titre,
      description: data.description || null,
      projetId: data.projetId,           // ← Clé principale
      // ❌ SUPPRIMER: serviceId, montant, facturable
      assigneAId: data.assigneAId || null,
      statut: data.statut,
      priorite: data.priorite,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null
    },
    include: { projet: true, assigneA: true }
  })

  return NextResponse.json(tache, { status: 201 })
}
```

---

## 🎯 ÉTAPE 2: CORRIGER NouveauPaiementModal

### ❌ AVANT (Logique cassée)

```tsx
// components/NouveauPaiementModal.tsx
const formData = {
  client: '',        // ❌ Redondant (vient de Facture)
  clientId: '',      // ❌ Redondant
  service: '',       // ❌ À SUPPRIMER (vient de Facture)
  serviceId: '',     // ❌ À SUPPRIMER
  montantTotal: '',  // ❌ Optionnel et confus
  montantPayé: '',   // ❌ C'est juste 'montant' du paiement
  methodePaiement: 'Transfert bancaire',
  statut: 'impayé',
  date: new Date()...,
  reference: '',
  notes: ''
}
```

### ✅ APRÈS (Correct)

```tsx
// components/NouveauPaiementModal.tsx
const formData = {
  factureId: '',           // ✅ OBLIGATOIRE - La clé de tout
  montant: '',             // Montant du paiement
  moyenPaiement: 'VIREMENT_BANCAIRE',  // Enum
  datePaiement: new Date()...,
  statut: 'EN_ATTENTE',   // ou 'CONFIRME'
  reference: '',          // Numéro de transaction
  notes: ''
  
  // ❌ SUPPRIMÉS:
  // client, clientId (disponible via facture)
  // service, serviceId (disponible via facture)
  // montantTotal (c'est le montant du paiement)
}
```

### 📝 Changements HTML

```tsx
// PREMIER CHAMP: Sélectionner une FACTURE (obligatoire)
<div>
  <label>Facture *</label>
  <select 
    name="factureId" 
    required
    onChange={(e) => {
      const facture = factures.find(f => f.id === e.target.value)
      // Afficher: Facture #001, Client: XYZ, Montant: 590€
      setFormData(prev => ({
        ...prev,
        factureId: e.target.value,
        montant: facture?.montantTotal || ''
      }))
    }}
  >
    <option value="">-- Sélectionner une facture --</option>
    {factures.map(f => (
      <option key={f.id} value={f.id}>
        FAC-{f.numero} | {f.client.nom} | {f.montantTotal}€
      </option>
    ))}
  </select>
</div>

{/* Affichage informatif */}
{selectedFacture && (
  <div className="bg-blue-50 p-3 rounded">
    <p><strong>Client:</strong> {selectedFacture.client.nom}</p>
    <p><strong>Montant:</strong> {selectedFacture.montantTotal}€</p>
    <p><strong>Statut:</strong> {selectedFacture.statut}</p>
  </div>
)}

{/* Montant du paiement */}
<input 
  name="montant" 
  type="number" 
  value={formData.montant}
  onChange={handleChange}
  required
/>

{/* Moyen de paiement */}
<select name="moyenPaiement" required>
  <option value="VIREMENT_BANCAIRE">Virement bancaire</option>
  <option value="CHEQUE">Chèque</option>
  <option value="ESPECES">Espèces</option>
  <option value="CARTE_CREDIT">Carte crédit</option>
</select>

{/* Date du paiement */}
<input name="datePaiement" type="date" required />

{/* Référence de transaction */}
<input name="reference" placeholder="Numéro de transaction" />

{/* Notes */}
<textarea name="notes" placeholder="Notes optionnelles" />

{/* ❌ SUPPRIMER */}
{/* <input name="client" /> */}
{/* <input name="service" /> */}
{/* <input name="montantTotal" /> */}
```

### 🔧 Changement API

```typescript
// app/api/paiements/route.ts - POST
export async function POST(request: Request) {
  const data = await request.json()

  // ✅ Validation: factureId OBLIGATOIRE
  if (!data.factureId || !data.montant) {
    return NextResponse.json(
      { error: 'factureId et montant sont obligatoires' },
      { status: 400 }
    )
  }

  // ✅ Vérifier que la facture existe
  const facture = await prisma.facture.findUnique({
    where: { id: data.factureId }
  })
  if (!facture) {
    return NextResponse.json(
      { error: 'Facture non trouvée' },
      { status: 404 }
    )
  }

  const paiement = await prisma.paiement.create({
    data: {
      factureId: data.factureId,           // ← OBLIGATOIRE
      clientId: facture.clientId,          // ← Hérité de la facture
      montant: data.montant,
      moyenPaiement: data.moyenPaiement || 'VIREMENT_BANCAIRE',
      datePaiement: data.datePaiement ? new Date(data.datePaiement) : new Date(),
      statut: data.statut || 'EN_ATTENTE',
      reference: data.reference || null,
      notes: data.notes || null
      // ❌ SUPPRIMER: tacheId, projetId, serviceId (viennent de facture)
    },
    include: { facture: true, client: true }
  })

  // ✅ Mettre à jour le statut de la facture
  const paiementsTotal = await prisma.paiement.aggregate({
    where: { factureId: data.factureId },
    _sum: { montant: true }
  })
  
  let nouveauStatut: 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' = 'EN_ATTENTE'
  if (paiementsTotal._sum.montant >= facture.montantTotal) {
    nouveauStatut = 'PAYEE'
  } else if (paiementsTotal._sum.montant > 0) {
    nouveauStatut = 'PARTIELLEMENT_PAYEE'
  }

  await prisma.facture.update({
    where: { id: data.factureId },
    data: { statut: nouveauStatut }
  })

  return NextResponse.json(paiement, { status: 201 })
}
```

---

## 🎯 ÉTAPE 3: CORRIGER NouveauFactureModal

### ❌ AVANT

```tsx
const formData = {
  numero: '',        // ✅ Bon
  clientId: '',      // ✅ Bon
  projetId: '',      // Optionnel (facture ponctuelle)
  // ❌ MANQUE: abonnementId
  montant: '',       // ✅ Bon
  tauxTVA: 0.18,     // ✅ Bon
  dateEmission: '',  // ✅ Bon
  dateEcheance: '',  // ✅ Bon
  statut: 'EN_ATTENTE',
  notes: ''
}
```

### ✅ APRÈS

```tsx
const formData = {
  numero: '',              // Auto-généré
  clientId: '',            // Obligatoire
  
  // Une SEULE source de facture:
  abonnementId: '',        // ✅ Pour factures récurrentes
  projetId: '',            // ✅ Pour factures ponctuelles (projet)
  serviceId: '',           // ✅ Pour factures services ponctuels (RARE)
  
  montant: '',             // Obligatoire
  tauxTVA: 0.18,
  dateEmission: '',        // Obligatoire
  dateEcheance: '',        // Calculé automatiquement
  statut: 'EN_ATTENTE',
  notes: ''
}
```

### 📝 Changements HTML

```tsx
// Types de facture (radio buttons)
<fieldset>
  <legend>Type de facture *</legend>
  
  <label>
    <input 
      type="radio" 
      name="sourceType" 
      value="abonnement"
      onChange={(e) => setFormData(prev => ({
        ...prev,
        sourceType: 'abonnement',
        projetId: '', serviceId: ''
      }))}
    />
    Abonnement (Récurrente)
  </label>
  
  <label>
    <input 
      type="radio" 
      name="sourceType" 
      value="projet"
      onChange={(e) => setFormData(prev => ({
        ...prev,
        sourceType: 'projet',
        abonnementId: '', serviceId: ''
      }))}
    />
    Projet (Ponctuelle)
  </label>
  
  <label>
    <input 
      type="radio" 
      name="sourceType" 
      value="service"
      onChange={(e) => setFormData(prev => ({
        ...prev,
        sourceType: 'service',
        abonnementId: '', projetId: ''
      }))}
    />
    Service (Ponctuelle)
  </label>
</fieldset>

{/* Afficher le bon select selon le type */}
{sourceType === 'abonnement' && (
  <select name="abonnementId" required>
    <option>-- Sélectionner un abonnement --</option>
    {abonnements.map(a => (
      <option key={a.id} value={a.id}>
        {a.nom} | {a.service.nom} | {a.montant}€/{a.frequence}
      </option>
    ))}
  </select>
)}

{sourceType === 'projet' && (
  <select name="projetId" required>
    <option>-- Sélectionner un projet --</option>
    {projets.map(p => (
      <option key={p.id} value={p.id}>
        {p.titre} | {p.service.nom}
      </option>
    ))}
  </select>
)}

{sourceType === 'service' && (
  <select name="serviceId" required>
    <option>-- Sélectionner un service --</option>
    {services.map(s => (
      <option key={s.id} value={s.id}>
        {s.nom} | {s.prix}€
      </option>
    ))}
  </select>
)}
```

### 🔧 Changement API

```typescript
// app/api/factures/route.ts - POST
export async function POST(request: Request) {
  const data = await request.json()

  // ✅ Validation: Au moins UNE source (abonnement, projet ou service)
  const hasSource = data.abonnementId || data.projetId || data.serviceId
  if (!data.numero || !data.clientId || !data.montant || !hasSource) {
    return NextResponse.json(
      { error: 'Champs obligatoires manquants' },
      { status: 400 }
    )
  }

  // ✅ Vérifier que seule UNE source est fournie
  const sourceCount = [data.abonnementId, data.projetId, data.serviceId].filter(Boolean).length
  if (sourceCount > 1) {
    return NextResponse.json(
      { error: 'Une facture ne peut avoir qu\'UNE seule source' },
      { status: 400 }
    )
  }

  const taux = (data.tauxTVA || 18) / 100
  const montantTotal = data.montant * (1 + taux)

  const facture = await prisma.facture.create({
    data: {
      numero: data.numero,
      clientId: data.clientId,
      abonnementId: data.abonnementId || null,  // ✅ Ajouté
      projetId: data.projetId || null,
      serviceId: data.serviceId || null,
      montant: data.montant,
      tauxTVA: data.tauxTVA || 0.18,
      montantTotal,
      dateEmission: new Date(data.dateEmission),
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      statut: data.statut || 'EN_ATTENTE',
      notes: data.notes || null
    },
    include: {
      client: true,
      abonnement: true,
      projet: true,
      service: true
    }
  })

  return NextResponse.json(facture, { status: 201 })
}
```

---

## 🎯 ÉTAPE 4: CORRIGER AbonnementModal

### ❌ AVANT

```tsx
// components/AbonnementModal.tsx
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  // ... crée juste l'abonnement
  // ❌ MANQUE: génération de facture auto
}
```

### ✅ APRÈS

```tsx
// components/AbonnementModal.tsx
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  const form = new FormData(e.currentTarget)
  const data = Object.fromEntries(form.entries())

  try {
    const res = await fetch('/api/abonnements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) throw new Error('Erreur création abonnement')
    
    // ✅ Abonnement créé + facture auto générée dans la route API
    const result = await res.json()
    
    // Afficher un succès
    toast.success('Abonnement créé ! Facture auto-générée.')
    onSaved()
  } catch (err) {
    setError(err.message)
  }
}
```

### 🔧 Changement API

```typescript
// app/api/abonnements/route.ts - POST
export async function POST(request: Request) {
  const data = await request.json()

  if (!data.clientId || !data.serviceId || !data.montant || !data.frequence) {
    return NextResponse.json(
      { error: 'Champs obligatoires manquants' },
      { status: 400 }
    )
  }

  // ✅ 1. Créer l'abonnement
  const abonnement = await prisma.abonnement.create({
    data: {
      nom: data.nom,
      description: data.description || null,
      clientId: data.clientId,
      serviceId: data.serviceId,
      montant: parseFloat(String(data.montant)),
      frequence: data.frequence,
      statut: 'ACTIF',
      dateDebut: new Date(data.dateDebut),
      dateFin: data.dateFin ? new Date(data.dateFin) : null,
      dateProchainFacture: calculateNextInvoiceDate(
        new Date(data.dateDebut),
        data.frequence
      )
    },
    include: { client: true, service: true }
  })

  // ✅ 2. GÉNÉRER LA PREMIÈRE FACTURE AUTOMATIQUEMENT
  const facture = await prisma.facture.create({
    data: {
      numero: generateFactureNumber(),
      clientId: abonnement.clientId,
      abonnementId: abonnement.id,        // ← Lien clé
      montant: abonnement.montant,
      tauxTVA: 0.18,                       // TVA standard
      montantTotal: abonnement.montant * 1.18,
      dateEmission: new Date(),
      dateEcheance: calculateDueDate(abonnement.frequence),
      statut: 'EN_ATTENTE',
      notes: `Facture auto-générée pour abonnement ${abonnement.nom}`
    },
    include: { client: true, abonnement: true }
  })

  return NextResponse.json({
    abonnement,
    facture,  // ← Retourner les deux
    message: 'Abonnement créé et facture auto-générée'
  }, { status: 201 })
}

// Fonction helper
function calculateNextInvoiceDate(startDate: Date, frequence: string): Date {
  const next = new Date(startDate)
  switch (frequence) {
    case 'MENSUEL':
      next.setMonth(next.getMonth() + 1)
      break
    case 'TRIMESTRIEL':
      next.setMonth(next.getMonth() + 3)
      break
    case 'SEMESTRIEL':
      next.setMonth(next.getMonth() + 6)
      break
    case 'ANNUEL':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

function calculateDueDate(frequence: string): Date {
  const dueDate = new Date()
  switch (frequence) {
    case 'MENSUEL':
      dueDate.setDate(dueDate.getDate() + 15)
      break
    case 'TRIMESTRIEL':
    case 'SEMESTRIEL':
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case 'ANNUEL':
      dueDate.setDate(dueDate.getDate() + 60)
      break
  }
  return dueDate
}
```

---

## ✅ RÉSUMÉ DES CHANGEMENTS

### Modals à modifier

| Modal | Champs à supprimer | Champs à ajouter | Action API |
|-------|------|------|------|
| **NouvelleTacheModal** | serviceId, montant, facturable | - | POST /api/taches (simplifié) |
| **NouveauPaiementModal** | client, clientId, service, serviceId, montantTotal | - | POST /api/paiements (factureId obligatoire) |
| **NouveauFactureModal** | - | abonnementId | POST /api/factures (source validation) |
| **AbonnementModal** | - | - | POST /api/abonnements (auto-facture) |

### Routes API à modifier

| Route | Validation | Automatisation |
|-------|---|---|
| `POST /api/taches` | Retirer serviceId | - |
| `POST /api/paiements` | factureId OBLIGATOIRE | Statut facture auto |
| `POST /api/factures` | Source valide | - |
| `POST /api/abonnements` | Source valide | Générer facture auto |

---

## 📊 AVANT/APRÈS: Impact utilisateur

### Avant (Confus)
```
Manager crée une Tâche:
  Titre: "Audit fiscal Q1"
  Projet: "Audit 2025"
  Service: "Audit" (mais project a déjà un service!)
  Montant: 2000€ (où ça va?)
  Facturable: true (choix?)
  → Confusion totale

Manager crée un Paiement:
  Client: "XYZ Corp"
  Service: "Comptabilité" (direct, pas de facture!)
  Montant: 500€
  → Paiement orphelin (pas de facture!)

Manager crée un Abonnement:
  Service: "Comptabilité"
  Montant: 500€/mois
  → Aucune facture créée automatiquement
  → dateProchainFacture = jamais utilisée
```

### Après (Clair)
```
Manager crée une Tâche:
  Titre: "Audit fiscal Q1"
  Projet: "Audit 2025" ← Service hérité automatiquement
  Assignée à: Jean Dupont
  → Simple, logique, pas d'ambiguïté

Manager crée un Paiement:
  Sélectionner une Facture: "FAC-001 | XYZ Corp | 590€"
  Montant: 590€ (pré-rempli)
  Moyen: Virement bancaire
  → Paiement lié à une facture (intégrité garantie)

Manager crée un Abonnement:
  Nom: "Audit Fiscal Annuel"
  Service: "Audit"
  Montant: 6000€/an
  → Facture auto-générée pour 6000€ TTC
  → Prête à être envoyée au client
```

---

## 🎯 COMMENCER PAR OÙ?

**Ordre recommandé:**

1. **Paiement (CRITIQUE)** ← FactureId obligatoire - URGENCE
2. **Tâche (IMPORTANT)** ← Supprimer champs inutiles
3. **Facture (IMPORTANT)** ← Ajouter abonnementId
4. **Abonnement (BONUS)** ← Auto-facture

Veux-tu que je commence par l'une de ces refactorisations?

