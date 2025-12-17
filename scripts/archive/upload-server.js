const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Busboy = require('busboy')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.UPLOAD_SERVER_PORT || 4000

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_BYTES || String(10 * 1024 * 1024), 10) // default 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip']
const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY || ''
const CORS_ORIGIN = process.env.UPLOAD_CORS_ORIGIN || '*'

// Helper function to check allowed file extension
function isAllowedFile(filename) {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext)
}

// CORS middleware FIRST (before any body parsers)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key')
  res.header('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Error handling for connection issues
app.use((req, res, next) => {
  req.on('error', (err) => {
    console.error('Request error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Connection error' })
    }
  })
  res.on('error', (err) => {
    console.error('Response error:', err)
  })
  next()
})

// Only parse JSON for non-multipart requests to avoid body-parser
// interfering with Busboy multipart handling (prevents "entity too large" errors)
app.use((req, res, next) => {
  try {
    if (req.is && req.is('multipart/form-data')) return next()
  } catch (e) {
    // ignore
  }
  return express.json()(req, res, next)
})

// Simple API key auth middleware (enforced only if UPLOAD_API_KEY is set)
app.use((req, res, next) => {
  if (!UPLOAD_API_KEY) return next()
  const key = req.headers['x-api-key'] || (req.headers.authorization && String(req.headers.authorization).replace(/Bearer\s+/i, ''))
  if (!key || String(key) !== UPLOAD_API_KEY) return res.status(401).json({ error: 'Unauthorized' })
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Custom multipart parser middleware using busboy
function parseMultipart(req, res, next) {
  if (req.method !== 'POST' || !req.is('multipart/form-data')) return next()
  
  const bb = Busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE } })
  req.fields = {}
  req.file = null
  let pendingWrites = 0
  let closed = false

  bb.on('field', (fieldname, val) => {
    console.log(`Field: ${fieldname} = ${val}`)
    if (!req.fields[fieldname]) req.fields[fieldname] = []
    req.fields[fieldname].push(val)
  })

  // Busboy 'file' signature: (fieldname, file, filename, encoding, mimetype)
  bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
    // Some clients or busboy versions may pass a file info object instead of a string
    let fname = ''
    let ftype = mimetype
    if (typeof filename === 'string') {
      fname = filename
    } else if (filename && typeof filename === 'object') {
      fname = filename.filename || filename.name || filename.fileName || ''
      ftype = ftype || filename.mimetype || filename.type
    }

    console.log(`File: ${fieldname}, filename=${fname || '[object Object]'}, mimetype="${ftype}"`)
    if (!isAllowedFile(fname)) {
      console.log(`✗ File extension not allowed for "${fname}"`)
      file.resume()
      return bb.emit('error', new Error('INVALID_FILE_EXTENSION'))
    }

    // Write incoming file to a temporary uploads folder immediately
    pendingWrites++
    try {
      const tmpDir = path.join(process.cwd(), 'public', 'uploads', 'tmp')
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      const timestamp = Date.now()
      const safeName = `${timestamp}_${fname.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const tmpPath = path.join(tmpDir, safeName)
      const writeStream = fs.createWriteStream(tmpPath)
      file.pipe(writeStream)

      writeStream.on('finish', () => {
        try {
          const stats = fs.statSync(tmpPath)
          const taille = stats.size
          req.file = { fieldname, filename: fname, mimetype: ftype, tmpPath, taille }
        } catch (e) {
          console.error('Error stat tmp file', e)
        }
        pendingWrites--
        if (closed && pendingWrites === 0) next()
      })

      writeStream.on('error', (err) => {
        pendingWrites--
        console.error('Write stream error:', err)
        bb.emit('error', err)
      })
      file.on('error', (err) => {
        pendingWrites--
        console.error('File stream error:', err)
        bb.emit('error', err)
      })
    } catch (err) {
      pendingWrites--
      console.error('Error handling file stream:', err)
      bb.emit('error', err)
    }
  })

  bb.on('close', () => {
    // Wait for any pending writes to finish before calling next()
    closed = true
    if (pendingWrites === 0) return next()
    // otherwise next() will be called from writeStream 'finish'
  })
  bb.on('error', (err) => {
    console.error('Busboy error:', err)
    res.status(400).json({ error: err.message })
  })

  req.pipe(bb)
}

app.post('/upload', parseMultipart, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    if (!req.fields?.clientId?.length) return res.status(400).json({ error: 'clientId is required' })

    const clientId = req.fields.clientId[0]
    const description = req.fields.description?.[0] || null
    const type = req.fields.type?.[0] || null
    const uploadPar = req.fields.uploadPar?.[0] || null

    // Move temp file written by parseMultipart to final destination
    const dir = path.join(process.cwd(), 'public', 'uploads', 'clients', String(clientId))
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const timestamp = Date.now()
    const safeName = `${timestamp}_${req.file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const filePath = path.join(dir, safeName)

    if (!req.file || !req.file.tmpPath) {
      return res.status(500).json({ error: 'File not available on server' })
    }

    // Move the temporary file to final destination
    try {
      fs.renameSync(req.file.tmpPath, filePath)
    } catch (err) {
      // fallback to copy stream
      await new Promise((resolve, reject) => {
        const read = fs.createReadStream(req.file.tmpPath)
        const write = fs.createWriteStream(filePath)
        read.pipe(write)
        write.on('finish', resolve)
        write.on('error', reject)
        read.on('error', reject)
      })
      try { fs.unlinkSync(req.file.tmpPath) } catch (e) {}
    }

    // Read written file size
    const stats = fs.statSync(filePath)
    const bufferLength = stats.size

    const url = `/uploads/clients/${clientId}/${safeName}`
    const taille = Math.round((bufferLength / 1024 / 1024) * 100) / 100

    // Validate that clientId exists
    const existingClient = await prisma.client.findUnique({ where: { id: String(clientId) } }).catch(() => null)
    if (!existingClient) {
      // Clean up the uploaded file
      try { fs.unlinkSync(filePath) } catch (e) {}
      return res.status(400).json({ error: `Invalid clientId: "${clientId}" does not exist` })
    }

    // Save to database
    const doc = await prisma.documentClient.create({
      data: {
        nom: req.file.filename,
        description,
        type,
        url,
        clientId: String(clientId),
        taille,
        uploadPar,
      },
    })

    res.json({ message: 'Fichier uploadé avec succès', path: url, doc })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Server error', details: err instanceof Error ? err.message : 'Unknown error' })
  }
})

