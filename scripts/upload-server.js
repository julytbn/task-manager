#!/usr/bin/env node

/**
 * Upload Server - Express.js
 * Gère les uploads de fichiers pour l'application Task Manager
 * Port: 4000 (configurable via UPLOAD_SERVER_PORT)
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const busboy = require('busboy');

// Configuration
const PORT = process.env.UPLOAD_SERVER_PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024; // 10MB
// Configuration CORS plus sécurisée
const CORS_ORIGIN = process.env.NODE_ENV === 'production' 
  ? process.env.UPLOAD_CORS_ORIGIN || 'https://votredomaine.com'
  : process.env.UPLOAD_CORS_ORIGIN || 'http://localhost:3000';

// Fichiers autorisés
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.ppt', '.pptx',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z',
  '.mp4', '.avi', '.mov', '.wmv', '.flv',
  '.mp3', '.wav', '.aac', '.flac'
];

// Initialiser Express
const app = express();

// Middleware
// Configuration CORS sécurisée
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || CORS_ORIGIN.split(',').includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Gestion des erreurs CORS
app.use((err, req, res, next) => {
  if (err) {
    console.error('CORS Error:', err);
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  next();
});
app.use(express.json());
app.use(express.static(UPLOAD_DIR));

// Routes

/**
 * GET /health
 * Endpoint de vérification du serveur
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

/**
 * POST /upload
 * Upload un fichier avec support FormData
 * FormData fields: file, clientId, taskId (optionnel)
 */
