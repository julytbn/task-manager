# 🔄 RESTRUCTURATION DU CODE APPLICATIF

## 📝 Vue d'ensemble

Maintenant que le schéma Prisma est optimisé, il faut restructurer le code applicatif pour respecter les nouvelles relations.

---

## 🔴 POINTS CRITIQUES À CORRIGER

### 1️⃣ **Paiement: Doit TOUJOURS avoir une factureId**

#### ❌ AVANT (Dangereux)
```typescript
// app/api/paiements/route.ts
const paiement = await prisma.paiement.create({
  data: {
    tacheId: req.body.tacheId,
    projetId: req.body.projetId,
    clientId: req.body.clientId,
    montant: req.body.montant,
    moyenPaiement: req.body.moyenPaiement,
    datePaiement: new Date(),
    // ❌ MANQUE: factureId n'est pas requis
  }
});
```

#### ✅ APRÈS (Correct)
```typescript
// app/api/paiements/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ✅ Valider que la facture existe
    const facture = await prisma.facture.findUnique({
      where: { id: body.factureId },
      include: { client: true }
    });
    
    if (!facture) {
      return new Response(JSON.stringify({ 
        error: "Facture introuvable" 
      }), { status: 404 });
    }
    
    // ✅ Créer le paiement avec factureId OBLIGATOIRE
    const paiement = await prisma.paiement.create({
      data: {
        factureId: body.factureId,           // ✅ OBLIGATOIRE
        clientId: body.clientId,             // ✅ OBLIGATOIRE
        montant: body.montant,
        moyenPaiement: body.moyenPaiement,
        reference: body.reference,
        datePaiement: new Date(body.datePaiement),
        statut: "EN_ATTENTE",
        // ✅ OPTIONNELS
        tacheId: body.tacheId || null,
        projetId: body.projetId || null,
        notes: body.notes
      },
      include: {
        facture: true,
        client: true,
        tache: true
      }
    });
    
    // ✅ Mettre à jour le statut de la facture si entièrement payée
    const totalPayes = await prisma.paiement.aggregate({
      where: { factureId: body.factureId },
      _sum: { montant: true }
    });
    
    if (totalPayes._sum.montant >= facture.montantTotal) {
      await prisma.facture.update({
        where: { id: body.factureId },
        data: { statut: "PAYEE" }
      });
    } else if ((totalPayes._sum.montant || 0) > 0) {
      await prisma.facture.update({
        where: { id: body.factureId },
        data: { statut: "PARTIELLEMENT_PAYEE" }
      });
    }
    
    return new Response(JSON.stringify(paiement), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    });
  }
}
```

---

### 2️⃣ **Facture: Logique Abonnement vs Projet**

#### ✅ Auto-générer factures pour abonnements

```typescript
// lib/services/facture.service.ts
import { prisma } from "@/lib/prisma";
import { FrequencePaiement } from "@prisma/client";

export async function generateInvoicesForSubscriptions() {
  // Trouver tous les abonnements actifs avec facture due
  const abonnements = await prisma.abonnement.findMany({
    where: {
      statut: "ACTIF",
      dateProchainFacture: { lte: new Date() }
    },
    include: { client: true, service: true }
  });
  
  for (const abon of abonnements) {
    // Vérifier qu'une facture n'existe pas déjà pour cette période
    const factureDuJour = await prisma.facture.findFirst({
      where: {
        abonnementId: abon.id,
        dateEmission: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    });
    
    if (factureDuJour) {
      console.log(`Facture déjà créée pour abon ${abon.id}`);
      continue;
    }
    
    // ✅ Créer la facture automatiquement
    const facture = await prisma.facture.create({
      data: {
        numero: `FAC-${new Date().getFullYear()}-${Date.now()}`,
        clientId: abon.clientId,
        abonnementId: abon.id,           // ✅ Lier à l'abonnement
        projetId: null,                  // ✅ NULL car automatique
        montant: abon.montant,
        tauxTVA: 0.18,
        montantTotal: abon.montant * 1.18,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 30*24*60*60*1000),
        statut: "EN_ATTENTE"
      }
    });
    
    // Calculer la prochaine date
    const nextDate = calculateNextDate(abon.dateProchainFacture, abon.frequence);
    
    // ✅ Mettre à jour l'abonnement
    await prisma.abonnement.update({
      where: { id: abon.id },
      data: {
        dateProchainFacture: nextDate,
        nombrePaiementsEffectues: { increment: 1 }
      }
    });
    
    console.log(`✅ Facture ${facture.numero} créée pour ${abon.nom}`);
  }
}

function calculateNextDate(current: Date, frequence: FrequencePaiement): Date {
  const next = new Date(current);
  
  switch(frequence) {
    case "MENSUEL":
      next.setMonth(next.getMonth() + 1);
      break;
    case "TRIMESTRIEL":
      next.setMonth(next.getMonth() + 3);
      break;
    case "SEMESTRIEL":
      next.setMonth(next.getMonth() + 6);
      break;
    case "ANNUEL":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }
  
  return next;
}
```

