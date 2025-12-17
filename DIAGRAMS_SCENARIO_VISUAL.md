# 🎯 DIAGRAMMES VISUELS - ARCHITECTURE DU SYSTÈME

**Document:** Visualisations du système Kekeli  
**Date:** 15 Décembre 2025

---

## 📊 1. ARCHITECTURE GÉNÉRALE

```
┌──────────────────────────────────────────────────────────────┐
│                     KEKELI - APPLICATION INTERNE             │
│                   (Pas d'accès client)                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                 │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│Dashboard │ CRM      │ Projets  │Timesheets│Facturation   │
│Manager   │ Clients  │ Tâches   │Validation│ Factures     │
│Employee  │Services  │Équipes   │Reports   │ Proformas    │
│Dashboard │          │          │          │ Paiements    │
└──────────┴──────────┴──────────┴──────────┴──────────────┘
        │                                           │
        ├─ Authentication (NextAuth) ─────────────┤
        │                                           │
        └─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API (Node.js)                  │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│/clients  │/projects │/invoices │/tasks    │/timesheets   │
│/services │/subscr   │/payments │/charges  │/notifications│
└──────────┴──────────┴──────────┴──────────┴──────────────┘
        │                                           │
        ├─ Authorization (Rôles) ─────────────────┤
        │                                           │
        └─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                   │
├────────┬────────┬────────┬────────┬────────┬────────────┤
│Clients │Projects│Invoices│Tasks   │Users   │Timesheets │
│Services│Teams   │Payments│Charges │Roles   │Subscr     │
└────────┴────────┴────────┴────────┴────────┴────────────┘
```

---

## 👥 2. RÔLES & PERMISSIONS

```
┌─────────────────────────────────────────────────────────┐
│                   AUTHENTIFICATION NEXTAR                 │
│                   (Email + Mot de passe)                │
└──────────────────┬────────────────────────────────────┘
                   │
       ┌───────────┼───────────┬──────────┐
       ▼           ▼           ▼          ▼
    ┌────┐      ┌────┐      ┌────┐    ┌────┐
    │ADMIN│      │MGR │      │EMP │    │CONS│
    └─┬──┘      └─┬──┘      └─┬──┘    └─┬──┘
      │           │           │         │
      ├─── Tous ──┤           │         │
      │  les droits│           │         │
      │           │           │         │
      │     ┌─────┴──────┐    │         │
      │     │ Gestion    │    │         │
      │     │ Utilisateurs│   │         │
      │     └────────────┘    │         │
      │                       │         │
      │     ┌─────────────────┴─────┐  │
      │     │ Créer/Voir Projets   │  │
      │     │ Créer/Voir Clients   │  │
      │     │ Créer Factures       │  │
      │     │ Valider Timesheets   │  │
      │     └─────────────────┬─────┘  │
      │                       │         │
      │                 ┌─────┴────┐   │
      │                 │ Timesheets│   │
      │                 │ My Tasks  │   │
      │                 └─────┬────┘   │
      │                       │         │
      │                       │         │ ┌────────────┐
      │                       │         └─┤ Projets   │
      │                       │           │ Lecture   │
      │                       │           └────────────┘
      └───────────────────────┴───────────────┘
```

---

## 🔄 3. FLUX CRM + FACTURATION

