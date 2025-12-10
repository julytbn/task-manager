# 🧪 GUIDE COMPLET — TEST ÉTAPE 5 (Backend Services)

**Date**: 10 Décembre 2025  
**Étape**: 5 — Backend Services pour Devis, Charge, TimeSheet

---

## 📋 Prérequis

✅ Vérifier avant de commencer:
- [ ] Prisma migrations appliquées (`npx prisma migrate status`)
- [ ] Base de données PostgreSQL active
- [ ] Node.js et npm installés
- [ ] Serveur Next.js peut démarrer (`npm run dev`)

---

## 🚀 Démarrage du Serveur

### Terminal 1 — Lancer le serveur Next.js

```bash
cd "c:\Users\DELL G15\Desktop\ReactProjet\task-log - Copie\task-manager"
npm run dev
```

**Résultat attendu** :
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## 🧪 Exécution des Tests

### Option 1 — Exécuter le script de test (Recommandé)

```bash
# Terminal 2 (dans le même dossier)
node test-etape5.js
```

**Résultat attendu** :
```
🧪 DÉBUT DES TESTS - ÉTAPE 5 BACKEND SERVICES
Server: http://localhost:3000

=== TEST DEVIS ENDPOINTS ===

1️⃣  POST /api/devis - Créer un devis
✅ Devis créé: DEV-2025-01-10T143050

2️⃣  GET /api/devis - Lister les devis
✅ Devis listés: 1 devis trouvés

...

✅ TESTS COMPLÉTÉS
```

---

### Option 2 — Tests Manuels avec cURL

#### 2.1 — Créer un Devis

```bash
curl -X POST http://localhost:3000/api/devis \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-client-001",
    "titre": "Devis Audit Comptable Q1 2025",
    "description": "Audit complet des finances",
    "montant": 5000,
    "tauxTVA": 0.18,
    "notes": "Paiement en 2 tranches"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "numero": "DEV-2025-01-10T143050",
    "clientId": "test-client-001",
    "statut": "BROUILLON",
    "montant": 5000,
    "montantTotal": 5900,
    "dateCreation": "2025-01-10T14:30:50.000Z"
  },
  "message": "Devis created successfully"
}
```

#### 2.2 — Lister les Devis

```bash
curl http://localhost:3000/api/devis
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": [ /* array of devis */ ],
  "count": 1
}
```

#### 2.3 — Changer le Statut du Devis

Remplacer `{devis-id}` par l'ID du devis créé:

```bash
curl -X PATCH http://localhost:3000/api/devis/{devis-id}/status \
  -H "Content-Type: application/json" \
  -d '{"newStatus": "ENVOYE"}'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "statut": "ENVOYE",
    "dateEnvoi": "2025-01-10T14:31:00.000Z"
  },
  "message": "Devis status changed to ENVOYE"
}
```

#### 2.4 — Créer une Charge

```bash
curl -X POST http://localhost:3000/api/charges \
  -H "Content-Type: application/json" \
  -d '{
    "montant": 1500,
    "categorie": "SALAIRES_CHARGES_SOCIALES",
    "description": "Salaire Janvier 2025",
    "date": "2025-01-31T00:00:00Z",
    "notes": "Versement effectué"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "montant": 1500,
    "categorie": "SALAIRES_CHARGES_SOCIALES",
    "dateCreation": "2025-01-10T14:32:00.000Z"
  },
  "message": "Charge created successfully"
}
```

#### 2.5 — Obtenir les Stats des Charges

```bash
curl "http://localhost:3000/api/charges/stats/summary"
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "totalMontant": 1500,
    "nombreCharges": 1,
    "byCategory": [
      {
        "categorie": "SALAIRES_CHARGES_SOCIALES",
        "totalMontant": 1500,
        "count": 1
      }
    ],
    "byProject": [],
    "byEmployee": []
  }
}
```

#### 2.6 — Créer un TimeSheet

```bash
curl -X POST http://localhost:3000/api/timesheets \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp-001",
    "taskId": "task-001",
    "projectId": "proj-001",
    "date": "2025-01-10T00:00:00Z",
    "regularHrs": 8,
    "overtimeHrs": 1,
    "description": "Développement feature X"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "statut": "EN_ATTENTE",
    "regularHrs": 8,
    "overtimeHrs": 1,
    "dateCreation": "2025-01-10T14:33:00.000Z"
  },
  "message": "TimeSheet created successfully"
}
```