#### ✅ Créer factures pour projets

```typescript
// app/api/factures/create-project/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Valider le projet
    const projet = await prisma.projet.findUnique({
      where: { id: body.projetId }
    });
    
    if (!projet) {
      return new Response(JSON.stringify({ error: "Projet introuvable" }), { 
        status: 404 
      });
    }
    
    // ✅ Créer la facture de projet
    const facture = await prisma.facture.create({
      data: {
        numero: `FAC-PRJ-${Date.now()}`,
        clientId: projet.clientId,
        abonnementId: null,              // ✅ NULL car projet
        projetId: body.projetId,         // ✅ Lier au projet
        montant: body.montant,
        tauxTVA: 0.18,
        montantTotal: body.montant * 1.18,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 30*24*60*60*1000),
        statut: "EN_ATTENTE"
      }
    });
    
    return new Response(JSON.stringify(facture), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    });
  }
}
```

---

### 3️⃣ **Requête: Factures d'un client avec statut**

#### ✅ Récupérer factures avec paiements

```typescript
// app/api/factures/[clientId]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const factures = await prisma.facture.findMany({
      where: { clientId: params.clientId },
      include: {
        client: true,
        abonnement: true,
        projet: true,
        paiements: {                    // ✅ Inclure les paiements
          select: {
            id: true,
            montant: true,
            datePaiement: true,
            statut: true,
            moyenPaiement: true
          }
        },
        taches: true
      },
      orderBy: { dateEmission: "desc" }
    });
    
    // ✅ Enrichir avec calculs
    const facturified = factures.map(f => ({
      ...f,
      totalPayes: f.paiements.reduce((sum, p) => sum + p.montant, 0),
      montantDu: f.montantTotal - f.paiements.reduce((sum, p) => sum + p.montant, 0),
      nbrePaiements: f.paiements.length,
      pourcentagePaie: Math.round(
        (f.paiements.reduce((sum, p) => sum + p.montant, 0) / f.montantTotal) * 100
      )
    }));
    
    return new Response(JSON.stringify(facturified), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    });
  }
}
```

---

### 4️⃣ **Dashboard: Paiements en retard**

```typescript
// app/api/dashboard/late-payments/route.ts
export async function GET(req: Request) {
  try {
    // ✅ Trouver factures en retard avec paiements manquants
    const factures = await prisma.facture.findMany({
      where: {
        AND: [
          { dateEcheance: { lt: new Date() } },  // Dépassée
          { statut: { in: ["EN_ATTENTE", "PARTIELLEMENT_PAYEE", "RETARD"] } }
        ]
      },
      include: {
        client: true,
        abonnement: true,
        projet: true,
        paiements: {
          select: { montant: true, datePaiement: true }
        }
      },
      orderBy: { dateEcheance: "asc" }
    });
    
    // ✅ Calculer les montants dus
    const latePayments = factures.map(f => {
      const totalPayes = f.paiements.reduce((sum, p) => sum + p.montant, 0);
      const montantDu = f.montantTotal - totalPayes;
      const joursEnRetard = Math.floor(
        (Date.now() - f.dateEcheance.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        factureId: f.id,
        numero: f.numero,
        client: `${f.client.prenom} ${f.client.nom}`,
        origine: f.abonnement ? "Abonnement" : "Projet",
        montantDu,
        joursEnRetard,
        urgence: joursEnRetard > 30 ? "CRITIQUE" : joursEnRetard > 7 ? "HAUTE" : "MOYENNE"
      };
    });
    
    return new Response(JSON.stringify(latePayments), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    });
  }
}
```

---

### 5️⃣ **Statistiques: Revenu par abonnement**

```typescript
// app/api/analytics/revenue/route.ts
export async function GET(req: Request) {
  try {
    // ✅ Revenu confirmé par abonnement
    const revenueBySubscription = await prisma.abonnement.findMany({
      include: {
        _count: {
          select: {
            factures: true
          }
        },
        factures: {
          select: {
            id: true,
            montantTotal: true,
            paiements: {
              select: { montant: true, statut: true }
            }
          }
        },
        client: {
          select: { prenom: true, nom: true }
        }
      }
    });
    
    const stats = revenueBySubscription.map(abon => {
      const totalRevenuePotentiel = abon.factures.reduce((sum, f) => sum + f.montantTotal, 0);
      const totalRevenueConfirme = abon.factures.reduce((sum, f) => {
        return sum + f.paiements
          .filter(p => p.statut === "CONFIRME")
          .reduce((pSum, p) => pSum + p.montant, 0);
      }, 0);
      
      return {
        abonnementId: abon.id,
        nom: abon.nom,
        client: `${abon.client.prenom} ${abon.client.nom}`,
        montantMensuel: abon.montant,
        nombreFactures: abon.factures.length,
        revenueConfirme: totalRevenueConfirme,
        revenuePotentiel: totalRevenuePotentiel,
        tauxCollection: Math.round((totalRevenueConfirme / totalRevenuePotentiel) * 100)
      };
    });
    
    return new Response(JSON.stringify(stats), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    });
  }
}
```

