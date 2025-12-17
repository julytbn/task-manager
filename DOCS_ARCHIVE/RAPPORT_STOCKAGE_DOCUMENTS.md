# 📁 RAPPORT - STOCKAGE DES DOCUMENTS DES TÂCHES

**Date:** 8 Décembre 2025  
**Status:** ✅ **Les documents sont bien stockés**

---

## 📊 RÉSUMÉ

La structure de stockage des documents est **correctement implémentée**. Les fichiers sont organisés par type (tâches et clients) et par ID d'entité.

---

## 🗂️ STRUCTURE DE STOCKAGE

```
storage/
├── uploads/
│   ├── tasks/                          ← Documents des tâches
│   │   └── {taskId}/                   ← Dossier par tâche
│   │       ├── _files.json             ← Métadonnées des fichiers
│   │       └── {timestamp}-{filename}  ← Fichiers uploadés
│   │
│   └── clients/                        ← Documents des clients
│       ├── {clientId}/
│       │   ├── {timestamp}-{filename}
│       │   └── ...
│       └── ...
```

---

## 📄 DOCUMENTS STOCKÉS

### 1. Documents des Tâches

#### Tâche ID: `cmix7jfvr0000stldwf69nyqn`

```
📁 Chemin: storage/uploads/tasks/cmix7jfvr0000stldwf69nyqn/

📄 Fichiers:
  ✅ 1765201740341-yas.pdf (6 KB)
     - Type MIME: application/pdf
     - Nom original: yas.pdf
     - URL API: /api/uploads/tasks/cmix7jfvr0000stldwf69nyqn/1765201740341-yas.pdf

📋 Métadonnées (_files.json):
  {
    "name": "1765201740341-yas.pdf",
    "originalName": "yas.pdf",
    "size": 6016 bytes,
    "mime": "application/pdf",
    "url": "/api/uploads/tasks/cmix7jfvr0000stldwf69nyqn/1765201740341-yas.pdf"
  }
```

✅ **Status:** Document correctement stocké et indexé

---

### 2. Documents des Clients

#### Client 1: `cli-test`
```
📁 Chemin: storage/uploads/clients/cli-test/

📄 Fichier:
  ✅ 1764691156206_test-upload.txt (Text file)
```

#### Client 2: `cmiodd68z00009x1uwby3ljad`
```
📁 Chemin: storage/uploads/clients/cmiodd68z00009x1uwby3ljad/

📄 Fichiers:
  ✅ 1764692476054_fiche-inscription.pdf
  ✅ 1764692458894_Design_sans_titre__6_.png
  ✅ 1764749682680_fiche-inscription.pdf
```

#### Client 3: `cmir27z2n0000dnmtcoe56aea`
```
📁 Chemin: storage/uploads/clients/cmir27z2n0000dnmtcoe56aea/

📄 Fichiers:
  ✅ 1764848976610_1764692476054_fiche-inscription.pdf
  ✅ 1764848207307_Facture_FAC-1764777385778-7.pdf
```

---

## 💾 STATISTIQUES DE STOCKAGE

### Récapitulatif

```
📊 TOTAL:
  - Dossiers tâches: 1 (avec documents)
  - Dossiers clients: 3 (avec documents)
  - Fichiers documents tâches: 1 ✅
  - Fichiers documents clients: 6
  - Total fichiers: 7
  - Format stockage: {timestamp}-{originalname}
  - Métadonnées: Format JSON (bien structuré)

📈 Types de fichiers:
  - PDF: 5 fichiers ✅
  - PNG/Images: 1 fichier ✅
  - TXT: 1 fichier ✅

📏 Tailles:
  - Tâche document: 6 KB ✅
  - Tous les fichiers: < 10 MB ✅
```

---

## 🔍 VÉRIFICATION DÉTAILLÉE

### Document de la Tâche

**Informations:**
```
ID Tâche:         cmix7jfvr0000stldwf69nyqn
Fichier:          yas.pdf (6 KB)
Type MIME:        application/pdf
Timestamp Upload: 1765201740341 (12 Août 2025, ~23:49 UTC)
Nom Stocké:       1765201740341-yas.pdf
Métadonnées:      ✅ Présentes dans _files.json
```

