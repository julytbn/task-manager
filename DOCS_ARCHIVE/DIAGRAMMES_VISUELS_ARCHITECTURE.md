# 📊 DIAGRAMMES VISUELS - Architecture Projet ↔ Services

**Date:** 9 décembre 2025

---

## 🔴 AVANT: Limitation (1 Service par Projet)

### Structure
```
Client "ACME Corp"
│
├─ Abonnement (Comptabilité Mensuelle)
│   └─ Service: Comptabilité
│       └─ Facture (auto-générée)
│           └─ Paiement
│
└─ Projet (Audit 2025)
    ├─ serviceId = "service_audit"  ← UN SEUL SERVICE
    ├─ Service: Audit Fiscal
    ├─ Factures
    │   └─ Paiements
    └─ Tâches
        ├─ Tâche 1: Réviser comptes
        ├─ Tâche 2: Vérifier TVA
        └─ Tâche 3: Rapport final

❌ IMPOSSIBLE: Ajouter "Service Conseil" au même projet
```

### Relation BD
```
┌──────────────┐
│   Projet     │
│──────────────│
│ id: "p1"     │
│ titre        │
│ serviceId    │◄───┐
│ montantEst   │    │
└──────────────┘    │ FK (1→1)
                    │
                ┌───┴──────────┐
                │   Service    │
                │──────────────│
                │ id: "svc1"   │
                │ nom: "Audit" │
                │ prix: 300000 │
                └──────────────┘
```

---

## 🟢 APRÈS: Flexible (N Services par Projet)

### Structure
```
Client "ACME Corp"
│
├─ Abonnement (Comptabilité Mensuelle)
│   └─ Service: Comptabilité
│       └─ Facture (auto-générée)
│           └─ Paiement
│
└─ Projet (Audit Complet 2025)
    ├─ montantTotal = 550000 FCFA
    ├─ ProjetServices:
    │   ├─ PS#1: Audit Fiscal
    │   │   ├─ montant: 300000 FCFA
    │   │   └─ ordre: 1
    │   ├─ PS#2: Comptabilité Générale
    │   │   ├─ montant: 200000 FCFA
    │   │   └─ ordre: 2
    │   └─ PS#3: Conseil Fiscal
    │       ├─ montant: 50000 FCFA
    │       └─ ordre: 3
    ├─ Factures (une ou plusieurs)
    │   └─ Paiements
    └─ Tâches (associées à services)
        ├─ Tâche 1: Réviser comptes (Service: Comptabilité)
        ├─ Tâche 2: Vérifier TVA (Service: Comptabilité)
        └─ Tâche 3: Rapport final (Service: Audit)

✅ POSSIBLE: Ajouter/supprimer services dynamiquement
```

### Relation BD (Avant/Après)

**AVANT (❌ Limitation):**
```
┌──────────────┐     ┌──────────────┐
│   Projet     │     │   Service    │
│──────────────│     │──────────────│
│ id: "p1"     │────▶│ id: "svc1"   │
│ serviceId    │     │ nom: "Audit" │
│ montantEst   │     │ prix: 300000 │
└──────────────┘     └──────────────┘
   1 projet = 1 service max
```

**APRÈS (✅ Flexible):**
```
┌──────────────┐                    ┌──────────────┐
│   Projet     │                    │   Service    │
│──────────────│                    │──────────────│
│ id: "p1"     │                    │ id: "svc1"   │
│ titre        │                    │ nom: "Audit" │
│ montantTotal │                    │ prix: 300000 │
│ (calculé)    │                    └──────────────┘
└──────────────┘                            ▲
       │                                    │ FK
       │ 1→N                                │
       │                          ┌─────────┴────────┐
       ├──────────────────────────┤                  │
       │                          │                  │
       └──────────┐               │                  │
                  │            ┌──────────────────┐  │
                  └───────────▶│  ProjetService   │  │
                  (PS#1)        │──────────────────│  │
                  (PS#2)        │ id              │  │
                  (PS#3)        │ projetId───────▶│  │
                                │ serviceId─────┬─┘  │
                                │ montant: 300k │    │
                                │ ordre: 1      │    │
                                └──────────────▼─────┘
   1 projet = N services
   1 service = N projets
```

---

## 📊 TABLEAU COMPARATIF DÉTAILLÉ

### Vue Client

**AVANT (❌):**
```
Client: "ACME"
├─ Projet: "Site Web"
│   ├─ Service: "Développement" (150k)
│   └─ montantEstime: 150k
│
├─ Projet: "Logo"
│   ├─ Service: "Design" (50k)
│   └─ montantEstime: 50k
│
└─ Projet: "Audit"
    ├─ Service: "Audit" (300k)
    └─ montantEstime: 300k

❌ Problème: Si "Site Web" doit inclure aussi "Design",
   il faut créer 2 projets ou modifier serviceId
```

