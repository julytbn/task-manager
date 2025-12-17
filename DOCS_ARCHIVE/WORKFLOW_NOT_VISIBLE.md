# 🎯 SOLUTION: Trouver "check-late-payments" dans GitHub Actions

## Le problème:
Le workflow n'apparaît pas dans la liste Actions car:
1. ✅ Le fichier existe: `.github/workflows/check-late-payments.yml`
2. ⚠️ Mais n'a jamais été exécuté
3. ⚠️ GitHub Actions n'affiche que les workflows qui ont une histoire

---

## ✅ Solutions:

### Solution 1: Créer manuellement un run (Recommandée!)

**Sur GitHub Web:**

1. Allez à: `https://github.com/julytbn/task-manager`
2. Cliquez l'onglet **"Actions"** (en haut)
3. Cherchez dans la liste de gauche (ou créez-en un)
4. Si vous ne voyez pas de liste, cherchez: **"New workflow"** ou **"Set up a workflow yourself"**

**Alternative - Lien direct:**
```
https://github.com/julytbn/task-manager/actions/new
```

---

### Solution 2: Lister tous les workflows

**URL directe pour voir TOUS les workflows (même jamais exécutés):**

```
https://github.com/julytbn/task-manager/blob/master/.github/workflows
```

Là vous devez voir: `check-late-payments.yml`

---

### Solution 3: Utiliser un script pour trigger le workflow

**Créer un fichier `trigger-workflow.sh`:**

```bash
#!/bin/bash

# Déclencher le workflow check-late-payments

curl -X POST \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/julytbn/task-manager/actions/workflows/check-late-payments.yml/dispatches \
  -d '{"ref":"master"}'

echo "Workflow triggé!"
```

**Pour l'exécuter:**
```bash
bash trigger-workflow.sh
```

---

## 🔍 Vérifier que le fichier est bien dans GitHub

**URL pour voir le fichier directement:**

```
https://github.com/julytbn/task-manager/blob/master/.github/workflows/check-late-payments.yml
```

Si vous voyez le fichier là, c'est qu'il est correctement stocké.

---

## 📋 Checklist - Pourquoi le workflow ne s'affiche pas

- [ ] Le fichier `.github/workflows/check-late-payments.yml` existe sur GitHub
- [ ] Le contenu YAML est correct
- [ ] Les secrets `CRON_SECRET` et `BASE_URL` sont configurés
- [ ] Vous êtes sur la bonne branche (`master`)
- [ ] Vous avez fait un commit et push

---

## 🆘 Si Toujours Pas Visible

### Essayez ceci:

1. **Vérifier le fichier sur GitHub:**
   ```
   https://github.com/julytbn/task-manager/tree/master/.github/workflows
   ```

2. **Vérifier la syntaxe YAML:**
   - Pas d'erreurs YAML?
   - Indentation correcte (2 espaces)?
   - Pas d'accents ou caractères bizarres?

3. **Créer un workflow test simple:**
   - Allez à `https://github.com/julytbn/task-manager/actions`
   - Cliquez "New workflow"
   - Utilisez un template GitHub
   - Voyez si ça apparaît

4. **Vérifier les permissions:**
   - Êtes-vous propriétaire du repo?
   - GitHub Actions est-il activé?

---

## ✅ Alternative: Test Local

Si vous voulez juste vérifier que ça marche:

**Localement:**
```bash
# Démarrer le serveur
npm run dev

# Dans autre terminal, tester le endpoint
curl -X POST \
  -H "X-Cron-Secret: test-secret" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/api/cron/check-late-payments

# Vous devriez voir: 200 OK
```

---

## 📞 Prochaines Étapes

**Dites-moi:**

1. ✅ Avez-vous vu le fichier sur GitHub? (`https://.../.github/workflows/check-late-payments.yml`)
2. ❓ Ou vous préférez tester localement d'abord?
3. 🆘 Ou vous êtes bloqué?

---

**Note:** Les secrets `CRON_SECRET` et `BASE_URL` doivent être configurés dans:
```
https://github.com/julytbn/task-manager/settings/secrets/actions
```

Sans ça, même si le workflow apparaît, il échouera.
