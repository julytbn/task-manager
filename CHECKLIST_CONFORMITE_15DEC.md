# ✅ CHECKLIST DE CONFORMITÉ - ACTION ITEMS

**Date**: 15 Décembre 2025  
**Objectif**: S'assurer que TOUS les éléments du scénario sont opérationnels

---

## 🎯 PHASE 1: VÉRIFICATIONS CRITIQUES (À faire IMMÉDIATEMENT)

### 1️⃣ Teste du flux Proforma → Facture → Paiement

**Étapes**:
```
1. Manager crée une proforma:
   - Route: app/clients/[id]/pro-formas ou via app/factures
   - Ajouter client, montant, lignes
   - Sauvegarder avec statut EN_COURS

2. Marquer comme acceptée:
   - Bouton "Marquer comme validée"
   - Vérifier: statut change à ACCEPTEE
   - Vérifier: dateValidation enregistrée

3. Convertir en facture:
   - Cliquer "Convertir en facture"
   - API: POST /api/pro-formas/[id]/convert-to-invoice
   - Vérifier: nouvelle facture créée avec numéro unique
   - Vérifier: statut facture = EN_ATTENTE

4. Enregistrer un paiement:
   - Route: app/paiements
   - Sélectionner la facture
   - Ajouter montant, mode (VIREMENT_BANCAIRE), date
   - Sauvegarder
   - Vérifier: statut facture devient PAYEE (si montant = total)
```

**Checklist**:
- [ ] Proforma peut être créée
- [ ] Proforma peut être marquée comme acceptée
- [ ] Conversion en facture fonctionne
- [ ] Numéro facture unique généré
- [ ] Paiement enregistrable
- [ ] Statut facture se met à jour correctement

---

### 2️⃣ Teste du Timesheet (Employé + Manager)

**En tant qu'EMPLOYE**:
```
1. Accéder à app/timesheets/my-timesheets
2. Créer un timesheet:
   - Sélectionner une date
   - Choisir un projet
   - Choisir une tâche
   - Entrer 8h normales, 2h supplémentaires
   - Ajouter description d'activité
   - Soumettre
   
3. Vérifier: statut = EN_ATTENTE
```

**En tant que MANAGER**:
```
1. Accéder à app/timesheets/validation
2. Voir le timesheet en attente
3. Cliquer "Valider"
   - Vérifier: statut change à VALIDEE
   - Vérifier: dateModification mise à jour
   - Vérifier: validePar = ID du manager
```

**Checklist**:
- [ ] Employé peut créer timesheet
- [ ] Timesheet visible en attente
- [ ] Manager peut valider
- [ ] Statut se met à jour
- [ ] Heures supplémentaires sauvegardées

---

### 3️⃣ Teste des Abonnements + Génération Proformas

**Créer un abonnement**:
```
1. Route: app/abonnements
2. Créer abonnement:
   - Client sélectionné
   - Service: "Tenue de comptabilité"
   - Montant: 500€
   - Fréquence: MENSUEL
   - Statut: ACTIF
   - dateDebut: 01/12/2025
   - dateProchainFacture: 01/01/2026

3. Sauvegarder

4. Exécuter la génération:
   - API: GET /api/cron/generate-invoices
   - Ou attendre le cron job
   - Vérifier: ProForma créée automatiquement
   - Vérifier: statut = EN_COURS
```

**Checklist**:
- [ ] Abonnement peut être créé
- [ ] Statut ACTIF
- [ ] Génération proforma fonctionne
- [ ] ProForma liée à l'abonnement
- [ ] Récurrence fonctionne

---

### 4️⃣ Teste des Notifications Salaires

**Configuration**:
```
1. Route: app/admin/salary-settings
2. Entrer un montant de salaire pour décembre 2025
3. Date prévue: 25/12/2025

4. Exécuter les notifications:
   - API: POST /api/cron/salary-notifications
   - Ou attendre le cron
   - Date du jour + 5 = date notification

5. Vérifier:
   - Notification créée dans app/notifications
   - Email envoyé (si SMTP configuré)
   - Message: "Attention : paiement des salaires prévu..."
```

**Checklist**:
- [ ] Prévision salaire peut être entrée
- [ ] Notification système créée
- [ ] Message correct
- [ ] Email envoyé (vérifier SMTP)
- [ ] Statut notificationEnvoyee = true

---

### 5️⃣ Teste des Paiements en Retard

**Créer un paiement en retard**:
```
1. Route: app/factures
2. Créer facture:
   - Client
   - Montant: 1000€
   - dateEcheance: 01/12/2025 (PASSÉE)
   - Pas de paiement

3. Exécuter vérification:
   - API: GET /api/paiements/check-late
   - Vérifier: facture marquée comme EN_RETARD
   - Vérifier: notification envoyée au manager

4. Enregistrer un paiement:
   - Montant reçu (ex: 500€)
   - Vérifier: statut = PARTIELLEMENT_PAYEE
```

