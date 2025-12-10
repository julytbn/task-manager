# ⚡ QUICK START GUIDE - COMMANDES ESSENTIELLES

**Date**: 9 Décembre 2025

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Démarrer l'Application

```bash
# Lancer le serveur de développement
npm run dev
# L'application sera accessible sur http://localhost:3000 (ou 3001 si 3000 est occupé)

# OU lancer sur un port spécifique
PORT=3000 npm run dev
```

### 2. Tester l'Application

```bash
# Exécuter la suite de tests complète (100% réussite)
node scripts/testCompleteSystemV2.js

# Exécuter le test original
node scripts/testCompleteSystem.js

# Exécuter les tests spécifiques
node scripts/testPaymentLateDetection.js
node scripts/testCompleteFlow.js
node scripts/testEmailSending.js
```

### 3. Build pour Production

```bash
# Créer un build optimisé
npm run build

# Vérifier le build
npm run build && npm run start
```

### 4. Nettoyage et Maintenance

```bash
# Supprimer les fichiers temporaires
rm -r .next node_modules

# Réinstaller les dépendances
npm install

# Mettre à jour les dépendances
npm update
```

---

## 📊 VÉRIFICATIONS IMPORTANTES

### Avant le Déploiement

```bash
# 1. Vérifier que le build se compile sans erreurs
npm run build

# 2. Vérifier les types TypeScript
npx tsc --noEmit

# 3. Exécuter les tests
node scripts/testCompleteSystemV2.js

# 4. Vérifier les dépendances vulnérables
npm audit

# 5. Vérifier la base de données
npx prisma migrate status
```

### Configuration Environnement

```bash
# Vérifier les variables d'environnement
cat .env.local

# Variables essentielles à vérifier:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# - API_BASE_URL
```

---

## 🗂️ STRUCTURE DE FICHIERS CRÉÉS

```
task-manager/
├── TEST_RESULTS_VALIDATION.md         ← Rapport de validation
├── CORRECTION_HOOKS_REACT.md          ← Doc correction erreur
├── RESUME_SESSION_9DEC2025.md         ← Résumé session
├── ROADMAP_DEPLOYMENT.md              ← Plan de déploiement
├── EXECUTIVE_SUMMARY_9DEC.md          ← Résumé exécutif
├── QUICK_START_GUIDE.md               ← Ce fichier
└── scripts/
    └── testCompleteSystemV2.js        ← Script test amélioré
```

---

## 🔍 DIAGNOSTIQUE

### Si l'application ne démarre pas

```bash
# 1. Vérifier les dépendances
npm install

# 2. Vérifier la base de données
npx prisma db push

# 3. Vérifier les variables d'environnement
echo $DATABASE_URL
echo $NEXTAUTH_SECRET

# 4. Nettoyer le cache
rm -rf .next && npm run dev
```

### Si les tests échouent

```bash
# 1. Vérifier que le serveur est lancé
npm run dev  # Dans un terminal

# 2. Exécuter les tests dans un autre terminal
node scripts/testCompleteSystemV2.js

# 3. Vérifier les logs
tail -f .next/logs/app.log
```

### Si une erreur React se produit

```bash
# Nettoyer et relancer
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📋 MODULES À TESTER MANUELLEMENT

### 1. Gestion des Clients
```
URL: http://localhost:3000/clients
Actions:
- [ ] Consulter la liste des clients
- [ ] Créer un nouveau client
- [ ] Visualiser les détails d'un client
- [ ] Vérifier les onglets: Abonnements, Projets, Factures
```

### 2. Gestion des Projets
```
URL: http://localhost:3000/projets
Actions:
- [ ] Consulter la liste des projets
- [ ] Créer un nouveau projet
- [ ] Assigner un projet
- [ ] Voir les tâches du projet
```

### 3. Gestion des Tâches
```
URL: http://localhost:3000/taches
Actions:
- [ ] Consulter les tâches
- [ ] Créer une nouvelle tâche
- [ ] Assigner une tâche
- [ ] Changer le statut
- [ ] Ajouter des pièces jointes
```

### 4. Gestion des Factures
```
URL: http://localhost:3000/factures
Actions:
- [ ] Consulter les factures
- [ ] Créer une facture
- [ ] Éditer une facture
- [ ] Télécharger en PDF
- [ ] Enregistrer un paiement
```

### 5. Dashboard Employé
```
URL: http://localhost:3000/dashboard/employe
Actions:
- [ ] Vérifier la page charge sans erreur
- [ ] Consulter "Mes tâches"
- [ ] Voir le calendrier
- [ ] Vérifier les paiements
```

### 6. Dashboard Manager
```
URL: http://localhost:3000/dashboard
Actions:
- [ ] Vérifier les statistiques
- [ ] Consulter les tâches en retard
- [ ] Vérifier les paiements
- [ ] Voir les performances des équipes
```

---

## 🔐 SÉCURITÉ

### Vérifications de Sécurité

```bash
# 1. Vérifier les dépendances vulnérables
npm audit

