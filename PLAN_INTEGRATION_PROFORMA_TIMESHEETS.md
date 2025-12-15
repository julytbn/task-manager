# 📋 PLAN D'INTÉGRATION : PROFORMA + TIMESHEETS + NOTIFICATIONS

**Date**: 11 Décembre 2025  
**Objectif**: Intégrer les réalités internes de l'entreprise sans casser votre système automatisé existant  
**Approche**: ADDITIONNEL, pas REMPLAÇANT

---

## 🎯 RÉSUMÉ EXÉCUTIF

Tu avais conçu un système **100% automatisé et logique**. L'entreprise ajoute des **processus manuels parallèles** qui coexistent.

| Aspect | Ce que tu avais | Ce qu'ils font maintenant | Solution |
|--------|-----------------|--------------------------|----------|
| **Factures** | Auto-générées | Créent manuellement des Pro Formas | ✅ Ajouter modèle `ProForma` |
| **Suivi temps** | Implicite dans Tâche | Formels TimeSheets | ✅ Déjà dans schema (utiliser mieux) |
| **Notifications** | Par événement | 5 jours avant échéance | ✅ Ajouter job CRON |
| **Lien GUDEF** | N/A | Intégration admin | ⏳ Après base stable |
| **Salaires** | N/A | Prévision + TimeSheets | ⏳ Après base stable |

---

## 📍 PARTIE 1: FACTURE PRO FORMA

### 1.1 Pourquoi c'est différent

**Facture Auto (ce que tu avais)**:
```
Abonnement actif → Auto-génère facture mensuelle
Projet validé → Auto-génère facture à l'étape X
Tâche payable → Auto-ajoute à facture
```

