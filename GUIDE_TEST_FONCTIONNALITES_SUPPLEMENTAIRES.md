# 🔍 GUIDE DE TEST - FONCTIONNALITÉS SUPPLÉMENTAIRES

Ce document couvre les fonctionnalités additionnelles qui n'étaient pas dans le guide complet mais qui doivent aussi être testées.

---

## 📱 TESTE LES DASHBOARDS

### 1. Dashboard Admin

**Accès:** Admin Panel (si accessible)

```
À vérifier:
- Nombre total d'utilisateurs
- Nombre total de tâches
- Nombre total de factures
- Nombre total d'abonnements
- Graphique des revenus
- Graphique des tâches par statut
- Graphique des clients
```

✅ **À tester:**
- [ ] Admin peut voir tous les utilisateurs
- [ ] Admin peut voir toutes les tâches
- [ ] Les statistiques se mettent à jour en temps réel
- [ ] Les graphiques affichent les bonnes données

---

### 2. Dashboard Manager

**Accès:** Jean Dupont (Manager) > Dashboard

```
À vérifier:
- Tâches de son équipe
- Tâches à valider
- Factures impayées
- Abonnements actifs
- Calendrier des paiements
```

✅ **À tester:**
- [ ] Le manager voit que les tâches de son équipe
- [ ] Les tâches à valider sont affichées
- [ ] Les paiements en retard sont visibles
- [ ] Les abonnements renouvelables sont listés

---

### 3. Dashboard Employé

**Accès:** Marie Martin ou Pierre Bernard (Employé) > Dashboard

```
À vérifier:
- Tâches assignées
- Tâches soumises
- Tâches en cours
- Notifications personnelles
```

✅ **À tester:**
- [ ] L'employé voit que ses tâches
- [ ] Les tâches assignées apparaissent avec le contexte
- [ ] Les notifications arrivent en temps réel
- [ ] Les tâches complétées disparaissent de la liste active

---

## 🔐 TESTER LES PERMISSIONS ET ACCÈS

### 1. Permissions Utilisateur

```bash
Tester avec chaque rôle:

ADMIN:
- Accès à Admin Panel ✅
- Peut créer utilisateurs ✅
- Peut créer équipes ✅
- Peut voir tous les données ✅

MANAGER:
- Accès au Dashboard Manager ✅
- Peut valider tâches ✅
- Peut voir son équipe ✅
- Pas accès Admin Panel ✅

EMPLOYE:
- Accès au Dashboard Employé ✅
- Peut soumettre tâches ✅
- Peut voir ses tâches ✅
- Pas accès à validation ✅
```

✅ **À tester:**
- [ ] Admin peut accéder à tous les modules
- [ ] Manager ne peut pas accéder à Admin Panel
- [ ] Employé ne peut pas valider les tâches
- [ ] Les permissions sont enforced correctement

### 2. Contrôle d'Accès aux Documents

```
Test:
1. Uploader un document en tant que Manager
2. Essayer d'accéder avec Employé (non assigné)
3. Essayer d'accéder avec l'assigné
```

✅ **À vérifier:**
- [ ] Employé non assigné ne peut pas voir le document
- [ ] Employé assigné peut voir et télécharger
- [ ] Manager peut voir tous les documents de son équipe

---

## 📊 TESTER LES RAPPORTS ET EXPORTS

### 1. Export de Factures

**Accès:** Dashboard > Factures > Export

```bash
À tester:
- Export PDF d'une facture
- Export Excel de la liste
- Export avec filtres appliqués
```

✅ **À vérifier:**
- [ ] PDF se génère correctement
- [ ] Données formatées correctement
- [ ] Signature/logo présent
- [ ] Excel contient toutes les colonnes

### 2. Rapport de Performance

```bash
À tester:
- Rapport par utilisateur
- Rapport par projet
- Rapport par client
- Rapport périodique (mois/trimestre)
```