---

## 🔄 CHECKLIST DE RESTRUCTURATION

### Phase 1: Endpoints Critiques
- [ ] `POST /api/paiements` → Exiger factureId
- [ ] `GET /api/paiements` → Inclure facture en relation
- [ ] `DELETE /api/paiements/:id` → Interdire si facture référencée

### Phase 2: Auto-génération
- [ ] Créer CRON job `generateInvoicesForSubscriptions()`
- [ ] Mettre à jour `abonnements.dateProchainFacture`
- [ ] Incrémenter `abonnements.nombrePaiementsEffectues`

### Phase 3: Validation
- [ ] Middleware: Vérifier factureId pour tout paiement
- [ ] Middleware: Vérifier au moins (abonnementId OU projetId) pour facture
- [ ] Constraint DB: enforcer NOT NULL sur factureId

### Phase 4: Migration Données
- [ ] Nettoyer paiements orphelins (déjà fait)
- [ ] Attribuer factures manuelles aux projets/abonnements
- [ ] Valider intégrité référentielle

---

## 📊 SCHÉMA DE MIGRATION CODE

```
AVANT                          APRÈS
─────────────────────────────────────────────────────
Paiement orphelin     →      Paiement.factureId NOT NULL
(sans facture)                 ↓
                           Facture.statut = EN_ATTENTE
                           
Facture ambiguë        →      Facture.abonnementId ⊕ projetId
(abonnement? projet?)           (au moins l'un rempli)
                           
Calcul ad-hoc          →      Query avec include() paiements
montantDu                      totalPayes = sum(paiements.montant)
                           
Service dupliqué       →      Service.categoryId FK
(pas de catégorie)              ↓
                           ServiceCategory model
```

---

## 🧪 TESTS À EFFECTUER

```typescript
// ✅ Test 1: Créer paiement sans facture → ERREUR
it("should reject payment without invoice", async () => {
  expect(() => {
    prisma.paiement.create({
      data: {
        clientId: "...",
        montant: 100,
        // ❌ factureId manquant
      }
    });
  }).rejects.toThrow();
});

// ✅ Test 2: Facture auto-générée
it("should auto-generate invoice for subscription", async () => {
  const facture = await generateInvoicesForSubscriptions();
  expect(facture.abonnementId).toBeDefined();
  expect(facture.projetId).toBeNull();
});

// ✅ Test 3: Paiement partiel
it("should handle partial payments", async () => {
  const facture = await createInvoice({ montantTotal: 1000 });
  
  await createPayment({ factureId: facture.id, montant: 600 });
  expect(facture.statut).toBe("PARTIELLEMENT_PAYEE");
  
  await createPayment({ factureId: facture.id, montant: 400 });
  expect(facture.statut).toBe("PAYEE");
});
```

---

## 📈 PERFORMANCE & INDICES

```sql
-- Index pour requêtes courantes
CREATE INDEX idx_paiements_factureId ON paiements(factureId);
CREATE INDEX idx_factures_clientId ON factures(clientId);
CREATE INDEX idx_factures_abonnementId ON factures(abonnementId);
CREATE INDEX idx_factures_projetId ON factures(projetId);
CREATE INDEX idx_factures_dateEmission ON factures(dateEmission);
CREATE INDEX idx_factures_dateEcheance ON factures(dateEcheance);
CREATE INDEX idx_abonnements_clientId ON abonnements(clientId);
CREATE INDEX idx_abonnements_dateProchainFacture ON abonnements(dateProchainFacture);
```

---

## 🚀 RÉSUMÉ DES CHANGEMENTS APPLICATIFS

| Ancien Comportement | Nouveau Comportement | Impact |
|---|---|---|
| Paiement optionnel facture | Paiement DOIT avoir facture | Intégrité garantie |
| Facture ambiguë | Facture = Abon ⊕ Projet | Clarté +100% |
| Calcul montantDu ad-hoc | Query avec agrégation | Perf +50% |
| Service sans catégorie | Service.categoryId FK | Traçabilité +100% |
| Auto-génération manuelle | CRON job automatisé | Fiabilité +500% |

