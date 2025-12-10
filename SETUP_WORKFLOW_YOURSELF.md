# 🎯 GUIDE: "Set up a workflow yourself" - Étapes Complètes

## Vous êtes sur la bonne page! 🎉

Si vous voyez un éditeur avec un template workflow vide, suivez ces étapes:

---

## Étape 1: Copier le Contenu du Workflow

**Voici le contenu exact à copier:**

```yaml
name: Check Late Payments

on:
  schedule:
    - cron: '0 7 * * *'  # Tous les jours à 07:00 UTC
  workflow_dispatch:      # Permet manual trigger

jobs:
  check-late-payments:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Check late payments
        run: |
          curl -X POST \
            -H "X-Cron-Secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.BASE_URL }}/api/cron/check-late-payments" \
            -d '{}'
        
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          BASE_URL: ${{ secrets.BASE_URL }}
        
        timeout-minutes: 5
        continue-on-error: true

      - name: Log result
        if: always()
        run: echo "Late payment check completed at $(date -u)"
```

---

## Étape 2: Dans l'Éditeur GitHub

### 2.1 Effacer le contenu par défaut
- Sélectionnez tout (Ctrl+A)
- Supprimez

### 2.2 Coller le contenu
- Collez le contenu ci-dessus
- Vérifiez l'indentation (doit être aligné comme ci-dessus)

### 2.3 Nommer le fichier
- En haut à gauche, vous devez voir un champ "Filename"
- **Important:** Remplacez le nom par:
  ```
  .github/workflows/check-late-payments.yml
  ```

---

## Étape 3: Sauvegarder

### 3.1 Cliquez "Commit changes" (bouton vert en haut à droite)

### 3.2 Dans le popup, remplissez:
- **Commit message:** `add: workflow check-late-payments cron`
- **Description (optionnel):** `Automated daily check for late payments`
- Gardez "Commit directly to the `master` branch" sélectionné

### 3.3 Cliquez "Commit changes"

---

## Étape 4: Vérifier que c'est Créé

Attendez 2-3 secondes, puis vous devriez être redirigé à:
```
https://github.com/julytbn/task-manager/blob/master/.github/workflows/check-late-payments.yml
```

Si vous voyez le fichier et le contenu YAML, c'est ✅ réussi!

---

## ✅ ENSUITE: Configurer les Secrets (TRÈS IMPORTANT!)

**Sans secrets, le workflow échouera!**

### 4.1 Allez à:
```
https://github.com/julytbn/task-manager/settings/secrets/actions
```

### 4.2 Créer Secret 1: CRON_SECRET
- Cliquez "New repository secret"
- **Name:** `CRON_SECRET`
- **Value:** Générez un token sécurisé, exemple:
  ```
  super-secret-token-12345678-abcdefghijklmnop-9876543210
  ```
  (Au minimum 32 caractères)
- Cliquez "Add secret"

### 4.3 Créer Secret 2: BASE_URL
- Cliquez "New repository secret"
- **Name:** `BASE_URL`
- **Value:** 
  ```
  https://task-manager.kekeligroup.com
  ```
  (Ou `http://localhost:3000` si vous testez en local)
- Cliquez "Add secret"

---

## 🧪 Étape 5: Tester le Workflow

### 5.1 Allez à:
```
https://github.com/julytbn/task-manager/actions
```

### 5.2 Cherchez "check-late-payments" dans la liste de gauche
- Cliquez dessus

### 5.3 Cliquez "Run workflow" (bouton gris)
- Sélectionnez la branche: `master`
- Cliquez "Run workflow" (confirmation)

### 5.4 Attendez 10-30 secondes
- Le workflow devrait s'exécuter
- Regardez le résultat:
  - ✅ **Vert** = Succès! Workflow fonctionne
  - ❌ **Rouge** = Erreur (cliquez pour voir les logs)

---

## 🆘 Si Erreur (Logs):

### Erreur commune 1: "Unauthorized"
**Cause:** Secret CRON_SECRET incorrect  
**Solution:** Vérifiez la valeur exacte du secret

### Erreur commune 2: "Cannot reach BASE_URL"
**Cause:** BASE_URL inaccessible  
**Solution:** Vérifiez que l'URL est correcte et accessible

### Erreur commune 3: "Secrets not found"
**Cause:** Secrets pas créés  
**Solution:** Allez à `settings/secrets/actions` et créez-les

---

## ✅ Résumé - Checklist

- [ ] "Set up a workflow yourself" cliqué
- [ ] Contenu YAML copié/collé
- [ ] Nom du fichier: `.github/workflows/check-late-payments.yml`
- [ ] "Commit changes" cliqué
- [ ] Secret `CRON_SECRET` créé
- [ ] Secret `BASE_URL` créé
- [ ] Workflow testé (Run workflow)
- [ ] Résultat: ✅ Vert (succès!)

---

## 🎯 Après Succès

Une fois que tout fonctionne:

1. Le workflow s'exécutera **automatiquement** tous les jours à 07:00 UTC
2. **Les paiements en retard seront détectés** automatiquement
3. **Les notifications seront créées** dans la base de données
4. **Les emails seront envoyés** aux managers

---

## 💡 Notes Importantes

- **Indentation YAML:** Respectez les espaces (2 espaces par niveau)
- **Pas d'accents:** Le YAML n'aime pas les accents
- **Secrets masqués:** Après création, vous ne pouvez pas voir la valeur (c'est intentionnel!)
- **Secrets en minuscules:** `CRON_SECRET` et `BASE_URL` (respectez la casse!)

---

**Dites-moi: "✅ Workflow créé et testé!" quand tout fonctionne!** 🚀
