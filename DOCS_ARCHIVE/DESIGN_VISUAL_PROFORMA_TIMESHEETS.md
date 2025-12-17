# 🎨 RÉORGANISATION DU DASHBOARD - VUE VISUELLE

## 📱 Structure Actuelle vs Nouvelle

### AVANT (Situation actuelle)
```
┌─────────────────────────────────────────┐
│        DASHBOARD CLIENT                 │
│        (app/clients/[id])               │
└─────────────────────────────────────────┘
│
├─ 📋 Infos
├─ 💼 Abonnements
├─ 📦 Projets
├─ 📄 Factures ← Ici: Facturation Auto
├─ 💰 Paiements
├─ 📁 Documents
├─ 💬 Communications
└─ 📝 Notes
```

### APRÈS (Avec intégrations)
```
┌─────────────────────────────────────────┐
│        DASHBOARD CLIENT                 │
│        (app/clients/[id])               │
└─────────────────────────────────────────┘
│
├─ 📋 Infos
├─ 💼 Abonnements
├─ 📦 Projets
├─ 📄 Factures
│  ├─ Section 1: Factures Auto (existant)
│  │   └─ "Abonnement Mensuel - Facture Auto FAC-2025-001"
│  │
│  └─ ✨ Section 2: PRO FORMAS (NOUVEAU)
│     ├─ 🔵 En cours
│     │  └─ [PF-2025-001] "Audit Q3" - 5000€
│     │     Boutons: ✏️ Modifier | 👁️ Voir PDF | 🗑️ Supprimer
│     │
│     ├─ 🟢 Acceptées
│     │  └─ [PF-2025-002] "Consulting" - 8000€
│     │     Boutons: 📄 Convertir en facture | 📧 Envoyer | 🗑️ Supprimer
│     │
│     └─ 🔴 Rejetées
│        └─ [PF-2025-003] "Formation" - 3000€
│           Boutons: ✏️ Modifier | 🗑️ Supprimer
│
├─ 💰 Paiements
├─ 📁 Documents
├─ 💬 Communications
└─ 📝 Notes
```

---

## 👤 DASHBOARD EMPLOYÉ (Nouveau/Amélioré)

### Actuel
```
/app/dashboard

┌──────────────────────────────────────┐
│   Bonjour Jean Dupont               │
└──────────────────────────────────────┘

📊 Statistiques
├─ Tâches assignées: 12
├─ En cours: 5
└─ À faire: 7

📋 Mes tâches
├─ [Tâche 1] - À faire
├─ [Tâche 2] - En cours
└─ [Tâche 3] - À faire
```

### Nouveau (avec TimeSheets)
```
/app/dashboard

┌──────────────────────────────────────┐
│   Bonjour Jean Dupont               │
│   (EMPLOYE - Lun 11 Déc 2025)      │
└──────────────────────────────────────┘

📊 STATS SEMAINE
├─ Heures régulières: 35h / 40h ✅
├─ Heures supplémentaires: 2h
└─ Congés/Maladie: 0h

📋 MES TÂCHES (Semaine)
├─ [Tâche 1] "Audit fiscal" 
│  │─ Projet: P-001 (Acme Corp)
│  │─ Échéance: 15 Déc
│  │─ État: EN_COURS
│  └─ ⏱️ Temps enregistré: 8h / 12h estimées
│
├─ [Tâche 2] "Consultation"
│  │─ Projet: P-002 (TechCorp)
│  │─ Échéance: 18 Déc
│  │─ État: A_FAIRE
│  └─ ⏱️ Temps enregistré: 0h / 5h estimées
│
└─ [Tâche 3] "Rapport final"
   │─ Projet: P-001 (Acme Corp)
   │─ Échéance: 20 Déc
   │─ État: A_FAIRE
   └─ ⏱️ Temps enregistré: 0h / 3h estimées

⏰ TIMESHEET SEMAINE (NOUVEAU)
┌─────────────────────────────────────────────┐
│  Semaine du 9 au 13 Décembre 2025          │
├──────────┬─────────┬──────────┬──────────────┤
│  Jour    │ Normal  │ Supplém. │ Congés/Mal.  │
├──────────┼─────────┼──────────┼──────────────┤
│  Lun 9   │   8h    │    0h    │     0h       │
│  Mar 10  │   8h    │    0h    │     0h       │
│  Mer 11  │   8h    │    0h    │     0h       │
│  Jeu 12  │   8h    │    1h    │     0h       │
│  Ven 13  │   3h    │    0h    │     0h       │
├──────────┴─────────┴──────────┴──────────────┤
│  TOTAL:  35h normales | 1h supplém.         │
│  Status: 🟡 EN ATTENTE (À valider)          │
└─────────────────────────────────────────────┘

📌 ACTIONS
├─ [Soumettre TimeSheet] (modifié si EN_ATTENTE)
├─ [Éditer TimeSheet] (modifié si EN_ATTENTE)
└─ [Consulter archivés] (TimeSheets validés)

🔔 NOTIFICATIONS
├─ ⚠️  Facture FAC-2025-001 due dans 5 jours
├─ ⚠️  Tâche "Audit fiscal" due dans 5 jours
└─ ℹ️  TimeSheet validé par Manager Jean
```