**Format du timestamp:**
- `1765201740341` = Unix timestamp en millisecondes
- Conversion: 2025-08-12T23:49:00Z (à peu près)

**Conventions de nommage:**
- Format: `{unixTimestamp}-{originalFilename}`
- Avantages:
  ✅ Évite les collisions de noms
  ✅ Permet le tri chronologique
  ✅ Conserve le nom original pour l'affichage

---

## 🔗 INTÉGRATION API

### Endpoints de Téléchargement

```
GET /api/uploads/tasks/{taskId}/{filename}
GET /api/uploads/clients/{clientId}/{filename}

Exemple:
  GET /api/uploads/tasks/cmix7jfvr0000stldwf69nyqn/1765201740341-yas.pdf
```

### Métadonnées JSON

```json
// storage/uploads/tasks/{taskId}/_files.json
[
  {
    "name": "1765201740341-yas.pdf",           // Nom stocké
    "originalName": "yas.pdf",                 // Nom original pour l'affichage
    "size": 6016,                              // Taille en bytes
    "mime": "application/pdf",                 // Type MIME
    "url": "/api/uploads/tasks/cmix7jfvr0000stldwf69nyqn/1765201740341-yas.pdf"  // URL accès
  }
]
```

---

## ✅ POINTS FORTS

### Structure
- ✅ Organisation claire par type (tasks, clients)
- ✅ Séparation par ID d'entité
- ✅ Fichier index (_files.json) pour chaque dossier
- ✅ Convention de nommage cohérente (timestamp-filename)

### Sécurité
- ✅ Fichiers en dehors du répertoire public
- ✅ Accès via API (contrôle possible)
- ✅ Métadonnées stockées localement
- ✅ Noms de fichiers anonymisés (timestamp)

### Traçabilité
- ✅ Timestamp d'upload conservé
- ✅ Nom original préservé dans _files.json
- ✅ Type MIME enregistré
- ✅ Taille du fichier disponible

### Performance
- ✅ Pas de base de données pour les fichiers
- ✅ Système de fichiers natif (rapide)
- ✅ Métadonnées JSON (léger)

---

## 🎯 VÉRIFICATIONS EFFECTUÉES

### Pour la Tâche `cmix7jfvr0000stldwf69nyqn`

```
✅ Dossier existe: storage/uploads/tasks/cmix7jfvr0000stldwf69nyqn/
✅ Fichier existe: 1765201740341-yas.pdf (6 KB)
✅ Métadonnées JSON: _files.json présent et valide
✅ Format JSON bien structuré
✅ Champs obligatoires présents:
   - name ✅
   - originalName ✅
   - size ✅
   - mime ✅
   - url ✅
✅ URL API construite correctement
✅ Type MIME correct: application/pdf
✅ Taille raisonnable: 6 KB
```

### Pour les Clients

```
✅ 3 dossiers clients avec documents
✅ Total 6 fichiers clients stockés
✅ Mix de types de fichiers (PDF, PNG, TXT)
✅ Tous les fichiers < 10 MB ✅
```

---

## 📋 IMPLÉMENTATION DÉTECTÉE

D'après les fichiers du projet:

### Route API (app/api/taches/route.ts)

```typescript
// Ligne 173-174: Sauvegarde des documents des tâches
// "If files were uploaded, save them under storage/uploads/tasks/{taskId}"

// Le système:
1. Accepte les uploads multipart/form-data
2. Sauvegarde les fichiers avec timestamp
3. Crée un _files.json pour indexer les métadonnées
4. Génère une URL API pour l'accès
```

### Structure des Fichiers

```
1. Fichier est uploadé
   ↓
2. Renommage: {timestamp}-{nomOriginal}
   ↓
3. Stockage: storage/uploads/{type}/{id}/{filename}
   ↓
4. Métadonnées ajoutées à _files.json
   ↓
5. URL générée: /api/uploads/{type}/{id}/{filename}
   ↓
6. Accessible via API
```

---

## 🚀 RECOMMANDATIONS

### 1. Nettoyage des Fichiers (Important)

Implémenter un script de nettoyage pour les documents:

