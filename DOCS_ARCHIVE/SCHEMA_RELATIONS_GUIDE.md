# 📊 Guide Complet des Relations Prisma

## 🎯 Vue d'ensemble du système

Le système est organisé autour d'une hiérarchie claire :

```
CLIENT (Entity principale)
├── ABONNEMENT (Contrats récurrents)
│   ├── FACTURE (Auto-générées mensuellement/trimestriellement)
│   │   └── PAIEMENT (Plusieurs paiements possibles)
├── PROJET (Missions ponctuelles)
│   ├── FACTURE (Une ou plusieurs factures par phases)
│   │   └── PAIEMENT
│   └── TÂCHE (Décomposition du travail)
│       └── PAIEMENT
└── SERVICE (Catalogue de services offerts)
```

---

## 🔴 ENTITÉS PRINCIPALES

### 1️⃣ **CLIENT** 🔵
L'entité centrale du système.

**Relations sortantes:**
```typescript
model Client {
  abonnements      Abonnement[]     // 1→N Un client a plusieurs abonnements
  factures         Facture[]        // 1→N Factures directes du client
  paiements        Paiement[]       // 1→N Tous les paiements du client
  projets          Projet[]         // 1→N Plusieurs projets possibles
  documents        DocumentClient[] // 1→N Documents liés au client
  souhaits         Souhait[]        // 1→N Messages de vœux
}
```

**Exemple:**
```
Client: "Entreprise XYZ"
├─ Abonnement 1: Comptabilité (mensuel)
├─ Abonnement 2: Conseil Fiscal (trimestriel)
├─ Projet 1: Audit 2025
├─ Projet 2: Étude de marché
└─ 15 Factures (mix abonnements + projets)
    └─ 25 Paiements (certains factures payées en 3 fois)
```

---

### 2️⃣ **ABONNEMENT** 🟣
Contrats récurrents automatisés.

**Relations:**
```typescript
model Abonnement {
  clientId         String           // FK ← Client
  serviceId        String           // FK ← Service (ex: Comptabilité)
  client           Client           // Relation bidirectionnelle
  service          Service          // Relation bidirectionnelle
  factures         Facture[]        // 1→N Factures auto-générées
}
```

**Logique:**
- Un abonnement génère **automatiquement une facture** selon sa fréquence :
  - MENSUEL → 1 facture/mois
  - TRIMESTRIEL → 1 facture/3 mois
  - ANNUEL → 1 facture/an

**Contrainte UNIQUE:**
```sql
UNIQUE(abonnementId, dateEmission)
```
→ Une seule facture par abonnement et date

**Exemple:**
```
Abonnement: "Comptabilité XYZ"
├─ Client: Entreprise XYZ
├─ Service: Comptabilité
├─ Montant: 500€
├─ Fréquence: MENSUEL
└─ Factures générées:
   ├─ Facture 001 (1er Nov 2025) → 500€
   ├─ Facture 002 (1er Dec 2025) → 500€
   └─ Facture 003 (1er Jan 2026) → 500€
```

---

### 3️⃣ **PROJET** 🟡
Missions ponctuelles ou phases de travail.

**Relations:**
```typescript
model Projet {
  clientId         String           // FK → Client
  serviceId        String           // FK → Service
  equipeId         String?          // FK → Équipe (optionnel)
  client           Client           // Relation bidirectionnelle
  service          Service          // Relation bidirectionnelle
  equipe           Équipe?          // Relation bidirectionnelle
  factures         Facture[]        // 1→N Plusieurs factures (acompte, solde...)
  taches           Tache[]          // 1→N Sous-tâches du projet
  paiements        Paiement[]       // 1→N Paiements directs
}
```

**Logique:**
- Un projet peut générer **1 ou plusieurs factures** :
  - Facture 1 : Acompte (30%)
  - Facture 2 : Solde (70%)
  - Facture 3 : Frais supplémentaires