**APRÈS (✅):**
```
Client: "ACME"
├─ Projet: "Digital Complet"
│   ├─ Services:
│   │   ├─ Développement (150k)
│   │   ├─ Design (50k)
│   │   └─ SEO (30k)
│   └─ montantTotal: 230k (CALCULÉ)
│
├─ Projet: "Audit Complet"
│   ├─ Services:
│   │   ├─ Audit Fiscal (300k)
│   │   ├─ Comptabilité (200k)
│   │   └─ Conseil (50k)
│   └─ montantTotal: 550k (CALCULÉ)
│
└─ Abonnement: "Comptabilité Mensuelle"
    ├─ Service: Comptabilité (50k/mois)
    └─ Factures auto-générées

✅ Avantage: Un projet = UN ENSEMBLE DE SERVICES
            Montant automatiquement calculé
```

---

## 🔄 FLUX DE CRÉATION - AVANT vs APRÈS

### AVANT (❌)

```
1. Utilisateur veut créer "Projet Audit Complet"
   ├─ Audit Fiscal (300k)
   ├─ Comptabilité (200k)
   └─ Conseil (50k)

2. Dans NouveauProjetModal:
   ├─ Titre: "Audit Complet" ✓
   ├─ Client: "ACME" ✓
   ├─ Service: [Dropdown] ← SEUL 1 SERVICE
   │   └─ Choisir "Audit Fiscal"... MAIS ET LES AUTRES?
   └─ Budget: 550000

3. Créer le projet
   └─ Projet "Audit Complet"
       └─ serviceId = "audit_fiscal_id" ← LIMITÉ!

❌ RÉSULTAT: Utilisateur doit créer 3 projets séparés
            OU modifier le projet 3 fois
            OU montant incorrect
```

### APRÈS (✅)

```
1. Utilisateur veut créer "Projet Audit Complet"
   ├─ Audit Fiscal (300k)
   ├─ Comptabilité (200k)
   └─ Conseil (50k)

2. Dans NouveauProjetModal:
   ├─ Titre: "Audit Complet" ✓
   ├─ Client: "ACME" ✓
   ├─ Services: [Multi-Select] ← N SERVICES
   │   ├─ ☑ Audit Fiscal (300k)
   │   ├─ ☑ Comptabilité (200k)
   │   └─ ☑ Conseil (50k)
   │   └─ Total affiché: 550k ✓
   └─ Budget: 550000

3. Créer le projet
   └─ Projet "Audit Complet"
       ├─ montantTotal = 550000 ✓ (CALCULÉ)
       └─ projetServices:
           ├─ PS#1: Audit Fiscal (300k, ordre 1)
           ├─ PS#2: Comptabilité (200k, ordre 2)
           └─ PS#3: Conseil (50k, ordre 3)

✅ RÉSULTAT: UN seul projet, PLUSIEURS services
            Montant automatiquement calculé
```

---

## 💾 SCHÉMA SQL

### AVANT (❌)

```sql
-- Table projets
CREATE TABLE projets (
  id TEXT PRIMARY KEY,
  titre TEXT,
  clientId TEXT,
  serviceId TEXT REFERENCES services(id),  -- ← 1→1
  montantEstime FLOAT,
  ...
);

-- Impossible de lier plusieurs services
-- serviceId accepte UN SEUL ID
```

### APRÈS (✅)

```sql
-- Table projets (modifiée)
CREATE TABLE projets (
  id TEXT PRIMARY KEY,
  titre TEXT,
  clientId TEXT,
  montantTotal FLOAT,  -- ← CALCULÉ (remplace montantEstime)
  ...
  -- Plus de serviceId ici!
);

-- Table pivot (CRÉÉE)
CREATE TABLE projet_services (
  id TEXT PRIMARY KEY,
  projetId TEXT NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  serviceId TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  montant FLOAT,
  ordre INTEGER DEFAULT 0,
  dateAjout TIMESTAMP,
  
  UNIQUE(projetId, serviceId)  -- ← Pas de doublon
);

-- Avantages:
-- ✅ Un projet peut avoir N services
-- ✅ Un service peut être dans M projets
-- ✅ Montant du service peut être adapté par projet
-- ✅ Pas de suppression accidentelle de service
```

---

## 🔢 EXEMPLE CHIFFRÉ

### Scénario: Client "ACME" commande un "Audit Complet 2025"

**Services à inclure:**
| # | Service | Prix Catalogue | Montant Projet | Ordre |
|---|---|---|---|---|
| 1 | Audit Fiscal | 300000 | 300000 | 1 |
| 2 | Comptabilité Générale | 200000 | 180000 | 2 |
| 3 | Conseil Fiscal | 50000 | 40000 | 3 |
| **TOTAL** | | | **520000** | |

