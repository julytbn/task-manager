# 📋 GUIDE: VALIDATION DES UPLOADS DOCUMENTS

## ✅ Status: 70% Implémenté

### Vérifications Existantes

```typescript
✅ Authentification JWT requise
✅ Rate limiting (30 req/min par IP)
✅ Whitelist des types: ['tasks', 'clients', 'projects']
✅ Validation UUID des IDs
✅ Protection contre directory traversal
✅ Permission checks par type de document
✅ Vérification de propriété du document
```

---

## 🧪 CHECKLIST DE TEST UPLOADS

### Test 1: Authentification
```bash
# Sans token → 401
curl -X GET http://localhost:3000/api/uploads/tasks/123/file.pdf

# Avec token → Succès ou 403
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/uploads/tasks/123/file.pdf
```

### Test 2: Propriété des Documents
```bash
# EMPLOYE essaye d'accéder document d'un autre EMPLOYE
EMPLOYE_TOKEN=$(node scripts/get-token.js employe@test.com)
curl -X GET \
  -H "Authorization: Bearer $EMPLOYE_TOKEN" \
  http://localhost:3000/api/uploads/tasks/other-task-id/file.pdf
# Expected: 403 Forbidden
```

### Test 3: Validation des Types
```bash
# Type invalide → 400
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/uploads/malicious/123/file.pdf
# Expected: 400 Type de fichier non autorisé
```

### Test 4: Protection Directory Traversal
```bash
# Essayer d'échapper le répertoire
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/uploads/tasks/../../etc/passwd
# Expected: 403 Accès refusé
```

### Test 5: Rate Limiting
```bash
# Faire 35 requêtes rapidement
for i in {1..35}; do
  curl -X GET \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/uploads/tasks/123/file_$i.pdf
done
# Expected: 429 Trop de requêtes (après 30)
```

### Test 6: Fichiers Non-Existants
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/uploads/tasks/123/nonexistent.pdf
# Expected: 404 Fichier introuvable
```

---

## 🔧 AMÉLIORATIONS À AJOUTER

### 1. Validation Mime-Types
```typescript
// À ajouter dans route.ts:
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif'
]

// Vérifier Content-Type
const file = await fs.promises.stat(filePath)
if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
  return NextResponse.json(
    { error: 'Type MIME non autorisé' },
    { status: 400 }
  )
}
```

### 2. Limite de Taille de Fichier
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const stats = await fs.promises.stat(filePath)
if (stats.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
    { status: 413 }
  )
}
```

### 3. Logging des Accès
```typescript
// Enregistrer chaque accès pour audit
await prisma.accessLog.create({
  data: {
    userId: session.user.id,
    fileType: type,
    fileId: id,
    fileName: file,
    timestamp: new Date(),
    ipAddress: clientIp,
    success: true
  }
})
```

### 4. Scannage Antivirus (Optional)
```typescript
// Pour production avec fichiers sensibles
const NodeClam = require('clamscan')
const clamscan = await new NodeClam().init()
const { is_infected } = await clamscan.scanFile(filePath)
if (is_infected) {
  await fs.promises.unlink(filePath)
  return NextResponse.json(
    { error: 'Fichier suspect détecté' },
    { status: 400 }
  )
}
```

### 5. Chiffrement des Uploads
```typescript
// Pour documents sensibles
const crypto = require('crypto')
const encryptedPath = `${filePath}.enc`

const cipher = crypto.createCipher('aes192', process.env.ENCRYPTION_KEY)
const input = fs.createReadStream(filePath)
const output = fs.createWriteStream(encryptedPath)

input.pipe(cipher).pipe(output)
```

---

## 📊 MATRICE DE PERMISSION UPLOADS

| Type | ADMIN | MANAGER | EMPLOYE | CONSULTANT |
|------|-------|---------|---------|------------|
| tasks | ✅ Tous | ✅ Ses projets | ✅ Ses upload | ✅ Ses upload |
| clients | ✅ Tous | ✅ Clients assignés | ❌ Pas accès | ❌ Pas accès |
| projects | ✅ Tous | ✅ Ses projets | ❌ Pas accès | ❌ Pas accès |

---

## 🚀 DEPLOIEMENT UPLOADS

### Local Testing
```bash
# 1. Créer structure répertoire
mkdir -p storage/uploads/{tasks,clients,projects}
chmod 755 storage

# 2. Ajouter au .gitignore
echo "storage/uploads/" >> .gitignore

# 3. Tester endpoints
npm run test:uploads
```

### Production (Vercel)
```bash
# Option 1: Utiliser blob storage Vercel
# https://vercel.com/docs/storage/vercel-blob

# Option 2: S3 AWS
# https://docs.aws.amazon.com/s3/

# Option 3: Google Cloud Storage
# https://cloud.google.com/storage
```

### Configuration Vercel Blob
```typescript
// À remplacer dans route.ts
import { put, get, delete: del } from '@vercel/blob'

export async function GET(request: Request, { params }: { params: any }) {
  // ...
  const blob = await get(`${type}/${id}/${file}`)
  return NextResponse.json({ url: blob.url })
}
```

---

## ✅ VALIDATION GO LIVE

- [ ] Authentification testée (401 sans token)
- [ ] Propriété des documents vérifiée (403 pour non-propriétaires)
- [ ] Types valides uniquement (400 pour types invalides)
- [ ] Protection directory traversal (403 pour ../)
- [ ] Rate limiting actif (429 après 30/min)
- [ ] Fichiers sensibles chiffrés (si applicable)
- [ ] Logs d'accès enregistrés
- [ ] Stockage production configuré (S3, Blob, etc.)
- [ ] Sauvegardes automatiques en place
- [ ] Retention policy définie (combien de temps garder?)

---

## 🔍 DEBUGGING

```bash
# Voir les uploads
ls -la storage/uploads/

# Voir les permissions
stat storage/uploads/tasks/123/file.pdf

# Tester accès
npm run test:uploads -- --verbose

# Logs
tail -f .next/server.log | grep "uploads\|document\|file"
```

---

## ⏱️ TEMPS ESTIMÉ DE COMPLÉTION

- Validation complète: **1 heure**
- Améliorations mime-types: **30 min**
- Chiffrement (optionnel): **1 heure**
- Tests automatisés: **1 heure**
- **Total: ~2-3 heures** pour 100% complet