**Exemple:**
```
Projet: "Audit comptable 2025"
├─ Client: Entreprise XYZ
├─ Service: Audit
├─ Budget: 3000€
├─ Début: Jan 2025 | Fin: Mar 2025
├─ Équipe: Team Audit
│
├─ TÂCHES:
│  ├─ Révision des comptes (100€)
│  ├─ Vérification TVA (200€)
│  └─ Rapport final (300€)
│
└─ FACTURES:
   ├─ Facture 001: Acompte 1500€ (Jan 2025)
   │  └─ Paiement: 1500€ (Reçu le 15 Jan)
   └─ Facture 002: Solde 1500€ (Mar 2025)
      ├─ Paiement: 750€ (Reçu le 10 Mar)
      └─ Paiement: 750€ (Reçu le 25 Mar)
```

---

### 4️⃣ **FACTURE** 🔴
Cœur du système de facturation.

**Relations:**
```typescript
model Facture {
  clientId         String           // FK ← Client (OBLIGATOIRE)
  abonnementId     String?          // FK ← Abonnement (NULL si manuelle/projet)
  projetId         String?          // FK ← Projet (NULL si abonnement)
  
  client           Client           // Relation bidirectionnelle
  abonnement       Abonnement?      // Relation nullable
  projet           Projet?          // Relation nullable
  paiements        Paiement[]       // 1→N Plusieurs paiements possibles
  taches           Tache[]          // 1→N Tâches facturées
}
```

**Types de factures:**

| Type | abonnementId | projetId | Description |
|------|---|---|---|
| **Auto-Abonnement** | ✅ Non-null | ❌ Null | Générée automatiquement par un abonnement |
| **Projet** | ❌ Null | ✅ Non-null | Facture d'une mission ponctuelle |
| **Manuelle** | ❌ Null | ❌ Null | Créée manuellement (rare) |

**Statuts possibles:**
```typescript
enum StatutFacture {
  BROUILLON              // En cours de rédaction
  EN_ATTENTE             // Émise, en attente de paiement
  PARTIELLEMENT_PAYEE    // Reçoit des paiements progressifs
  PAYEE                  // 100% reçu
  RETARD                 // Dépassé la date d'échéance
  ANNULEE                // Annulée
}
```

**Exemple d'une facture auto (Abonnement):**
```
Facture 001
├─ Client: Entreprise XYZ
├─ Abonnement: Comptabilité 500€/mois
├─ Projet: NULL (car générée par abonnement)
├─ Montant HT: 500€
├─ TVA (18%): 90€
├─ Total TTC: 590€
├─ Date d'émission: 2025-12-01
├─ Date d'échéance: 2025-12-31
├─ Statut: EN_ATTENTE
└─ Paiements:
   └─ 1 paiement de 590€ (Virement le 15/12)
      → Facture devient PAYÉE
```

**Exemple d'une facture projet:**
```
Facture 002
├─ Client: Entreprise XYZ
├─ Abonnement: NULL (car liée à un projet)
├─ Projet: Audit comptable 2025
├─ Montant HT: 1500€ (acompte)
├─ TVA (18%): 270€
├─ Total TTC: 1770€
├─ Date d'émission: 2025-01-01
├─ Date d'échéance: 2025-01-31
├─ Statut: PARTIELLEMENT_PAYEE
└─ Paiements:
   ├─ Paiement 1: 885€ le 15/01 (50%)
   ├─ Paiement 2: 885€ le 20/01 (50%)
   → Facture devient PAYÉE
```

---

### 5️⃣ **PAIEMENT** 🔵
Toujours lié à une facture (obligatoire).

**Relations:**
```typescript
model Paiement {
  factureId        String           // FK ← Facture (OBLIGATOIRE)
  clientId         String           // FK ← Client (OBLIGATOIRE)
  tacheId          String?          // FK ← Tâche (optionnel, contexte)
  projetId         String?          // FK ← Projet (optionnel, contexte)
  
  facture          Facture          // Relation obligatoire
  client           Client           // Relation obligatoire
  tache            Tache?           // Relation optionnelle
  projet           Projet?          // Relation optionnelle
}
```

