jh# 🎓 Guide d'Intégration - Prévision des Salaires

## 📋 Checklist d'installation

### Phase 1: Préparation
- [ ] Vérifier que le projet utilise Prisma
- [ ] Vérifier la configuration PostgreSQL
- [ ] Vérifier que NextAuth est configuré

### Phase 2: Code
- [ ] Ajouter le modèle `PrevisionSalaire` au schema.prisma ✓
- [ ] Ajouter le champ `tarifHoraire` à `Utilisateur` ✓
- [ ] Créer le service `SalaryForecastService` ✓
- [ ] Ajouter l'import dans `TimesheetService` ✓
- [ ] Modifier `validateTimesheet()` pour appeler le recalcul ✓
- [ ] Créer les endpoints API ✓
- [ ] Créer les pages UI ✓

### Phase 3: Configuration
- [ ] Ajouter `CRON_SECRET` au `.env`
- [ ] Configurer vercel.json avec le cron job
- [ ] Exécuter la migration Prisma

### Phase 4: Test et Déploiement
- [ ] Tester la recalcul lors de la validation d'un timesheet
- [ ] Tester l'envoi des notifications
- [ ] Tester les pages UI
- [ ] Déployer en production

---

## 🚀 Étapes détaillées d'installation

### 1. Configuration du `.env`

Ajouter les variables:
```env
# Clé secrète pour les cron jobs (générer une clé forte!)
CRON_SECRET=your-super-secret-key-here-min-32-chars

# Email (optionnel, si utilisation de SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

Pour générer une clé secrète sûre:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Migration de la base de données

```bash
# Créer la migration
npx prisma migrate dev --name add_salary_forecast_system

# Ou si vous utilisez le script
bash scripts/migrate-salary-forecast.sh
```

### 3. Configuration Vercel (optionnel, mais recommandé)

Si vous utilisez Vercel, le `vercel.json` est déjà mis à jour.

Sinon, utilisez un service de cron externe comme:
- **cron-job.org**
- **EasyCron**
- **AWS EventBridge**
- **Google Cloud Scheduler**

Configuration pour un service externe:
```
URL: https://your-app.com/api/cron/salary-notifications
Méthode: GET
Headers:
  Authorization: Bearer {VOTRE_CRON_SECRET}
Fréquence: Quotidien à 9h (recommandé)
```

### 4. Initialiser les tarifs horaires des employés

Via le panneau admin `/admin/salary-settings`:
1. Accéder en tant qu'Admin
2. Voir la liste des employés
3. Cliquer sur "Modifier" pour chaque employé
4. Entrer le tarif horaire (ex: 25€/h)
5. Confirmer

Ou via API:
```bash
curl -X POST http://localhost:3000/api/employees/update-tariff \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp_123",
    "tarifHoraire": 25.50
  }'
```

---

## ✅ Vérification de l'installation

### Test 1: Schema Prisma
```bash
npx prisma db push
# Doit afficher les nouvelles tables/colonnes
```

### Test 2: API - Récupérer les employés
```bash
curl http://localhost:3000/api/employees?includeHourlyRate=true
```
Doit retourner la liste des employés avec leur tarif horaire.

### Test 3: API - Déclencher les notifications
```bash
curl -X POST http://localhost:3000/api/salary-forecasts/send-notifications \
  -H "Authorization: Bearer your-cron-secret"
