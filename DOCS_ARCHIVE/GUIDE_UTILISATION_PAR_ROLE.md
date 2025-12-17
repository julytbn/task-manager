# 📖 GUIDE D'UTILISATION PAR RÔLE - APPLICATION KEKELI

**Document:** Guide interne pour l'entreprise  
**Date:** 15 Décembre 2025  
**Audience:** Managers, Employés, Administrateurs

---

## 🎯 OVERVIEW DU SYSTÈME

Ce logiciel est une **application interne** pour gérer:
- **CRM des clients**
- **Gestion de projets**
- **Facturation (proformas + factures)**
- **Timesheet des employés**
- **Comptabilité (charges et prévisions)**

**Important:** Les clients n'ont PAS accès à cette application.

---

## 👤 RÔLE 1 : MANAGER

### 🎯 Missions principales

Tu gères:
- Création et suivi des clients
- Création et suivi des projets
- Assignation des tâches aux employés
- Validation des timesheets
- Création et suivi des factures
- Enregistrement des paiements
- Suivi des charges et prévisions

### 📍 Pages principales

#### 1️⃣ Dashboard Manager (`/dashboard`)
**Ce que tu vois:**
- Recettes mensuelles (en euros)
- Charges mensuelles
- Bénéfice net (recettes - charges)
- Nombre de factures impayées
- Heures travaillées par l'équipe
- Projets en retard
- Graphes d'évolution

**Actions possibles:**
- Cliquer sur un chiffre pour voir les détails
- Filtrer par date
- Exporter un rapport

---

#### 2️⃣ Clients (`/clients`)
**Ce que tu peux faire:**

**Créer un nouveau client:**
1. Cliquer sur "Nouveau client"
2. Remplir:
   - Nom / Prénom (ou Entreprise)
   - Email
   - Téléphone
   - Adresse
   - **URL GUDEF** (lien vers le compte officiel)
   - Type : Particulier ou Entreprise
   - SIRET/SIREN (si entreprise)
3. Ajouter des notes internes
4. Uploader des documents (optionnel)

**Voir le détail du client:**
1. Cliquer sur le nom du client
2. Tu vois:
   - Infos générales
   - Bouton 🔗 **"Ouvrir GUDEF"** (ouvre automatiquement le lien)
   - Liste des projets en cours
   - Factures et proformas
   - Paiements reçus
   - Documents
   - Historique des interactions

---

#### 3️⃣ Projets (`/projets`)
**Ce que tu peux faire:**

**Créer un nouveau projet:**
1. Cliquer sur "Nouveau projet"
2. Remplir:
   - Client concerné
   - Nom du projet
   - Description
   - Dates : début et fin estimées
   - Budget estimatif (optionnel)
   - Services concernés (peut en choisir plusieurs)
   - Équipe assignée
3. Valider

**Voir un projet:**
1. Cliquer sur le nom du projet
2. Tu vois:
   - Détails du projet
   - Liste des tâches (à faire, en cours, terminées)
   - Montant total et factures associées
   - Timesheet des employés du projet
   - Équipe assignée
   - Services facturable

**Important:** Le montant final ne vient PAS des tâches, mais:
- De la facture proforma (création manuelle)
- Ou de l'abonnement (récurrent)
- Ou des services facturés directement

---

#### 4️⃣ Tâches (`/taches`)
**Ce que tu peux faire:**

**Voir les tâches soumises:**
- Affichage de TOUTES les tâches (créées par les employés)
- Tâches avec statut "EN_ATTENTE" (validation requise)
- Tâches sans assigné

**Assigner une tâche:**
1. Cliquer sur une tâche
2. Cliquer sur "Assigner à"
3. Choisir un employé de l'équipe
4. Valider

**Marquer comme validée:**
1. Cliquer sur la tâche
2. Bouton "Valider la tâche"
3. La tâche passe à "EN_COURS"

**Voir les détails:**
- Description
- Priorité
- Dates d'échéance
- Employé assigné
- Service lié (optionnel)
- Heures estimées/réelles
- Montant si facturable

---

#### 5️⃣ Timesheet Validation (`/timesheets/validation`)
**Ce que tu peux faire:**

**Voir les timesheets en attente:**
1. Aller à `/timesheets/validation`
2. Voir la liste des timesheets **"EN_ATTENTE"** (des employés)

**Valider un timesheet:**
1. Cliquer sur un timesheet
2. Voir:
   - Date
   - Projet et tâche
   - Heures normales
   - Heures supplémentaires (si applicable)
   - Description de l'activité
   - Nom de l'employé
