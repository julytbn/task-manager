# 📧 Configuration Email Production

## 🎯 Objectif
Configurer un email personnalisé pour l'envoi des notifications en production avec Gmail.

---

## 📋 Options de Configuration

### **Option 1: Gmail avec App Password** ✅ RECOMMANDÉ

#### Étape 1: Activer l'authentification 2FA sur Gmail
1. Aller sur https://myaccount.google.com/security
2. Activer "Vérification en deux étapes"
3. Valider votre téléphone

#### Étape 2: Générer un App Password
1. Aller sur https://myaccount.google.com/apppasswords
2. Sélectionner: **Mail** → **Windows Computer** (ou votre device)
3. Google générera un mot de passe de 16 caractères
4. **Copier ce mot de passe**

#### Étape 3: Configurer `.env.production`
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com        # ← Votre nouvel email
SMTP_PASS=xxxx xxxx xxxx xxxx           # ← App Password (sans espaces: xxxxxxxxxxxxxxxx)
SMTP_FROM=Kekeli Group <votre-email@gmail.com>
```

#### Étape 4: Configurer dans Vercel
Dashboard → Settings → Environment Variables

| Variable | Valeur |
|----------|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `votre-email@gmail.com` |
| `SMTP_PASS` | `xxxxxxxxxxxxxxxx` (App Password) |
| `SMTP_FROM` | `Kekeli Group <votre-email@gmail.com>` |

---

### **Option 2: SendGrid** (Alternative professionelle)

#### Setup SendGrid
1. Créer compte: https://sendgrid.com/
2. Générer une API Key
3. Configurer:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.votre-api-key-tres-longue
SMTP_FROM=noreply@votre-domaine.com
```

---

### **Option 3: MailGun**

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@votre-domaine.com
SMTP_PASS=votre-mailgun-password
SMTP_FROM=noreply@votre-domaine.com
```

---

## ✅ Vérification Post-Configuration

### Test local
```bash
# 1. Mettre à jour .env.production avec vos secrets
# 2. Lancer le build
npm run build

# 3. Tester un email (créer un client, ajouter une charge, etc.)
npm run start
```

### Test en production
1. Déployer sur Vercel
2. Créer un test client
3. Vérifier les logs Vercel
4. Vérifier la boîte de réception du destinataire

### Vérifier les logs
```bash
# Dans Vercel Dashboard → Functions → Logs
# Vous devez voir: ✅ Email SMTP envoyé à: xxxxx
```

---

## 🔐 Sécurité

⚠️ **IMPORTANT:**
- ❌ Ne JAMAIS utiliser votre mot de passe Google réel
- ✅ Toujours utiliser un **App Password** (Gmail)
- ✅ Stocker les secrets dans **Vercel Environment Variables**, pas dans Git
- ✅ Ajouter `.env.production` au `.gitignore`

---

## 🐛 Dépannage

### Email non envoyé
1. Vérifier `SMTP_USER` et `SMTP_PASS` sont corrects
2. Vérifier l'App Password (sans espaces)
3. Vérifier 2FA activé sur Gmail
4. Vérifier `SMTP_FROM` est correct

### Erreur "Invalid credentials"
- L'App Password a des **espaces** entre les groupes
- Supprimer les espaces: `xxxx xxxx xxxx xxxx` → `xxxxxxxxxxxxxxxx`

### Erreur "SMTP connection timeout"
- Vérifier `SMTP_HOST=smtp.gmail.com` et `SMTP_PORT=587`
- Vérifier que votre VPN/firewall ne bloque pas le port 587

---

## 📚 Ressources

- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [MailGun Docs](https://documentation.mailgun.com/)
- [Nodemailer Docs](https://nodemailer.com/)
