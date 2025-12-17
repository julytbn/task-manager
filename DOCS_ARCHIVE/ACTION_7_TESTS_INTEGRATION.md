# 🧪 Tests d'Intégration - Action 7

## Objectives
Vérifier que tous les systèmes fonctionnent correctement ensemble:
1. ✅ Emails pour paiements retard
2. ✅ Calcul corrects des dates d'échéance
3. ✅ Cron job s'exécute
4. ✅ Routes consolidées fonctionnent
5. ✅ GitHub Actions configuré

---

## 📋 Plan de Test

### Test 1: Email de Paiement Retard

**Objectif**: Vérifier qu'un email est envoyé quand un paiement est en retard

#### Étapes
1. **Créer un client test**
   ```bash
   # Via API ou dashboard
   POST /api/clients
   {
     "nom": "Client Test Email",
     "email": "test-client@example.com"
   }
   ```

2. **Créer un projet avec fréquence**
   ```bash
   POST /api/projets
   {
     "titre": "Projet Test",
     "clientId": "<client-id>",
     "frequencePaiement": "MENSUEL",
     "budget": 100000
   }
   ```

3. **Créer une facture**
   ```bash
   POST /api/factures
   {
     "clientId": "<client-id>",
     "projetId": "<project-id>",
     "montantTotal": 50000,
     "dateEcheance": "2025-11-01"  // Date passée = retard
   }
   ```

4. **Créer un paiement EN_ATTENTE**
   ```bash
   POST /api/paiements
   {
     "montant": 0,
     "statut": "EN_ATTENTE",
     "clientId": "<client-id>",
     "factureId": "<facture-id>"
   }
   ```

5. **Déclencher la vérification des retards**
   ```bash
   # Via cron
   curl -X POST \
     -H "X-Internal-Secret: development-secret" \
     http://localhost:3000/api/paiements/check-late
   
   # OU via le nouveau proxy
   curl -X POST \
     -H "X-CRON-SECRET: development-secret" \
     http://localhost:3000/api/cron/check-late-payments
   ```

6. **Vérifier les résultats**
   - ✅ Une **notification** est créée en BDD
   - ✅ Un **email** est envoyé au manager (affichage URL Ethereal)
   - ✅ Les logs affichent `📧 Email alerte retard envoyé à ...`

#### Résultats Attendus
```json
{
  "success": true,
  "latePaymentsCount": 1,
  "latePayments": [
    {
      "id": "paiement-id",
      "clientName": "Client Test Email",
      "montant": 0,
      "daysLate": 36  // 36 jours de retard depuis le 1er nov
    }
  ]
}
```

---

### Test 2: Date Échéance Correcte

**Objectif**: Vérifier que la date d'échéance est correctement récupérée depuis la facture

#### Étapes
1. Créer facture avec `dateEcheance: 2025-12-15`
2. Créer paiement EN_ATTENTE lié à cette facture
3. Vérifier dans les logs que `dueDate = 2025-12-15`

#### Vérification
```bash
# Voir les logs
npm run dev

# Chercher la ligne:
# daysLate calculé correctement? 
# "Le paiement est en retard de X jours"
```

---

### Test 3: Route Consolidée Membres

**Objectif**: Vérifier que POST /api/equipes/[id]/membres crée notification ET email

#### Étapes
1. **Créer une équipe**
   ```bash
   POST /api/equipes
   {
     "nom": "Équipe Test",
     "leadId": "<user-id>"
   }
   ```

2. **Ajouter un membre avec email**
   ```bash
   POST /api/equipes/<team-id>/membres
   {
     "utilisateurId": "<user-id>",
     "role": "DEVELOPER"
   }
   ```

3. **Vérifier les résultats**
   - ✅ Membre créé en BDD
   - ✅ Notification créée
   - ✅ Email envoyé (URL Ethereal affiché)

#### Route Dépréciée
4. **Vérifier que POST /api/equipes/members retourne warning**
   ```bash
   POST /api/equipes/members
   {
     "equipeId": "<team-id>",
     "utilisateurId": "<user-id>",
     "role": "DEVELOPER"
   }
   
   # Résultat:
   {
     "ok": true,
     "warning": "⚠️ DEPRECATED: Cette route ne crée pas..."
   }
   ```

---

### Test 4: Endpoint CRON Unifié