---

## 👨‍💼 DASHBOARD MANAGER/ADMIN

### Nouveau: Section TimeSheets
```
/app/timesheets (ou onglet dans manager dashboard)

┌──────────────────────────────────────┐
│        GESTION TIMESHEETS            │
│        Mon équipe                    │
└──────────────────────────────────────┘

🔍 Filtres
├─ Employé: [Dropdown]
├─ Statut: [EN_ATTENTE | VALIDEE | REJETEE]
├─ Semaine: [Sélecteur de date]
└─ [Rechercher]

📋 LISTE TIMESHEETS
┌─────────────────────────────────────────────────────┐
│ Employé      │ Semaine    │ Régul. │ Suppl. │ Statut │
├──────────────┼────────────┼────────┼────────┼────────┤
│ Jean Dupont  │ 9-13 Déc   │  35h   │  1h    │ 🟡 EN ATTENTE
│              │            │        │        │ [Valider] [Rejeter] [Voir]
├──────────────┼────────────┼────────┼────────┼────────┤
│ Marie Martin │ 9-13 Déc   │  40h   │  0h    │ 🟢 VALIDEE
├──────────────┼────────────┼────────┼────────┼────────┤
│ Pierre Durand│ 9-13 Déc   │  38h   │  2h    │ 🟡 EN ATTENTE
│              │            │        │        │ [Valider] [Rejeter] [Voir]
└─────────────────────────────────────────────────────┘

📊 RÉSUMÉ SEMAINE
├─ Heures travaillées total: 113h
├─ Heures supplémentaires: 3h
├─ En attente de validation: 2 timesheets
└─ Validés: 1 timesheet
```

---

## 📄 PAGE PRO FORMAS DÉTAIL (Nouveau)

### Modal: Créer Pro Forma
```
┌─────────────────────────────────────────────────────┐
│  ✨ CRÉER PRO FORMA                          [X]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Numéro: [PF-2025-004]           (auto-généré)    │
│                                                     │
│  Client: [Acme Corporation] (auto-rempli)         │
│                                                     │
│  Projet (optionnel): [Dropdown] "Audit Fiscal"    │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ LIGNES (Détail du devis)                    │  │
│  ├─────────────────────────────────────────────┤  │
│  │                                             │  │
│  │ Ligne 1:                                    │  │
│  │ Désignation: [Audit fiscal Q3       ]      │  │
│  │ Montant HT:  [5000]€                       │  │
│  │ → Montant TTC (18%): 5900€                 │  │
│  │ [X] Supprimer ligne                        │  │
│  │                                             │  │
│  │ Ligne 2:                                    │  │
│  │ Désignation: [Consultation juridique]      │  │
│  │ Montant HT:  [2000]€                       │  │
│  │ → Montant TTC (18%): 2360€                 │  │
│  │ [X] Supprimer ligne                        │  │
│  │                                             │  │
│  │ [+ Ajouter une ligne]                      │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  📊 TOTAUX                                         │
│  ├─ Montant HT: 7000€                            │
│  ├─ TVA (18%): 1260€                             │
│  └─ TOTAL TTC: 8260€ 💰                          │
│                                                     │
│  Date d'échéance: [18/12/2025]  (optionnel)      │
│                                                     │
│  Notes (optionnel):                               │
│  ┌──────────────────────────────────────────────┐ │
│  │ Tarif réduit si paiement avant fin mois      │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  [Annuler]  [Créer Pro Forma]  [Créer & Envoyer] │
└─────────────────────────────────────────────────────┘
```

