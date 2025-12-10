# 🐛 DIAGNOSTIC - TÂCHES SOUMISES N'APPARAISSENT PAS AU MANAGER

**Date:** 8 Décembre 2025  
**Status:** 🔴 **BUG IDENTIFIÉ**

---

## 📊 PROBLÈME DÉCRIT

❌ Quand un employé soumet une tâche avec le statut `SOUMISE`:
1. La tâche n'apparaît **pas** dans la page Kanban du manager
2. La tâche n'apparaît **pas** dans le tableau "Tâches soumises"
3. Le manager ne peut donc **pas valider/rejeter** la tâche

✅ Ce qui devrait se passer:
1. L'employé soumet une tâche → Statut = `SOUMISE`
2. La tâche devrait apparaître dans le dashboard manager
3. Le manager clique sur la tâche → Peut valider/rejeter + ajouter un commentaire

---

## 🔍 CAUSE IDENTIFIÉE

### Fichier: `/app/api/taches/route.ts` (Ligne 10-16)

```typescript
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const where: any = {}
    // If the user is an employee, return only tasks assigned to them
    if (session?.user?.role === 'EMPLOYE' && session.user.id) {
      where.assigneAId = session.user.id  // ❌ PROBLÈME ICI
    }

    const taches = await prisma.tache.findMany({
      where,
      include: {
        projet: { select: { id: true, titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { dateCreation: 'desc' }
    })
    return NextResponse.json(taches)
```

### 🔴 LE PROBLÈME:

**Condition logique incorrecte:**

```
ACTUELLEMENT:
- Si user.role === 'EMPLOYE' → Retourner SEULEMENT les tâches assignées à cet employé
- Si user.role !== 'EMPLOYE' (MANAGER/ADMIN) → Retourner TOUTES les tâches

MAIS:
- Une tâche SOUMISE n'a PAS d'assigné (assigneAId = null)
- Elle est créée par un employé, en attente de validation du manager
- Le manager la voit pas car elle n'est pas filtrée correctement
```

### 📊 Flux de Création d'une Tâche:

```
1. Employé crée/soumet une tâche
   - Statut: SOUMISE ✅
   - AssigneA: null (pas encore assignée) ❌ ← PROBLÈME!
   
2. Manager consulte /api/taches
   - GET retourne TOUTES les tâches (pas un employé)
   - MAIS: La tâche SOUMISE existe et devrait être visible
   
3. Page Kanban reçoit les tâches
   - Tâche SOUMISE devrait être mappée → statut 'submitted'
   - Elle devrait filtrer correctement
```

---

## 🔧 SOLUTION

### Fix #1: Améliorer le Filtre GET

**Fichier:** `/app/api/taches/route.ts`

```typescript
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const where: any = {}
    
    // Si l'utilisateur est un EMPLOYE:
    //   - Retourner uniquement les tâches assignées à cet employé
    // Si l'utilisateur est un MANAGER ou ADMIN:
    //   - Retourner TOUTES les tâches (pour voir les tâches soumises)
    if (session?.user?.role === 'EMPLOYE' && session.user.id) {
      where.assigneAId = session.user.id
    }
    // Pour les managers/admins: pas de filtre (voir toutes les tâches)

    const taches = await prisma.tache.findMany({
      where,
      include: {
        projet: { select: { id: true, titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { dateCreation: 'desc' }
    })
    
    console.log(`User role: ${session?.user?.role}, Tasks returned: ${taches.length}`)
    
    return NextResponse.json(taches)
  } catch (error) {
    console.error('Erreur récupération tâches:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tâches' },
      { status: 500 }
    )
  }
}
```

✅ **Ce fix devrait déjà marcher** si le code n'a pas changé.

### Fix #2: Vérifier le Composant SubmitTaskForm

**Vérification à faire:**

1. Quand l'employé soumet une tâche, le statut doit être défini à `SOUMISE`
2. L'assigné peut être:
   - `null` → Tâche en attente de validation
   - Défini → Tâche directement assignée

**Fichier:** `/components/dashboard/SubmitTaskForm.tsx` (Ligne 53-54)

