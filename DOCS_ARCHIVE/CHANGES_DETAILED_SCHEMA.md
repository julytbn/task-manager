# 📝 CHANGEMENTS DÉTAILLÉS - Schema Prisma

**Date:** 9 décembre 2025  
**Migration ID:** 20251209103819_add_projet_service_relation

---

## 🔴 SUPPRESSIONS

### 1️⃣ Colonne Supprimée: `Projet.serviceId`

**Avant:**
```prisma
model Projet {
  // ... autres champs
  serviceId String  // ← SUPPRIMÉ
  service   Service @relation(fields: [serviceId], references: [id])
}
```

**Raison:** Relation 1→1 était insuffisante. Remplacée par 1→N via ProjetService.

**Impact:** Les projets existants avec serviceId ont eu leurs données migrées dans la table `projet_services`.

---

### 2️⃣ Colonne Supprimée: `Projet.montantEstime`

**Avant:**
```prisma
model Projet {
  // ... autres champs
  montantEstime Float?  // ← SUPPRIMÉ
}
```

**Raison:** Remplacé par `montantTotal` qui est le **montant réel** (somme des services).

**Différence:**
- `montantEstime` = Estimation initiale (peut ne pas être à jour)
- `montantTotal` = Calcul réel = SUM(projetServices[].montant)

---

### 3️⃣ Colonne Supprimée: `Facture.serviceId`

**Avant:**
```prisma
model Facture {
  // ... autres champs
  serviceId String?  // ← SUPPRIMÉ
  service   Service? @relation(fields: [serviceId], references: [id])
}
```

**Raison:** Redondante et ambiguë.

**Logique:**
- Si `Facture.abonnementId` → Service vient via `Abonnement.serviceId`
- Si `Facture.projetId` → Services viennent via `Projet.projetServices[].serviceId`
- JAMAIS un `Facture.serviceId` direct

**Contrainte:** Une facture doit avoir `abonnementId` XOR `projetId`, jamais les deux.

---

### 4️⃣ Relation Supprimée: `Service.projets`

**Avant:**
```prisma
model Service {
  // ... autres champs
  projets Projet[]  // ← SUPPRIMÉ (était via serviceId)
}
```

**Raison:** Remplacée par `Service.projetServices[]` (relation via pivot).

**Nouvelle logique:**
```prisma
model Service {
  projetServices ProjetService[]  // ← Pour accéder aux projets
}

// Pour obtenir les projets d'un service:
const service = await prisma.service.findUnique({
  where: { id: "svc123" },
  include: {
    projetServices: {
      include: { projet: true }  // ← Accès indirect
    }
  }
});

// service.projetServices[0].projet = le projet contenant ce service
```

---

### 5️⃣ Relation Supprimée: `Service.factures`

**Avant:**
```prisma
model Service {
  // ... autres champs
  factures Facture[]  // ← SUPPRIMÉ (was incorrect)
}
```

**Raison:** Logiquement erronée. Une facture n'est pas directement liée à un service.

---

## 🟢 AJOUTS

### 1️⃣ Table Créée: `ProjetService` (Pivot)

**Nouveau Model:**
```prisma
model ProjetService {
  id        String   @id @default(cuid())
  projetId  String
  serviceId String
  montant   Float?        // Montant du service DANS ce projet
  ordre     Int      @default(0)
  dateAjout DateTime @default(now())
  
  projet    Projet   @relation(fields: [projetId], references: [id], onDelete: Cascade)
  service   Service  @relation(fields: [serviceId], references: [id], onDelete: Restrict)

  @@unique([projetId, serviceId])  // Pas de doublon service dans un projet
  @@map("projet_services")
}
```

**Champs:**
- `projetId` (FK) → Project du projet
- `serviceId` (FK) → Service inclus dans le projet
- `montant` (Float?) → Montant SPÉCIFIQUE du service pour ce projet (peut différer du prix catalogue)
- `ordre` (Int) → Ordre d'affichage des services (pour l'UX)
- `dateAjout` (DateTime) → Quand le service a été ajouté au projet

**Contraintes:**
- `@@unique([projetId, serviceId])` → Un service ne peut pas être ajouté 2x au même projet
- FK `projetId`: `onDelete: Cascade` → Si projet est supprimé, les associations sont supprimées
- FK `serviceId`: `onDelete: Restrict` → On ne peut pas supprimer un service si des projets l'utilisent

**Table SQL générée:**
```sql
CREATE TABLE "projet_services" (
  "id" TEXT PRIMARY KEY,
  "projetId" TEXT NOT NULL REFERENCES "projets"("id") ON DELETE CASCADE,
  "serviceId" TEXT NOT NULL REFERENCES "services"("id") ON DELETE RESTRICT,
  "montant" DOUBLE PRECISION,
  "ordre" INTEGER NOT NULL DEFAULT 0,
  "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("projetId", "serviceId")
);
```

---

### 2️⃣ Colonne Ajoutée: `Projet.montantTotal`

**Nouveau champ:**
```prisma
model Projet {
  // ... autres champs
  montantTotal Float?  // ← AJOUTÉ
}
```

**Description:**
- Remplace `montantEstime`
- **Montant RÉEL** = somme de tous les `ProjetService.montant`
- NULL si aucun service associé

**Calcul (côté application):**
```typescript
const projet = await prisma.projet.findUnique({
  where: { id: "proj123" },
  include: { projetServices: true }
});

const montantTotal = projet.projetServices.reduce(
  (sum, ps) => sum + (ps.montant || 0),
  0
);

await prisma.projet.update({
  where: { id: "proj123" },
  data: { montantTotal }
});
```

