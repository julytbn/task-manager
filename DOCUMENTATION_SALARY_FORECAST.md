# 🎯 Système de Prévision des Salaires - Documentation Complète

## 📋 Vue d'ensemble

Le système de prévision des salaires permet de:
- **Calculer automatiquement** les prévisions salariales basées sur les timesheets validés
- **Envoyer des notifications** 5 jours avant le paiement (dernier jour du mois)
- **Offrir une visibilité** aux employés sur leurs salaires estimés
- **Suivre l'historique** des prévisions mensuelles

## 🏗️ Architecture

### Base de données

#### Modèle `PrevisionSalaire`
```prisma
model PrevisionSalaire {
  id               String   @id @default(cuid())
  employeId        String
  mois             Int
  annee            Int
  montantPrevu     Float
  montantNotifie   Float?   
  dateNotification DateTime? 
  dateGeneration   DateTime @default(now())
  dateModification DateTime @updatedAt
  employe          Utilisateur @relation(...)
}
```

#### Champ ajouté à `Utilisateur`
```prisma
tarifHoraire     Float?   // Tarif horaire en €/h
previsionsSalaires   PrevisionSalaire[]
```

### Services

#### `SalaryForecastService` (`lib/services/salaryForecasting/salaryForecastService.ts`)
Service principal avec les méthodes:

- **`recalculateSalaryForecast(employeId, dateTimesheet)`**
  - Appelée automatiquement à chaque validation de timesheet
  - Calcule: `somme(heures_validees) × tarif_horaire`
  - Crée ou met à jour la prévision du mois

- **`getSalaryForecast(employeId, mois?, annee?)`**
  - Récupère les prévisions de l'employé

- **`sendPaymentNotifications()`**
  - Envoie les notifications 5 jours avant le paiement
  - S'exécute chaque jour via cron job
  - Crée notifications in-app + emails

- **`getSalaryStatistics(employeId, dernierseMois)`**
  - Statistiques (total, moyenne) pour les derniers N mois

### API Endpoints

#### 1. **Récupérer les prévisions**
```
GET /api/salary-forecasts?employeeId=...&month=...&year=...
```
Retourne les prévisions salariales filtrées

#### 2. **Recalculer une prévision**
```
POST /api/salary-forecasts
Body: { employeeId, date }
```
Recalcule la prévision pour le mois de la date donnée

#### 3. **Statistiques salariales**
```
GET /api/salary-forecasts/statistics/[employeeId]?months=12
```
Retourne les statistiques (total, moyenne, etc.)

#### 4. **Envoyer les notifications**
```
POST /api/salary-forecasts/send-notifications
Auth: Bearer {CRON_SECRET}
```
Déclenche manuellement l'envoi des notifications

#### 5. **Cron job**
```
GET /api/cron/salary-notifications
Auth: Bearer {CRON_SECRET} ou x-vercel-cron-secret
```
Point d'entrée pour les services de cron (Vercel, etc.)

#### 6. **Gestion des employés**
```
GET /api/employees?includeHourlyRate=true
POST /api/employees/update-tariff
Body: { employeeId, tarifHoraire }
```

## 🔄 Flux de travail

### 1️⃣ Validation d'un Timesheet
```
Employé soumet timesheet
           ↓
Manager valide timesheet
           ↓
TimesheetService.validateTimesheet() appelé
           ↓
SalaryForecastService.recalculateSalaryForecast() appelé
           ↓
Prévision créée/mise à jour
```

### 2️⃣ Envoi des notifications
```
Cron job déclenché quotidiennement (9h recommandé)
           ↓
SalaryForecastService.sendPaymentNotifications()
           ↓
Si on est à 5 jours avant le paiement:
  - Email envoyé à l'employé
  - Notification in-app créée
  - dateNotification marquée
```

### 3️⃣ Affichage au Dashboard
```
Employé accède /dashboard/salary-forecasts
           ↓
Récupère prévisions via /api/salary-forecasts
           ↓
Affiche tableau + statistiques
```

## ⚙️ Configuration

### Variables d'environnement

Ajouter au `.env`:
```env
# Cron job secret
CRON_SECRET=votre_clé_secrète_très_sûre
```

### Configuration Vercel (vercel.json)

Pour activer le cron job sur Vercel:
```json
{
  "crons": [{
    "path": "/api/cron/salary-notifications",
    "schedule": "0 9 * * *"
  }]
}
```