app.post('/upload', (req, res) => {
  console.log(`📨 POST /upload received`);
  const bb = busboy({ headers: req.headers });
  
  let fields = {};
  let fileBuffer = null;
  let origFilename = null;
  let mimetype = null;

  bb.on('field', (fieldname, val) => {
    console.log(`   Field: ${fieldname} = ${val}`);
    fields[fieldname] = val;
  });

  bb.on('file', (fieldname, file, info) => {
    console.log(`   File field: ${fieldname}, filename: ${info.filename}`);
    origFilename = info.filename;
    mimetype = info.mimetype;
    
    // Buffer the file instead of writing immediately
    const chunks = [];
    file.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
      console.log(`   File buffered: ${fileBuffer.length} bytes`);
    });
    
    file.on('error', (err) => {
      console.error(`   ❌ File stream error:`, err);
    });
  });

    bb.on('close', () => {
    try {
      console.log(`   Busboy close event - fileBuffer: ${fileBuffer ? 'yes' : 'no'}`);
      if (!fileBuffer || !origFilename) {
        return res.status(400).json({ error: 'Aucun fichier fourni ou fichier vide' });
      }

      // Vérification de la taille du fichier
      if (fileBuffer.length > MAX_FILE_SIZE) {
        return res.status(413).json({ 
          error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
        });
      }

      // Vérification de l'extension du fichier
      const ext = path.extname(origFilename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({ 
          error: 'Type de fichier non autorisé',
          allowedExtensions: ALLOWED_EXTENSIONS
        });
      }

      // Création du répertoire de destination s'il n'existe pas
      const destDir = fields.taskId 
        ? path.join(UPLOAD_DIR, fields.taskId)
        : UPLOAD_DIR;
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const filename = `${path.parse(origFilename).name}-${uniqueSuffix}${ext}`;
      const filepath = path.join(destDir, filename);

      // Écrire le fichier
      fs.writeFile(filepath, fileBuffer, (err) => {
        if (err) {
          console.error('Erreur lors de l\'écriture du fichier:', err);
          return res.status(500).json({ error: 'Erreur lors de l\'enregistrement du fichier' });
        }

        console.log(`Fichier enregistré: ${filepath}`);
        
        // Retourner la réponse avec l'URL du fichier
        const relativePath = path.relative(
          path.join(process.cwd(), 'public'), 
          filepath
        ).replace(/\\/g, '/');
        
        res.status(200).json({
          success: true,
          filename: origFilename,
          path: `/${relativePath}`,
          size: fileBuffer.length,
          mimetype,
          taskId: fields.taskId || null
        });
      });
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      res.status(500).json({ 
        error: 'Une erreur est survenue lors du traitement du fichier',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    if (!fileBuffer || !origFilename) {
      console.log(`   ❌ No file data`);
      return res.status(400).json({ 
        error: 'Aucun fichier fourni',
        details: 'Veuillez fournir un fichier'
      });
    }

    try {
      // Now determine upload directory with all fields available
      const clientId = fields.clientId || req.query.clientId;
      const taskId = fields.taskId || req.query.taskId;
      
      let uploadPath;
      if (clientId) {
        uploadPath = path.join(UPLOAD_DIR, 'clients', clientId);
      } else if (taskId) {
        uploadPath = path.join(UPLOAD_DIR, taskId);
      } else {
        uploadPath = path.join(UPLOAD_DIR, 'general');
      }
      
      // Generate unique filename
      const ext = path.extname(origFilename);
      const nameWithoutExt = path.basename(origFilename, ext);
      const hash = crypto.randomBytes(8).toString('hex');
      const filename = `${nameWithoutExt}-${hash}${ext}`;
      
      // Create directory if it doesn't exist
      fs.mkdirSync(uploadPath, { recursive: true });
      
      const uploadedFilePath = path.join(uploadPath, filename);
      console.log(`   Writing to: ${uploadedFilePath}`);
      
      // Write file to disk
      fs.writeFileSync(uploadedFilePath, fileBuffer);
      const stat = fs.statSync(uploadedFilePath);
      
      const subdir = clientId ? `clients/${clientId}` : (taskId || 'general');
      
      console.log(`📤 File uploaded successfully: ${filename} to ${subdir}`);

      res.json({
        success: true,
        message: 'Fichier uploadé avec succès',
        file: {
          id: filename,
          originalName: origFilename,
          filename: filename,
          size: stat.size,
          mimetype: mimetype,
          url: `${req.protocol}://${req.get('host')}/${subdir}/${filename}`,
          uploadDate: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error(`❌ Error processing upload:`, err);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement du fichier', details: err.message });
    }
  });

  bb.on('error', (err) => {
    console.error('❌ Busboy error:', err);
    res.status(400).json({ error: 'Erreur lors du traitement du fichier', details: err.message });
  });

  req.pipe(bb);
});

/**
 * POST /upload/multiple
 * Upload plusieurs fichiers
 * Query params: taskId (optionnel)
 */
/**
 * POST /upload/multiple
 * Upload plusieurs fichiers avec support FormData
 * FormData fields: files (array), clientId, taskId (optionnel)
 */
app.post('/upload/multiple', (req, res) => {
  const bb = busboy({ headers: req.headers });
  
  let fields = {};
  const uploadedFiles = [];
  let activeStreams = 0;
  let allDone = false;

  bb.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  bb.on('file', (fieldname, file, info) => {
    const { filename: origFilename, mimetype } = info;
    
    activeStreams++;
    
    // Determine upload directory based on clientId or taskId
    const clientId = fields.clientId || req.query.clientId;
    const taskId = fields.taskId || req.query.taskId;
    
    let uploadPath;
    if (clientId) {
      uploadPath = path.join(UPLOAD_DIR, 'clients', clientId);
    } else if (taskId) {
      uploadPath = path.join(UPLOAD_DIR, taskId);
    } else {
      uploadPath = path.join(UPLOAD_DIR, 'general');
    }
    
    // Generate unique filename
    const ext = path.extname(origFilename);
    const nameWithoutExt = path.basename(origFilename, ext);
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${nameWithoutExt}-${hash}${ext}`;
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    
    const uploadedFilePath = path.join(uploadPath, filename);
    
    // Pipe file to disk
    const writeStream = fs.createWriteStream(uploadedFilePath);
    
    file.pipe(writeStream);
    
    writeStream.on('error', (err) => {
      console.error('Write stream error:', err);
      activeStreams--;
      if (allDone && activeStreams === 0) {
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement du fichier', details: err.message });
      }
    });
    
    writeStream.on('finish', () => {
      // Get file stats
      const stat = fs.statSync(uploadedFilePath);
      const subdir = clientId ? `clients/${clientId}` : (taskId || 'general');
      
      uploadedFiles.push({
        id: filename,
        originalName: origFilename,
        filename,
        size: stat.size,
        mimetype,
        url: `${req.protocol}://${req.get('host')}/${subdir}/${filename}`,
        uploadDate: new Date().toISOString()
      });
      
      activeStreams--;
      
      if (allDone && activeStreams === 0) {
        res.json({
          success: true,
          message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
          files: uploadedFiles
        });
      }
    });
  });

  bb.on('close', () => {
    allDone = true;
    if (activeStreams === 0) {
      if (uploadedFiles.length === 0) {
        return res.status(400).json({ 
          error: 'Aucun fichier fourni',
          details: 'Veuillez fournir au moins un fichier'
        });
      }
      res.json({
        success: true,
        message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
        files: uploadedFiles
      });
    }
  });

  bb.on('error', (err) => {
    console.error('Busboy error:', err);
    res.status(400).json({ error: 'Erreur lors du traitement des fichiers', details: err.message });
  });

  req.pipe(bb);
});

