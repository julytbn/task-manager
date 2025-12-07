# 🚀 QUICK START - Génération Automatique de Factures (5 min)

## TL;DR (L'essentiel)

✅ **Déjà implémenté et fonctionnel!**

Quand vous créez un abonnement, une facture est **générée automatiquement**.  
Chaque jour à **08:00 UTC**, les factures pour les renouvellements sont aussi **générées automatiquement**.

## Étape 1: Vérifier l'Installation ✓

Tous les fichiers nécessaires sont déjà en place:
```
✅ lib/invoice-generator.ts
✅ app/api/cron/generate-invoices/route.ts
✅ scripts/generate-invoices.ts
✅ vercel.json (config Cron)
✅ package.json (npm run cron:invoices)
```

## Étape 2: Tester Localement (2 min)

### 2.1: Exécuter le cron job manuellement
```bash
npm run cron:invoices
```

Vous devriez voir:
```
═══════════════════════════════════════════════════════════════
🔄 GÉNÉRATEUR DE FACTURES AUTOMATIQUES
═══════════════════════════════════════════════════════════════
✅ Factures générées: X
✨ Exécution terminée avec succès
```

### 2.2: Tester via l'API
```bash
curl "http://localhost:3000/api/cron/generate-invoices?secret=development-secret"
```

Résultat attendu:
```json
{
  "success": true,
  "invoicesGenerated": 0,
  "details": []
}
```

## Étape 3: Créer un Abonnement de Test (2 min)

### 3.1: Créer un Client
```bash
curl -X POST "http://localhost:3000/api/clients" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Test Client", "email": "test@example.com"}'
```
Copier l'ID du client retourné → `CLIENT_ID`

### 3.2: Créer un Service
```bash
curl -X POST "http://localhost:3000/api/services" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Test Service", "prix": 50000}'
```
Copier l'ID du service retourné → `SERVICE_ID`

### 3.3: Créer un Abonnement (génère la facture automatiquement!)
```bash
curl -X POST "http://localhost:3000/api/abonnements" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Abonnement Test",
    "clientId": "CLIENT_ID",
    "serviceId": "SERVICE_ID",
    "montant": 50000,
    "frequence": "MENSUEL"
  }'
```

✅ **Une facture a été générée automatiquement!**

### 3.4: Vérifier la Facture
```bash
curl "http://localhost:3000/api/factures" | jq '.[] | select(.abonnementId != null)'
```

Vous devriez voir la facture générée automatiquement avec:
- ✅ Numéro: `FACT-202412-XXXX`
- ✅ Montant HT + TVA
- ✅ Statut: `EN_ATTENTE`

## Étape 4: Configurer pour la Production (1 min)

### Si vous utilisez Vercel (Recommandé):
✅ **Déjà configuré!** Rien à faire.
- Les factures se généreront automatiquement chaque jour à 08:00 UTC
- Vérifier en allant sur: Vercel Dashboard → [Projet] → Settings → Cron Jobs

### Si vous utilisez Linux/VPS:
```bash
crontab -e

# Ajouter cette ligne:
0 8 * * * cd /chemin/vers/app && npm run cron:invoices >> /var/log/invoices.log 2>&1
```

### Si vous utilisez Docker Compose:
Voir `AUTO_INVOICE_GENERATION.md` → Option 5 Docker

## Étape 5: Vérifier que Tout Fonctionne ✓

### Checklist finale:
- [ ] `npm run cron:invoices` s'exécute sans erreurs
- [ ] API `/api/cron/generate-invoices?secret=development-secret` retourne 200 OK
- [ ] Créer un abonnement génère une facture
- [ ] Factures visibles dans `/api/factures`
- [ ] Configuration Vercel/Linux/Docker en place (production)

---

## 📚 Documentation Complète

| Besoin | Lire |
|--------|------|
| Configurer pour Vercel/Linux/Docker | `AUTO_INVOICE_GENERATION.md` |
| Guide détaillé d'intégration | `INTEGRATION_GUIDE_AUTO_INVOICES.md` |
| Déployer en production | `DEPLOYMENT_CHECKLIST_AUTO_INVOICES.md` |
| Exemples avancés | `EXAMPLES_CURL_AUTO_INVOICES.md` |

---

## 🎯 Cas d'Usage Courants

### Créer un client avec abonnement mensuel
1. Créer client
2. Créer abonnement avec `frequence: MENSUEL`
3. ✅ Facture générée immédiatement
4. ✅ Facture supplémentaire générée chaque 30 jours

### Tester en développement
```bash
npm run cron:invoices
```

### Vérifier que les factures se génèrent
```bash
curl "http://localhost:3000/api/factures" | jq length
# Devrait retourner le nombre de factures
```

---

## 🆘 Problèmes Courants

### Les factures ne se génèrent pas?
1. Vérifier que l'abonnement a le statut `ACTIF`
2. Exécuter: `npm run cron:invoices`
3. Vérifier les logs

### Erreur "Unauthorized"?
- Utiliser: `secret=development-secret` en dev
- En production, configurer `CRON_SECRET`

### Le cron job ne s'exécute pas?
- Si Vercel: Vérifier les Cron Jobs dans Settings
- Si Linux: Vérifier crontab: `crontab -l`
- Si Docker: Vérifier les logs: `docker-compose logs`

---

## ✨ Et Voilà!

Vous avez maintenant un système de **génération automatique de factures 100% fonctionnel**.

Les factures se créent:
- ✅ À la création d'un abonnement
- ✅ Selon le planning (mensuel/trimestriel/semestriel/annuel)
- ✅ Sans intervention manuelle
- ✅ Avec tous les détails (montant + TVA + dates)

---

**Besoin d'aide?** Voir la documentation complète dans les fichiers `.md` du projet.
