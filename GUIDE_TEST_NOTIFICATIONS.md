# 🧪 GUIDE DE TEST - NOTIFICATIONS & PAIEMENTS

**Date:** 3 Décembre 2025  
**Objectif:** Vérifier que le système fonctionne correctement

---

## 🔧 Prérequis

```bash
# 1. Être dans le répertoire du projet
cd "c:\Users\DELL G15\Desktop\ReactProjet\task-log - Copie\task-manager"

# 2. Vérifier que node_modules existe
ls node_modules/@prisma/client

# 3. Vérifier DATABASE_URL dans .env
cat .env | grep DATABASE_URL
```

---

## 🧪 Test 1: Vérifier la Base de Données

### 1.1 Vérifier la connexion Prisma

```bash
node scripts/checkPrismaClient.js
```

**Résultat attendu:**
```
✅ Notification property exists
✅ Count result: X (nombre de notifications existantes)
```

---

## 🧪 Test 2: Tester le Système Paiements Retard

### 2.1 Exécuter le test complet

```bash
node scripts/testPaymentNotificationReminder.js
```

**Résultat attendu:**
```
✅ Test 1: Client créé
✅ Test 2: Projet créé
✅ Test 3: Tâche créée
✅ Test 4: Paiement créé
✅ Test 5: Notification créée
✅ Test 6: Notifications trouvées
✅ Test terminé avec succès!
```

---

### 2.2 Sortie détaillée du test

Le script affiche:
```
1️⃣  Création du client...
   ✅ Client créé: [ID]

2️⃣  Création du projet...
   ✅ Projet créé: [ID]

3️⃣  Création de la tâche...
   ✅ Tâche créée: [ID]

4️⃣  Création du paiement...
   ✅ Paiement créé: [ID]
   ✅ Retard détecté: OUI
   ✅ Notification créée: [ID]

5️⃣  Vérification des notifications du manager...
   ✅ X notification(s) d'alerte trouvée(s)

📊 Résumé:
   - Client ID: [ID]
   - Projet ID: [ID]
   - Tâche ID: [ID]
   - Paiement ID: [ID]
   - Manager ID: [ID]
   - Notification ID: [ID]

✅ Test terminé avec succès!
```

---

## 🧪 Test 3: Vérifier l'API Notifications via cURL

### 3.1 Récupérer toutes les notifications

```bash
# Besoin d'être authentifié - remplacer AUTH_COOKIE par votre session
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

**Résultat attendu:**
```json
[
  {
    "id": "notification_id",
    "titre": "Paiement en retard - Nom Client",
    "message": "Le paiement de...",
    "type": "ALERTE",
    "lu": false,
    "dateCreation": "2025-12-03T..."
  }
]
```

### 3.2 Marquer une notification comme lue

```bash
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"notificationId": "notification_id"}'
```

**Résultat attendu:**
```json
{
  "id": "notification_id",
  "lu": true,
  "dateModification": "2025-12-03T..."
}
```

### 3.3 Créer une notification

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "titre": "Test Notification",
    "message": "Ceci est un test",
    "type": "INFO",
    "lien": "/dashboard"
  }'
```

**Résultat attendu:**
```json
{
  "id": "new_notification_id",
  "titre": "Test Notification",
  "message": "Ceci est un test",
  "type": "INFO",
  "lu": false,
  "dateCreation": "2025-12-03T..."
}
```

---

## 🧪 Test 4: Vérifier le Frontend

### 4.1 Ouvrir le dashboard

```
1. Allez à http://localhost:3000
2. Connectez-vous avec un compte MANAGER
3. Allez à /dashboard/manager
4. Vérifiez la bell icon en haut à droite
```

### 4.2 Vérifier les notifications

```
1. Cliquez sur la bell icon
2. Vous devriez voir les notifications
3. Vérifiez que le badge rouge affiche le nombre de non-lues
4. Cliquez sur une notification pour la marquer comme lue
```

### 4.3 Vérifier le composant LatePaymentAlerts

