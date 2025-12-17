# 🔍 SOLUTION RAPIDE - Configurer les Secrets

## Si vous trouvez l'interface trop compliquée...

---

## Option 1️⃣: Approche URL Directe (Recommandée!)

### Copier-coller cette URL dans votre navigateur:

```
https://github.com/julytbn/task-manager/settings/secrets/actions
```

**Note:** Remplacez:
- `julytbn` → votre username GitHub
- `task-manager` → le nom exact de votre repo

### Si la page charge:

1. Cliquez le bouton vert **"New repository secret"**

2. **Première fois - Créer CRON_SECRET:**
   ```
   Name: CRON_SECRET
   Secret: super-secret-token-12345678-abcdefghijklmnop-9876543210
   ```
   Cliquez "Add secret"

3. **Deuxième fois - Créer BASE_URL:**
   ```
   Name: BASE_URL
   Secret: https://task-manager.kekeligroup.com
   ```
   (Ou utilisez `http://localhost:3000` pour dev)
   
   Cliquez "Add secret"

4. **Vérifier:**
   Vous devez voir 2 secrets listés (masqués)

---

## Option 2️⃣: Via Actions - Manual Trigger Test

### Si les secrets sont configurés, testez-les ainsi:

1. Allez à: `https://github.com/julytbn/task-manager/actions`

2. Cherchez **"check-late-payments"** dans la liste

3. Cliquez dessus

4. Cliquez le bouton gris **"Run workflow"**

5. Cliquez **"Run workflow"** (confirmation)

6. Attendez 10-30 secondes et vérifiez le résultat:
   - ✅ Si **vert**: Secrets fonctionnent!
   - ❌ Si **rouge**: Erreur d'authentification

---

## Option 3️⃣: Solution Manuelle (Sans CLI)

### Si l'interface GitHub est trop compliquée:

**Créer un fichier `.env.local` en développement** (temporaire pour tester):

```bash
# Fichier: .env.local (racine du projet)

CRON_SECRET=votre-secret-token-ici
BASE_URL=http://localhost:3000
```

**Puis tester localement:**
```bash
npm run dev
curl -X POST \
  -H "X-Cron-Secret: votre-secret-token-ici" \
  http://localhost:3000/api/cron/check-late-payments
```

---

## 🎯 Approche Étape par Étape VISUELLE

### Si vous êtes dans Settings:

```
1. Allez à https://github.com/julytbn/task-manager
        ↓
2. Cliquez "Settings" (onglet en haut)
        ↓
3. Menu GAUCHE - Cherchez UNE de ces options:
   • "Secrets and variables"
   • "Actions" > "Secrets"  
   • "Security" > "Secrets"
        ↓
4. Si vous trouvez une page avec:
   "Repository secrets"
   [New repository secret]
   
   → C'EST LE BON ENDROIT! ✅
        ↓
5. Cliquez "New repository secret"
   Remplissez les infos
   Cliquez "Add secret"
        ↓
6. Répétez pour le 2e secret
```

---

## ✅ Après Configuration

Les secrets doivent apparaître dans GitHub:
```
CRON_SECRET     ••••••• (masqué)
BASE_URL        https://... (URL visible)
```

Et le workflow s'exécutera automatiquement:
- ⏰ Tous les jours à 07:00 UTC
- 🖱️ Ou manuellement via le bouton "Run workflow"

---

## 🆘 Si Toujours Pas Trouvé

### Essayez ceci:

1. **Déconnexion/Reconnexion GitHub** - Cache navigateur
2. **Autre navigateur** - Firefox, Chrome, Edge, Safari
3. **Mode incognito** - Pas d'extensions interfèrent
4. **Rafraîchir la page** - F5 ou Ctrl+Shift+R (cache dur)

### Ou vérifiez:

- Êtes-vous propriétaire/admin du repo?
- Avez-vous les droits de créer des secrets?
- C'est bien `task-manager` (vérifier le nom exact)?

---

## 📞 Liens Directs

- **Secrets Page**: https://github.com/julytbn/task-manager/settings/secrets/actions
- **Actions Page**: https://github.com/julytbn/task-manager/actions
- **Workflow File**: https://github.com/julytbn/task-manager/blob/master/.github/workflows/check-late-payments.yml

---

## 🎓 Ce que les Secrets Contrôlent

```
Workflow file (.github/workflows/check-late-payments.yml):

  curl -X POST \
    -H "X-Internal-Secret: ${{ secrets.CRON_SECRET }}" \
    ${{ secrets.BASE_URL }}/api/cron/check-late-payments
    
    ↑ Utilise CRON_SECRET   ↑ Utilise BASE_URL
```

Sans ces secrets en place, le workflow échoue.

---

## 📋 Checklist Finale

```
[ ] Trouvé la page des secrets GitHub
[ ] Créé secret: CRON_SECRET
[ ] Créé secret: BASE_URL  
[ ] Vérifier que 2 secrets sont listés
[ ] Testé via "Run workflow" (bouton vert)
[ ] Résultat: ✅ Vert (succès!)
```

---

**Astuce finale:** Si vous répondez "✅ Secrets trouvés!", je peux vérifier que tout fonctionne! 🚀