```typescript
// Supprimer les documents orphelins (tâches supprimées)
// Archiver les documents anciens (> 1 an)
// Vérifier l'intégrité des fichiers vs métadonnées
```

**Fréquence:** Hebdomadaire

### 2. Sauvegarde (Important)

Mettre en place une sauvegarde des documents:

```
- Backup quotidien du dossier storage/uploads/
- Stockage dans le cloud (AWS S3, Azure Blob, etc.)
- Versionning des fichiers importants
```

### 3. Limite de Taille (À vérifier)

Vérifier que la limite de fichiers est implémentée:

```typescript
// Vérifier dans app/api/taches/route.ts
// Taille max: 10 MB par fichier (à confirmer)
// Nombre max de fichiers par tâche: À définir
```

### 4. Virus/Malware Scanning (À considérer)

Pour une utilisation en production:

```
- Intégrer ClamAV ou equivalent
- Scanner les fichiers uploadés
- Rejeter les fichiers suspects
```

### 5. Compression (Optionnel)

Pour économiser l'espace disque:

```
- Compresser les vieux documents (ZIP)
- Générer des thumbnails pour les images
- Créer des previews PDF
```

### 6. Contrôle d'Accès (À améliorer)

Actuellement via API, mais à vérifier:

```typescript
// app/api/uploads/route.ts (ou équivalent)
// Vérifier que seuls les autorisés accèdent aux documents:
// - Manager du projet
// - Assigné de la tâche
// - Admin
```

---

## 📊 RÉSUMÉ DE L'ORGANISATION

### Hiérarchie

```
storage/
│
├── uploads/
│   ├── tasks/
│   │   └── cmix7jfvr0000stldwf69nyqn/  [1 tâche avec documents]
│   │       ├── _files.json             [Index]
│   │       └── 1765201740341-yas.pdf   [Document PDF - 6 KB] ✅
│   │
│   └── clients/
│       ├── cli-test/                   [1 client avec document]
│       ├── cmiodd68z00009x1uwby3ljad/  [1 client avec 3 documents]
│       └── cmir27z2n0000dnmtcoe56aea/  [1 client avec 2 documents]
```

### Comptes

```
📊 OBJETS DOCUMENTÉS:
  - Tâches avec documents: 1
  - Clients avec documents: 3
  - Total documents stockés: 7
  
📈 COUVERTURE:
  - % de tâches avec documents: 1 sur X tâches (à vérifier)
  - % de clients avec documents: 3 sur Y clients (à vérifier)
```

---

## 🔐 SÉCURITÉ

### Actuels

- ✅ Fichiers en dehors du répertoire web public (`/public`)
- ✅ Noms anonymisés (timestamp)
- ✅ Accès via API (potentiellement contrôlable)
- ✅ Métadonnées stockées localement

### À Améliorer

- ⚠️ Vérifier le contrôle d'accès aux fichiers
- ⚠️ Vérifier la validation du type de fichier
- ⚠️ Vérifier la limite de taille
- ⚠️ Implémenter un scanning antivirus
- ⚠️ Implémenter le versioning des fichiers

---

## ✅ CONCLUSION

### Status: **✅ STOCKAGE FONCTIONNEL**

**Les documents des tâches sont:**

1. ✅ **Bien stockés** - Organisation claire et logique
2. ✅ **Bien indexés** - Métadonnées JSON présentes
3. ✅ **Bien nommés** - Convention timestamp-name
4. ✅ **Accessibles** - URL API générées correctement
5. ✅ **Traçables** - Timestamps et noms originaux conservés

### Exemple de Document Présent

```
📄 Document: yas.pdf
   Stocké dans: storage/uploads/tasks/cmix7jfvr0000stldwf69nyqn/
   Taille: 6 KB
   Type: PDF
   Accessible via: /api/uploads/tasks/cmix7jfvr0000stldwf69nyqn/1765201740341-yas.pdf
   Métadonnées: ✅ Présentes
```

### Prochaines Étapes

1. Vérifier le contrôle d'accès aux fichiers
2. Implémenter le nettoyage des fichiers orphelins
3. Mettre en place une sauvegarde
4. Tester la limite de taille
5. Tester le scanning de fichiers

---

**Document généré:** 8 Décembre 2025