```
┌──────────────────┐
│  NOUVEAU CLIENT  │
│  Créé par MANAGER│
└────────┬─────────┘
         │
         ├─ Nom, Email
         ├─ Téléphone
         ├─ Adresse
         ├─ URL GUDEF ✅
         └─ Type (Particulier/Entreprise)
         │
         ▼
┌──────────────────────┐
│  NOUVEAU PROJET      │
│  Lié au Client       │
└────────┬─────────────┘
         │
         ├─ Services (1+)
         ├─ Équipe assignée
         ├─ Dates début/fin
         └─ Budget (optionnel)
         │
         ▼
┌──────────────────────┐
│  CRÉER TÂCHES        │
│  Assigner employés   │
└────────┬─────────────┘
         │
         ├─ Service (optionnel)
         ├─ Priorité
         └─ Dates d'échéance
         │
         ▼
┌──────────────────────┐
│  EMPLOYÉS TRAVAILLENT│
│  + TIMESHEETS        │
└────────┬─────────────┘
         │
         ├─ Heures normales
         ├─ Heures supp (optionnel)
         └─ Description
         │
         ▼
┌──────────────────────────┐
│ MANAGER VALIDE TIMESHEET │
└────────┬─────────────────┘
         │
         ├─ Approuve heures
         └─ Marque comme validée
         │
         ▼
┌──────────────────────────┐
│ CRÉER FACTURE PROFORMA   │
│ Montant + Lignes         │
└────────┬─────────────────┘
         │
         ├─ Statut = EN_COURS
         └─ Numéro unique
         │
         ▼
┌──────────────────────────────────┐
│ ENVOYER CLIENT (HORS APP)         │
│ Email / WhatsApp / Physique       │
└────────┬───────────────────────────┘
         │
         ├─ Client reçoit proforma
         ├─ Revoit les montants
         └─ Valide par email/appel
         │
         ▼
┌──────────────────────────┐
│ MANAGER VALIDE PROFORMA  │
│ Clique "Marquer validée" │
└────────┬─────────────────┘
         │
         ├─ Statut = ACCEPTEE
         └─ Attendre conversion
         │
         ▼
┌──────────────────────────────┐
│ CONVERSION → FACTURE OFFICIELLE│
│ Cliquer "Convertir"          │
└────────┬──────────────────────┘
         │
         ├─ Nouveau numéro facture
         ├─ Statut = IMPAYEE
         ├─ Copie lignes proforma
         └─ Montant hérité
         │
         ▼
┌──────────────────────────┐
│ ENREGISTRER PAIEMENT     │
│ Montant + Mode + Date    │
└────────┬─────────────────┘
         │
         ├─ Paiement complet
         │  └─ Facture → PAYEE ✅
         │
         ├─ Paiement partiel
         │  └─ Facture → PARTIELLEMENT_PAYEE
         │
         └─ Pas de paiement
            └─ Facture → IMPAYEE
         │
         ▼
┌──────────────────────────────────┐
│ DASHBOARD AFFICHE REVENUS        │
│ = Paiements reçus (PAS factures) │
└──────────────────────────────────┘
```

---

## 📅 4. FLUX ABONNEMENTS

```
┌────────────────────────────┐
│  CRÉER ABONNEMENT          │
│  Client + Service          │
└────────┬───────────────────┘
         │
         ├─ Montant
         ├─ Fréquence
         │  ├─ MENSUEL
         │  ├─ TRIMESTRIEL
         │  └─ ANNUEL
         ├─ Statut = ACTIF
         └─ Dates début/fin (opt)
         │
         ▼
┌────────────────────────────────┐
│ CHAQUE MOIS (ou période)       │
│ SYSTÈME GÉNÈRE AUTO             │
│ FACTURE PROFORMA                │
└────────┬───────────────────────┘
         │
         ├─ Même client
         ├─ Même service
         ├─ Même montant
         └─ Numéro + date
         │
         ▼
┌────────────────────────────┐
│ MANAGER VALIDE PROFORMA    │
│ (Même processus qu'avant)  │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ CONVERSION → FACTURE       │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ PAIEMENT ENREGISTRÉ        │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ PROCHAINE PÉRIODE...       │
│ (Boucle repeat)            │
└────────────────────────────┘
```

---

## 📊 5. TIMESHEET WORKFLOW

```
                    ┌──────────────────┐
                    │  EMPLOYÉ CRÉE    │
                    │  TIMESHEET       │
                    └────────┬─────────┘
                             │
                             ├─ Date du travail
                             ├─ Projet
                             ├─ Tâche
                             ├─ Heures normales
                             ├─ Heures supp (opt)
                             └─ Description
                             │
                             ▼
                    ┌──────────────────────┐
                    │ SOUMIS               │
                    │ Statut = EN_ATTENTE  │
                    └────────┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌───────┐      ┌──────────┐   ┌──────────┐
        │VALIDÉE│      │REJETÉE   │   │CORRIGÉE  │
        │  ✅   │      │   ❌     │   │  🔄     │
        └───┬───┘      └────┬─────┘   └────┬─────┘
            │               │              │
            │        Emp retour corriger   │
            │               └──────────────┤
            │                              │
            └──────────────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │ HEURES COMPTÉES  │
                    │ Mise à jour      │
                    │ Task.heuresReels │
                    └──────────────────┘
```

---

## 💰 6. DASHBOARD MANAGER