/**
 * DELETE /delete/:filename
 * Supprime un fichier
 */
app.delete('/delete/:filename', (req, res) => {
  const { filename } = req.params;
  const taskId = req.query.taskId || 'general';
  const filepath = path.join(UPLOAD_DIR, taskId, filename);

  // Vérifier le chemin pour éviter les attaques de traversée de répertoire
  if (!filepath.startsWith(UPLOAD_DIR)) {
    return res.status(403).json({ 
      error: 'Accès refusé',
      details: 'Chemin de fichier invalide'
    });
  }

  fs.unlink(filepath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ 
          error: 'Fichier non trouvé',
          details: `Le fichier ${filename} n'existe pas`
        });
      }
      return res.status(500).json({ 
        error: 'Erreur lors de la suppression',
        details: err.message
      });
    }

    res.json({
      success: true,
      message: 'Fichier supprimé avec succès',
      filename
    });
  });
});

/**
 * GET /files/:taskId
 * Liste les fichiers d'une tâche
 */
app.get('/files/:taskId', (req, res) => {
  const { taskId } = req.params;
  const dirPath = path.join(UPLOAD_DIR, taskId);

  fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.json({ success: true, files: [] });
      }
      return res.status(500).json({ 
        error: 'Erreur lors de la lecture du répertoire',
        details: err.message
      });
    }

    const fileList = files
      .filter(f => f.isFile())
      .map(f => {
        const filepath = path.join(dirPath, f.name);
        const stat = fs.statSync(filepath);
        return {
          id: f.name,
          name: f.name,
          size: stat.size,
          url: `${req.protocol}://${req.get('host')}/${taskId}/${f.name}`,
          uploadDate: stat.mtime.toISOString()
        };
      });

    res.json({
      success: true,
      taskId,
      files: fileList
    });
  });
});

/**
 * GET /clients/:clientId/documents
 * Liste les documents d'un client
 */
app.get('/clients/:clientId/documents', (req, res) => {
  const { clientId } = req.params;
  console.log(`📥 Fetching documents for client: ${clientId}`);
  const dirPath = path.join(UPLOAD_DIR, 'clients', clientId);

  fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.json([]);
      }
      return res.status(500).json({ 
        error: 'Erreur lors de la lecture du répertoire',
        details: err.message
      });
    }

    const documents = files
      .filter(f => f.isFile())
      .map(f => {
        const filepath = path.join(dirPath, f.name);
        const stat = fs.statSync(filepath);
        // Parse filename format: originalName-hash.ext
        const ext = path.extname(f.name);
        const nameWithoutExt = path.basename(f.name, ext);
        const parts = nameWithoutExt.lastIndexOf('-');
        const originalName = parts > 0 ? nameWithoutExt.substring(0, parts) : nameWithoutExt;
        
        return {
          id: f.name,
          nom: originalName + ext,
          type: ext.substring(1).toLowerCase(),
          url: `${req.protocol}://${req.get('host')}/clients/${clientId}/${f.name}`,
          taille: stat.size,
          dateUpload: stat.mtime.toISOString(),
          uploadPar: null
        };
      });

    res.json(documents);
  });
});

// Gestion des erreurs

// Erreur générique
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  
  res.status(500).json({
    error: 'Erreur serveur',
    details: err.message,
    timestamp: new Date().toISOString()
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Créer le répertoire de base s'il n'existe pas
console.log('Creating upload directory...');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
console.log('Upload directory created.');

// Démarrer le serveur
console.log('Starting server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ Upload Server');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Upload Dir: ${UPLOAD_DIR}`);
  console.log(`   Max File Size: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`);
  console.log(`   CORS Origin: ${CORS_ORIGIN}`);
  console.log('\n📋 Routes disponibles:');
  console.log('   POST /upload - Upload un fichier');
  console.log('   POST /upload/multiple - Upload plusieurs fichiers');
  console.log('   GET /health - Vérification du serveur');
  console.log('   GET /files/:taskId - Lister les fichiers');
  console.log('   GET /clients/:clientId/documents - Lister les documents du client');
  console.log('   DELETE /delete/:filename - Supprimer un fichier\n');
  console.log('✅ Server is ready and listening for requests.\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('❌ Exception non capturée:', err);
  console.error('Stack:', err.stack);
  // Don't exit, just log
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejection non gérée:', reason);
  // Don't exit, just log
});