3. Bouton "Valider" → Passe à "VALIDEE"

**Rejeter un timesheet:**
1. Bouton "Rejeter"
2. Optionnel : laisser un commentaire
3. L'employé le voit et peut le corriger

**Voir les statistiques:**
- Total des heures validées ce mois
- Coût interne (heures × tarif horaire)
- Comparaison avec mois précédent

---

#### 6️⃣ Factures Proformas (`/factures`)
**Ce que tu peux faire:**

**Créer une facture proforma:**
1. Cliquer sur "Nouvelle proforma"
2. Remplir:
   - Client
   - Projet (optionnel)
   - Montant total
   - Description
   - Date d'échéance
   - Ajouter des lignes (designation, montant, intervenant)
3. Sauvegarder → Statut = "EN_COURS"

**Voir les proformas:**
- Filtre par statut
- Voir toutes les proformas en cours
- Voir celles validées

**Envoyer au client:**
- ✅ **HORS APPLICATION** (email, WhatsApp, physique)
- Tu peux copier le lien PDF pour l'envoyer

**Valider la proforma reçue:**
1. Cliquer sur la proforma
2. Client l'a validée (confirmation par email/appel/WhatsApp)
3. Toi : Cliquer sur "Marquer comme validée"
4. Statut passe à "ACCEPTEE"

**Conversion en facture:**
1. Proforma "ACCEPTEE"
2. Cliquer sur "Convertir en facture"
3. Automatiquement :
   - Crée une **facture officielle**
   - Numéro de facture généré
   - Statut = "IMPAYEE"
   - Montant hérité
   - Date d'émission = aujourd'hui

---

#### 7️⃣ Factures (`/factures`)
**Ce que tu peux faire:**

**Voir les factures:**
- Liste de TOUTES les factures
- Filtre par statut (impayée, partiellement payée, payée)
- Filtre par client
- Filtre par date

**Voir une facture:**
1. Cliquer sur le numéro
2. Voir:
   - Lignes de facture
   - Montant total
   - Statut actuel
   - Paiements reçus
   - Date d'échéance
   - Notes

**Télécharger PDF:**
- Cliquer sur "Télécharger PDF"
- Génère un PDF prêt à imprimer/envoyer

**Envoyer par email:**
- Cliquer sur "Envoyer par email"
- Email automatique au client

---

#### 8️⃣ Paiements (`/paiements`)
**Ce que tu peux faire:**

**Enregistrer un paiement:**
1. Sélectionner une facture
2. Cliquer sur "Ajouter un paiement"
3. Remplir:
   - Montant payé
   - Mode de paiement (Virement, Chèque, Espèces, etc.)
   - Date de paiement
4. Valider

**Statuts automatiques:**
- Si montant payé = 0€ → **IMPAYEE**
- Si 0 < payé < montant → **PARTIELLEMENT_PAYEE**
- Si payé = montant → **PAYEE**

**Voir les revenus:**
- Dashboard affiche les revenus = paiements reçus
- PAS les factures générées (seulement paiements réels)

---

#### 9️⃣ Charges & Prévisions (`/accounting/charges`)
**Ce que tu peux faire:**

**Enregistrer une charge:**
1. Cliquer sur "Nouvelle charge"
2. Remplir:
   - Libellé (ex: "Salaire novembre")
   - Montant
   - Catégorie:
     - Salaires & charges sociales
     - Loyer
     - Internet
     - Impôts
     - Autres
   - Date de la charge
   - Date de paiement prévue (optionnel)
   - Employé (optionnel)
   - Projet (optionnel)
3. Sauvegarder

**Prévoir les salaires:**
1. Catégorie = "Salaires & charges sociales"
2. Montant total des salaires
3. Date prévue de paiement

**Notifications automatiques:**
- ⏰ 5 jours avant : notification dans l'app
- 📧 Email automatique : "Attention : paiement des salaires prévu dans 5 jours"

**Voir les charges:**
- Vue mensuelle
- Graphes d'évolution
- Comparaison mois par mois
- Calcul automatique du bénéfice (recettes - charges)

---

### 🔐 Accès spécifique Manager

| Page | Peut créer | Peut modifier | Peut valider | Peut supprimer |
|------|-----------|---------------|--------------|--------|
| Clients | ✅ Oui | ✅ Oui | - | ✅ Oui |
| Projets | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui |
| Services | ❌ Non (Admin) | ❌ Non (Admin) | - | ❌ Non |
| Tâches | ✅ Assigner | ✅ Valider | ✅ Oui | - |
| Timesheets | ❌ Non | ❌ Non | ✅ Valider | ❌ Non |
| Proformas | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui |
| Factures | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui |
| Paiements | ✅ Oui | ✅ Oui | - | ✅ Oui |
| Charges | ✅ Oui | ✅ Oui | - | ✅ Oui |

