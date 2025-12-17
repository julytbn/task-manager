# Configuration SMTP pour la Réinitialisation de Mot de Passe

## Vue d'ensemble
Le système de réinitialisation de mot de passe envoie des emails via SMTP. Vous devez configurer les variables d'environnement pour que cela fonctionne en production.

## Configuration par fournisseur

### 1. Gmail (Recommandé et gratuit)

#### Étapes:
1. Accédez à votre compte Google: https://myaccount.google.com
2. Allez à **Sécurité** > **Mots de passe d'application**
3. Générez un mot de passe d'application (16 caractères)
4. Configurez les variables d'environnement:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=votre-email@gmail.com
```

### 2. Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
SMTP_FROM=votre-email@outlook.com
```

### 3. OVH

```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=votre-email@votredomaine.com
SMTP_PASS=votre-mot-de-passe
SMTP_FROM=votre-email@votredomaine.com
```

### 4. Hostinger

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@votredomaine.com
SMTP_PASS=votre-mot-de-passe
SMTP_FROM=support@votredomaine.com
```

### 5. Free.fr

```env
SMTP_HOST=smtp.free.fr
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=votre-login
SMTP_PASS=votre-mot-de-passe
SMTP_FROM=votre-email@free.fr
```

### 6. Autre fournisseur personnalisé

Contactez votre hébergeur pour obtenir:
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE (true pour 465, false pour 587)
- SMTP_USER et SMTP_PASS

## Mode Développement - Ethereal (Gratuit)

En développement, si SMTP_HOST n'est pas configuré, l'application utilise **Ethereal Email** automatiquement.

### Avantages:
- ✅ Aucune configuration requise
- ✅ Emails de test gratuits
- ✅ Aperçu HTML disponible
- ✅ Parfait pour tester le flux

### Comment tester:
1. Laissez `SMTP_HOST` vide dans votre `.env.local`
2. Testez le flux de réinitialisation
3. Regardez les logs pour trouver le lien d'aperçu Ethereal
4. Cliquez sur le lien pour voir l'email formaté

**Logs de test:**
```
📧 Email de test (Ethereal) envoyé à: user@example.com
🔗 Aperçu: https://ethereal.email/message/xxxxx
```

## Tester votre configuration

### 1. Via cURL (terminal)

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 2. Via l'interface
1. Allez à http://localhost:3000/connexion
2. Cliquez sur "Mot de passe oublié?"
3. Entrez votre email
4. Vérifiez les logs pour voir si l'email a été envoyé

### 3. Vérifier les logs

**Succès SMTP:**
```
✅ Email SMTP envoyé à: user@example.com | Message ID: <123@example.com>
```

**Mode Ethereal:**
```
📧 Email de test (Ethereal) envoyé à: user@example.com
🔗 Aperçu: https://ethereal.email/message/xxxxx
```

**Erreur:**
```
❌ Erreur envoi email: Error details...
```

## Dépannage

### "SMTP non configuré. Emails non envoyés."
- Configurez les variables SMTP_HOST, SMTP_USER, SMTP_PASS dans `.env.local`
- En développement, utilisez Ethereal (pas de configuration)

### "Authentication failed"
- Vérifiez SMTP_USER et SMTP_PASS
- Pour Gmail: utilisez un **mot de passe d'application**, pas votre mot de passe Gmail
- Vérifiez que le compte a accès à SMTP

### "Connection timeout"
- Vérifiez SMTP_HOST et SMTP_PORT
- Assurez-vous que le pare-feu n'est pas bloqué (port 587 ou 465)
- Essayez SMTP_SECURE=true avec port 465

### Email non reçu
- Vérifiez le dossier SPAM/Indésirables
- Les adresses de test (@example.com) ne recevront pas d'email
- Utilisez une vraie adresse email

## Production

1. **Utilisez un vrai fournisseur SMTP** (Gmail, SendGrid, etc.)
2. **Stockez les secrets dans les variables d'environnement** (jamais en dur)
3. **Testez avant de déployer**
4. **Monitorer les logs d'erreurs d'email**

## Sécurité

- 🔒 Ne commitez pas `.env.local` dans le repo
- 🔒 Ne partagez jamais vos mots de passe SMTP
- 🔒 Utilisez des "App Passwords" pour Gmail plutôt que votre vrai mot de passe
- 🔒 En production, utilisez un service d'email dédié ou un fournisseur de confiance