app.get('/clients/:clientId/documents', async (req, res) => {
  try {
    const clientId = String(req.params.clientId)
    const docs = await prisma.documentClient.findMany({ where: { clientId }, orderBy: { dateUpload: 'desc' } })
    res.json(docs)
  } catch (err) {
    console.error('Fetch docs error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Multer / general error handler
app.use((err, req, res, next) => {
  if (err) {
    console.error('Server error handler', err)
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' })
    if (String(err.message) === 'INVALID_MIME_TYPE' || String(err.message) === 'INVALID_FILE_EXTENSION') return res.status(415).json({ error: 'Invalid file type' })
    return res.status(500).json({ error: 'Server error' })
  }
  next()
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start server with better error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Upload server listening on http://localhost:${PORT}`)
  console.log(`📁 Max file size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  console.log(`🔐 CORS origin: ${CORS_ORIGIN}`)
  console.log(`🔑 API Key required: ${UPLOAD_API_KEY ? 'Yes' : 'No'}`)
})

server.on('error', (err) => {
  console.error('❌ Server error:', err)
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`)
    process.exit(1)
  }
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...')
  server.close(async () => {
    await prisma.$disconnect()
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...')
  server.close(async () => {
    await prisma.$disconnect()
    console.log('Server closed')
    process.exit(0)
  })
})