```
┌──────────────────────────────────────────────────────┐
│              MANAGER DASHBOARD                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐  ┌──────────────────┐        │
│  │ RECETTES        │  │ CHARGES          │        │
│  │ 15,000€         │  │ 8,500€           │        │
│  │ (paiements)     │  │ (salaires,loyers)│        │
│  └────────┬────────┘  └──────────┬───────┘        │
│           │                      │                 │
│           └──────────┬───────────┘                 │
│                      │                             │
│                      ▼                             │
│           ┌───────────────────┐                   │
│           │ BÉNÉFICE MENSUEL  │                   │
│           │ 6,500€            │                   │
│           └───────────────────┘                   │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ FACTURES IMPAYÉES: 3 (5,000€)              │ │
│  │ FACTURES PARTIELLEMENT PAYÉES: 2 (3,500€)  │ │
│  │ FACTURES PAYÉES: 8 ✅                       │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ HEURES TRAVAILLÉES: 320h                    │ │
│  │ PROJETS EN RETARD: 1                        │ │
│  │ TÂCHES EN COURS: 12                         │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ GRAPHES: Recettes vs Charges (mois dernier)│ │
│  │ [Graphe ligne]                              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────────┘
```

---

## 📋 7. STATUTS & TRANSITIONS

```
TÂCHES
══════════════════════════════════════
    À faire ──→ En cours ──→ Terminée
      ▲                        │
      └────────────────────────┘
      (optionnel: revenir)


TIMESHEETS
══════════════════════════════════════
    EN_ATTENTE ──→ VALIDÉE ✅
         │
         └──→ REJETÉE ❌
              │
              └──→ CORRIGÉE
                   │
                   └──→ EN_ATTENTE (again)


PROFORMAS
══════════════════════════════════════
    EN_COURS ──→ ACCEPTÉE ──→ CONVERTIE → Facture
      │              │
      └──→ REJETÉE ❌ │
      │              │
      └──────────────┘


FACTURES
══════════════════════════════════════
    EN_ATTENTE ──→ IMPAYÉE
         │            │
         │            ├──→ PARTIELLEMENT_PAYÉE
         │            │         │
         │            │         └──→ PAYÉE ✅
         │            │
         └────────────┴─────────────→ (parcours)


ABONNEMENTS
══════════════════════════════════════
    ACTIF ──→ SUSPENDU ──→ ANNULÉ
```

---

## 🔐 8. SÉCURITÉ & PERMISSIONS

```
┌─────────────────────────────────────────────────────┐
│              COUCHE AUTHENTIFICATION                │
│                   (NextAuth)                        │
│  Email + Mot de passe → JWT Token → Session        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│           COUCHE AUTORISATION (Rôles)              │
│  ┌────────┬──────────┬─────────┬──────────────┐   │
│  │ ADMIN  │ MANAGER  │ EMPLOYE │ CONSULTANT   │   │
│  ├────────┼──────────┼─────────┼──────────────┤   │
│  │ Tous   │ Gérer    │ Timesheet│ Lire projets│   │
│  │ droits │ Clients  │ Mon task │ Lire factures│  │
│  │        │ Projets  │ View own │             │   │
│  │        │ Factures │ projects │             │   │
│  │        │ Paiements│         │             │   │
│  │        │ Timesheet│         │             │   │
│  └────────┴──────────┴─────────┴──────────────┘   │
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│        COUCHE API (Vérification rôle)              │
│  Chaque requête → Vérifier rôle → Autoriser/Refuser│
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│        COUCHE DONNÉES (PostgreSQL)                 │
│  Données isolées par permissions                    │
└─────────────────────────────────────────────────────┘


❌ PAS D'ACCÈS CLIENT
══════════════════════════════════════
Les clients n'ont PAS de compte
Les clients ne voient pas les factures dans l'app
Les clients reçoivent proformas hors système
(Email, WhatsApp, papier)
```

---

## 📧 9. NOTIFICATIONS