### Affichage: Liste Pro Formas (dans ClientDetailTabs)
```
┌─────────────────────────────────────────────────────┐
│  📋 PRO FORMAS                [+ Créer]             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔵 EN COURS (2)                                    │
│  ├─ PF-2025-001 "Audit Q3"                         │
│  │  │─ Montant: 5900€                             │
│  │  │─ Date: 12/12/2025                           │
│  │  │─ Projet: Acme Corp - Audit Fiscal          │
│  │  └─ [✏️ Modif] [👁️ PDF] [📧 Env] [🗑️ Del]    │
│  │                                                 │
│  └─ PF-2025-002 "Consulting"                       │
│     │─ Montant: 8260€                             │
│     │─ Date: 15/12/2025                           │
│     │─ Projet: TechCorp - Stratégie               │
│     └─ [✏️ Modif] [👁️ PDF] [📧 Env] [🗑️ Del]    │
│                                                     │
│  🟢 ACCEPTÉES (1)                                  │
│  └─ PF-2025-003 "Formation Équipe"                │
│     │─ Montant: 3600€                             │
│     │─ Date: 10/12/2025                           │
│     │─ Projet: Interne                            │
│     │─ Acceptée le: 11/12/2025 ✅                 │
│     └─ [👁️ PDF] [📄 Conv. Facture] [🗑️ Del]    │
│                                                     │
│  🔴 REJETÉES (1)                                   │
│  └─ PF-2025-004 "Maintenance Annuelle"            │
│     │─ Montant: 2000€                             │
│     │─ Rejetée le: 09/12/2025                     │
│     │─ Raison: Dépasserait le budget Q4          │
│     └─ [👁️ PDF] [✏️ Modif] [🗑️ Del]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔔 NOTIFICATIONS - Avant & Après

### AVANT (Actuellement)
```
🔔 Notifications (vous en avez 0)
├─ Tâche assignée
└─ Paiement reçu
```

### APRÈS (Avec système 5 jours)
```
🔔 Notifications (vous en avez 4)

⚠️  ALERTES (3)
├─ Facture FAC-2025-001 due dans 5 jours (12/12/2025)
│  Montant: 5000€ - [Voir]
│
├─ Abonnement "Consulting Mensuel" expire dans 5 jours (17/12/2025)
│  Client: Acme Corp - [Renouveler]
│
└─ Tâche "Rapport Final" due dans 5 jours (15/12/2025)
   Assignée à: Jean Dupont - [Voir]

ℹ️  INFORMATIONS (1)
└─ TimeSheet validé par Marie Martin (11/12/2025)
   Semaine du 9 au 13 Déc - Régularités acceptées ✅
```

---

## 🗂️ ORGANISATION DES FICHIERS (Structure à créer)

```
app/
├─ api/
│  ├─ pro-formas/           ✨ NOUVEAU
│  │  ├─ route.ts           (GET, POST)
│  │  └─ [id]/
│  │     ├─ route.ts        (GET, PUT, DELETE)
│  │     └─ convert-to-invoice/
│  │        └─ route.ts     (POST: conversion)
│  │
│  ├─ timesheets/           (à améliorer)
│  │  ├─ route.ts           (GET, POST, PUT)
│  │  └─ [id]/
│  │     ├─ route.ts        (GET, PUT)
│  │     └─ validate/
│  │        └─ route.ts     (POST: validation manager)
│  │
│  └─ cron/
│     └─ notifications.ts    ✨ Améliorer (5 jours)
│
├─ timesheets/              ✨ NOUVEAU (optionnel)
│  └─ page.tsx              (Liste + gestion)
│
└─ clients/[id]/
   └─ page.tsx              (déjà existe)

components/
├─ ProFormaModal.tsx         ✨ NOUVEAU
├─ ProFormaList.tsx          ✨ NOUVEAU
├─ TimeSheetForm.tsx         ✨ NOUVEAU
├─ TimeSheetList.tsx         ✨ NOUVEAU
├─ TimeSheetValidator.tsx    ✨ NOUVEAU
│
└─ ClientDetailTabs.tsx      📝 À modifier
   (ajouter sections ProForma)

lib/
├─ proFormaGenerator.ts      ✨ NOUVEAU (PDF)
├─ timeSheetHelpers.ts       ✨ NOUVEAU (calculs)
└─ factureGenerator.ts       (déjà existe)

prisma/
└─ schema.prisma             📝 À modifier
   ├─ +ProForma
   ├─ +ProFormaLigne
   ├─ +enum StatutProForma
   └─ Améliorer TimeSheet (relations)
```

---

## 🎯 RÉSUMÉ VISUEL: AVANT vs APRÈS

| Aspect | AVANT | APRÈS |
|--------|-------|-------|
| **Factures** | Facture Auto (Abo, Projet) | + Pro Formas (Manuel) |
| **TimeSheets** | Model existe, 0 UI | UI complète (Employé + Manager) |
| **Notifications** | Par événement | + Rappels 5j avant |
| **Dashboard Client** | 8 onglets | 8 onglets + Pro Formas section |
| **Dashboard Employé** | Tâches + Stats | + TimeSheet semaine + Actions |
| **Dashboard Manager** | Équipe | + Validation TimeSheets |

---

## 🚀 Prochaines étapes:

1. **Valider ce design** avec toi
2. **Commencer Phase 1**: Modèle Prisma + API Pro Formas
3. **Puis Frontend**: Modal + Composants
4. **Ensuite TimeSheets**: UI + Validation
5. **Enfin Notifications**: CRON job

**Ça te convient?** 🎨
