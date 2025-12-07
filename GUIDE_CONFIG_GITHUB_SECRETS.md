# 🔐 Configuration des Secrets GitHub Actions

**Objectif**: Configurer les secrets pour que le CRON de vérification des paiements en retard s'exécute automatiquement.

---

## 📋 Secrets à Configurer

### 1. CRON_SECRET
**Valeur**: Token unique pour sécuriser les appels CRON

```bash
# Générer une clé sécurisée (faire dans votre terminal):
openssl rand -base64 32

# Exemple de résultat:
# a7K9mL2xP5qR8vN3jW4fD6sT1bY9gH7kZ
```

### 2. BASE_URL
**Valeur**: L'URL de votre application en production

```
Pour production (Vercel):
https://task-manager-production.vercel.app

Pour développement local (testing):
http://localhost:3000
```

---

## ✅ Étapes à Suivre

### Étape 1: Aller dans les paramètres du repo GitHub

1. Allez sur: https://github.com/julytbn/task-manager
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** → **Actions**

### Étape 2: Ajouter CRON_SECRET

1. Cliquez sur **New repository secret**
2. **Name**: `CRON_SECRET`
3. **Value**: Collez la clé générée avec `openssl rand -base64 32`
4. Cliquez sur **Add secret**

### Étape 3: Ajouter BASE_URL

1. Cliquez sur **New repository secret**
2. **Name**: `BASE_URL`
3. **Value**: Votre URL de production (ex: `https://task-manager-production.vercel.app`)
4. Cliquez sur **Add secret**

### Étape 4: Configurer l'application (fichier .env.production)

Assurez-vous que le secret correspond dans votre `.env.production`:

```env
CRON_SECRET=<la-même-clé-que-sur-github>
BASE_URL=https://task-manager-production.vercel.app
```

---

## 🧪 Test du Workflow

### Tester manuellement

1. Allez sur: https://github.com/julytbn/task-manager/actions
2. Sélectionnez **Check Late Payments - Daily CRON**
3. Cliquez sur **Run workflow** → **Run workflow**
4. Attendez que le job s'exécute
5. Vérifiez les logs pour voir le résultat

### Vérifier les logs

Les logs sont visibles dans:
```
GitHub → Actions → Check Late Payments → Latest run
```

Les résultats possibles:
- ✅ **Success**: Cron s'est exécuté correctement
- ❌ **Failed**: Erreur (vérifier l'URL et le secret)
- ⏱️ **Timeout**: L'API met trop de temps à répondre

---

## 🔍 Dépannage

### Erreur: "401 Unauthorized"
- Cause: Secret incorrect ou ne correspond pas à `CRON_SECRET` en .env
- Solution: Vérifier que le secret GitHub = secret .env

### Erreur: "404 Not Found"
- Cause: BASE_URL incorrect
- Solution: Vérifier que l'URL est complète (https://... pas http://...)

### Erreur: "Connection refused"
- Cause: L'application n'est pas accessible à cette URL
- Solution: Vérifier que Vercel/serveur est en ligne

---

## 📅 Calendrier d'Exécution

Le CRON s'exécute **tous les jours à 07:00 UTC**:

| Fuseau horaire | Heure |
|---|---|
| UTC | 07:00 |
| GMT | 07:00 |
| CET (Paris) | 08:00 |
| CEST (Paris été) | 09:00 |
| GMT+1 | 08:00 |
| GMT+2 | 09:00 |

---

## ✨ Résultat Attendu

Une fois configuré correctement, le système va:

1. ✅ S'exécuter automatiquement tous les jours à 7h UTC
2. ✅ Détecter tous les paiements en retard
3. ✅ Créer des notifications en BDD
4. ✅ Envoyer des emails aux managers
5. ✅ Logger les résultats dans les GitHub Actions

---

**Fait ?** Vérifiez que les secrets sont configurés en allant dans:
→ https://github.com/julytbn/task-manager/settings/secrets/actions
