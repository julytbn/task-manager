# 🧪 Testing Guide - Projets Stats BD

## 🚀 Quick Test (1 minute)

### 1. Lancer le serveur
```powershell
cd "c:\Users\DELL G15\Desktop\ReactProjet\task-log - Copie\task-manager"
npm run dev
```

### 2. Ouvrir le navigateur
```
http://localhost:3000/projets
```

### 3. Observer les KPI Cards
```
Vous devriez voir:
- Total Projets: [nombre depuis BD]
- En Cours: [nombre depuis BD]
- Terminés: [nombre depuis BD]
- Budget Total: [montant formaté en FCFA]
```

✅ **TEST RÉUSSI** si les chiffres sont non-zéro et formatés correctement

---

## 🔍 API Testing

### Test 1: URL directement dans le navigateur

**1. Ouvrir:**
```
http://localhost:3000/api/dashboard/projets-stats
```

**2. Observer:**
```json
{
  "totalProjets": 11,
  "projetsEnCours": 2,
  "projetsTermines": 3,
  "budgetTotal": 50000000,
  "budgetTotalFormatted": "50 000 000 XOF",
  "projetsEnCoursList": [...],
  "projetsTerminesList": [...],
  "statutsDisponibles": [...]
}
```

✅ **VALIDE** si:
- Status 200
- JSON valide
- Tous les champs présents

---

### Test 2: PowerShell avec Invoke-WebRequest

```powershell
# Requête simple
Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/projets-stats" `
  -Method GET | ConvertFrom-Json

# Afficher les résultats
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/projets-stats" `
  -Method GET | ConvertFrom-Json

Write-Host "Total Projets: $($response.totalProjets)"
Write-Host "En Cours: $($response.projetsEnCours)"
Write-Host "Terminés: $($response.projetsTermines)"
Write-Host "Budget: $($response.budgetTotalFormatted)"
```

**Résultat attendu:**
```
Total Projets: 11
En Cours: 2
Terminés: 3
Budget: 50 000 000 XOF
```

---

### Test 3: PowerShell avec curl

```powershell
# Simple GET
curl -Uri "http://localhost:3000/api/dashboard/projets-stats"

# Avec header et format
curl -Uri "http://localhost:3000/api/dashboard/projets-stats" `
  -Headers @{"Content-Type"="application/json"}
```

---

### Test 4: Browser DevTools

**1. Ouvrir DevTools** (F12)

**2. Aller à Network tab**

**3. Charger** `/projets`

**4. Chercher** `projets-stats`

**5. Inspecter la requête:**
```
Request:
  Method: GET
  URL: /api/dashboard/projets-stats
  Status: 200

Response:
  {...JSON complète...}
```

**6. Vérifier les données:**
```
✅ totalProjets > 0
✅ budgetTotalFormatted contient "XOF"
✅ projetsEnCoursList est un array
✅ statutsDisponibles contient des éléments
```

---

## 🧩 Component Testing

### Test 1: Vérifier le hook dans une page

**Créer un fichier test:** `app/test-hook/page.tsx`

```typescript
'use client'
import { useProjectsStatistics } from '@/lib/useProjectsStatistics'
import { useEffect } from 'react'

export default function TestHookPage() {
  const { data, loading, error, refreshStatistics } = useProjectsStatistics()

  useEffect(() => {
    console.log('Hook initialized')
    console.log('Loading:', loading)
    console.log('Data:', data)
    console.log('Error:', error)
  }, [data, loading, error])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Hook</h1>
      
      {loading && <p>⏳ Loading...</p>}
      {error && <p style={{ color: 'red' }}>❌ Error: {error}</p>}
      
      {data && (
        <div>
          <h2>✅ Données reçues!</h2>
          <p><strong>Total:</strong> {data.totalProjets}</p>
          <p><strong>En Cours:</strong> {data.projetsEnCours}</p>
          <p><strong>Terminés:</strong> {data.projetsTermines}</p>
          <p><strong>Budget:</strong> {data.budgetTotalFormatted}</p>
          
          <h3>Projets en cours:</h3>
          <pre>{JSON.stringify(data.projetsEnCoursList, null, 2)}</pre>
          
          <button onClick={refreshStatistics}>
            Rafraîchir les données
          </button>
        </div>
      )}
    </div>
  )
}
```

