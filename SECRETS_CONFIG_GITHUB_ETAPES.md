# 🔐 CONFIGURATION GITHUB SECRETS - Étapes Complètes

## ⚠️ CRITIQUE: Ces secrets doivent être configurés pour que le CRON fonctionne en production

---

## Étape 1: Accéder aux Settings du Repository

1. Allez à: **https://github.com/julytbn/task-manager**
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu de gauche, trouvez **Secrets and variables**
4. Cliquez sur **Actions**

---

## Étape 2: Créer le Secret `CRON_SECRET`

### 2.1 Cliquer sur "New repository secret"

### 2.2 Remplir:
- **Name**: `CRON_SECRET`
- **Secret**: Générez une chaîne sécurisée (au minimum 32 caractères)

**Exemple sécurisé**:
```
your-super-secret-token-12345678-abcdefgh-9876543210
```

Ou utilisez un générateur: https://www.random.org/strings/

### 2.3 Cliquer "Add secret"

---

## Étape 3: Créer le Secret `BASE_URL`

### 3.1 Cliquer sur "New repository secret"

### 3.2 Remplir:
- **Name**: `BASE_URL`
- **Secret**: L'URL de base de votre application

**Exemples**:
- Production: `https://task-manager.kekeligroup.com`
- Staging: `https://staging-task-manager.kekeligroup.com`
- Local (dev): `http://localhost:3000`

### 3.3 Cliquer "Add secret"

---

## Étape 4: Vérifier les Secrets

1. Après création, vous devriez voir:
   - ✅ `CRON_SECRET` (masqué)
   - ✅ `BASE_URL` (masqué)

2. Les secrets sont maintenant disponibles dans GitHub Actions

---

## Étape 5: Vérifier le Workflow

1. Allez à **Actions** (en haut)
2. Cliquez sur **check-late-payments**
3. Vous devriez voir le workflow avec l'horaire:
   ```
   Schedule: Every day at 07:00 UTC
   ```

---

## ✅ Vérification que Tout Fonctionne

### Vérifier le workflow YAML

Le fichier `.github/workflows/check-late-payments.yml` devrait contenir:

```yaml
name: Check Late Payments

on:
  schedule:
    - cron: '0 7 * * *'  # 07:00 UTC tous les jours
  workflow_dispatch:      # Manuel trigger

jobs:
  check-late-payments:
    runs-on: ubuntu-latest
    
    steps:
      - name: Check late payments
        run: |
          curl -X POST \
            -H "X-Internal-Secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{}' \
            ${{ secrets.BASE_URL }}/api/cron/check-late-payments
```

---

## 🧪 Test Manuel du Workflow

### Option 1: Trigger manuel via GitHub UI
1. Allez à **Actions**
2. Cliquez sur **check-late-payments**
3. Cliquez sur **Run workflow** (bouton vert)
4. Cliquez **Run workflow** dans le popup
5. Attendez quelques secondes pour voir les résultats

### Option 2: Trigger via curl (local)
```bash
curl -X POST \
  -H "X-Cron-Secret: your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/api/cron/check-late-payments
```

---

## 🔍 Troubleshooting

### ❌ Le workflow ne s'exécute pas

**Cause possible**: Secrets non configurés  
**Solution**: Vérifier dans Settings > Secrets que CRON_SECRET et BASE_URL existent

### ❌ Erreur 401 Unauthorized

**Cause possible**: Secret incorrect ou BASE_URL invalide  
**Solution**:
1. Vérifier la valeur exacte du CRON_SECRET
2. Vérifier que BASE_URL est accessible de l'internet
3. Vérifier que l'endpoint `/api/cron/check-late-payments` existe

### ❌ Erreur 500 Internal Server Error

**Cause possible**: Erreur dans la vérification des paiements  
**Solution**:
1. Vérifier les logs du serveur
2. Vérifier que la base de données est accessible
3. Vérifier que les migrations ont été exécutées

### ❌ Le workflow s'exécute mais les paiements ne sont pas détectés

**Cause possible**: Pas de paiements en retard dans la base de données  
**Solution**:
1. Créer des données de test avec paiements en retard
2. Vérifier la logique de détection en `lib/paymentLateService.ts`
3. Vérifier les logs

---

## 📝 Checklist Finale

- [ ] Secrets CRON_SECRET créé dans GitHub
- [ ] Secret BASE_URL créé dans GitHub
- [ ] Workflow file `.github/workflows/check-late-payments.yml` existe
- [ ] Workflow file contient les secrets correctement
- [ ] Test manuel du workflow réussi (via GitHub UI ou curl)
- [ ] Pas d'erreurs dans les logs

---

## 🎯 Après Configuration

Une fois les secrets configurés:

1. **Le CRON s'exécutera automatiquement** tous les jours à 07:00 UTC
2. **Les paiements en retard seront détectés** automatiquement
3. **Les notifications seront créées** dans la base de données
4. **Les emails seront envoyés** aux managers (si configurés)

---

**Important**: Ces secrets ne sont visibles qu'une fois au moment de la création. Si vous les oubliez, vous devrez les régénérer.

**Sécurité**: Ne partagez jamais vos secrets publiquement!

---

**Statut**: 📋 À faire  
**Importance**: 🔴 CRITIQUE  
**Temps estimé**: 5-10 minutes
