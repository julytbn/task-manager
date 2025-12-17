# ✅ Guide d'Activation du Serveur d'Upload

## 🎯 État Actuel

✅ **Serveur d'upload** - http://localhost:4000 (ACTIF)
✅ **Serveur Next.js** - http://localhost:3000 (ACTIF)

---

## 🧪 Comment Vérifier que Tout Fonctionne

### Option 1 : Depuis PowerShell
```powershell
# Vérifier les ports
netstat -ano | Select-String "LISTENING" | Where-Object {$_ -match "3000|4000"}

# Doit afficher:
# TCP    0.0.0.0:4000           0.0.0.0:0              LISTENING       [PID]
# TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       [PID]
```

### Option 2 : Depuis le navigateur
1. Ouvrez `http://localhost:3000`
2. Naviguez vers la page des **Clients**
3. Cliquez sur un client
4. Trouvez la section **"Gestion des Documents"**
5. Essayez d'upload un fichier

### Option 3 : Test Direct du Serveur d'Upload
```powershell
# Tester la connexion au serveur d'upload
Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
```

---

## 🔧 En Cas de Problème

### Le port 4000 n'est pas en écoute?
```powershell
# Vérifiez que le serveur d'upload est bien lancé
Get-Process node | Select-Object ProcessName, Id

# Si pas de processus node, lancez:
npm run upload-server
```

### L'erreur persiste?
1. Ouvrez la **Console** du navigateur (F12 > Console)
2. Copiez le script dans `test-upload-connection.js`
3. Collez-le dans la console et exécutez
4. Vérifiez le message d'erreur exact

### Démarrage Complet
```powershell
# Terminal 1 - Upload Server
npm run upload-server

# Terminal 2 - Next.js (attendre 3 secondes après Terminal 1)
npm run dev
```

---

## 📝 Variables d'Environnement Requises

Votre fichier `.env` doit contenir:
```env
NEXT_PUBLIC_UPLOAD_SERVER_URL=http://localhost:4000
UPLOAD_SERVER_PORT=4000
UPLOAD_MAX_BYTES=10485760
UPLOAD_CORS_ORIGIN=*
UPLOAD_API_KEY=
```

---

## 🐛 Dépannage Détaillé

### Erreur: "Failed to fetch"
**Cause:** Le serveur d'upload n'est pas en cours d'exécution

**Solution:**
1. Vérifiez avec: `netstat -ano | Select-String "4000"`
2. Si rien, lancez: `npm run upload-server`

### Erreur: "Port already in use"
**Cause:** Quelque chose d'autre utilise le port 4000

**Solution:**
```powershell
# Arrêtez tous les processus Node
Stop-Process -Name node -Force

# Redémarrez
npm run upload-server
```

### Erreur: "CORS error"
**Cause:** Configuration CORS incorrecte

**Solution:**
1. Vérifiez `.env`: `UPLOAD_CORS_ORIGIN=*`
2. Redémarrez le serveur d'upload

---

## 🚀 Prochaines Étapes

Une fois tout fonctionnelle:
1. ✅ Allez sur la page des **Clients**
2. ✅ Cliquez sur un **Client**
3. ✅ Dans la section **"Gestion des Documents"**
4. ✅ Essayez d'upload un fichier (PDF, Image, etc.)
5. ✅ Vous devriez voir le fichier dans la liste

---

**Status:** ✅ OPÉRATIONNEL
**Dernière mise à jour:** 2 Décembre 2025