**⚠️ RÈGLE CRUCIALE:**
```
Un paiement DOIT toujours être lié à UNE FACTURE.
Un paiement ne peut pas exister sans facture.
```

**Statuts possibles:**
```typescript
enum StatutPaiement {
  EN_ATTENTE    // Enregistré mais non reçu
  CONFIRME      // Reçu et confirmé
  REFUSE        // Refusé par la banque
  REMBOURSE     // Remboursement émis
}
```

**Moyens de paiement:**
```typescript
enum MoyenPaiement {
  ESPECES
  CHEQUE
  VIREMENT_BANCAIRE
  CARTE_BANCAIRE
  MOBILE_MONEY
  PAYPAL
  AUTRE
}
```

**Exemple:**
```
Paiement 1
├─ Facture: 001 (Abonnement Comptabilité)
├─ Client: Entreprise XYZ
├─ Montant: 590€
├─ Moyen: VIREMENT_BANCAIRE
├─ Référence: REF12345
├─ Date de paiement: 2025-12-15
├─ Date de réception: 2025-12-17
├─ Statut: CONFIRME
├─ Tâche: NULL (pas liée à une tâche spécifique)
└─ Projet: NULL (générée par abonnement)
```

---

### 6️⃣ **TÂCHE** 🟠
Éléments de travail décomposant un projet.

**Relations:**
```typescript
model Tache {
  projetId         String           // FK → Projet (OBLIGATOIRE)
  serviceId        String?          // FK → Service (optionnel)
  assigneAId       String?          // FK → Utilisateur (optionnel)
  factureId        String?          // FK → Facture (optionnel)
  equipeId         String?          // FK → Équipe (optionnel)
  
  projet           Projet           // Relation bidirectionnelle
  service          Service?         // Relation optionnelle
  assigneA         Utilisateur?     // Relation optionnelle
  facture          Facture?         // Relation optionnelle
  equipe           Équipe?          // Relation optionnelle
  paiements        Paiement[]       // 1→N Paiements liés à cette tâche
}
```

**Logique:**
- Une tâche est **toujours liée à un projet**
- Une tâche peut être **facturée séparément** (si factureId est remplie)
- Une tâche peut avoir **plusieurs paiements** (si montant échelonné)

**Statuts possibles:**
```typescript
enum StatutTache {
  A_FAIRE       // Non commencée
  EN_COURS      // En train d'être travaillée
  EN_REVISION   // À vérifier
  TERMINE       // Complétée
  ANNULE        // Annulée
}
```

**Exemple:**
```
Tâche: "Révision des comptes"
├─ Projet: Audit comptable 2025
├─ Service: Audit
├─ Assignée à: Jean (Manager)
├─ Équipe: Team Audit
├─ Montant: 100€
├─ Statut: TERMINE
├─ Facturable: true
└─ Factures: Facture 002 (Audit)
```

---

### 7️⃣ **SERVICE** 🟢
Catalogue des services offerts.

**Relations:**
```typescript
model Service {
  categorie        CategorieService
  categoryId       String?          // FK → ServiceCategory (optionnel)
  
  category         ServiceCategory? // Relation optionnelle
  abonnements      Abonnement[]     // 1→N Abonnements utilisant ce service
  projets          Projet[]         // 1→N Projets utilisant ce service
  taches           Tache[]          // 1→N Tâches utilisant ce service
}

model ServiceCategory {
  nom              String           // ex: "Comptabilité", "Audit"
  services         Service[]        // 1→N Services de cette catégorie
}
```