**Checklist**:
- [ ] Facture en retard détectée
- [ ] Notification manager créée
- [ ] Paiement partiel accepté
- [ ] Statut mis à jour correctement

---

## 🎯 PHASE 2: VÉRIFICATIONS FONCTIONNELLES

### 6️⃣ Teste du Module CRM

**Créer un client**:
```
1. Route: app/clients
2. Cliquer "+ Nouveau client"
3. Formulaire:
   - Nom: "Dupont"
   - Prénom: "Jean"
   - Entreprise: "Dupont SA"
   - Email: test@dupont.fr
   - Téléphone: +33612345678
   - Adresse: "123 rue de Paris"
   - Type: ENTREPRISE
   - gudefUrl: "https://gudef.example.com/dupont"
   
4. Sauvegarder

5. Aller au détail client:
   - Vérifier toutes les infos
   - Vérifier: bouton "Ouvrir GUDEF" cliquable
   - Lien mène à l'URL GUDEF
```

**Checklist**:
- [ ] Client créable avec tous les champs
- [ ] gudefUrl sauvegardée
- [ ] Détail client affiche les infos
- [ ] Bouton GUDEF fonctionne
- [ ] Liens projets/factures/paiements visibles

---

### 7️⃣ Teste du Module Services

**Vérifier les services**:
```
1. Route: app/api/services ou admin
2. Vérifier présence des 11 catégories:
   - COMPTABILITE
   - AUDIT_FISCALITE
   - MARKETING
   - COMMUNICATION
   - REDACTION_GESTION_PROJET
   - DEMARRAGE_ADMINISTRATIF
   - FORMATION
   - COACHING
   - ETUDE_MARCHE
   - CONCEPTION_IMPRESSION
   - IMMOBILIER

3. Services par catégorie:
   - Comptabilité: "Tenue de comptabilité", "Audit annuel"
   - etc.
```

**Checklist**:
- [ ] 11 catégories présentes
- [ ] Services rattachés à catégories
- [ ] Services affichables dans sélection projet

---

### 8️⃣ Teste du Module Projets

**Créer un projet**:
```
1. Route: app/projets
2. Créer un nouveau projet:
   - Client: Dupont SA
   - Titre: "Audit fiscal 2025"
   - Description: "..."
   - Services: Sélectionner "Audit comptable"
   - Budget: 5000€
   - dateDebut: 01/01/2026
   - dateFin: 31/03/2026
   - Équipe: Sélectionner une équipe
   
3. Sauvegarder

4. Aller au détail:
   - Tâches créables
   - Services visibles
   - Timeline affichée
```

**Checklist**:
- [ ] Projet créable avec tous les champs
- [ ] Services multi-sélection fonctionne
- [ ] Équipe assignable
- [ ] Détail affiche tâches + services
- [ ] Factures du projet affichées

---

### 9️⃣ Teste des Tâches

**Créer une tâche (AVEC service)**:
```
1. Route: app/taches ou depuis détail projet
2. Créer une tâche:
   - Projet: "Audit fiscal 2025"
   - Service: "Audit comptable"
   - Titre: "Vérifier documents"
   - Assigné à: Employe1
   - Priorité: HAUTE
   - Dates: ...
   
3. Sauvegarder
```

**Créer une tâche (SANS service)**:
```
1. Créer une tâche:
   - Projet: "Audit fiscal 2025"
   - Service: [VIDE/OPTIONNEL]
   - Titre: "Réunion kick-off"
   - Assigné à: Manager
```

**Checklist**:
- [ ] Tâche créable avec service
- [ ] Tâche créable SANS service
- [ ] Service optionnel dans formulaire
- [ ] Statuts corrects (A_FAIRE, EN_COURS, EN_REVISION, SOUMISE, TERMINE)
- [ ] Priorités correctes
- [ ] Vue Kanban fonctionne

---

### 🔟 Teste du Dashboard Manager

**Route**: `app/dashboard/projets-stats`

**Vérifier l'affichage de**:
```
- [ ] Recettes du mois (montant)
- [ ] Charges du mois (montant)
- [ ] Bénéfice (Recettes - Charges)
- [ ] Factures impayées (nombre + montant)
- [ ] Heures travaillées (total)
- [ ] Projets actifs
- [ ] Graphique Recettes (ligne ou bar)
- [ ] Graphique Charges (ligne ou bar)
- [ ] Comparaison mois par mois
- [ ] Top projets par chiffre
- [ ] Top employés par heures
```

