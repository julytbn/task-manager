# 🧹 Nettoyage des Fichiers - Action 6

## Fichiers à Supprimer

### 1. ❌ test-email.js (PRIORITÉ 1 - SÉCURITÉ)
**Chemin**: `test-email.js` (racine du projet)
**Raison**: Contient des **credentials hardcoded** (email et mot de passe Gmail)
**Impact de sécurité**: 🔴 CRITIQUE

```javascript
// ⚠️ DANGER: Credentials en clair
user: 'julietetebenissan@gmail.com',
pass: 'wnbldvfmdvhijlgh'
to: 'lydiecocou@gmail.com@gmail.com'  // Email invalide aussi
```

**Action**: Supprimer le fichier
```bash
rm test-email.js
```

---

## Fichiers à Archiver (Code Mort)

### 2. 📦 Documentation obsolète à archiver

Les fichiers suivants sont de la documentation de la phase de développement et peuvent être archivés dans `docs/archives/`:

```
SYNTHESE_FINALE_AUDIT_3DEC.md
COMPLETION_REPORT_PROJETS_STATS.md
CHANGELOG_PROJETS_STATS.md
CHANGELOG_DASHBOARD.md
```

**Action**:
```bash
mkdir -p docs/archives
mv SYNTHESE_FINALE_AUDIT_3DEC.md docs/archives/
mv COMPLETION_REPORT_PROJETS_STATS.md docs/archives/
mv CHANGELOG_PROJETS_STATS.md docs/archives/
mv CHANGELOG_DASHBOARD.md docs/archives/
```

---

## Fichiers à Conserver

### ✅ Documentation Utile (GARDER)
- `AUDIT_RESUME_6DEC.md` - Audit récent
- `AUDIT_COMPLET_FONCTIONNALITES_6DEC.md` - Audit détaillé
- `GUIDE_CONFIG_GITHUB_SECRETS.md` - Configuration GitHub
- Tous les `README_*.md` - Documentation utilisateur

### ✅ Configuration Importante (GARDER)
- `.env.example` - Modèle d'environnement
- `vercel.json` - Configuration Vercel
- `.github/workflows/` - Workflows GitHub

### ✅ Code Source (GARDER)
- `app/api/**` - Routes API
- `lib/**` - Bibliothèques réutilisables
- `components/**` - Composants React
- `prisma/**` - Schema et migrations

---

## 🔍 Checklist Nettoyage

```
[ ] 1. Supprimer test-email.js
[ ] 2. Archiver fichiers obsolètes
[ ] 3. Vérifier pas de credentials en .env.example
[ ] 4. Vérifier pas de credentials dans les fichiers source
[ ] 5. Commit et push les changements
```

---

## ⚠️ Important

**AVANT de supprimer des fichiers**:
1. ✅ Faire un backup local: `git stash`
2. ✅ Vérifier que le fichier n'est pas utilisé: `grep -r "test-email" .`
3. ✅ Vérifier le git log: `git log --oneline -10 test-email.js`

**APRÈS suppression**:
1. ✅ Commit: `git commit -m "chore: remove test-email.js with hardcoded credentials"`
2. ✅ Push: `git push origin master`
3. ✅ Vérifier sur GitHub que le fichier est bien supprimé

---

## 🔐 Sécurité - Check Final

Avant de déployer, vérifier qu'aucun credential ne reste:

```bash
# Chercher tous les hardcoded emails/passes
grep -r "gmail.com" . --include="*.js" --include="*.ts" --include="*.tsx"
grep -r "password" . --include="*.js" --include="*.ts" --include="*.tsx" | grep -v "PASSWORD=" | grep -v "// password"
grep -r "secret" . --include="*.js" --include="*.ts" --include="*.tsx" | grep -v "CRON_SECRET" | grep -v "// secret"
```

Si des résultats apparaissent:
- Vérifier qu'ils n'ont pas de valeurs réelles
- Si oui: remplacer par des variables d'environnement

---

**Fait ?** ✅ Vous pouvez passer à l'action 7 (Tests)