**Exemple:**
```
ServiceCategory: "Comptabilité"
├─ Service 1: Déclaration TVA
├─ Service 2: Bilan comptable
├─ Service 3: Suivi d'entreprise
└─ Service 4: Audit interne

Service: "Bilan comptable"
├─ Catégorie: Comptabilité
├─ Prix: 500€
├─ Utilisé dans:
│  ├─ Abonnement: "Comptabilité 500€/mois"
│  └─ Projet: "Audit 2025"
```

---

## 📋 TABLEAUX DE SYNTHÈSE

### Matrice de Relation: Client → Facture

| Origine de la Facture | abonnementId | projetId | Fréquence | Exemples |
|---|---|---|---|---|
| **Abonnement** | ✅ FK | ❌ NULL | Mensuel/Trimestriel/Annuel | Comptabilité récurrente |
| **Projet** | ❌ NULL | ✅ FK | Unique ou par phases | Audit, Étude de marché |
| **Manuelle** | ❌ NULL | ❌ NULL | N/A | Factures d'ajustement |

---

### Flux Complet: Abonnement → Paiement

```
1. CLIENT souscrit ABONNEMENT
   ↓
2. SYSTÈME génère automatiquement FACTURE
   (chaque période, ex: 1er du mois)
   ↓
3. CLIENT reçoit FACTURE
   ├─ Facture avec statut: EN_ATTENTE
   ├─ Date d'échéance: +30 jours
   ├─ Montant: 500€ HT + 90€ TVA = 590€ TTC
   ↓
4. CLIENT effectue PAIEMENT(S)
   ├─ Option A: 1 paiement de 590€
   │  → Facture devient PAYÉE
   ├─ Option B: 2 paiements de 295€ chacun
   │  → Facture devient PARTIELLEMENT_PAYEE
   │  → Puis PAYÉE après 2e paiement
   ↓
5. NOTIFICATION envoyée
   ├─ Si paiement reçu: "Facture payée"
   ├─ Si date d'échéance approche: "Facture en retard"
```

---

### Flux Complet: Projet → Paiement

```
1. CLIENT accepte PROJET
   ↓
2. PROJET est créé avec TÂCHES
   ├─ Tâche 1: Révision (100€)
   ├─ Tâche 2: Vérification (200€)
   └─ Tâche 3: Rapport (300€)
   ↓
3. TÂCHES sont complétées et FACTURÉES
   ├─ Facture 1 (Acompte): 150€ (30%)
   └─ Facture 2 (Solde): 350€ (70%)
   ↓
4. CLIENT effectue PAIEMENT(S)
   ├─ Facture 1: 150€ (payée en 1 fois)
   └─ Facture 2: 350€ (payée en 2 fois: 175€ + 175€)
   ↓
5. Suivi des PAIEMENTS
   ├─ Si date d'échéance dépassée: Facture RETARD
   ├─ NOTIFICATION: "Paiement en retard"
```

---

## 🔧 OPÉRATIONS CRITIQUES

### ✅ Créer une FACTURE via ABONNEMENT

```typescript
// 1. Abonnement existe déjà
const abonnement = await prisma.abonnement.findUnique({
  where: { id: "abc123" },
  include: { client: true, service: true }
});

// 2. Créer la facture automatiquement
const facture = await prisma.facture.create({
  data: {
    numero: "FAC-2025-001",
    clientId: abonnement.clientId,
    abonnementId: abonnement.id,      // ← Clé: lier à l'abonnement
    projetId: null,                    // ← NULL car pas de projet
    montant: abonnement.montant,
    montantTotal: abonnement.montant * 1.18,
    dateEmission: new Date(),
    dateEcheance: new Date(Date.now() + 30*24*60*60*1000), // +30 jours
    statut: "EN_ATTENTE"
  }
});
```

### ✅ Créer une FACTURE via PROJECT