Cela déclenche le cron job chaque jour à 9h.

### Alternative: Cron job externe

Avec un service comme cron-job.org:
```
URL: https://votre-domaine.com/api/cron/salary-notifications
Méthode: GET
Header: Authorization: Bearer {CRON_SECRET}
Fréquence: Quotidien à 9h
```

## 📊 Pages et Interfaces

### 1. **Dashboard Employé** `/dashboard/salary-forecasts`
- Tableau des prévisions mensuelles
- Statistiques (total, moyenne, nombre de mois)
- Statut des notifications
- Lien vers les timesheets

### 2. **Admin - Configuration des tarifs** `/admin/salary-settings`
- Liste de tous les employés
- Affichage/modification du tarif horaire
- Contrôle d'accès Admin

## 📧 Emails de notification

Email envoyé 5 jours avant le paiement:
- **Sujet**: 💰 Notification de paiement - {Mois} {Année}
- **Contenu**:
  - Montant du salaire prévu
  - Date de paiement (dernier jour du mois)
  - Confirmation du statut
  - Période couverte

Notification in-app:
- Type: ALERTE
- Message: "Votre salaire pour {mois} sera payé dans 5 jours. Montant prévu: {montant}€"

## 🔐 Sécurité

1. **Authentification**:
   - Endpoints protégés par session NextAuth
   - Cron job protégé par CRON_SECRET

2. **Autorisation**:
   - Employés: ne voient que leurs propres prévisions
   - Admin: peut modifier les tarifs horaires

3. **Données sensibles**:
   - Montants salariales chiffrés en base
   - Emails envoyés de manière sécurisée
   - Logs des modifications

## 🚀 Déploiement

### 1. Migration de la base de données
```bash
npx prisma migrate dev --name add_salary_forecast
```

### 2. Configuration des variables d'environnement
```bash
# Générerer une clé secrète
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Activer le cron job
- Vercel: Ajouter `crons` dans vercel.json
- Autre: Configurer un service de cron externe

### 4. Vérifier l'installation
```bash
# Tester l'endpoint cron
curl -H "Authorization: Bearer {CRON_SECRET}" \
  https://votre-domaine.com/api/cron/salary-notifications
```

## 📈 Utilisation

### Pour un employé:
1. Soumettre des timesheets
2. Manager les valide
3. Prévision salariale s'affiche dans le dashboard
4. Recevoir notification email 5 jours avant paiement

### Pour un admin:
1. Aller sur `/admin/salary-settings`
2. Configurer le tarif horaire de chaque employé
3. Vérifier les notifications envoyées
4. Accéder aux statistiques salariales

## 🐛 Dépannage

### Prévisions ne s'affichent pas
- Vérifier que le tarif horaire est configuré
- Vérifier que les timesheets sont "VALIDEE"
- Consulter les logs de `recalculateSalaryForecast`

### Notifications non envoyées
- Vérifier que CRON_SECRET est configuré
- Vérifier que le cron job est actif
- Consulter les logs du endpoint `/api/cron/salary-notifications`

### Calculs incorrects
- Vérifier le tarif horaire en base de données
- Vérifier le statut des timesheets (doivent être VALIDEE)
- Consulter les heures dans les timesheets

## 📝 Logs

Les actions importantes sont loggées:
```
[SalaryForecast] Prévision mise à jour pour {nom}: {montant}€
[CRON] Début de l'envoi des notifications
[EMAIL] Tentative envoi SMTP vers: {email}
```

## 🎓 Exemples

### Recalculer manuellement une prévision:
```javascript
// App côté client
const response = await fetch('/api/salary-forecasts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'emp_123',
    date: new Date('2025-01-15')
  })
});
const data = await response.json();
```

### Déclencher les notifications:
```bash
curl -X POST \
  -H "Authorization: Bearer your-cron-secret" \
  https://votre-domaine.com/api/salary-forecasts/send-notifications
```

### Récupérer les statistiques:
```javascript
const stats = await fetch(
  '/api/salary-forecasts/statistics/emp_123?months=12'
);
```

## 📞 Support

Pour des questions ou des problèmes:
1. Vérifier les logs de l'application
2. Tester les endpoints avec Postman
3. Vérifier la configuration de la base de données
4. Consulter la documentation de Prisma

---

**Dernière mise à jour**: Décembre 2025
**Version**: 1.0
