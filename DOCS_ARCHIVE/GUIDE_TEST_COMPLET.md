# 🧪 GUIDE COMPLET DE TEST - Toutes les Fonctionnalités

Ce guide te permet de tester manuellement toutes les fonctionnalités du système.

---

## 📋 TABLE DES MATIÈRES

1. [Créer les utilisateurs](#créer-les-utilisateurs)
2. [Créer une équipe](#créer-une-équipe)
3. [Ajouter des membres à l'équipe](#ajouter-des-membres-à-léquipe)
4. [Créer un client](#créer-un-client)
5. [Créer un projet](#créer-un-projet)
6. [Créer et soumettre une tâche](#créer-et-soumettre-une-tâche)
7. [Manager valide/rejette la tâche](#manager-validererejette-la-tâche)
8. [Créer une facture](#créer-une-facture)
9. [Créer un abonnement](#créer-un-abonnement)
10. [Tester la génération des factures d'abonnement](#tester-la-génération-des-factures-dabonnement)
11. [Tester les services](#tester-les-services)
12. [Tester les documents/uploads](#tester-les-documentsupload)
13. [Vérifier les notifications](#vérifier-les-notifications)
14. [Tester la détection des paiements en retard](#tester-la-détection-des-paiements-en-retard)
15. [Tester la détection des tâches en retard](#tester-la-détection-des-tâches-en-retard)

---

## 🔐 ÉTAPE 1: Créer les Utilisateurs

### Accès: Dashboard Admin > Utilisateurs

**Créer 3 utilisateurs:**

#### Utilisateur 1 - Manager
```
Prénom: Jean
Nom: Dupont
Email: jean.dupont@kekeligroup.com
Rôle: MANAGER
Mot de passe: TestPass123!
```

#### Utilisateur 2 - Employé
```
Prénom: Marie
Nom: Martin
Email: marie.martin@kekeligroup.com
Rôle: EMPLOYE
Mot de passe: TestPass123!
```

#### Utilisateur 3 - Employé
```
Prénom: Pierre
Nom: Bernard
Email: pierre.bernard@kekeligroup.com
Rôle: EMPLOYE
Mot de passe: TestPass123!
```

✅ **À vérifier:**
- Les 3 utilisateurs apparaissent dans la liste
- Les rôles sont corrects

---

## 👥 ÉTAPE 2: Créer une Équipe

### Accès: Dashboard Admin > Équipes > Créer

```
Nom: Équipe Dev
Description: Équipe de développement
Chef d'équipe: Jean Dupont (Manager)
```

✅ **À vérifier:**
- L'équipe est créée
- Jean Dupont est chef d'équipe

---

## 🔗 ÉTAPE 3: Ajouter des Membres à l'Équipe

### Accès: Équipe Dev > Gérer Membres

**Ajouter 2 membres:**

```
Membre 1: Marie Martin (EMPLOYE)
Membre 2: Pierre Bernard (EMPLOYE)
```

✅ **À vérifier:**
- ✅ Email reçu par Marie et Pierre (notification d'ajout à l'équipe)
- Les 2 membres apparaissent dans la liste
- Les notifications sont créées en BDD

---

## 🏢 ÉTAPE 4: Créer un Client

### Accès: Dashboard Admin > Clients > Créer

```
Prénom: Acme
Nom: Corporation
Email: contact@acme.com
Téléphone: +33123456789
Entreprise: ACME Inc
Adresse: 123 Avenue des Clients, Paris
Type: ENTREPRISE
```

✅ **À vérifier:**
- Le client est créé
- Il apparaît dans la liste

---

## 📊 ÉTAPE 5: Créer un Projet

### Accès: Dashboard Admin > Projets > Créer

```
Titre: Projet Website Acme
Description: Création du site web pour ACME Corp
Client: ACME Corporation
Équipe: Équipe Dev
Chef de projet: Jean Dupont
Budget: 50000 FCFA
Statut: EN_COURS
Date de début: 01/12/2024
Date de fin: 31/12/2025
```

✅ **À vérifier:**
- Le projet est créé
- Il est lié à l'équipe Dev
- Le budget s'affiche

---

## 📝 ÉTAPE 6: Créer et Soumettre une Tâche

### Accès: Dashboard Employé (Marie) > Soumettre Tâche

**Tâche 1 - Avec assignation immédiate:**

```
Titre: Implémenter la page d'accueil
Description: Créer la page d'accueil du site avec design responsive
Projet: Projet Website Acme
Statut: A_FAIRE
Priorité: HAUTE
Date d'échéance: 15/12/2024
Heures estimées: 16
Montant: 5000 FCFA
Facturable: OUI
Assignée à: Pierre Bernard
```

✅ **À vérifier:**
- ✅ Email reçu par Pierre (notification d'assignation de tâche)
- La tâche apparaît dans le dashboard employé
- Une notification est créée pour les managers

**Tâche 2 - Avec date d'échéance passée:**

```
Titre: Corriger les bugs critiques
Description: Corriger les 5 bugs critiques identifiés
Projet: Projet Website Acme
Statut: EN_COURS
Priorité: URGENTE
Date d'échéance: 05/12/2024  (DATE PASSÉE!)
Heures estimées: 8
Montant: 2000 FCFA
Facturable: OUI
Assignée à: Marie Martin
```

✅ **À vérifier:**
- La tâche est créée avec une date passée
- Elle apparaîtra dans les "tâches en retard" au prochain CRON

---

## ✅ ÉTAPE 7: Manager Valide/Rejette la Tâche

### Accès: Dashboard Manager (Jean) > Tâches Soumises

#### Valider la Tâche 1:

```
Statut: TERMINE
Commentaire: Excellente implémentation, bien responsive!
```

✅ **À vérifier:**
- La tâche change de statut
- Le commentaire est sauvegardé
- Pierre reçoit une notification (optionnel)

#### Rejeter la Tâche 2:

```
Statut: ANNULE
Commentaire: À refaire selon les spécifications mises à jour
```

✅ **À vérifier:**
- La tâche est rejetée
- Marie voit le commentaire du rejet

---

## 💰 ÉTAPE 8: Créer une Facture

### Accès: Dashboard Admin > Factures > Créer

**Facture 1 - Paiement à jour:**

```
Numéro: FAC-2024-001
Client: ACME Corporation
Projet: Projet Website Acme
Montant HT: 25000 FCFA
Taux TVA: 18%
Montant Total: 29500 FCFA
Date d'émission: 08/12/2024
Date d'échéance: 22/12/2024
Statut: EN_ATTENTE
```

**Facture 2 - Paiement en retard:**

```
Numéro: FAC-2024-002
Client: ACME Corporation
Projet: Projet Website Acme
Montant HT: 15000 FCFA
Taux TVA: 18%
Montant Total: 17700 FCFA
Date d'émission: 01/11/2024
Date d'échéance: 15/11/2024  (DATE PASSÉE!)
Statut: EN_ATTENTE
```

✅ **À vérifier:**
- Les 2 factures sont créées
- La facture 2 n'est pas payée et la date est passée

---

## 🔔 ÉTAPE 9: Vérifier les Notifications

### Accès: Dashboard > Notifications (coin haut droit)

**Notifications attendues:**

```
✅ Marie a été ajoutée à l'équipe Dev
✅ Pierre a été ajoutée à l'équipe Dev
✅ Pierre a une nouvelle tâche: "Implémenter la page d'accueil"
✅ Managers ont une notification: "Nouvelle tâche créée"
```

✅ **À vérifier:**
- Toutes les notifications apparaissent
- Elles ont le bon titre et message
- Le lien fonctionne

---

## ⏰ ÉTAPE 10: Tester la Détection des Paiements en Retard

### Accès: Terminal / Postman

**Appeler le CRON manuellement:**

```bash
curl -X POST http://localhost:3000/api/cron/check-late-payments \
  -H "X-Cron-Secret: test-secret" \
  -H "Content-Type: application/json" \
  -d '{}'
```

✅ **À vérifier:**
- ✅ Réponse 200 OK
- ✅ Email reçu par Jean (manager): notification de paiement en retard
- ✅ Une notification est créée en BDD pour Jean
- ✅ La facture FAC-2024-002 est détectée comme en retard

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Vérification complétée: 1 paiement(s) en retard détecté(s)",
  "data": {
    "totalPayments": 2,
    "latePayments": 1,
    "notified": 1,
    "success": true
  }
}
```

---

## ⏳ ÉTAPE 11: Tester la Détection des Tâches en Retard

### Accès: Terminal / Postman

**Appeler le CRON des tâches en retard:**

```bash
curl -X POST http://localhost:3000/api/cron/check-late-tasks \
  -H "X-Cron-Secret: test-secret" \
  -H "Content-Type: application/json" \
  -d '{}'
```

✅ **À vérifier:**
- ✅ Réponse 200 OK
- ✅ Email reçu par Marie: notification de tâche en retard
- ✅ Une notification est créée en BDD pour Marie
- ✅ La tâche "Corriger les bugs critiques" est détectée comme en retard

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Vérification complétée: 1 tâche(s) en retard détectée(s)",
  "data": {
    "totalTasks": 2,
    "lateTasks": 1,
    "notified": 1,
    "success": true
  }
}
```

---

## 📊 ÉTAPE 12: Vérifier les Dashboards

### Dashboard Employé (Marie ou Pierre):

```
✅ Voir les tâches assignées
✅ Voir les notifications
✅ Voir les statistiques (tâches en cours, complétées, etc.)
✅ Voir les revenus générés
✅ Voir les tâches en retard
```

### Dashboard Manager (Jean):

```
✅ Voir les tâches soumises
✅ Voir les tâches en cours par équipe
✅ Voir les notifications
✅ Voir les statistiques (complétées, en cours, en retard)
✅ Voir les revenus par équipe
✅ Valider/Rejeter les tâches
```

---

## 📈 ÉTAPE 13: Tester les Graphiques et KPI

### Vérifications dans les dashboards:

```
✅ Graphique des tâches par statut
✅ Graphique des revenus par mois
✅ KPI: Nombre de tâches complétées
✅ KPI: Revenu total
✅ KPI: Tâches en retard
✅ KPI: Paiements en retard
✅ Performance de l'équipe
✅ Progression des projets
```

---

## 🔄 ÉTAPE 14: Tester le Cycle Complet

**Flux complet d'une tâche:**

```
1. Employé soumet une tâche
   ↓
2. Email envoyé aux assignés
   ↓
3. Notification créée en BDD
   ↓
4. Manager voit notification
   ↓
5. Manager valide/rejette + commentaire
   ↓
6. Notification mise à jour
   ↓
7. Dashboard reflect les changements
```

---

## 💳 ÉTAPE 9: Créer un Abonnement

### Accès: Dashboard > Abonnements > Nouveau

**Créer 2 abonnements:**

#### Abonnement 1 - Service Mensuel
```
Nom: Audit Comptable Mensuel
Description: Service d'audit comptable récurrent
Client: Acme Corp (créé à l'étape 4)
Service: Créer/sélectionner "Service Comptable"
Montant: 150000 FCFA
Fréquence: MENSUEL
Date début: 2025-12-08
Date fin: (laisser vide pour illimité)
Statut: ACTIF
```

#### Abonnement 2 - Service Annuel
```
Nom: Audit Fiscal Annuel
Description: Audit fiscal complet
Client: Acme Corp
Service: Créer/sélectionner "Service Audit Fiscal"
Montant: 500000 FCFA
Fréquence: ANNUEL
Date début: 2025-12-08
Date fin: 2026-12-07
Statut: ACTIF
```

✅ **À vérifier:**
- Les 2 abonnements apparaissent en statut ACTIF
- ✅ Une facture initiale est générée automatiquement pour chaque abonnement
- Les montants incluent la TVA (18%)
- Les prochaines dates de facturation sont correctes:
  - Abonnement 1 (mensuel): 2026-01-08
  - Abonnement 2 (annuel): 2026-12-08

---

## 📄 ÉTAPE 10: Tester la Génération des Factures d'Abonnement

### Accès: Dashboard > Factures

**Vérifier les factures générées:**

```
2 nouvelles factures devraient être créées automatiquement:
- Facture 1: FAC-[ID] - Audit Comptable Mensuel - 177000 FCFA (150000 + TVA)
- Facture 2: FAC-[ID] - Audit Fiscal Annuel - 590000 FCFA (500000 + TVA)
```

✅ **À vérifier:**
- Les factures portent le statut EN_ATTENTE
- Le montant TTC inclut bien la TVA (18%)
- La date d'émission est aujourd'hui
- La date d'échéance est 30 jours après (par défaut)
- Les factures sont liées aux abonnements créés

**Tester la génération automatique (CRON d'abonnement):**

```bash
# Terminal - Appeler l'endpoint de génération des factures d'abonnement
curl -X POST "http://localhost:3000/api/cron/generate-subscription-invoices" \
  -H "X-Cron-Secret: your-secret-key" \
  -H "Content-Type: application/json"
```

✅ **À vérifier:**
- La réponse indique le nombre de factures générées
- Aucune erreur dans les logs

---

## 🔧 ÉTAPE 11: Tester les Services

### Accès: Dashboard Admin > Services

**Créer 3 services (si pas déjà créés):**

#### Service 1 - Comptabilité
```
Nom: Service Comptable
Catégorie: COMPTABILITE
Description: Services de comptabilité générale
Prix: 150000 FCFA
Disponible: Oui
```

#### Service 2 - Audit Fiscal
```
Nom: Service Audit Fiscal
Catégorie: AUDIT
Description: Audit fiscal et conformité
Prix: 500000 FCFA
Disponible: Oui
```

#### Service 3 - Consulting
```
Nom: Service Consulting
Catégorie: CONSULTING
Description: Conseil et expertise
Prix: 200000 FCFA
Disponible: Oui
```

✅ **À vérifier:**
- Les 3 services apparaissent dans la liste
- Les prix sont correctement affichés
- Les catégories sont correctes
- Les services peuvent être sélectionnés pour les abonnements

---

## 📁 ÉTAPE 12: Tester les Documents/Uploads

### Accès: Tableau de bord > Tâches > Tâche > Onglet Documents

**Tester l'upload de documents:**

1. Créer un fichier test (ou en utiliser un existant):
   ```
   Fichier: document_test.pdf
   Taille: < 10 MB
   Type: PDF, Word, Image, etc.
   ```

2. Depuis la tâche créée à l'étape 6, cliquer sur "Ajouter un document"

3. Sélectionner le fichier et uploader

```
Endpoint utilisé: POST /api/upload
Port du serveur: 4000
Dossier de stockage: storage/uploads/tasks/{taskId}/
```

✅ **À vérifier:**
- Le fichier s'upload sans erreur
- Le fichier apparaît dans la liste des documents
- Le fichier peut être téléchargé
- Le fichier est stocké en BDD avec le bon nom
- Les permissions d'accès sont correctes (seulement le manager + assigné)

---

---

## 📧 ÉTAPE 13: Vérifier les Emails

**Emails attendus pendant le test:**

```
✅ Bienvenue - Création de compte (3x)
✅ Ajout à l'équipe Dev (Marie)
✅ Ajout à l'équipe Dev (Pierre)
✅ Assignation de tâche (Pierre)
✅ Assignation de tâche - Tâche Retard (Marie)
✅ Paiement en retard (Jean) - après CRON
✅ Tâche en retard (Marie) - après CRON
✅ Abonnement créé - Facture générée (Acme Corp)
✅ Managers notifiés: "Nouvelle tâche créée"
```

**Vérifier les emails (Ethereal):**

1. Aller sur: https://ethereal.email/messages
2. Vérifier que tous les emails apparaissent
3. Pour chaque email, vérifier:
   - La ligne d'objet (subject)
   - Le destinataire
   - Le contenu HTML
   - Les liens fonctionnent
   - La signature

**Templates attendus:**

- Welcome Email: HTML avec logo + message de bienvenue
- Team Added: HTML avec confirmation + détails équipe
- Task Assigned: HTML avec titre tâche + lien dashboard
- Payment Late: HTML avec banneau rouge + montant + nombre jours retard
- Task Late: HTML avec banneau rouge + deadline dépassée + assigné

✅ **À vérifier:**
- Tous les emails sont reçus
- Les templates HTML sont propres et formatés
- Les liens fonctionnent
- Les données dynamiques sont correctes
- Les images/logos s'affichent
- Pas d'erreurs HTML

---

## 🔴 ÉTAPE 14: Tester la Détection des Paiements en Retard

### Accès: Dashboard > Notifications + CRON Manual

**Créer un paiement en retard (manipulation de date):**

1. Aller dans Dashboard > Factures
2. Chercher la facture créée à l'étape 8
3. Créer une facture avec une date d'échéance PASSÉE:

```
Créer une nouvelle facture:
Client: Acme Corp
Numéro: FAC-2025-001
Montant: 100000 FCFA
Date d'échéance: 2025-11-01 (date passée - plus de 7 jours)
Statut: EN_ATTENTE (non payée)
```

**Tester le CRON de détection:**

```bash
# Terminal - Appeler le CRON de paiements en retard
curl -X POST "http://localhost:3000/api/cron/check-late-payments" \
  -H "X-Cron-Secret: your-secret-key" \
  -H "Content-Type: application/json"
```

✅ **À vérifier:**
- La réponse retourne une liste des factures en retard
- Une notification est créée pour le manager
- Un email est envoyé au manager avec:
  - Montant du paiement
  - Nombre de jours de retard
  - Client concerné
- Le statut de la facture change à "EN_RETARD" (si implémenté)

---

## ⏰ ÉTAPE 15: Tester la Détection des Tâches en Retard

### Accès: Dashboard > Notifications + CRON Manual

**Tâche déjà créée à l'étape 6:**

La tâche "Tâche Retard" avec date d'échéance passée (2025-11-15) doit déclencher une notification.

**Tester le CRON de détection:**

```bash
# Terminal - Appeler le CRON de tâches en retard
curl -X POST "http://localhost:3000/api/cron/check-late-tasks" \
  -H "X-Cron-Secret: your-secret-key" \
  -H "Content-Type: application/json"
```

✅ **À vérifier:**
- La réponse retourne une liste des tâches en retard
- Une notification est créée pour l'assigné (Marie)
- Un email est envoyé à Marie avec:
  - Titre de la tâche
  - Nombre de jours de retard
  - Lien vers la tâche
- Les tâches TERMINEE ou ANNULEE ne sont PAS notifiées

---

## ✅ CHECKLIST FINALE

- [ ] Utilisateurs créés (3)
- [ ] Équipe créée et membres ajoutés
- [ ] Emails de bienvenue reçus (3)
- [ ] Emails d'ajout à l'équipe reçus (2)
- [ ] Client créé
- [ ] Projet créé
- [ ] Services créés (3)
- [ ] Tâches créées et assignées (2)
- [ ] Emails d'assignation de tâche reçus (2)
- [ ] Tâches validées/rejetées par manager
- [ ] Factures créées (2)
- [ ] Abonnements créés (2)
- [ ] Factures d'abonnement générées automatiquement (2)
- [ ] Documents/uploads testés et stockés
- [ ] Permissions d'accès aux documents vérifiées
- [ ] Notifications apparaissent correctement
- [ ] CRON paiements en retard fonctionne
- [ ] Notification paiement en retard créée
- [ ] Email paiement en retard reçu
- [ ] CRON tâches en retard fonctionne
- [ ] Notification tâche en retard créée
- [ ] Email tâche en retard reçu
- [ ] Tous les emails reçus correctement (Ethereal)
- [ ] Templates HTML propres et formatés
- [ ] Dashboards affichent les données correctes
- [ ] Graphiques et KPI calculent correctement
- [ ] Tous les statuts de tâche testés
- [ ] Abonnements ACTIF/SUSPENDU/EN_RETARD fonctionnent
- [ ] Factures en ATTENTE/PAYEE/EN_RETARD affichées correctement

---

## 🆘 TROUBLESHOOTING

**Si email non reçu:**
- Vérifier que le serveur SMTP/Ethereal est configuré dans `.env`
- Vérifier les variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Vérifier que l'adresse email existe et est valide
- Vérifier les logs du serveur (console)
- Vérifier sur Ethereal: https://ethereal.email/messages

**Si notification non créée:**
- Vérifier que l'endpoint fonctionne (statut 200)
- Vérifier que l'utilisateur existe en BDD
- Vérifier les logs du serveur pour les erreurs
- Vérifier que la table Notification n'a pas de constraints

**Si CRON échoue:**
- Vérifier le secret CRON_SECRET dans `.env`
- Vérifier que l'URL est correcte et accessible
- Vérifier les logs du serveur
- Vérifier que le header X-Cron-Secret est correct
- Tester l'endpoint directement avec CURL

**Si abonnement non créé:**
- Vérifier que le client existe
- Vérifier que le service existe
- Vérifier la date début < date fin
- Vérifier que le montant est un nombre valide

**Si facture d'abonnement ne se génère pas:**
- Vérifier que l'abonnement a le statut ACTIF
- Vérifier que la date du jour >= dateProchainFacture
- Vérifier les calculs de date
- Vérifier que la TVA est appliquée (18%)

**Si tâche n'apparaît pas:**
- Vérifier le statut et les permissions
- Vérifier que l'utilisateur est connecté
- Vérifier que la tâche est liée au projet
- Vérifier que la tâche n'est pas supprimée

**Si upload échoue:**
- Vérifier que le port 4000 est accessible
- Vérifier que le dossier storage/uploads existe
- Vérifier les permissions du dossier
- Vérifier la taille du fichier (< 10 MB)
- Vérifier les logs du serveur d'upload

**Si les données ne s'actualisent pas:**
- Rafraîchir la page (F5 ou Ctrl+R)
- Vider le cache du navigateur
- Vérifier que vous êtes connecté
- Vérifier que vous avez les bonnes permissions

---

## 📋 RÉSUMÉ

Ce guide te permet de tester complètement tous les modules du système:

### 🧑‍💼 Gestion Utilisateurs et Équipes
1. ✅ Créer tous les utilisateurs nécessaires (ADMIN, MANAGER, EMPLOYE)
2. ✅ Créer et gérer une équipe
3. ✅ Ajouter des membres et vérifier les emails de notification

### 📊 Gestion Clients et Projets
4. ✅ Créer un client
5. ✅ Créer un projet
6. ✅ Lier les tâches au projet

### 🎯 Gestion des Tâches
7. ✅ Soumettre et assigner des tâches
8. ✅ Manager valide/rejette les tâches
9. ✅ Vérifier les emails d'assignation
10. ✅ **Manager reçoit notification "Nouvelle tâche créée"** (au lieu de "soumise")
11. ✅ Tester les uploads de documents
12. ✅ Vérifier les permissions d'accès

### 💳 Gestion des Abonnements et Facturation
13. ✅ Créer des services
14. ✅ Créer des abonnements avec fréquences
15. ✅ Vérifier la génération automatique de factures
16. ✅ Tester les calculs de TVA
17. ✅ Vérifier les statuts d'abonnement

### 💰 Gestion des Paiements et Notifications
18. ✅ Créer des factures
19. ✅ Tester la détection des paiements en retard (CRON)
20. ✅ Vérifier les emails de notification retard
21. ✅ Tester la détection des tâches en retard (CRON)

### 📧 Système d'Email
22. ✅ Vérifier tous les templates d'email
23. ✅ Tester l'intégration Ethereal
24. ✅ Valider les données dynamiques dans les emails

### 📈 Tableaux de Bord
25. ✅ Vérifier les dashboards
26. ✅ Valider les KPI et graphiques
27. ✅ Tester les filtres et recherches

---

## 📝 STATUTS ET VALEURS À TESTER

**Statuts de Tâche:**
- NOUVEAU → ASSIGNEE → EN_COURS → TERMINE / REJETE / ANNULE

**Statuts de Facture:**
- EN_ATTENTE → PAYEE / EN_RETARD / ANNULEE

**Statuts d'Abonnement:**
- ACTIF → SUSPENDU / EN_RETARD / ANNULE / TERMINE

**Rôles Utilisateur:**
- ADMIN: Accès complet
- MANAGER: Gestion équipe + validation tâches
- EMPLOYE: Soumission tâches + consultation

---

## 🚀 PROCHAINES ÉTAPES APRÈS LES TESTS

1. ✅ Vérifier que tous les tests passent (checklist complétée)
2. ✅ Documenter les bugs trouvés
3. ✅ Corriger les bugs en priorité
4. ✅ Refaire les tests (regression testing)
5. ✅ Préparer le déploiement en production
6. ✅ Former les utilisateurs
7. ✅ Lancer le système en production

---

**Ton système est maintenant complètement testé!** 🚀

Pour reproduire les tests: utilise ce guide étape par étape et coche la checklist à mesure de ta progression.