---

## 👨‍💻 RÔLE 2 : EMPLOYÉ

### 🎯 Missions principales

Tu dois:
- Consulter tes tâches assignées
- Soumettre des tâches (si besoin)
- Compléter ton timesheet
- Voir tes projets

### 📍 Pages principales

#### 1️⃣ Dashboard Employé (`/dashboard/employe`)
**Ce que tu vois:**
- Mes tâches d'aujourd'hui
- Mes projets en cours
- Heures travaillées cette semaine
- Derniers timesheets soumis
- Notifications personnelles

**Actions:**
- Cliquer sur une tâche pour voir les détails
- Accéder directement à "Mon Timesheet"
- Voir les tâches qui me sont assignées

---

#### 2️⃣ Mes Tâches (`/taches`)
**Ce que tu peux faire:**

**Voir tes tâches:**
1. Aller à `/taches`
2. Voir uniquement TES tâches assignées
3. Filtrer par statut:
   - À faire
   - En cours
   - Terminée

**Mettre à jour une tâche:**
1. Cliquer sur une tâche
2. Voir les détails:
   - Titre
   - Description
   - Projet
   - Date d'échéance
   - Priorité
   - Service lié
3. Cliquer sur "Changer le statut"
4. Options:
   - À faire → En cours
   - En cours → Terminée
   - Ou revenir à À faire

**Ajouter une tâche (si autorisé):**
1. Cliquer sur "Nouvelle tâche"
2. Remplir:
   - Titre
   - Description
   - Projet
   - Service (optionnel)
   - Priorité
   - Date estimée
3. Soumettre → En attente de validation manager

**Voir les détails:**
- Description complète
- Heures estimées vs réelles
- Documents attachés
- Commentaires

---

#### 3️⃣ Mon Timesheet (`/timesheets/my-timesheets`)
**Ce que tu peux faire:**

**Créer un timesheet:**
1. Cliquer sur "Nouveau timesheet"
2. Remplir:
   - **Date** du travail
   - **Projet**
   - **Tâche**
   - **Heures normales** (ex: 8h)
   - **Heures supplémentaires** (optionnel)
   - **Congé** (si applicable)
   - **Maladie** (si applicable)
   - **Description** : ce que tu as fait
3. Sauvegarder → Statut = "EN_ATTENTE"

**Voir tes timesheets:**
1. Aller à `/timesheets/my-timesheets`
2. Voir:
   - Tous tes timesheets
   - Statut: EN_ATTENTE, VALIDEE, REJETEE, CORRIGEE
   - Date
   - Total d'heures par mois

**Modifier un timesheet:**
- Si statut = EN_ATTENTE : tu peux modifier
- Si statut = REJETEE : tu peux corriger et réenvoyer
- Si statut = VALIDEE : tu ne peux pas modifier

**Timesheets rejetées:**
1. Manager a cliqué "Rejeter"
2. Peut-être un commentaire pour expliquer pourquoi
3. Toi : Cliquer "Corriger"
4. Modifier les heures
5. Réenvoyer → De nouveau EN_ATTENTE

---

#### 4️⃣ Mes Projets (`/projets`)
**Ce que tu peux faire:**

**Voir les projets:**
1. Aller à `/projets`
2. Voir uniquement les projets où tu es assigné
3. Voir:
   - Nom du projet
   - Client
   - Statut
   - Tâches du projet
   - Dates d'échéance

**Voir les détails d'un projet:**
1. Cliquer sur le projet
2. Voir:
   - Description
   - Équipe du projet
   - Tâches (que tu dois faire)
   - Timesheet (si tu en as soumis)
3. **Tu ne vois PAS:**
   - Montant du projet
   - Factures
   - Paiements

---

#### 5️⃣ Notifications (`/notifications`)
**Ce que tu reçois:**
- ✅ Nouvelle tâche assignée
- ✅ Tâche modifiée
- ✅ Timesheet rejeté (avec raison)
- ✅ Timesheet validé
- ✅ Changement dans un projet

**Actions:**
- Lire les notifications
- Marquer comme lues
- Cliquer pour aller directement à la tâche

---

### 🔐 Accès spécifique Employé