```typescript
const projet = await prisma.projet.findUnique({
  where: { id: "proj123" },
  include: { client: true, taches: true }
});

const facture = await prisma.facture.create({
  data: {
    numero: "FAC-2025-002",
    clientId: projet.clientId,
    abonnementId: null,                // ← NULL car pas d'abonnement
    projetId: projet.id,               // ← Clé: lier au projet
    montant: 1500,                     // Acompte
    montantTotal: 1500 * 1.18,
    dateEmission: new Date(),
    dateEcheance: new Date(Date.now() + 30*24*60*60*1000),
    statut: "EN_ATTENTE"
  }
});
```

### ✅ Enregistrer un PAIEMENT

```typescript
const paiement = await prisma.paiement.create({
  data: {
    factureId: facture.id,            // ← OBLIGATOIRE: FK vers facture
    clientId: facture.clientId,       // ← OBLIGATOIRE
    montant: 590,
    moyenPaiement: "VIREMENT_BANCAIRE",
    reference: "REF12345",
    datePaiement: new Date(),
    statut: "EN_ATTENTE",
    projetId: facture.projetId,       // ← Contexte optionnel
    tacheId: null                     // ← Optionnel
  }
});

// Vérifier si la facture est entièrement payée
const totalPayes = await prisma.paiement.aggregate({
  where: { factureId: facture.id },
  _sum: { montant: true }
});

if (totalPayes._sum.montant >= facture.montantTotal) {
  await prisma.facture.update({
    where: { id: facture.id },
    data: { statut: "PAYEE" }
  });
}
```

---

## ⚠️ CONTRAINTES IMPORTANTES

| Entité | Champ | Contrainte | Raison |
|---|---|---|---|
| **Paiement** | factureId | NOT NULL | Un paiement doit toujours être lié à une facture |
| **Facture** | clientId | NOT NULL | Une facture doit toujours avoir un client |
| **Facture** | (abonnementId, dateEmission) | UNIQUE | Une seule facture par abonnement/date |
| **Abonnement** | clientId | RESTRICT | On ne peut pas supprimer un client avec des abonnements actifs |
| **Projet** | clientId | RESTRICT | On ne peut pas supprimer un client avec des projets |

---

## 📊 REQUÊTES COURANTES

### 1. Factures d'un client

```typescript
const factures = await prisma.facture.findMany({
  where: { clientId: "client123" },
  include: {
    abonnement: true,
    projet: true,
    paiements: true
  }
});
```

### 2. Factures en retard

```typescript
const enRetard = await prisma.facture.findMany({
  where: {
    statut: "RETARD",
    dateEcheance: { lt: new Date() }
  },
  include: { client: true, paiements: true }
});
```

### 3. Revenus d'un abonnement

```typescript
const revenus = await prisma.paiement.aggregate({
  where: {
    facture: {
      abonnementId: "abon123"
    },
    statut: "CONFIRME"
  },
  _sum: { montant: true }
});
```

### 4. Paiements manquants

```typescript
const facturesToutesfactures = await prisma.facture.findMany({
  where: {
    statut: { in: ["EN_ATTENTE", "PARTIELLEMENT_PAYEE", "RETARD"] }
  },
  include: {
    paiements: true
  }
});
```

---

## ✨ RÉSUMÉ FINAL

| Entité | Rôle | Clé FK Principale | Multiplicité |
|---|---|---|---|
| **Client** | Source de tout | - | 1 root |
| **Abonnement** | Contrat récurrent | clientId | N par client |
| **Projet** | Mission ponctuelle | clientId | N par client |
| **Facture** | Facturation | clientId + (abonnementId OU projetId) | N par client |
| **Paiement** | Règlement | factureId (OBLIGATOIRE) | N par facture |
| **Tâche** | Décomposition | projetId | N par projet |
| **Service** | Catalogue | - | Référentiel |

**La hiérarchie garantit:**
- ✅ Aucun paiement sans facture
- ✅ Aucune facture sans client
- ✅ Chaque abonnement génère ses propres factures
- ✅ Chaque projet peut avoir plusieurs factures
- ✅ Traçabilité complète: Client → Facture → Paiement
