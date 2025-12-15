# 🔧 FIX: Gmail SMTP Authentication

## ❌ Erreur Actuelle

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

Cela signifie que vos credentials Gmail sont invalides.

---

## ✅ SOLUTION: Utiliser Gmail App Password

### Pourquoi?
- Gmail ne permet plus les connexions directes avec mot de passe personnelle
- Il faut générer un "App Password" spécifique pour les applications

### Comment générer?

**Étape 1:** Aller sur https://myaccount.google.com/apppasswords

**Étape 2:** 
- Se logger avec julietetebenissan@gmail.com si pas connecté
- Sélectionner: Mail → Windows Computer (ou votre device)

**Étape 3:**
- Google génère un password de 16 caractères
- Exemple: `abcd efgh ijkl mnop`
- Copier ce password

**Étape 4:** Mettre à jour `.env`

```env
# Avant (❌ Incorrect):
SMTP_PASS=wnbldvfmdvhijlgh

# Après (✅ Correct):
SMTP_PASS=abcd efgh ijkl mnop
```

**⚠️ Important:** Garder les espaces du password d'application Google

### Alternative: Si 2FA pas activé

Si vous n'avez pas 2FA activé, vous pouvez aussi:

1. Aller: https://myaccount.google.com/security
2. Baisser la sécurité: "Less secure app access" → ON
3. Utiliser votre mot de passe personnel dans `.env`

---

## 🧪 Tester après correction

```bash
node scripts/test-smtp.js
```

**Résultat attendu:**
```
✅ Connexion au serveur SMTP réussie
✅ Email de test envoyé avec succès
```

---

## 📋 Autre Option: Tester sans Gmail

Si vous ne pouvez pas utiliser Gmail, tester avec Ethereal (test service):

```env
# .env - Désactiver la config Gmail
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=julietetebenissan@gmail.com
# SMTP_PASS=...

# Le script utilisera Ethereal automatiquement
```

Puis:
```bash
node scripts/test-smtp.js
```

Affichera un lien pour voir l'email de test.

---

## 🔒 Sécurité: Ne pas committer

**Important:** Assurez-vous que `.env` est dans `.gitignore`

```bash
grep ".env" .gitignore
# Résultat: .env (doit être présent)
```

Si manquant:
```bash
echo ".env" >> .gitignore
```