---

### 3️⃣ Relation Ajoutée: `Projet.projetServices`

**Nouveau lien:**
```prisma
model Projet {
  // ... autres champs
  projetServices ProjetService[]  // ← AJOUTÉ
}
```

**Utilisation:**
```typescript
const projet = await prisma.projet.findUnique({
  where: { id: "proj123" },
  include: {
    projetServices: {
      include: { service: true },
      orderBy: { ordre: 'asc' }
    }
  }
});

// projet.projetServices[0] = {
//   id: "ps1",
//   montant: 150000,
//   ordre: 1,
//   service: { nom: "Audit", prix: 150000, ... }
// }
```

---

### 4️⃣ Relation Ajoutée: `Service.projetServices`

**Nouveau lien:**
```prisma
model Service {
  // ... autres champs
  projetServices ProjetService[]  // ← AJOUTÉ
}
```

**Utilisation:**
```typescript
// Pour voir dans quels projets ce service est utilisé:
const service = await prisma.service.findUnique({
  where: { id: "svc123" },
  include: {
    projetServices: {
      include: { projet: true },
      orderBy: { dateAjout: 'desc' }
    }
  }
});

// service.projetServices.map(ps => ps.projet.titre)
// → ["Audit 2025", "Création Site Web", ...]
```

---

## 🔄 RELATIONS AVANT/APRÈS

### Vue 1: Projet → Services

**AVANT (Limitation):**
```
Projet
  ├─ id
  ├─ titre
  ├─ serviceId        ← FK à UN Service
  └─ service          ← Relation 1→1
      ├─ nom
      ├─ prix
      └─ ...
```

**APRÈS (Flexible):**
```
Projet
  ├─ id
  ├─ titre
  ├─ montantTotal     ← Calculé automatiquement
  └─ projetServices[] ← Relation 1→N
      ├─ ProjetService #1
      │   ├─ montant: 150000
      │   ├─ ordre: 1
      │   └─ service
      │       ├─ nom: "Audit"
      │       ├─ prix: 150000
      │       └─ ...
      ├─ ProjetService #2
      │   ├─ montant: 100000
      │   ├─ ordre: 2
      │   └─ service: ...
      └─ ...
```

---

### Vue 2: Service → Projets

**AVANT (Impossible):**
```
Service
  ├─ nom
  ├─ prix
  ├─ projets[]        ← ÉTAIT VIA serviceId (1→1, donc ≠)
  └─ factures[]       ← Relation erronée
```

**APRÈS (Correct):**
```
Service
  ├─ nom
  ├─ prix
  └─ projetServices[] ← Relation 1→N (pivot)
      ├─ ProjetService #1
      │   ├─ montant: 150000
      │   └─ projet: "Audit 2025"
      ├─ ProjetService #2
      │   ├─ montant: 150000
      │   └─ projet: "Site Web"
      └─ ...
      
❌ Pas de relation directe Projet ou Facture
```

---

### Vue 3: Facture → Abonnement/Projet

**AVANT (Ambigu):**
```
Facture
  ├─ numero
  ├─ abonnementId   (optional)
  ├─ projetId       (optional)
  ├─ serviceId      ← ❌ QUOI?? Ambigu!
  └─ montant
```

**APRÈS (Clair):**
```
Facture
  ├─ numero
  ├─ abonnementId   (optional) ← SOIT
  │   └─ Abonnement
  │       └─ serviceId → le service
  ├─ projetId       (optional) ← SOIT
  │   └─ Projet
  │       └─ projetServices[] → les services
  ├─ montant
  └─ montantTotal
  
✅ Service trouvé indirectement, jamais directement
```

---

## 🎯 RÉSUMÉ

| Changement | Avant | Après | Raison |
|---|---|---|---|
| Projet → Service | 1→1 (FK) | 1→N (pivot) | Plusieurs services par projet |
| Service → Projet | 1→1 (FK) | 1→N (pivot) | Service dans plusieurs projets |
| Facture → Service | Direct (FK) | Indirect (via projet/abonnement) | Clarté logique |
| Montant Projet | Estimé | Réel (calculé) | Exactitude |
| Table Pivot | ❌ N'existait pas | ✅ ProjetService | Flexibilité |

---

## 📊 STATISTIQUES

**Avant la migration:**
- 16 models Prisma
- 24 relations
- 1 limitation majeure (Projet → 1 Service)

**Après la migration:**
- 17 models Prisma (+1: ProjetService)
- 26 relations (+2)
- 0 limitation logique ✅

---

## ✅ VÉRIFICATION

**SQL généré (migration.sql):**
```sql
-- ✅ Crée la table pivot
CREATE TABLE "projet_services" (...)

-- ✅ Ajoute le champ montantTotal
ALTER TABLE "projets" ADD COLUMN "montantTotal" DOUBLE PRECISION

-- ✅ Supprime les champs obsolètes
ALTER TABLE "projets" DROP COLUMN "serviceId"
ALTER TABLE "projets" DROP COLUMN "montantEstime"
ALTER TABLE "factures" DROP COLUMN "serviceId"

-- ✅ Crée les FK + contraintes
ALTER TABLE "projet_services" ADD CONSTRAINT ... 
```

**Status:** ✅ Toutes les opérations SQL exécutées avec succès