### AVANT (❌ Impossible)
```
Créer projet avec serviceId = "audit_fiscal_id"
├─ Projet montré: Audit Complet 2025
├─ Mais serviceId ne peut contenir qu'UN ID
├─ Les autres services (Comptabilité, Conseil) ne sont pas liés
└─ montantEstime = 520000 (manuel, peut devenir invalide)
```

### APRÈS (✅ Fluide)
```
Créer projet avec serviceIds = ["audit_fiscal", "compta", "conseil"]

API crée automatiquement:
├─ Projet:
│   ├─ id: "proj_audit_2025"
│   ├─ titre: "Audit Complet 2025"
│   ├─ montantTotal: 520000 ← CALCULÉ (300k + 180k + 40k)
│   └─ projetServices: [3 rows]
│
├─ ProjetService #1:
│   ├─ projetId: "proj_audit_2025"
│   ├─ serviceId: "svc_audit_fiscal"
│   ├─ montant: 300000 ← Adapté si différent du catalogue
│   └─ ordre: 1
│
├─ ProjetService #2:
│   ├─ projetId: "proj_audit_2025"
│   ├─ serviceId: "svc_compta"
│   ├─ montant: 180000 ← Peut être moins que 200000
│   └─ ordre: 2
│
└─ ProjetService #3:
    ├─ projetId: "proj_audit_2025"
    ├─ serviceId: "svc_conseil"
    ├─ montant: 40000 ← Peut être moins que 50000
    └─ ordre: 3

✅ Avantages:
   • Tous les services liés en UNE FOIS
   • Montant automatiquement calculé
   • Chaque service peut avoir un montant adapté au projet
   • Ordre détermine l'affichage (UX friendly)
```

---

## 🎯 CALCUL montantTotal

### Formule
```
montantTotal = SUM(projetServices[*].montant)

Pour "Audit Complet 2025":
  = 300000 (Audit) + 180000 (Compta) + 40000 (Conseil)
  = 520000
```

### Synchronisation
```
1. Créer ProjetService
   └─ ProjetService.montant = 300000

2. Recalculer montantTotal
   └─ Projet.montantTotal = SUM(...)

3. Afficher dans UI
   └─ "Montant total du projet: 520000 FCFA"

4. Générer facture
   └─ Si acompte 50%: Facture = 260000
   └─ Si facture complète: Facture = 520000
```

---

## 📱 INTERFACE UTILISATEUR

### NouveauProjetModal - AVANT (❌)
```
┌─────────────────────────────────────┐
│   Nouveau Projet                    │
├─────────────────────────────────────┤
│                                     │
│ Titre: [________________]           │
│                                     │
│ Client: [▼ ACME Corp]               │
│                                     │
│ Service: [▼ Audit Fiscal]           │ ← UN SEUL
│                                     │
│ Budget: [550000]                    │
│                                     │
│         [Créer] [Annuler]           │
└─────────────────────────────────────┘
```

### NouveauProjetModal - APRÈS (✅)
```
┌─────────────────────────────────────┐
│   Nouveau Projet                    │
├─────────────────────────────────────┤
│                                     │
│ Titre: [________________]           │
│                                     │
│ Client: [▼ ACME Corp]               │
│                                     │
│ Services: [Multi-Select]            │ ← PLUSIEURS
│  ☑ Audit Fiscal (300k)              │
│  ☑ Comptabilité (200k)              │
│  ☑ Conseil (50k)                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Services sélectionnés:          │ │
│ │ 1. Audit Fiscal ........ 300k   │ │
│ │ 2. Comptabilité ........ 200k   │ │
│ │ 3. Conseil ............. 50k    │ │
│ │ ──────────────────────────────  │ │
│ │ TOTAL: .............. 550k ✅   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Budget: [550000]                    │
│                                     │
│         [Créer] [Annuler]           │
└─────────────────────────────────────┘
```

---

## ✨ RÉSUMÉ VISUEL

```
AVANT                               APRÈS
────────────────────────────────────────────────

Projet ──1──┐                   Projet ──1──┐
            │                              │
            │ (FK)                         │ (pas FK)
            │                              │
            ▼                              ▼
        Service                    ProjetService
                                        /   \
                                       /     \
                                    (FK)    (FK)
                                     /       \
                                    ▼         ▼
                                Projet     Service
                                
❌ 1 Projet = 1 Service          ✅ 1 Projet = N Services
❌ Limitation majeure            ✅ Architecture flexible
❌ serviceId unique              ✅ Liste de services
❌ montantEstime inexact         ✅ montantTotal calculé
```

---

**Créé le:** 9 décembre 2025  
**Intention:** Clarifier visuellement les changements architecturaux