```
1. Allez à /dashboard/manager
2. Cherchez la section "Paiements en Retard"
3. Cliquez sur "Voir tous" pour le détail
4. Vérifiez que les paiements en retard s'affichent
```

---

## 🔍 Test 5: Vérifier la Base de Données

### 5.1 Ouvrir Prisma Studio

```bash
npx prisma studio
```

Puis dans le navigateur:
```
1. http://localhost:5555
2. Cliquez sur "Notification" dans le menu
3. Vérifiez que les notifications s'affichent
4. Filtrez par utilisateur pour voir ses notifications
```

### 5.2 Requêtes SQL directes

Si vous avez accès à PostgreSQL:

```sql
-- Voir toutes les notifications
SELECT * FROM notifications ORDER BY "dateCreation" DESC;

-- Voir les notifications non-lues
SELECT * FROM notifications WHERE lu = false;

-- Compter par type
SELECT type, COUNT(*) FROM notifications GROUP BY type;

-- Voir les notifications d'un utilisateur
SELECT * FROM notifications WHERE "utilisateurId" = 'user_id';
```

---

## 🛠️ Troubleshooting

### Problème: "Non autorisé" (401)
**Solution:**
```bash
# 1. Vérifiez que vous êtes connecté
# 2. Vérifiez le .env pour DATABASE_URL
# 3. Vérifiez que nextauth est configuré
```

### Problème: "Notification introuvable" (404)
**Solution:**
```bash
# 1. La notification appartient-elle à cet utilisateur?
# 2. L'ID est-il correct?
# 3. Vérifiez dans la BD avec Prisma Studio
```

### Problème: Erreur de connexion DB
**Solution:**
```bash
# 1. Vérifiez DATABASE_URL
echo $DATABASE_URL

# 2. Testez la connexion
npx prisma db execute --stdin < test.sql

# 3. Vérifiez Prisma
npx prisma migrate status
```

### Problème: Les notifications ne s'affichent pas
**Solution:**
```bash
# 1. Rafraîchissez la page (F5)
# 2. Ouvrez la console (F12) et cherchez les erreurs
# 3. Vérifiez que le polling est actif (Network tab)
# 4. Testez l'API directement avec cURL
```

---

## 📋 Checklist de Vérification

Utilisez cette checklist pour vérifier que tout fonctionne:

```
[ ] 1. Script test paiement retard s'exécute
[ ] 2. Notifications créées dans la BD
[ ] 3. API GET retourne les notifications
[ ] 4. API PATCH marque comme lu
[ ] 5. API POST crée une notification
[ ] 6. EmployeeHeader affiche notifications
[ ] 7. ManagerHeader affiche notifications
[ ] 8. Bell icon affiche le badge rouge
[ ] 9. Compteur de non-lues correct
[ ] 10. Clic sur notification marque comme lu
[ ] 11. Paiements en retard s'affichent
[ ] 12. LatePaymentAlerts component fonctionnel
[ ] 13. Polling toutes les 60 secondes
[ ] 14. Pas d'erreurs en console (F12)
[ ] 15. Prisma Studio montre les données
```

---

## 🚀 Déploiement Vercel

Pour activer les CRON jobs sur Vercel:

### 1. Créer `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check-late-payments",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 2. Configurer les variables d'environnement

```
CRON_SECRET=your_secret_here
```

### 3. Mettre à jour l'endpoint API

```typescript
// app/api/cron/check-late-payments.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await checkAndNotifyLatePayments()
  return NextResponse.json(result)
}
```

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Consultez `DIAGNOSTIC_NOTIFICATIONS_COMPLET.md` pour l'audit complet
2. Vérifiez les logs console (F12)
3. Exécutez le script de test
4. Ouvrez Prisma Studio pour inspecter la BD

---

**Audit complet:** `DIAGNOSTIC_NOTIFICATIONS_COMPLET.md`  
**Résumé rapide:** `QUICK_ANSWER_NOTIFICATIONS.md`  
**Date:** 3 Décembre 2025