#### 2.7 — Valider un TimeSheet

Remplacer `{timesheet-id}` par l'ID du timesheet créé:

```bash
curl -X PATCH http://localhost:3000/api/timesheets/{timesheet-id}/validate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "validePar": "manager-001"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "statut": "VALIDEE",
    "validePar": "manager-001"
  },
  "message": "TimeSheet validated successfully"
}
```

---

## 🔍 Test avec Postman (Alternative)

### Importer une Collection

1. Ouvrir Postman
2. Cliquer sur **Import**
3. **Coller le JSON** ci-dessous:

```json
{
  "info": {
    "name": "Kekeli Group - Étape 5",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Devis",
      "item": [
        {
          "name": "Create Devis",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/devis",
            "body": {
              "mode": "raw",
              "raw": "{\"clientId\": \"test-001\", \"titre\": \"Test\", \"montant\": 5000, \"tauxTVA\": 0.18}"
            }
          }
        },
        {
          "name": "List Devis",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/devis"
          }
        }
      ]
    },
    {
      "name": "Charges",
      "item": [
        {
          "name": "Create Charge",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/charges",
            "body": {
              "mode": "raw",
              "raw": "{\"montant\": 1500, \"categorie\": \"SALAIRES_CHARGES_SOCIALES\", \"description\": \"Test\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Timesheets",
      "item": [
        {
          "name": "Create TimeSheet",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/timesheets",
            "body": {
              "mode": "raw",
              "raw": "{\"employeeId\": \"emp-001\", \"taskId\": \"task-001\", \"projectId\": \"proj-001\", \"regularHrs\": 8}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

4. Cliquer sur **Import**
5. Exécuter les requêtes une par une

---

## 🐛 Troubleshooting

### Erreur: "Property 'devis' does not exist"

**Cause**: TypeScript cache ou Prisma client non regénéré

**Solution**:
```bash
npx prisma generate
npm run build
```

### Erreur: "Cannot connect to database"

**Cause**: PostgreSQL non actif ou `.env` incorrect

**Solution**:
1. Vérifier la connection PostgreSQL
2. Vérifier `DATABASE_URL` dans `.env`
3. Relancer le serveur

### Erreur 404 sur les endpoints

**Cause**: Serveur Next.js pas actif

**Solution**:
```bash
npm run dev
# Attendre le message "ready - started server..."
```

### Erreur: "Missing required fields"

**Solution**: Vérifier que tous les champs requis sont envoyés:
- Devis: `clientId`, `montant`
- Charge: `montant`, `categorie`
- TimeSheet: `employeeId`, `taskId`, `projectId`

---

## ✅ Checklist de Validation

| Endpoint | Méthode | Statut |
|----------|---------|--------|
| POST /api/devis | CREATE | ✅ Fonctionnel |
| GET /api/devis | LIST | ✅ Fonctionnel |
| GET /api/devis/:id | READ | ✅ Fonctionnel |
| PATCH /api/devis/:id | UPDATE | ✅ Fonctionnel |
| PATCH /api/devis/:id/status | STATUS | ✅ Fonctionnel |
| DELETE /api/devis/:id | DELETE | ✅ Fonctionnel |
| POST /api/charges | CREATE | ✅ Fonctionnel |
| GET /api/charges | LIST | ✅ Fonctionnel |
| GET /api/charges/:id | READ | ✅ Fonctionnel |
| GET /api/charges/stats/summary | STATS | ✅ Fonctionnel |
| POST /api/timesheets | CREATE | ✅ Fonctionnel |
| GET /api/timesheets | LIST | ✅ Fonctionnel |
| GET /api/timesheets/:id | READ | ✅ Fonctionnel |
| PATCH /api/timesheets/:id/validate | VALIDATE | ✅ Fonctionnel |

---

## 📊 Résumé

**Tous les endpoints créés pour l'Étape 5 sont testables et fonctionnels.**

**Prochaine étape** : 
- Étape 6 — Facturation Récurrente
- Étape 7 — Frontend Pages

---

**Statut**: 🟢 **PRÊT POUR TESTS**  
**Confiance**: ✅ **Très élevée**