✅ **À vérifier:**
- [ ] Les chiffres sont corrects
- [ ] Les tendances sont calculées
- [ ] Les comparaisons temporelles fonctionnent

---

## 🔔 TESTER LES NOTIFICATIONS EN TEMPS RÉEL

### 1. Notifications Dashboard

```
À tester:
1. Créer une nouvelle tâche assignée
2. Vérifier qu'une notification apparaît en temps réel
3. Cliquer sur la notification
4. Vérifier le lien vers la ressource
```

✅ **À vérifier:**
- [ ] Notification apparaît immédiatement
- [ ] Lien pointe vers la bonne ressource
- [ ] Notification peut être marquée comme lue

### 2. Notifications Email + Dashboard

```
À tester:
1. Événement déclenche notification
2. Email et notification dashboard créés
3. Les deux contiennent les mêmes infos
```

✅ **À vérifier:**
- [ ] Les deux notifications sont créées
- [ ] Les données sont cohérentes
- [ ] Les temps d'envoi sont proches

---

## 📞 TESTER LES CONTACTS ET CLIENT

### 1. Gestion des Contacts Client

**Accès:** Dashboard > Clients > [Client] > Contacts

```
À ajouter:
- Prénom: Sophie
- Nom: Durand
- Poste: Directrice Financière
- Email: sophie.durand@acme.com
- Téléphone: +221 77 123 45 67
```

✅ **À vérifier:**
- [ ] Contact créé et listé
- [ ] Email peut être utilisé pour envoyer documents
- [ ] Téléphone formaté correctement

### 2. Historique Client

```
À vérifier:
- Voir toutes les tâches du client
- Voir tous les paiements du client
- Voir tous les abonnements du client
- Voir tous les documents du client
```

✅ **À tester:**
- [ ] Historique complet et exact
- [ ] Filtres temporels fonctionnent
- [ ] Export possible depuis l'historique

---

## 💼 TESTER LA GESTION DES PROJETS

### 1. Statuts de Projet

**Créer un 2ème projet avec un statut différent:**

```
Projet 2: Projet Archive
Status: ARCHIVE
Client: Acme Corp
```

✅ **À vérifier:**
- [ ] Les projets archivés n'apparaissent pas par défaut
- [ ] Peuvent être filtrés pour afficher
- [ ] Les tâches de projets archivés ne peuvent pas être modifiées

### 2. Affectation de Budget

```
À ajouter au projet:
- Budget initial: 2,000,000 FCFA
- Dépensé jusqu'à présent: ?
- Reste disponible: ?
```

✅ **À vérifier:**
- [ ] Le calcul du budget est correct
- [ ] Les tâches consomment le budget
- [ ] Une alerte apparaît si budget atteint

---

## 📧 TESTER LA GESTION EMAIL AVANCÉE

### 1. Templates Personnalisés

```
À tester:
- Email de bienvenue custom
- Email de paiement en retard custom
- Email de tâche assignée custom
```

✅ **À vérifier:**
- [ ] Chaque template utilise le bon branding
- [ ] Les variables dynamiques sont remplacées
- [ ] Les liens de tracking fonctionnent

### 2. CC/BCC et Groupes

```
À tester:
- Envoyer email en CC du manager
- Envoyer email en BCC de l'admin
- Groupes de distribution
```

✅ **À vérifier:**
- [ ] CC reçoit bien l'email
- [ ] BCC ne voit pas les autres recipients
- [ ] Groupes d'envoi fonctionnent

---

## 🔄 TESTER LES WORKFLOWS ET AUTOMATIONS

### 1. Workflow de Tâche

```
Scénario complet:
1. NOUVEAU → créé par Employé
2. ASSIGNEE → assigné par Manager
3. EN_COURS → démarre par assigné
4. TERMINE → terminée par assigné
5. VALIDEE → validée par Manager
```

✅ **À vérifier:**
- [ ] Chaque transition est possible
- [ ] Les emails de transition sont envoyés
- [ ] Les notifications sont créées