**Checklist**:
- [ ] Tous les KPIs affichés
- [ ] Données correctes (d'après la DB)
- [ ] Graphes responsive
- [ ] Filtres par période fonctionnent

---

## 🎯 PHASE 3: VÉRIFICATIONS DE SÉCURITÉ

### 1️⃣1️⃣ Roles & Permissions

**ADMIN**:
```
- [ ] Peut créer/modifier/supprimer services
- [ ] Peut créer utilisateurs
- [ ] Peut voir tous les dashboards
- [ ] Peut voir tous les projets
```

**MANAGER**:
```
- [ ] Peut créer clients
- [ ] Peut créer proformas
- [ ] Peut valider proformas
- [ ] Peut enregistrer paiements
- [ ] Peut créer projets
- [ ] Peut voir dashboard
- [ ] Peut valider timesheets
- [ ] NE PEUT PAS: Supprimer utilisateurs, voir données sensibles autres managers
```

**EMPLOYE**:
```
- [ ] Peut voir ses tâches
- [ ] Peut créer timesheets
- [ ] Peut voir ses heures
- [ ] NE PEUT PAS: Créer clients, proformas, voir données autres employés
```

**CONSULTANT**:
```
- [ ] Peut voir projets assignés
- [ ] Peut créer tâches (assignées)
- [ ] Peut créer timesheets
```

**Checklist**:
- [ ] Routes protégées par middleware
- [ ] Vérification rôle sur API
- [ ] Données filtrées par rôle
- [ ] Pas d'accès aux données d'autres utilisateurs

---

### 1️⃣2️⃣ Clients PAS Accès App

```
- [ ] Pas de route /client-login
- [ ] Pas de role CLIENT dans RoleUtilisateur enum
- [ ] Pas d'email/password dans Client model
- [ ] Clients non authentifiables
- [ ] Proformas envoyées par email externe
- [ ] Paiements enregistrés par MANAGER uniquement
```

**Checklist**:
- [ ] Zéro accès client
- [ ] Validation: routes admin/manager/employe seulement

---

## 🎯 PHASE 4: VÉRIFICATIONS TECHNIQUES

### 1️⃣3️⃣ Configuration Externes

**SMTP (Email)**:
```
1. Vérifier .env:
   - SMTP_HOST: défini
   - SMTP_PORT: défini
   - SMTP_USER: défini
   - SMTP_PASSWORD: défini
   
2. Tester envoi:
   - Créer une proforma
   - Email devrait être envoyé au client
   - Vérifier boîte spam
```

**Checklist**:
- [ ] Variables SMTP définies
- [ ] Email test envoyé
- [ ] Pas d'erreurs logs

---

### 1️⃣4️⃣ Base de Données

**Vérifier les migrations**:
```
1. npm run prisma:migrate
2. Vérifier:
   - Tous les models présents
   - Toutes les relations correctes
   - Indexes créés
```

**Checklist**:
- [ ] Migrations appliquées
- [ ] Schema up-to-date
- [ ] Pas d'erreurs Prisma

---

### 1️⃣5️⃣ Cron Jobs

**Vérifier que les crons sont configurés**:
```
- [ ] generate-invoices: /api/cron/generate-invoices
- [ ] salary-notifications: /api/cron/salary-notifications
- [ ] check-late-payments: /api/cron/check-late-payments
- [ ] check-late-tasks: /api/cron/check-late-tasks
```

**Configuration Vercel/Server**:
```
1. Ajouter à vercel.json ou cron provider:
   - /api/cron/generate-invoices: Chaque 1er du mois
   - /api/cron/salary-notifications: Chaque jour (20j avant)
   - /api/cron/check-late-payments: Chaque jour
   - /api/cron/check-late-tasks: Chaque jour
```

**Checklist**:
- [ ] Crons en production configurés
- [ ] Logs d'exécution visibles
- [ ] Pas d'erreurs

---

## 📋 SCORE DE CONFORMITÉ

### Avant les tests: **100%** (théorique)

Remplissez ce tableau après les tests:

| Catégorie | Items | OK | Manquants | Score |
|---|---|---|---|---|
| Proforma→Facture→Paiement | 5 | ? | ? | ?% |
| Timesheet | 3 | ? | ? | ?% |
| Abonnements | 3 | ? | ? | ?% |
| Notifications | 2 | ? | ? | ?% |
| CRM | 3 | ? | ? | ?% |
| Services | 2 | ? | ? | ?% |
| Projets | 3 | ? | ? | ?% |
| Tâches | 3 | ? | ? | ?% |
| Dashboard | 2 | ? | ? | ?% |
| Permissions | 4 | ? | ? | ?% |
| Configuration | 3 | ? | ? | ?% |
| **TOTAL** | **36** | **?** | **?** | **?%** |

---

## 🚀 PROCHAINES ÉTAPES

### Si TOUS les tests ✅:
```
1. Déployer en staging
2. Tester avec données réelles
3. Déployer en production
4. Lancer à utilisateurs réels
5. Monitoring & support
```

### Si des GAPS ❌:
```
1. Lister les problèmes
2. Prioriser par impact
3. Corriger (sprints rapides)
4. Re-tester
5. Documenter les changements
```

---

**Document**: Checklist de conformité  
**Date**: 15 Décembre 2025  
**Statut**: À remplir lors des tests  
**Prochain point**: Lundi ?