```
Doit retourner `{ "success": true, "data": { "sent": 0, "failed": 0 } }`

### Test 4: Page utilisateur
1. Aller sur `/dashboard/salary-forecasts` en tant qu'employé
2. Doit afficher le dashboard des prévisions
3. Initiallement vide (pas de timesheets validés)

### Test 5: Workflow complet
1. Créer un timesheet
2. Manager le valide
3. Vérifier que la prévision s'affiche dans le dashboard
4. Vérifier les logs: `[SalaryForecast] Prévision mise à jour...`

---

## 📁 Structure des fichiers créés

```
project-root/
├── app/
│   ├── admin/
│   │   └── salary-settings/
│   │       └── page.tsx          # Admin panel pour les tarifs
│   ├── api/
│   │   ├── cron/
│   │   │   └── salary-notifications/
│   │   │       └── route.ts      # Cron job endpoint
│   │   ├── employees/
│   │   │   ├── route.ts          # Récupérer les employés
│   │   │   └── update-tariff/
│   │   │       └── route.ts      # Mettre à jour les tarifs
│   │   └── salary-forecasts/
│   │       ├── route.ts          # CRUD des prévisions
│   │       ├── send-notifications/
│   │       │   └── route.ts      # Envoyer les notifications
│   │       └── statistics/[employeeId]/
│   │           └── route.ts      # Statistiques
│   └── dashboard/
│       └── salary-forecasts/
│           └── page.tsx          # Dashboard employé
├── lib/
│   └── services/
│       └── salaryForecasting/
│           └── salaryForecastService.ts  # Service principal
├── prisma/
│   └── schema.prisma             # Modèles mis à jour
├── scripts/
│   ├── migrate-salary-forecast.sh
│   └── test-salary-forecast.sh
├── DOCUMENTATION_SALARY_FORECAST.md
└── vercel.json                   # Cron job configuré
```

---

## 🔗 Intégration avec les modules existants

### TimeSheet Service
Le service timesheet est modifié pour appeler le service de prévisions:

```typescript
// lib/services/timesheets/timesheetService.ts
async validateTimesheet(id: string, validateurId: string) {
  const timesheet = await prisma.timeSheet.update(...);
  
  // Recalculer la prévision salariale après validation
  await salaryForecastService.recalculateSalaryForecast(
    timesheet.employeeId,
    timesheet.date
  );
  
  return timesheet;
}
```

### Notification Service
Les notifications sont créées automatiquement:

```typescript
// Créer une notification in-app
await prisma.notification.create({
  data: {
    utilisateurId: prevision.employeId,
    titre: "💰 Notification de paiement",
    message: `Votre salaire sera payé dans 5 jours...`,
    type: "ALERTE",
  },
});
```

---

## 🧪 Scénarios de test

### Scénario 1: Validation d'un timesheet
1. Employé soumet un timesheet de 20h pour janvier
2. Tarif horaire: 25€/h
3. Manager valide
4. **Résultat attendu**: Prévision créée avec 500€

### Scénario 2: Notification 5 jours avant le paiement
1. Prévision créée pour janvier (31 janvier)
2. Cron job exécuté le 27 janvier (5 jours avant)
3. **Résultat attendu**: Email + notification envoyés

### Scénario 3: Mise à jour du tarif horaire
1. Employé a prévision en cours: 500€
2. Admin change tarif de 25€/h à 30€/h
3. Nouveau timesheet validé (20h)
4. **Résultat attendu**: Nouvelle prévision recalculée à 600€

### Scénario 4: Plusieurs employés
1. 3 employés avec des tarifs différents
2. Chacun a des timesheets
3. Cron job s'exécute
4. **Résultat attendu**: Notifications envoyées individuellement

---

## 🐛 Dépannage

### Erreur: "tarifHoraire" not found in schema
**Solution**: Exécuter la migration `npx prisma migrate dev`

### Erreur: "PrevisionSalaire" model not found
**Solution**: Vérifier que le modèle est dans schema.prisma et exécuter `npx prisma generate`

### Les prévisions ne s'affichent pas
**Vérifications**:
1. Tarif horaire configuré: `tarifHoraire IS NOT NULL`
2. Timesheet validé: `statut = 'VALIDEE'`
3. Consulter les logs: `[SalaryForecast]` dans les logs

### Notifications non envoyées
**Vérifications**:
1. CRON_SECRET configuré
2. Cron job actif (vérifier Vercel dashboard ou service externe)
3. Consulter les logs: `[CRON]` dans les logs
4. Tester manuellement: `POST /api/salary-forecasts/send-notifications`

### Emails non reçus
**Vérifications**:
1. Configuration SMTP correcte
2. Email valide de l'employé
3. Service d'email n'est pas en spam
4. Consulter les logs: `[EMAIL]` dans les logs

---

## 📞 Support et Améliorations Futures

### Fonctionnalités futures possibles:
- [ ] Export PDF des prévisions
- [ ] Comparaison année sur année
- [ ] Prévision par projet/client
- [ ] Alertes personnalisées
- [ ] Intégration avec logiciel de paie
- [ ] Dashboard RH avancé

### Optimisations possibles:
- [ ] Cache des prévisions
- [ ] Pagination des listes
- [ ] Indices pour les requêtes fréquentes
- [ ] Archive des anciennes prévisions

---

**Créé**: Décembre 2025  
**Version**: 1.0  
**Statut**: ✅ Prêt pour production