| Page | Peux voir | Peux créer | Peux modifier |
|------|----------|-----------|--------------|
| Dashboard | ✅ Mon dashboard | - | - |
| Mes tâches assignées | ✅ Seulement les miennes | ✅ Soumettre | ✅ Changer statut |
| Timesheet | ✅ Le mien | ✅ Créer | ✅ Avant validation |
| Mes projets | ✅ Seulement mes projets | ❌ Non | ❌ Non |
| Clients | ❌ Non | ❌ Non | ❌ Non |
| Factures | ❌ Non | ❌ Non | ❌ Non |
| Charges | ❌ Non | ❌ Non | ❌ Non |

---

## 🛠️ RÔLE 3 : ADMIN

### 🎯 Missions principales

Tu gères:
- Création des utilisateurs (managers, employés)
- Création des services et catégories
- Configuration du système
- Audit et logs
- Sauvegarde des données

### 📍 Pages principales

#### 1️⃣ Utilisateurs (`/utilisateurs`)
**Ce que tu peux faire:**

**Créer un utilisateur:**
1. Cliquer sur "Nouvel utilisateur"
2. Remplir:
   - Nom
   - Prénom
   - Email
   - Téléphone
   - Rôle: ADMIN, MANAGER, EMPLOYE, CONSULTANT
   - Département (optionnel)
3. Envoyer invitation par email

**Voir les utilisateurs:**
- Liste de TOUS les utilisateurs
- Voir leur rôle
- Voir leur département
- Voir leur statut (actif/inactif)

**Modifier un utilisateur:**
1. Cliquer sur l'utilisateur
2. Modifier:
   - Rôle
   - Département
   - Statut
3. Sauvegarder

**Désactiver un utilisateur:**
- Bouton "Désactiver"
- L'utilisateur ne peut plus se connecter
- Ses données restent dans le système

---

#### 2️⃣ Services (`/`)
**Ce que tu peux faire:**

**Créer une catégorie de service:**
1. Section "Catégories"
2. Cliquer sur "Nouvelle catégorie"
3. Nom : ex "Comptabilité"
4. Sauvegarder

**Créer un service:**
1. Cliquer sur "Nouveau service"
2. Remplir:
   - Nom du service
   - Catégorie
   - Description
   - Prix estimé (optionnel)
   - Durée estimée
3. Sauvegarder

**Voir les services:**
- Liste de TOUS les services
- Groupés par catégorie
- Voir prix et durée estimée

**Modifier un service:**
1. Cliquer sur le service
2. Modifier les infos
3. Sauvegarder

---

#### 3️⃣ Configuration (`/parametres`)
**Ce que tu peux faire:**

**Paramètres d'email:**
- SMTP serveur
- Port SMTP
- Email sender
- Mot de passe

**Paramètres de facturation:**
- Format de numéro de facture
- Devise
- Paramètres d'impression

**Paramètres de timesheet:**
- Tarif horaire par défaut
- Heures max par jour
- Rappels automatiques

**Notifications:**
- Activer/désactiver les emails
- Timing des rappels (salaires, factures, etc.)
- Templates d'emails

---

### 🔐 Accès spécifique Admin

| Fonction | Accès |
|----------|--------|
| Créer/modifier/supprimer utilisateurs | ✅ Oui |
| Créer/modifier/supprimer services | ✅ Oui |
| Voir TOUS les projets/clients/factures | ✅ Oui |
| Modifier configuration du système | ✅ Oui |
| Voir les logs d'activité | ✅ Oui |
| Exports de données | ✅ Oui |
| Sauvegarde BD | ✅ Oui |

---

## 📊 FLUX DE TRAVAIL COMPLET

### Scénario 1 : Nouveau projet avec facturation

```
1. MANAGER crée un CLIENT
   └─ Nom, email, URL GUDEF, adresse
   
2. MANAGER crée un PROJET
   ├─ Client
   ├─ Services (ex: Audit comptable)
   └─ Équipe (assigne des employés)
   
3. MANAGER crée des TÂCHES
   ├─ Assigne à des employés
   ├─ Les employés changent le statut EN_COURS → TERMINEE
   └─ Employés soumettent leur timesheet
   
4. MANAGER valide les TIMESHEETS
   └─ Confirme les heures travaillées
   
5. MANAGER crée une FACTURE PROFORMA
   ├─ Montant basé sur services
   ├─ Ajoute les lignes détaillées
   └─ Statut = EN_COURS
   
6. MANAGER envoie au CLIENT (HORS APP)
   ├─ Par email
   ├─ Par WhatsApp
   └─ Ou physique
   
7. CLIENT valide (HORS APP)
   └─ Par email/appel/signature
   
8. MANAGER marque comme VALIDEE
   └─ Statut = ACCEPTEE
   
9. MANAGER convertit en FACTURE
   ├─ Crée facture officielle
   ├─ Numéro généré
   └─ Statut = IMPAYEE
   
10. MANAGER enregistre le PAIEMENT
    ├─ Montant payé
    ├─ Mode (virement, chèque, etc.)
    └─ Facture passe à PAYEE
    
11. DASHBOARD affiche les REVENUS
    └─ Basés sur paiements reçus
```