### 2. Workflow de Facture

```
Scénario complet:
1. EN_ATTENTE → créée
2. PAYEE → payée
3. Ou EN_RETARD → détectée par CRON
```

✅ **À vérifier:**
- [ ] Transitions correctes
- [ ] Notifications appropriées
- [ ] KPI mis à jour

---

## 🌐 TESTER L'INTERNATIONALISATION

### 1. Dates et Nombres

```
À vérifier en FR-FR:
- Dates: JJ/MM/AAAA
- Nombres: 1 234 567,89
- Devise: FCFA
```

✅ **À tester:**
- [ ] Les dates sont au bon format
- [ ] Les nombres utilisent bonne séparation
- [ ] La devise est cohérente partout

### 2. Traductions

```
À vérifier:
- Interface en français
- Emails en français
- Rapports en français
```

✅ **À tester:**
- [ ] Pas de texte anglais visible
- [ ] Traductions cohérentes
- [ ] Termes métier traduits correctement

---

## ⚡ TESTER LES PERFORMANCES

### 1. Temps de Chargement

```
À mesurer:
- Page d'accueil: < 2s
- Liste des tâches (100+): < 3s
- Rapport (grand): < 5s
- Upload fichier: < 10s
```

✅ **À tester:**
- [ ] Pages charges rapidement
- [ ] Pas de lag sur interactions
- [ ] Pagination/lazy loading fonctionne

### 2. Gestion Mémoire

```
À observer:
- Pas de fuite mémoire (F12 > Performance)
- Pas de ralentissements progressifs
- Pas d'erreurs de stack
```

✅ **À tester:**
- [ ] Pas de memory leaks
- [ ] Performance stable dans la durée
- [ ] Responsive sur connexion lente

---

## 🔒 TESTER LA SÉCURITÉ

### 1. Authentification

```
À tester:
- Login avec email invalide: refuse ✅
- Login avec mot de passe invalide: refuse ✅
- Login avec compte valide: accepte ✅
- Logout fonctionne ✅
- Session expiration ✅
```

✅ **À vérifier:**
- [ ] Pas d'accès sans authentification
- [ ] Session bien gérée
- [ ] Timeout fonctionne

### 2. Injection SQL/XSS

```
À tester:
- Soumettre texte avec: <script>alert('xss')</script>
- Soumettre texte avec: ' OR '1'='1
- Vérifier que c'est échappé correctement
```

✅ **À vérifier:**
- [ ] Script n'exécute pas
- [ ] Texte brut affiché
- [ ] Base de données sécurisée

---

## 🐛 BUGS COURANTS À TESTER

```
À chercher:
- [ ] Dates invalides (29 février année non-bissextile)
- [ ] Montants négatifs (où ne devraient pas être)
- [ ] Doublons de notifications
- [ ] Emails envoyés deux fois
- [ ] Attachments manquants
- [ ] Images cassées dans emails
- [ ] Liens expirés
- [ ] Cache non mis à jour
- [ ] Pagination cassée
- [ ] Export incomplet
```

---

## ✅ CHECKLIST FINAL COMPLET

- [ ] Tous les dashboards testés
- [ ] Toutes les permissions vérifiées
- [ ] Tous les exports fonctionnent
- [ ] Notifications en temps réel OK
- [ ] Contacts clients gérés
- [ ] Projets avec budgets testés
- [ ] Emails personnalisés vérifiés
- [ ] Workflows complets testés
- [ ] Internationalisation correcte
- [ ] Performances acceptables
- [ ] Sécurité validée
- [ ] Bugs courants recherchés et fixés

---

## 📝 NOTES DE TEST

```
Date de test: ____________
Testeur: ________________
Environnement: DEV / STAGING / PROD

Bugs trouvés:
1. ____________________
2. ____________________
3. ____________________

Observations:
________________________

Recommandations:
________________________
```

---

**Bon testing! 🧪**