**Accéder à:** `http://localhost:3000/test-hook`

**Vérifier:**
- ✅ Loading passe de true à false
- ✅ Data se remplit avec les bonnes valeurs
- ✅ Aucune erreur dans la console
- ✅ Bouton "Rafraîchir" fonctionne

---

### Test 2: Cache Testing

**Code de test:**
```typescript
// lib/test-cache.ts
import { useProjectsStatistics } from './useProjectsStatistics'

export async function testCache() {
  console.time('First call')
  // First call - should fetch from API
  const response1 = await fetch('/api/dashboard/projets-stats')
  const data1 = await response1.json()
  console.timeEnd('First call') // ~400-600ms

  console.time('Second call (should be cached)')
  // Second call - should use module cache
  const response2 = await fetch('/api/dashboard/projets-stats')
  const data2 = await response2.json()
  console.timeEnd('Second call') // < 5ms

  console.assert(
    JSON.stringify(data1) === JSON.stringify(data2),
    'Cache data should match'
  )
}
```

**Résultat attendu:**
```
First call: 450ms (API call)
Second call: 2ms (from cache)
✅ Cache data should match
```

---

## 🐛 Debugging

### Enable Console Logging

**Dans** `lib/useProjectsStatistics.ts`:

```typescript
// Ajouter des logs
useEffect(() => {
  console.log('📊 useProjectsStatistics hook initializing...')
  
  const fetchStatistics = async () => {
    try {
      console.log('📡 Fetching from API...')
      
      if (projectStatsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        console.log('⚡ Using cached data')
        setData(projectStatsCache)
        setLoading(false)
        return
      }

      console.log('🔄 Fetching fresh data...')
      const response = await fetch('/api/dashboard/projets-stats')
      const jsonData = await response.json()
      
      console.log('✅ Data received:', jsonData)
      projectStatsCache = jsonData
      cacheTimestamp = Date.now()
      
      setData(jsonData)
    } catch (err) {
      console.error('❌ Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  fetchStatistics()
}, [])
```

**Ouvrir Console (F12) et vérifier les logs:**
```
📊 useProjectsStatistics hook initializing...
📡 Fetching from API...
🔄 Fetching fresh data...
✅ Data received: {...}
```

---

### Enable API Logging

**Dans** `app/api/dashboard/projets-stats/route.ts`:

```typescript
export async function GET() {
  try {
    console.log('📊 [API] GET /api/dashboard/projets-stats')
    
    // Récupérer les enums
    console.log('📖 [API] Fetching EnumStatutProjet...')
    const statutsEnum = await prisma.enumStatutProjet.findMany({
      where: { actif: true }
    })
    console.log(`✅ [API] Found ${statutsEnum.length} statuts`)

    // Récupérer les projets
    console.log('📁 [API] Fetching Projets...')
    const projets = await prisma.projet.findMany({...})
    console.log(`✅ [API] Found ${projets.length} projets`)

    // Traitement
    console.log('🧮 [API] Calculating statistics...')
    projets.forEach(projet => {
      const budget = projet.budget || 0
      statistics.budgetTotal += budget
      
      if (projet.statut === 'EN_COURS') {
        statistics.projetsEnCours++
      } else if (projet.statut === 'TERMINE') {
        statistics.projetsTermines++
      }
    })
    console.log(`✅ [API] Statistics: ${statistics.projetsEnCours} en cours, ${statistics.projetsTermines} terminés`)
    
    console.log(`💰 [API] Budget total: ${statistics.budgetTotalFormatted}`)
    console.log(`📤 [API] Returning response`)
    
    return NextResponse.json({...})
  } catch (error) {
    console.error('❌ [API] Error:', error)
    return NextResponse.json(...)
  }
}
```

**Vérifier les logs du serveur terminal:**
```
📊 [API] GET /api/dashboard/projets-stats
📖 [API] Fetching EnumStatutProjet...
✅ [API] Found 3 statuts
📁 [API] Fetching Projets...
✅ [API] Found 11 projets
🧮 [API] Calculating statistics...
✅ [API] Statistics: 2 en cours, 3 terminés
💰 [API] Budget total: 50 000 000 XOF
📤 [API] Returning response
```

---

## 📊 Data Validation

### Vérifier la structure JSON