```
┌──────────────────────────────────────────┐
│    ÉVÉNEMENT SYSTÈME                     │
│    (Différents types)                    │
└────────┬───────────────────────────────┘
         │
    ┌────┼────┬───────┬────────┐
    │    │    │       │        │
    ▼    ▼    ▼       ▼        ▼
  Task Paiement Timesheet Salaire Subscription
  Créée Retard  Rejeté    5j avant Renouvelé
  │      │       │         │      │
  │      │       │         │      │
  └─────┬┴───┬──┴─┬───┬────┴──┬───┘
        │    │    │   │       │
        ▼    ▼    ▼   ▼       ▼
    ┌─────────────────────────────────┐
    │    NOTIFICATION SYSTÈME         │
    │  (Dans l'app)                   │
    └────────┬────────────────────────┘
             │
             ├─ Marquée comme lue ✅
             ├─ Archivée
             └─ Supprimée
             │
             ▼
    ┌─────────────────────────────────┐
    │    EMAIL AUTOMATIQUE            │
    │    (SMTP)                       │
    │                                 │
    │    "Bienvenue sur Kekeli..."   │
    │    "Votre timesheet est..."    │
    │    "Salaires prévus dans 5j..."│
    └─────────────────────────────────┘
```

---

## 🎯 10. PARCOURS UTILISATEUR COMPLET

```
                     ┌─────────────┐
                     │   ACCUEIL   │
                     │ Connexion   │
                     └─────┬───────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
           ┌────────┐ ┌──────┐ ┌─────────┐
           │ MANAGER│ │EMPLOYE│ │ ADMIN   │
           └───┬────┘ └───┬──┘ └────┬────┘
               │          │         │
       ┌───────┼────┐     │         │
       │       │    │     │         │
       ▼       ▼    ▼     ▼         ▼
    Clients Projets Tâches Timesheets Utilisateurs
    Factures Tâches Timesheet Mon dashboard Services
    Paiements Charges                     Config
    Dashboard
    │       │    │     │         │
    └───────┼────┴─────┼─────────┘
            │          │
            ▼          ▼
       ┌─────────────────────────┐
       │  ACTIONS COEUR          │
       │                         │
       │  1. Créer Client/Projet │
       │  2. Assigner Tâche      │
       │  3. Valider Timesheet   │
       │  4. Créer Facture       │
       │  5. Enregistrer Paiement│
       │                         │
       └────────────┬────────────┘
                    │
                    ▼
       ┌─────────────────────────┐
       │  DASHBOARD AFFICHE      │
       │  RÉSULTATS              │
       │                         │
       │  • Recettes ✅          │
       │  • Charges ✅           │
       │  • Bénéfice ✅          │
       │  • État projets ✅      │
       │                         │
       └─────────────────────────┘
```

---

## 📊 11. BASE DE DONNÉES - RELATIONS

```
                    ┌──────────┐
                    │  Clients │
                    └────┬─────┘
                         │
    ┌────────────┬────────┼────────┬─────────────┐
    │            │        │        │             │
    ▼            ▼        ▼        ▼             ▼
Projets      Factures  Proformas Documents   Abonnements
    │            │        │        │             │
    └────┬────────┴────────┼────────┼─────────────┘
         │                 │        │
         ▼                 ▼        ▼
    Tâches            Paiements   Services
    │                           │
    └──────────┬────────────────┘
               │
         ┌─────┴──────┐
         │            │
         ▼            ▼
    Timesheets    Utilisateurs
         │            │
         └─────┬──────┘
               │
               ▼
         Notifications
              │
              ▼
           Charges
```

---

## ✅ 12. CHECKLIST DÉPLOIEMENT

```
PRÉ-PRODUCTION CHECKLIST
════════════════════════════════════════

Semaine 1 (Préparation)
  ☐ Infrastructure créée (Hosting, DB, S3)
  ☐ .env.production configuré
  ☐ Database migrated
  ☐ SMTP testé (email send)
  ☐ SSL certificate obtenu
  ☐ Tests manuels complets
  ☐ Monitoring configuré (Sentry)

Semaine 2 (Lancement)
  ☐ Staging deployment OK
  ☐ Smoke tests passés
  ☐ Production deployment
  ☐ Utilisateurs créés
  ☐ Formation effectuée
  ☐ Support 24/7 actif

APRÈS LANCEMENT (2 semaines)
  ☐ Monitoring actif (aucune erreur)
  ☐ Performance OK (< 500ms)
  ☐ Users satisfaits (4+/5)
  ☐ Bugs critiques corrigés
  ☐ Feedbacks collectés
  ☐ Plan Phase 2 créé
```

---

**Fin des diagrammes visuels**

Ces schémas complètent la documentation écrite et facilitent la compréhension globale.