**Pro Forma (ce qu'ils font)**:
```
Client appelle → Manager crée manuellement
Validation interne → Envoie PDF au client
Client accepte → Devient commande ou devient facture
```

### 1.2 Modèle Prisma à AJOUTER

```prisma
model ProForma {
  id                String           @id @default(cuid())
  numero            String           @unique
  clientId          String
  projetId          String?
  
  // Montants
  montant           Float            // HT
  tauxTVA           Float            @default(0.18)
  montantTotal      Float            // TTC
  
  // Détails
  description       String?          // "Prestation de consulting", etc.
  lignes            ProFormaLigne[]
  
  // Statuts & Dates
  statut            StatutProForma   @default(EN_COURS)      // EN_COURS, ACCEPTEE, REJETEE, FACTUREE
  dateCreation      DateTime         @default(now())
  dateValidation    DateTime?
  dateEcheance      DateTime?
  dateConversion    DateTime?        // Quand elle devient facture
  
  // Traçabilité
  creePar           String?          // ID utilisateur
  notes             String?
  
  // Relations
  client            Client           @relation(fields: [clientId], references: [id], onDelete: Cascade)
  projet            Projet?          @relation(fields: [projetId], references: [id], onDelete: SetNull)
  facture           Facture?         // Facture générée de cette Pro Forma
  
  @@unique([clientId, numero])
  @@map("pro_formas")
}

model ProFormaLigne {
  id                String           @id @default(cuid())
  proFormaId        String
  designation       String           // "Audit fiscal Q3", etc.
  montantAPayer     Float            // HT
  montantGlobal     Float            // TTC
  ordre             Int              @default(0)
  dateCreation      DateTime         @default(now())
  
  proForma          ProForma         @relation(fields: [proFormaId], references: [id], onDelete: Cascade)
  
  @@map("pro_forma_lignes")
}

enum StatutProForma {
  EN_COURS          // Créée, pas encore envoyée
  ENVOYEE           // Envoyée au client
  ACCEPTEE          // Client a accepté
  REJETEE           // Client a refusé
  FACTUREE          // Convertie en facture réelle
  EXPIREE           // Dépassé la date limite
}
```

### 1.3 Où mettre le bouton "Créer Pro Forma"

**Dashboard Client** → Onglet "Factures"

```tsx
// Dans: app/clients/[id]/page.tsx
// Component: ClientDetailTabs.tsx - Tab "factures"

<div className="mt-4">
  <button onClick={() => setIsProFormaModalOpen(true)}>
    <Plus className="w-4 h-4 mr-2" />
    Créer Pro Forma
  </button>
</div>

<ProFormaModal 
  clientId={client.id}
  isOpen={isProFormaModalOpen}
  onClose={() => setIsProFormaModalOpen(false)}
/>
```

### 1.4 Modèle du Formulaire Pro Forma

```tsx
// Component: components/ProFormaModal.tsx
// Champs:

1. Numéro (auto-généré: PF-AAAA-XXXXX)
2. Client (auto-rempli)
3. Projet (dropdown, optionnel)
4. Lignes dynamiques:
   - Désignation (ex: "Audit fiscal")
   - Montant HT
   - Automatique → Montant TTC
5. Date d'échéance (optionnel)
6. Notes/description
7. Boutons:
   - Créer & Enregistrer
   - Créer & Envoyer (futur: email)
   - Annuler
```

### 1.5 API à créer

```typescript
// POST /api/pro-formas
// GET /api/pro-formas
// GET /api/pro-formas/[id]
// PUT /api/pro-formas/[id]
// POST /api/pro-formas/[id]/convert-to-invoice  // Convertir en facture
// DELETE /api/pro-formas/[id]
```

---

## ⏱️ PARTIE 2: TIMESHEETS (Déjà dans le schema)

### 2.1 Situation actuelle

✅ **Modèle Prisma existant** (schema.prisma ligne ~600):
```prisma
model TimeSheet {
  id              String            @id @default(cuid())
  date            DateTime
  regularHrs      Int               // heures normales
  overtimeHrs     Int?              // heures supplémentaires
  sickHrs         Int?              // maladie
  vacationHrs     Int?              // congés
  statut          StatutTimeSheet   @default(EN_ATTENTE)
  employeeId      String
  taskId          String            // Lien à Tâche
  projectId       String            // Lien à Projet
  ...
}
```

✅ **Problème**: Modèle existe mais **Frontend n'existe pas**

### 2.2 Où intégrer TimeSheets dans le Dashboard

**Option 1 - Dashboard Employé** (RECOMMANDÉ):
```
/app/dashboard (Employé voit ses données)
  ├─ Mes tâches en cours
  ├─ Mes heures cette semaine
  └─ ✅ NOUVEAU: Remplir TimeSheet
```

**Option 2 - Page dédiée**:
```
/app/timesheets
  ├─ Liste des timesheets
  ├─ Ajouter nouveau
  ├─ Valider (pour Manager)
```

### 2.3 Frontend à créer

```typescript
// Fichiers à créer:

1. components/TimeSheetForm.tsx
   - Semaine
   - Pour chaque jour: heures régulières, supplémentaires, maladie, congés
   - Tâche(s) assignées
   - Projet
   - Sauvegarder comme EN_ATTENTE
   - Soumettre (état: EN_ATTENTE → VALIDEE)

2. components/TimeSheetList.tsx
   - Vue: Employé voit les siens (EN_ATTENTE, VALIDEE, REJETEE)
   - Vue Manager: Tous les timesheets de l'équipe, peut valider/rejeter

3. app/timesheets/page.tsx
   - Liste + formulaire
   - Filtre par semaine/employé/statut

4. app/api/timesheets/route.ts
   - GET, POST, PUT
```

### 2.4 Logique TimeSheet

```
Employé remplit TimeSheet
  ↓
TimeSheet.statut = EN_ATTENTE
  ↓
Manager valide (peut voir tous les timesheets)
  ↓
TimeSheet.statut = VALIDEE ou REJETEE
  ↓
Si VALIDEE → Données utilisées pour:
  - Calcul heures travaillées (pour Tâche.heuresReelles)
  - Prévision salaires (futur)
```

---

## 🔔 PARTIE 3: NOTIFICATIONS 5 JOURS AVANT

### 3.1 Quoi notifier

```
Pour chaque:
- Facture en attente de paiement
- Abonnement arrivant à échéance
- Tâche avec date d'échéance proche

Déclencher 5 jours AVANT la date d'échéance:
```

### 3.2 Job CRON existant

✅ **Existe déjà** dans `/app/api/cron/`

À modifier/ajouter:

```typescript
// app/api/cron/notifications.ts (NOUVEAU ou à modifier)

export async function POST() {
  const today = new Date()
  const in5Days = new Date(today)
  in5Days.setDate(in5Days.getDate() + 5)

  // 1️⃣ Factures
  const facturesEchue = await prisma.facture.findMany({
    where: {
      statut: { not: 'PAYEE' },
      dateEcheance: {
        gte: today,
        lte: in5Days
      },
      paiements: { none: {} }  // Pas encore payée
    }
  })

  for (const facture of facturesEchue) {
    await prisma.notification.create({
      data: {
        utilisateurId: facture.client.id,  // Au client
        titre: `Facture ${facture.numero} due dans 5 jours`,
        message: `Paiement de ${facture.montantTotal}€ attendu le ${formatDate(facture.dateEcheance)}`,
        type: 'ALERTE',
        lien: `/factures/${facture.id}`
      }
    })
  }

  // 2️⃣ Abonnements
  const abonnementsExpiring = await prisma.abonnement.findMany({
    where: {
      statut: 'ACTIF',
      dateFin: {
        gte: today,
        lte: in5Days
      }
    }
  })

  for (const abo of abonnementsExpiring) {
    await prisma.notification.create({
      data: {
        utilisateurId: abo.client.id,
        titre: `Abonnement "${abo.nom}" expire dans 5 jours`,
        message: `Votre abonnement prendra fin le ${formatDate(abo.dateFin)}. Renouveler?`,
        type: 'ALERTE'
      }
    })
  }

  // 3️⃣ Tâches
  const tachesExpiring = await prisma.tache.findMany({
    where: {
      statut: { not: 'TERMINE' },
      dateEcheance: {
        gte: today,
        lte: in5Days
      }
    }
  })

  for (const tache of tachesExpiring) {
    if (tache.assigneAId) {
      await prisma.notification.create({
        data: {
          utilisateurId: tache.assigneAId,
          titre: `Tâche "${tache.titre}" due dans 5 jours`,
          message: `Échéance: ${formatDate(tache.dateEcheance)}`,
          type: 'ALERTE',
          lien: `/taches/${tache.id}`
        }
      })
    }
  }

  return NextResponse.json({ ok: true })
}
```

### 3.3 Configuration CRON

```typescript
// vercel.json (si Vercel)
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 9 * * *"  // Chaque jour à 9h
    }
  ]
}

// Ou localement: utiliser node-cron
// scripts/scheduledJobs.ts
```

---

## 🏗️ PARTIE 4: ARCHITECTURE DE DÉCISION

### 4.1 Factures: Auto vs Pro Forma (Qui utilise quoi?)

```
┌─────────────────────────────────────────┐
│        CLIENT ABONNEMENT ACTIF          │
└─────────────────────────────────────────┘
           ↓
    ┌──────────────┴──────────────┐
    ↓                             ↓
AUTO-FACTURE                 PRO FORMA
(mois prochain)         (manuel si besoin)
- Totalement automatique    - Manager décide
- Facture comptable         - Document précommande
- Paiement obligatoire      - Client accepte/refuse
```

**Logique**:
- Les abonnements **continuent** à auto-générer des factures (ton système existant)
- Les **Pro Formas** = documents de négociation préalables
- Si client accepte Pro Forma → Manager peut la **convertir en facture réelle**

### 4.2 Quand utiliser Pro Forma

✅ **Utiliser Pro Forma quand**:
- Devis/estimation avant engagement
- Plusieurs options de prix à présenter
- Négociation nécessaire

✅ **Utiliser Facture Auto quand**:
- Abonnement en cours (tu l'as déjà)
- Projet dont le scope est fixe
- Tâche facturée (ta logique existante)

### 4.3 Lien Facture Auto ← Pro Forma Acceptée

```typescript
// Si manager accepte Pro Forma:
// 1. Pro Forma.statut = ACCEPTEE
// 2. Manager clique "Convertir en facture"
// 3. Création Facture:

const facture = await prisma.facture.create({
  data: {
    numero: "FAC-AAAA-XXXXX",
    clientId: proForma.clientId,
    projetId: proForma.projetId,
    montant: proForma.montant,
    montantTotal: proForma.montantTotal,
    statut: 'VALIDEE'  // Prête à payer
    // Copie les lignes, etc.
  }
})

// Puis:
proForma.statut = 'FACTUREE'
proForma.dateConversion = now()
```

---

## 📊 PARTIE 5: TIMELINE INTÉGRATION

### Phase 1: Foundation (Jour 1-2)
```
✅ Ajouter ProForma au schema.prisma
✅ Générer Prisma client (npx prisma generate)
✅ Créer API ProForma (CRUD)
✅ Créer composant ProFormaModal
✅ Tester création/affichage
```

### Phase 2: Frontend Client (Jour 3-4)
```
✅ Ajouter onglet Pro Formas dans ClientDetailTabs
✅ Liste Pro Formas avec statuts
✅ Bouton "Voir PDF" (preview)
✅ Bouton "Convertir en facture"
✅ Bouton "Supprimer"
```

### Phase 3: TimeSheets (Jour 5-6)
```
✅ Créer TimeSheetForm (UI)
✅ API TimeSheet CRUD
✅ Afficher dans Dashboard Employé
✅ Validation Manager
```

### Phase 4: Notifications CRON (Jour 7)
```
✅ Job CRON 5 jours avant
✅ Tester avec dates proches
✅ Interface notifications (déjà existe)
```

### Phase 5: Futur (Salaires, GUDEF)
```
⏳ Après base stable
⏳ Prévision salaires basée TimeSheets
⏳ Export GUDEF
```

---

## 🔗 FICHIERS À CRÉER/MODIFIER

### À CRÉER (Nouveaux):

```
✅ prisma/schema.prisma
   └─ Ajouter ProForma + ProFormaLigne

✅ app/api/pro-formas/route.ts
   └─ GET, POST

✅ app/api/pro-formas/[id]/route.ts
   └─ GET, PUT, DELETE

✅ app/api/pro-formas/[id]/convert-to-invoice/route.ts
   └─ POST (convertir en facture)

✅ components/ProFormaModal.tsx
   └─ Formulaire création

✅ components/ProFormaList.tsx
   └─ Affichage liste + actions

✅ components/TimeSheetForm.tsx
   └─ Formulaire TimeSheet

✅ app/timesheets/page.tsx
   └─ Page dédiée (optionnel, ou dans dashboard)

✅ app/api/cron/notifications.ts
   └─ Job 5 jours avant
```

### À MODIFIER:

```
✅ components/ClientDetailTabs.tsx
   └─ Ajouter onglet ProFormas + TimeSheets (optionnel)

✅ app/dashboard/page.tsx (Employé)
   └─ Ajouter widget TimeSheets

✅ app/api/timesheets/route.ts
   └─ Améliorer le CRUD (basique existe)

✅ vercel.json ou config CRON
   └─ Ajouter job notifications
```

---

## 🎯 RÉSUMÉ DE LA LOGIQUE (Pour toi)

**Tu gardes tout ce que tu as créé** ✅

1. **Système Factures Auto** → Continue de fonctionner
   - Abonnements auto-génèrent factures ✅
   - Projets auto-génèrent factures ✅
   - Tâches contribuent aux factures ✅

2. **Ajout Pro Forma** → Parallèle au système auto
   - Manager crée manuellement ✅
   - Client accepte/refuse ✅
   - Convert en facture réelle si accepted ✅

3. **TimeSheets** → Utilise le modèle existant
   - Frontend à créer ✅
   - Trace heures réelles ✅
   - Manager valide ✅

4. **Notifications** → Job CRON
   - 5 jours avant échéance ✅
   - Pour Factures, Abonnements, Tâches ✅

---

## ❓ QUESTIONS CLARIFICATION

Si tu veux confirmer avant de commencer:

1. **Pro Forma**: Voulez-vous vraiment **deux systèmes parallèles** (Auto + Manuel)?
   - Ou seulement des Pro Formas (suppression factures auto)?

2. **TimeSheets**: Qui doit pouvoir les créer?
   - Employé lui-même? 
   - Manager pour son équipe?
   - Les deux?

3. **Notifications**: Seulement "5 jours avant" ou aussi:
   - 1 jour avant?
   - À la date d'échéance (le jour même)?

4. **Lien GUDEF**: Quand voulez-vous démarrer cette intégration?
   - Après Pro Formas stables?

5. **Prévision salaires**: Basée sur:
   - TimeSheets validés?
   - Heures régulières uniquement?

---

**Prêt à commencer l'implémentation?** 🚀

Dis-moi:
1. Valides-tu ce plan?
2. Quelles sont tes réponses aux questions clarification?
3. Veux-tu que j'implémente Phase 1 tout de suite?