# 2. Vérifier les variables sensibles dans le code
grep -r "password\|API_KEY\|SECRET" src/ --include="*.ts" --include="*.tsx"

# 3. Vérifier les fichiers .env ne sont pas commitès
git status | grep .env

# 4. Vérifier HTTPS en production
curl -I https://votre-domaine.com
```

### Configuration HTTPS

```bash
# En production, assurez-vous que:
- [ ] Certificat SSL installé
- [ ] Redirection HTTP → HTTPS active
- [ ] Headers de sécurité configurés
- [ ] CORS correctement configuré
```

---

## 📈 MONITORING

### Indicateurs à Surveiller

```
Performance:
- [ ] Temps de réponse API < 500ms
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s

Erreurs:
- [ ] Zéro erreurs 5xx (serveur)
- [ ] < 1% erreurs 4xx (client)
- [ ] Zéro erreurs JavaScript non gérées

Utilisateurs:
- [ ] Taux d'uptime > 99.9%
- [ ] Nombre de sessions actives
- [ ] Temps moyen par session
```

---

## 💬 COMMANDES GIT

### Gestion des Versions

```bash
# Voir le statut
git status

# Voir les changements
git diff

# Voir l'historique
git log --oneline

# Créer une branche
git checkout -b feature/ma-feature

# Committer les changements
git add .
git commit -m "feat: description de la feature"

# Pusher la branche
git push origin feature/ma-feature

# Merger dans main
git checkout main
git merge feature/ma-feature
git push origin main
```

---

## 📞 TROUBLESHOOTING

### Problème: Port déjà utilisé

```bash
# Tuer le processus sur le port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Ou lancer sur un autre port
PORT=3001 npm run dev
```

### Problème: Erreur de base de données

```bash
# Réinitialiser la base de données
npx prisma migrate reset

# Ou pusher les migrations
npx prisma db push

# Vérifier l'état
npx prisma migrate status
```

### Problème: Cache NextJS

```bash
# Nettoyer le cache NextJS
rm -rf .next

# Relancer
npm run dev
```

### Problème: Dépendances cassées

```bash
# Nettoyer complètement
rm -rf node_modules package-lock.json .next

# Réinstaller
npm install

# Relancer
npm run dev
```

---

## 📞 SUPPORT & ESCALADE

### En Cas de Problème

1. **Vérifier les logs**
   ```bash
   npm run dev  # Voir les logs en temps réel
   ```

2. **Consulter la documentation**
   - `TEST_RESULTS_VALIDATION.md`
   - `CORRECTION_HOOKS_REACT.md`
   - `ROADMAP_DEPLOYMENT.md`

3. **Exécuter les tests**
   ```bash
   node scripts/testCompleteSystemV2.js
   ```

4. **Créer un ticket**
   - Décrire le problème
   - Partager les logs
   - Inclure les étapes pour reproduire

---

## ✅ CHECKLIST AVANT LANCEMENT

- [ ] `npm run build` réussi
- [ ] `npm run dev` lancé sans erreur
- [ ] `node scripts/testCompleteSystemV2.js` réussi (9/9)
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] HTTPS configuré
- [ ] Monitoring en place
- [ ] Équipe formée
- [ ] Documentation lue
- [ ] Tests manuels passés

---

**Créé le**: 9 Décembre 2025  
**Version**: 1.0  
**Statut**: ✅ Application Prête  
**Prochaine révision**: Avant déploiement production