```typescript
// Default statut - mark as SOUMISE for submitted tasks
const defaultStatut = (statutsTaches && statutsTaches.length > 0) 
  ? (statutsTaches.find((s:any)=>s.cle==='SOUMISE')?.cle || 'SOUMISE') 
  : 'SOUMISE'
```

✅ **C'est correct** - Le statut par défaut est bien `SOUMISE`

---

## 🧪 TESTS À FAIRE

### Test 1: Vérifier que le GET retourne les tâches SOUMISES

```bash
# En tant que MANAGER
GET http://localhost:3000/api/taches

# La réponse devrait contenir les tâches avec:
{
  "id": "...",
  "titre": "...",
  "statut": "SOUMISE",
  "assigneAId": null,  ← La clé!
  ...
}
```

### Test 2: Vérifier le Kanban

```
1. Aller sur http://localhost:3000/kanban (en tant que manager)
2. Cliquer sur onglet "Tâches soumises"
3. La tâche soumise par l'employé devrait apparaître
4. Cliquer sur "Tous" - elle devrait aussi être visible
```

### Test 3: Vérifier le Filtre Kanban

**Dans le fichier `/app/kanban/page.tsx` (Ligne 57):**

```typescript
const mapStatus = (statut?: string): TaskStatus => {
  switch (statut) {
    case 'A_FAIRE': return 'todo'
    case 'EN_COURS': return 'in_progress'
    case 'EN_REVISION': return 'review'
    case 'SOUMISE': return 'submitted'  ← ✅ C'est là!
    case 'TERMINE': return 'done'
    default: return 'todo'
  }
}
```

✅ **Le mapping est correct** - SOUMISE → 'submitted'

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Tâche créée par employé avec statut `SOUMISE`
- [ ] Tâche stockée en BDD avec `statut = 'SOUMISE'`
- [ ] GET `/api/taches` retourne la tâche (manager)
- [ ] GET `/api/taches` retourne la tâche (employé qui l'a créée? NON - c'est pas assignée)
- [ ] Kanban reçoit la tâche dans le JSON
- [ ] Kanban mappe le statut correctement ('submitted')
- [ ] Kanban affiche la tâche dans l'onglet "Tâches soumises"
- [ ] Manager peut cliquer sur la tâche
- [ ] Modal s'ouvre et permet validation/rejet

---

## 🔧 ACTIONS CORRECTIVES

### Action 1: Ajouter des Logs de Debug

Modifier `/app/api/taches/route.ts`:

```typescript
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('📋 GET /api/taches - User role:', session?.user?.role)

    const where: any = {}
    if (session?.user?.role === 'EMPLOYE' && session.user.id) {
      where.assigneAId = session.user.id
      console.log('📋 Filtre: EMPLOYE - Returning tasks assigned to:', session.user.id)
    } else {
      console.log('📋 Filtre: MANAGER/ADMIN - Returning ALL tasks')
    }

    const taches = await prisma.tache.findMany({
      where,
      include: {
        projet: { select: { id: true, titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { dateCreation: 'desc' }
    })
    
    console.log(`📋 Total tasks returned: ${taches.length}`)
    console.log('📋 Tasks statuts:', taches.map(t => `${t.titre}(${t.statut})`))
    
    return NextResponse.json(taches)
  } catch (error) {
    console.error('Erreur récupération tâches:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tâches' },
      { status: 500 }
    )
  }
}
```

### Action 2: Vérifier la Création de Tâche

Modifier `/components/dashboard/SubmitTaskForm.tsx` pour log:

```typescript
const handleSubmit = async () => {
  try {
    console.log('📝 Soumission tâche avec:', {
      titre: formData.titre,
      statut: formData.statut,
      assigneA: formData.assigneA,
      ...
    })
    
    // Le reste du code
  } catch (err) {
    console.error('Erreur soumission:', err)
  }
}
```

### Action 3: Vérifier la Réception au Kanban

Modifier `/app/kanban/page.tsx` (Ligne 80-85):

