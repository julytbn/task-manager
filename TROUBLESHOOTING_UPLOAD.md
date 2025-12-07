# 🔧 Guide de Dépannage - Erreur Réseau lors de l'Upload

## ❌ Erreur: "Erreur réseau pendant l'upload"

### Causes possibles et solutions

#### 1. **Le serveur d'upload n'est pas en cours d'exécution** ⚠️
**Symptômes:** Erreur "Impossible de se connecter au serveur d'upload"

**Solution:**
```powershell
# Vérifiez que le port 4000 est disponible
netstat -ano | Select-String "4000"

# Lancez le serveur d'upload
npm run upload-server

# Vérifiez qu'il démarre correctement:
# Vous devriez voir: "✅ Upload server listening on http://localhost:4000"
```

---

#### 2. **Problème de CORS (Cross-Origin Resource Sharing)** 🔒
**Symptômes:** Erreur CORS dans la console du navigateur

**Vérifications:**
- Fichier `.env` contient: `UPLOAD_CORS_ORIGIN=*` ou l'URL correcte
- Headers CORS sont activés dans `scripts/upload-server.js`

**Solution:**
```bash
# Si vous avez changé les ports, mettez à jour .env:
NEXT_PUBLIC_UPLOAD_SERVER_URL=http://localhost:4000
UPLOAD_CORS_ORIGIN=*
```

---

#### 3. **Le port 4000 est déjà utilisé** 🔌
**Symptômes:** "Port 4000 is already in use!"

**Solution:**
```powershell
# Trouvez le processus qui utilise le port 4000
netstat -ano | Select-String "4000" | ForEach-Object {
  $parts = $_ -split '\s+'
  $pid = $parts[-1]
  Write-Host "PID utilisant le port 4000: $pid"
}

# Arrêtez-le
Stop-Process -Id <PID> -Force

# Ou arrêtez tous les processus Node
Stop-Process -Name node -Force
```

---

#### 4. **Timeout lors du transfert de fichiers volumineux** ⏱️
**Symptômes:** "Timeout lors de l'upload"

**Solution:**
- Augmentez le timeout dans `.env`:
  ```
  UPLOAD_MAX_BYTES=52428800  # 50MB au lieu de 10MB
  ```
- Vérifiez votre connexion réseau
- Essayez de télécharger des fichiers plus petits

---

#### 5. **Fichier trop volumineux** 📦
**Symptômes:** "File too large"

**Solution:**
```bash
# Augmentez la limite dans .env:
UPLOAD_MAX_BYTES=52428800  # 50MB

# Redémarrez le serveur d'upload pour appliquer le changement
```

---

#### 6. **Type de fichier non autorisé** 🚫
**Symptômes:** "Invalid file type"

**Fichiers autorisés par défaut:**
- Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.txt`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- Archives: `.zip`

**Solution pour ajouter un type:**
1. Modifiez `scripts/upload-server.js`
2. Ligne: `const ALLOWED_EXTENSIONS = [...]`
3. Ajoutez votre extension (ex: `.pptx`)
4. Redémarrez le serveur

---

## ✅ Vérification Complète du Système

Utilisez ce script de diagnostic:

```powershell
# 1. Vérifiez Node.js
node --version
npm --version

# 2. Vérifiez les dépendances
npm list express busboy multer

# 3. Vérifiez les ports
netstat -ano | Select-String "3000|4000"

# 4. Testez la connexion au serveur d'upload
curl http://localhost:4000/health
# ou depuis PowerShell:
Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
```

---

## 🚀 Procédure de Démarrage Correcte

### Option 1: Avec le script fourni
```powershell
.\start-all.ps1
```

### Option 2: Manuellement (2 terminals)

**Terminal 1 - Serveur d'upload:**
```powershell
npm run upload-server
# Attendez: ✅ Upload server listening on http://localhost:4000
```

**Terminal 2 - Serveur Next.js:**
```powershell
npm run dev
# Attendez: ▲ Next.js 14.2.33 ready
```

---

## 📊 Variables d'Environnement Requises

Votre fichier `.env` doit contenir:

```env
# Upload Server Configuration
NEXT_PUBLIC_UPLOAD_SERVER_URL=http://localhost:4000
UPLOAD_SERVER_PORT=4000
UPLOAD_MAX_BYTES=10485760
UPLOAD_CORS_ORIGIN=*
UPLOAD_API_KEY=
```

**Important:**
- `NEXT_PUBLIC_` = accessible côté client
- `UPLOAD_SERVER_URL` doit correspondre au serveur réel
- `UPLOAD_CORS_ORIGIN=*` permet les requêtes de n'importe quelle origine

---

## 🔍 Logs et Débogage

### Vérifiez les logs du serveur d'upload:
```
✅ Upload server listening on http://localhost:4000
📁 Max file size: 10MB
🔐 CORS origin: *
🔑 API Key required: No
```

### Vérifiez la console du navigateur:
- F12 > Console
- Cherchez les erreurs CORS ou de connexion
- Vérifiez les requêtes dans l'onglet Network

### Testez le serveur d'upload:
```powershell
# Health check
$response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
Write-Host $response.Content
# Doit afficher: {"status":"ok","timestamp":"2025-12-02T..."}
```

---

## 🆘 Si le problème persiste

1. **Consultez les erreurs exactes:**
   - Terminal d'upload
   - Console du navigateur (F12)
   - Fichier `.env`

2. **Vérifiez la configuration réseau:**
   - Firewall bloque le port 4000?
   - VPN active?
   - Proxy configuré?

3. **Réinitialisation complète:**
```powershell
# 1. Arrêtez tous les processus
Stop-Process -Name node -Force

# 2. Nettoyez les modules
Remove-Item -Path node_modules -Recurse -Force
npm install

# 3. Régénérez Prisma
npm run prisma:generate

# 4. Redémarrez
.\start-all.ps1
```

---

**Dernière mise à jour:** Décembre 2025
**Version:** 1.0