```powershell
$data = (Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/projets-stats" | ConvertFrom-Json)

# Vérifier les champs principaux
$data.psobject.properties.name

# Résultat attendu:
# totalProjets
# projetsEnCours
# projetsTermines
# budgetTotal
# budgetTotalFormatted
# projetsEnCoursList
# projetsTerminesList
# statutsDisponibles
```

### Vérifier les types

```powershell
Write-Host "totalProjets type: $($data.totalProjets.GetType().Name)"
Write-Host "budgetTotalFormatted type: $($data.budgetTotalFormatted.GetType().Name)"
Write-Host "projetsEnCoursList is array: $($data.projetsEnCoursList -is [array])"
```

---

## ⚡ Performance Testing

### Mesurer le temps de réponse

```powershell
# Mesurer 10 appels
for ($i = 1; $i -le 10; $i++) {
  $start = Get-Date
  $response = Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/projets-stats"
  $duration = (Get-Date) - $start
  Write-Host "Call $i : $($duration.TotalMilliseconds)ms"
}

# Résultat attendu:
# Call 1  : 450ms (API)
# Call 2-3: 2ms (cache)
# Call 4-10: 2ms (cache)
```

---

## ✅ Checklist Final

### API Endpoint
- [ ] Route créée: `/api/dashboard/projets-stats`
- [ ] Méthode: GET
- [ ] Status: 200 OK
- [ ] Response: JSON valide
- [ ] Champs: tous présents
- [ ] Types: corrects

### React Hook
- [ ] Hook créé: `useProjectsStatistics`
- [ ] Loading state: fonctionne
- [ ] Data state: reçoit les données
- [ ] Error state: captures les erreurs
- [ ] Cache: fonctionne
- [ ] Refresh: fonctionne

### Integration
- [ ] Page `/projets` chargée
- [ ] Hook intégré
- [ ] KPI Cards mises à jour
- [ ] Budget formaté FCFA
- [ ] Aucune erreur Console
- [ ] Build successful

### Performance
- [ ] Premier appel: 400-600ms
- [ ] Appels en cache: < 5ms
- [ ] Cache TTL: 5 minutes
- [ ] Pas de fuites mémoire
- [ ] Pas de requêtes dupliquées

---

## 📝 Test Report Template

```
Test Date: [DATE]
Tester: [NOM]
Environment: Development/Production

API Tests:
- [ ] GET /api/dashboard/projets-stats returns 200
- [ ] Response contains all required fields
- [ ] Data is valid JSON
- [ ] Budget formatted in FCFA

Hook Tests:
- [ ] useProjectsStatistics initializes
- [ ] Loading state works
- [ ] Data is populated
- [ ] No errors in console
- [ ] Cache works
- [ ] Refresh works

Integration Tests:
- [ ] Page /projets loads
- [ ] Hook integrates correctly
- [ ] KPI Cards display data
- [ ] Build successful
- [ ] No TypeScript errors

Performance Tests:
- [ ] First call ~500ms
- [ ] Cached calls ~2ms
- [ ] Memory stable
- [ ] No network waterfalls

Overall: PASS / FAIL
Notes: [NOTES]
```

---

## 🚨 Troubleshooting

### Problème: 500 error from API

**Solution:**
1. Vérifier la connexion BD
2. Vérifier Prisma client: `npx prisma generate`
3. Vérifier les migrations: `npx prisma migrate status`
4. Voir les logs du serveur pour plus de détails

### Problème: Hook retourne toujours null

**Solution:**
1. Vérifier que API retourne 200
2. Vérifier que fetch réussit
3. Vérifier les logs de la console
4. Vérifier que setData est appelé

### Problème: Cache ne fonctionne pas

**Solution:**
1. Vérifier que projectStatsCache est module-level
2. Vérifier que cacheTimestamp est mis à jour
3. Vérifier le CACHE_DURATION (5 min)
4. Ouvrir DevTools Network pour voir les requêtes

### Problème: Budget ne s'affiche pas en FCFA

**Solution:**
1. Vérifier budgetTotalFormatted dans la réponse API
2. Vérifier toLocaleString avec currency: 'XOF'
3. Vérifier le formatage: `"50 000 000 XOF"`

---

**Last Updated:** 2024-12-27  
**Status:** ✅ Testing Ready