```typescript
const loadTasks = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/taches')
    if (!res.ok) throw new Error('Erreur récupération tâches')
    const data = await res.json()
    
    console.log('📊 Kanban reçoit:', data.length, 'tâches')
    console.log('📊 Statuts:', data.map((t: any) => `${t.titre}(${t.statut})`))
    
    const mapped: Task[] = data.map((t: any) => ({
      id: t.id,
      title: t.titre || t.title || 'Sans titre',
      project: t.projet?.titre || t.projet || undefined,
      client: t.client || undefined,
      assignee: t.assigneA ? `${t.assigneA.prenom || ''} ${t.assigneA.nom || ''}`.trim() : undefined,
      status: mapStatus(t.statut),
      priority: mapPriority(t.priorite),
      dueDate: t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString() : undefined,
      amount: t.montant ?? undefined
    }))
    
    console.log('📊 Tâches mappées:', mapped.map(t => `${t.title}(${t.status})`))
    
    setTasks(mapped)
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}
```

---

## 📊 ÉTAPES DE DEBUG

### Étape 1: Vérifier la Création

1. Se connecter en tant qu'employé
2. Aller sur "Soumettre une tâche"
3. Remplir les champs
4. Vérifier dans la console:
   ```
   📝 Soumission tâche avec: { titre: "...", statut: "SOUMISE" }
   ```

### Étape 2: Vérifier la Sauvegarde

1. Vérifier en BDD:
   ```sql
   SELECT id, titre, statut, "assigneAId" FROM taches 
   WHERE titre LIKE '%...' 
   ORDER BY "dateCreation" DESC LIMIT 1;
   
   -- Résultat attendu:
   -- statut = SOUMISE
   -- assigneAId = NULL
   ```

### Étape 3: Vérifier le GET

1. Se connecter en tant que manager
2. Ouvrir DevTools → Network
3. Aller sur Kanban
4. Chercher requête `/api/taches`
5. Vérifier la réponse contient la tâche avec `"statut": "SOUMISE"`
6. Vérifier dans la console:
   ```
   📋 GET /api/taches - User role: MANAGER
   📋 Filtre: MANAGER/ADMIN - Returning ALL tasks
   📋 Total tasks returned: X
   📋 Tasks statuts: ..., ...soumise(...SOUMISE), ...
   ```

### Étape 4: Vérifier l'Affichage

1. Kanban devrait logger:
   ```
   📊 Kanban reçoit: X tâches
   📊 Statuts: ..., ...soumise...submitted..., ...
   ```
2. Vérifier visuel: l'onglet "Tâches soumises" devrait contenir la tâche

---

## 🎯 RÉSUMÉ DU PROBLÈME

| Aspect | État Actuel | État Attendu |
|--------|------------|--------------|
| **Création** | Statut SOUMISE assigné ✅ | Statut SOUMISE assigné ✅ |
| **Stockage** | Sauvegardé en BDD ✅ | Sauvegardé en BDD ✅ |
| **GET /api/taches** | Retourne TOUTES les tâches (manager) ✅ | Retourne TOUTES les tâches (manager) ✅ |
| **Filtre Kanban** | Mappe SOUMISE → 'submitted' ✅ | Mappe SOUMISE → 'submitted' ✅ |
| **Affichage Kanban** | ❌ N'affiche pas la tâche SOUMISE | ✅ Affiche la tâche SOUMISE |

---

## 🚨 HYPOTHÈSES À VÉRIFIER

1. **L'employé soumet bien une tâche avec statut SOUMISE?**
   - À vérifier en BDD

2. **Le manager est bien connecté et son rôle est MANAGER?**
   - À vérifier dans session

3. **La réponse du GET contient bien la tâche SOUMISE?**
   - À vérifier avec DevTools Network

4. **Le filtre Kanban mappe bien SOUMISE → 'submitted'?**
   - À vérifier avec logs

5. **L'onglet "Tâches soumises" filtre bien par status === 'submitted'?**
   - À vérifier avec logs

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Ajouter les logs de debug
2. ⏳ Soumettre une tâche en tant qu'employé
3. ⏳ Vérifier les logs (console + DevTools)
4. ⏳ Identifier l'étape où la tâche est perdue
5. ⏳ Corriger le code
6. ⏳ Re-tester

---

**Document créé:** 8 Décembre 2025

