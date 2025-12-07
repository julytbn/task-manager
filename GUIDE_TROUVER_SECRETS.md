# 🔐 GUIDE VISUEL - Trouver les Secrets dans GitHub

## ⚠️ Le chemin exact dépend de votre version de GitHub

---

## 🎯 Approche 1: Via l'URL directe (Plus rapide!)

### Allez directement à cette URL:
```
https://github.com/julytbn/task-manager/settings/secrets/actions
```

**Ou composez-la ainsi:**
1. Remplacez `julytbn` par votre username
2. Remplacez `task-manager` par le nom du repo
3. Collez dans la barre d'adresse

---

## 🎯 Approche 2: Via le Menu Settings (Interface visuelle)

### Étape 1: Aller au repo
- Allez à: https://github.com/julytbn/task-manager
- Cliquez sur l'onglet **Settings** (tout en haut à droite)

### Étape 2: Trouver les Secrets

**Cherchez l'une de ces options dans le menu de gauche:**

Option A: **"Secrets and variables"**
- Cliquez dessus
- Puis cliquez sur **"Actions"** (pas "Dependabot")

Option B: **"Actions"** directement
- Cherchez un sous-menu "Secrets"
- Cliquez sur celui-ci

Option C: **"Security"** (si présent)
- Puis **"Secrets"**
- Puis **"Actions secrets"**

---

## 📸 Où Chercher Exactement

### Dans le Menu Settings de Gauche:

```
┌─────────────────────────────────┐
│ GENERAL                         │
├─────────────────────────────────┤
│ → Code and automation           │
│   → Actions                     │ ← Cherchez ici!
│   → Webhooks                    │
│                                 │
│ → Security                      │
│   → Secrets and variables       │ ← OU ICI!
│   → Deploy keys                 │
│                                 │
│ → Advanced                      │
│   ...                           │
└─────────────────────────────────┘
```

---

## ✅ Une fois sur la page des Secrets

Vous devriez voir:

```
Secrets and variables > Actions

[Repository secrets]
   ☑ Add secret
   [aucun secret yet]
   
[Organization secrets]
   [hérités du projet]
```

---

## 🔴 Si vous ne trouvez toujours pas:

### Essayez ceci:

1. **Déconnectez-vous et reconnectez-vous** (cache GitHub)

2. **Essayez un autre navigateur** (Firefox, Chrome, Edge)

3. **Utilisez l'URL directe:**
   ```
   https://github.com/julytbn/task-manager/settings/secrets/actions
   ```

4. **Contactez le support GitHub** si c'est un problème de permissions

---

## ⚡ Alternative Rapide: Utiliser GitHub CLI

Si vous avez **GitHub CLI** installé:

```bash
# Installer GitHub CLI (si pas déjà fait)
# Windows: choco install gh
# Mac: brew install gh
# Linux: sudo apt install gh

# Login
gh auth login

# Ajouter un secret
gh secret set CRON_SECRET --body "votre-secret-ici"
gh secret set BASE_URL --body "https://votre-domaine.com"

# Vérifier
gh secret list
```

---

## 🆘 Screenshots - Où Regarder

### Sur GitHub Web:

```
1. Repo → Settings (en haut)
                ↓
2. Menu de gauche → "Secrets and variables" 
                      OU "Actions" > "Secrets"
                ↓
3. Cliquez "Add secret"
                ↓
4. Remplissez:
   Name: CRON_SECRET
   Value: votre-secret
                ↓
5. Cliquez "Add secret"
```

---

## 📝 Chemin Exact par Étape

```
https://github.com
    ↓
[Account] → julytbn/task-manager
    ↓
Settings (onglet en haut)
    ↓
Menu Gauche: "Secrets and variables"
    ↓
Cliquez "Actions" (pas "Dependabot")
    ↓
"New repository secret"
    ↓
Remplissez les champs
```

---

## 💡 Astuce: Si vous voyez "Dependabot secrets"

C'est le **mauvais** endroit!

**Vous devez:**
1. Retour en arrière
2. Cliquez sur l'onglet **"Actions"** (à côté de Dependabot)
3. Puis cliquez "New repository secret"

---

## ✅ Vérification: Les Secrets Sont Là?

Une fois créés, vous devriez voir:

```
Repository secrets
├── ✅ CRON_SECRET (créé il y a X secondes)
└── ✅ BASE_URL (créé il y a X secondes)
```

Les valeurs sont **masquées** (vous ne pouvez pas les voir après création, c'est normal!)

---

## 🚨 Questions Fréquentes

### Q: Où sont les secrets maintenant?
**R:** Retournez à la même page. Ils sont listés mais masqués (c'est sécurisé!)

### Q: Je ne vois pas "New repository secret"?
**R:** Vérifiez que vous êtes sur l'onglet **Actions**, pas Dependabot

### Q: Puis-je voir la valeur que j'ai entrée?
**R:** Non, c'est intentionnel pour la sécurité. Seule la création nouvelle permet de voir.

### Q: Comment tester si ça marche?
**R:** Allez à **Actions** > **check-late-payments** > **Run workflow** (bouton vert)

---

## 📞 Liens Utiles

- **Doc GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **GitHub CLI**: https://cli.github.com/
- **Workflow File**: `.github/workflows/check-late-payments.yml` (dans votre repo)

---

**Note:** Si vous trouvez les secrets, tapez "✅ found" et on passe à l'étape suivante!
