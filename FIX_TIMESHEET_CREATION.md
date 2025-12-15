# 🔧 FIX: Erreur de Création de TimeSheet

## ❌ Problème Initial

**Erreur**: `Missing required fields: employeeId, taskId, projectId, date, regularHrs`

### Cause
Le formulaire `TimesheetForm.tsx` envoyait seulement `{ id, rows, validated }`, mais l'API attendait:
- `employeeId` (ID de l'employé) ✅ **REQUIS**
- `taskId` (ID de la tâche) ✅ **REQUIS**
- `projectId` (ID du projet) ✅ **REQUIS**
- `date` (Date du timesheet) ✅ **REQUIS**
- `regularHrs` (Heures régulières) ✅ **REQUIS**

---

## ✅ Solutions Apportées

### 1. **Formulaire mis à jour** (`src/modules/timesheets/components/TimesheetForm.tsx`)

#### Avant:
```typescript
const save = async () => {
  setSaving(true);
  try {
    await fetch('/api/timesheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, rows, validated }), // ❌ INCORRECTO
    });
  } catch (e) {
    // ignore
  }
  setSaving(false);
};
```

#### Après:
```typescript
const save = async () => {
  // ✅ Validation des champs requis
  if (!employeeId || !taskId || !projectId) {
    setError('Veuillez remplir tous les champs requis: Employé, Tâche, Projet');
    return;
  }

  // ✅ Calcul des heures totales
  const totalRegularHrs = rows.reduce((sum, row) => {
    const hours = parseFloat(row.regular?.replace(',', '.') || '0');
    return sum + (isNaN(hours) ? 0 : hours);
  }, 0);

  // ✅ Payload correct
  const payload = {
    employeeId,
    taskId,
    projectId,
    date: new Date().toISOString(),
    regularHrs: Math.round(totalRegularHrs),
    overtimeHrs: 0,
    sickHrs: 0,
    vacationHrs: 0,
    description: `Timesheet pour la semaine du ${rows[0]?.date}`,
  };
```

#### Nouveaux champs du formulaire:
```tsx
<input 
  type="text" 
  value={employeeId} 
  onChange={(e) => setEmployeeId(e.target.value)}
  placeholder="ex: emp-123"
/>
<input 
  type="text" 
  value={taskId} 
  onChange={(e) => setTaskId(e.target.value)}
  placeholder="ex: task-456"
/>
<input 
  type="text" 
  value={projectId} 
  onChange={(e) => setProjectId(e.target.value)}
  placeholder="ex: proj-789"
/>
```

### 2. **API Route améliorée** (`app/api/timesheets/route.ts`)

#### Avant:
```typescript
if (!body.employeeId || !body.taskId || !body.projectId) {
  return NextResponse.json({
    success: false,
    message: "Missing required fields: employeeId, taskId, projectId, date, regularHrs",
  }, { status: 400 });
}
```

#### Après (validation plus précise):
```typescript
const missingFields: string[] = [];
if (!body.employeeId) missingFields.push('employeeId');
if (!body.taskId) missingFields.push('taskId');
if (!body.projectId) missingFields.push('projectId');
if (!body.date) missingFields.push('date');
if (body.regularHrs === undefined || body.regularHrs === null) missingFields.push('regularHrs');

if (missingFields.length > 0) {
  return NextResponse.json({
    success: false,
    message: `Missing required fields: ${missingFields.join(', ')}`,
    missingFields,
  }, { status: 400 });
}
```

---

## 📋 Comment Utiliser le Formulaire

### Étape 1: Remplir les informations requises
```
Employé (ID): emp-123
Tâche (ID): task-456  
Projet (ID): proj-789
```

### Étape 2: Remplir les heures pour chaque jour
```
Lundi:    8 heures
Mardi:    8 heures
Mercredi: 8 heures
...
```

### Étape 3: Cliquer sur "💾 Enregistrer Timesheet"
- Le système valide que tous les champs requis sont remplis
- Calcule les heures totales
- Envoie à l'API

### Étape 4: Cliquer sur "🔍 Valider" (optionnel)
- Change le statut de `EN_ATTENTE` à `VALIDEE`

---

## 🔍 Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `src/modules/timesheets/components/TimesheetForm.tsx` | ✅ Ajout des champs requis + validation + gestion des erreurs |
| `app/api/timesheets/route.ts` | ✅ Validation améliorée des champs manquants |

---

## 📡 Structure de la Requête POST

```json
POST /api/timesheets
{
  "employeeId": "emp-123",
  "taskId": "task-456",
  "projectId": "proj-789",
  "date": "2025-12-12T10:30:00.000Z",
  "regularHrs": 40,
  "overtimeHrs": 0,
  "sickHrs": 0,
  "vacationHrs": 0,
  "description": "Timesheet pour la semaine du 01/07/2021"
}
```

### Réponse de succès:
```json
{
  "success": true,
  "data": {
    "id": "timesheet-id",
    "employeeId": "emp-123",
    "taskId": "task-456",
    "projectId": "proj-789",
    "regularHrs": 40,
    "statut": "EN_ATTENTE",
    "employee": {...},
    "task": {...},
    "project": {...}
  },
  "message": "TimeSheet created successfully"
}
```

---

## 🚨 Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Missing required fields: employeeId` | Le champ employeeId est vide | Remplissez le champ "Employé (ID)" |
| `Missing required fields: taskId` | Le champ taskId est vide | Remplissez le champ "Tâche (ID)" |
| `Missing required fields: projectId` | Le champ projectId est vide | Remplissez le champ "Projet (ID)" |
| `Missing required fields: date` | La date est manquante | La date est auto-remplie (maintenant) |
| `Missing required fields: regularHrs` | Les heures régulières sont 0 | Remplissez au moins une heure |

---

## ✨ Améliorations Futures

1. **Dropdown des employés/tâches/projets** au lieu de saisir les IDs
2. **Date picker** pour sélectionner la date du timesheet
3. **Calcul automatique** des heures totales par jour
4. **Intégration avec le dashboard** pour afficher les timesheets de l'employé
5. **Export PDF** du timesheet

---

## 🧪 Test Rapide

Utilisez cet exemple cURL pour tester:

```bash
curl -X POST http://localhost:3000/api/timesheets \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "test-emp-1",
    "taskId": "test-task-1",
    "projectId": "test-proj-1",
    "date": "2025-12-12T10:00:00Z",
    "regularHrs": 8
  }'
```

**Date**: 12 Décembre 2025  
**État**: ✅ RÉSOLU