**Objectif**: Vérifier que /api/cron/check-late-payments fonctionne

#### Étapes
1. **Test via POST**
   ```bash
   curl -X POST \
     -H "X-CRON-SECRET: development-secret" \
     http://localhost:3000/api/cron/check-late-payments
   ```

2. **Test via GET**
   ```bash
   curl -X GET \
     "http://localhost:3000/api/cron/check-late-payments?secret=development-secret"
   ```

3. **Vérifier** que c'est un proxy vers `/api/paiements/check-late`

#### Résultats Attendus
- ✅ Même réponse que `/api/paiements/check-late`
- ✅ Logs affichent: `[CRON] Proxy: Appel reçu...`

---

### Test 5: GitHub Actions Configuration

**Objectif**: Vérifier que le workflow GitHub est prêt

#### Étapes
1. **Vérifier les secrets sont configurés**
   - Aller: https://github.com/julytbn/task-manager/settings/secrets/actions
   - ✅ `CRON_SECRET` doit exister
   - ✅ `BASE_URL` doit exister

2. **Déclencher manuellement le workflow**
   - Aller: https://github.com/julytbn/task-manager/actions
   - Sélectionner: **Check Late Payments - Daily CRON**
   - Cliquer: **Run workflow** → **Run workflow**

3. **Vérifier les logs**
   - ✅ Workflow complété avec succès
   - ✅ Pas d'erreur 401 ou 404

---

## ✅ Checklist de Test

```
[ ] Test 1: Email paiement retard
    [ ] Client créé
    [ ] Projet créé
    [ ] Facture créée avec dateEcheance passée
    [ ] Paiement EN_ATTENTE créé
    [ ] CRON déclenché
    [ ] Notification créée en BDD
    [ ] Email reçu (URL Ethereal visible)

[ ] Test 2: Date échéance correcte
    [ ] dateEcheance récupérée depuis facture
    [ ] Jours de retard calculés correctement

[ ] Test 3: Route membres consolidée
    [ ] POST /api/equipes/[id]/membres crée email + notification
    [ ] POST /api/equipes/members retourne deprecation warning

[ ] Test 4: Endpoint CRON unifié
    [ ] POST /api/cron/check-late-payments fonctionne
    [ ] GET /api/cron/check-late-payments?secret=... fonctionne
    [ ] C'est un proxy vers /api/paiements/check-late

[ ] Test 5: GitHub Actions
    [ ] Secrets configurés
    [ ] Workflow s'exécute manuellement
    [ ] Pas d'erreurs dans les logs
```

---

## 📊 Métriques de Succès

### Performance
- [ ] Email envoyé en < 2 secondes
- [ ] CRON check-late complété en < 5 secondes
- [ ] Pas de timeout sur les API calls

### Fiabilité
- [ ] 100% des paiements retard détectés
- [ ] 100% des emails envoyés avec succès
- [ ] 0 erreur non-gérée

### UX
- [ ] Managers reçoivent emails clairs
- [ ] Dashboard affiche alertes correctement
- [ ] Notifications non-dupliquées sur 7 jours

---

## 🐛 Debugging

Si un test échoue:

### Email non envoyé?
```bash
# Vérifier les logs
npm run dev

# Chercher "Email alerte retard"
# ou "❌ Erreur lors de l'envoi d'email"

# Vérifier SMTP_HOST en .env
echo $SMTP_HOST  # doit être vide pour utiliser Ethereal
```

### Date échéance incorrect?
```bash
# Vérifier la facture
curl http://localhost:3000/api/factures/<facture-id>

# Vérifier que dateEcheance est présente et correcte
# Si manquante: le champ n'a pas été créé en migration
```

### Route membres ne crée pas email?
```bash
# Vérifier le contenu de la réponse
# S'il y a "warning": deprecated, c'est que vous utilisez la mauvaise route

# Utiliser: POST /api/equipes/<team-id>/membres
# PAS: POST /api/equipes/members
```

### CRON ne s'exécute pas sur GitHub?
```bash
# Vérifier les secrets:
# https://github.com/julytbn/task-manager/settings/secrets/actions

# Vérifier l'URL prod:
# BASE_URL doit être: https://task-manager-production.vercel.app
# (pas http:// ni avec /api à la fin)
```

---

**Prochain**: Action 8 (Performance Profiling)