---

### Scénario 2 : Abonnement récurrent

```
1. MANAGER crée un ABONNEMENT
   ├─ Client
   ├─ Service (ex: Coaching mensuel)
   ├─ Montant
   └─ Fréquence: MENSUEL
   
2. SYSTÈME génère automatiquement une PROFORMA
   ├─ Chaque mois
   ├─ Enregistrée pour validation
   └─ Manager la valide
   
3. PROFORMA → FACTURE
   └─ Même processus que scénario 1
   
4. DASHBOARD affiche l'ABONNEMENT
   └─ Comme revenue récurrent
```

---

### Scénario 3 : Prévision des salaires

```
1. MANAGER enregistre les CHARGES
   ├─ Catégorie: Salaires & charges sociales
   ├─ Montant total
   ├─ Date prévue: 15 décembre
   └─ Sauvegarder
   
2. SYSTÈME envoie NOTIFICATION
   ├─ 10 décembre (5 jours avant)
   ├─ Dashboard: "Paiement des salaires prévu dans 5 jours"
   └─ Email: Rappel automatique
   
3. MANAGER peut voir les CHARGES
   ├─ Graphes d'évolution
   ├─ Total mensuel
   └─ Comparaison avec mois précédent
   
4. DASHBOARD calcule BÉNÉFICE automatiquement
   └─ Recettes (paiements) - Charges
```

---

## ✅ CHECKLIST D'UTILISATION

### Pour un MANAGER, chaque mois:

- [ ] Créer les nouveaux projets/clients
- [ ] Assigner les tâches aux employés
- [ ] Vérifier les timesheet des employés (valider/rejeter)
- [ ] Créer les factures proformas
- [ ] Envoyer les proformas aux clients
- [ ] Valider les proformas reçues
- [ ] Convertir en factures officielles
- [ ] Enregistrer les paiements
- [ ] Ajouter les charges (salaires, loyers, etc.)
- [ ] Consulter le dashboard
- [ ] Générer un rapport mensuel

### Pour un EMPLOYÉ, chaque jour:

- [ ] Consulter mes tâches assignées
- [ ] Mettre à jour le statut des tâches
- [ ] Remplir mon timesheet
- [ ] Soumettre le timesheet
- [ ] Vérifier mes notifications

---

## 🆘 FAQ RAPIDE

### Q: Pourquoi la proforma n'a pas d'accès client?
**R:** Parce que les clients n'ont pas accès à l'application. C'est un logiciel INTERNE pour Kekeli.

### Q: Le timesheet se fait quand?
**R:** Chaque jour ou fin de semaine. L'employé remplit, le manager valide le lendemain ou en fin de semaine.

### Q: Comment se calcule le revenu?
**R:** Le revenu = paiements reçus (PAS les factures générées). Donc si tu as émis 1000€ mais reçu 500€, le revenu affiché est 500€.

### Q: La charge salaire peut être modifiée après?
**R:** Oui, manager peut modifier avant le paiement. Après, elle reste dans les archives.

### Q: Y a-t-il des rapports?
**R:** Oui, dashboard avec graphes. Pour des rapports détaillés, exporte les données.

### Q: Un employé peut soumettre une tâche?
**R:** Oui, il peut créer une tâche et la soumettre. Le manager la valide et l'assigne.

### Q: Comment changer le rôle d'un utilisateur?
**R:** Admin seul → Va à `/utilisateurs` → Clique sur l'utilisateur → Change le rôle → Sauvegarde.

---

## 🎯 CONCLUSION

Ce système est conçu pour:
- ✅ Gérer les clients internes (crm)
- ✅ Organiser les projets et tâches
- ✅ Facturer les services de l'entreprise
- ✅ Tracer les heures travaillées (timesheet)
- ✅ Gérer les finances (charges, revenus)
- ✅ Assurer la confidentialité (pas d'accès client)

**Le scénario décrit fonctionne à 95%.**

Pour toute question, contacte l'administrateur système.

---

**Document:** Guide d'utilisation  
**Version:** 1.0  
**Date:** 15 Décembre 2025  
**Auteur:** Équipe technique
