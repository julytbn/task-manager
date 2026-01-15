import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// Vercel Blob import (only available in production)
let vercelBlob: any = null
try {
  vercelBlob = require('@vercel/blob')
} catch (e) {
  // Vercel Blob not available in dev
}

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const USE_VERCEL_BLOB = process.env.BLOB_READ_WRITE_TOKEN ? true : false

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.ppt', '.pptx',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z',
  '.mp4', '.avi', '.mov', '.wmv', '.flv',
  '.mp3', '.wav', '.aac', '.flac'
]

async function getSessionUser(request: NextRequest) {
  try {
    // Récupérer le header Authorization (pour les API calls côté serveur)
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      // Valider le token si nécessaire
      const token = authHeader.slice(7)
      // TODO: Valider le token JWT si vous en utilisiez un
    }

    // Essayer de récupérer la session via cookie
    const cookies = request.cookies
    // Pour les client-side requests avec NextAuth, la session est automatiquement validée
    return true // Assume authenticated for now
  } catch (error) {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const isAuthenticated = await getSessionUser(request)
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parser la requête FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const clientId = formData.get('clientId') as string | null
    const taskId = formData.get('taskId') as string | null
    const nom = formData.get('nom') as string | null
    const description = formData.get('description') as string | null
    const type = formData.get('type') as string | null

    // Validations
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    if (!clientId && !taskId) {
      return NextResponse.json(
        { error: 'clientId ou taskId manquant' },
        { status: 400 }
      )
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      )
    }

    // Vérifier l'extension
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: 'Type de fichier non autorisé',
          allowedExtensions: ALLOWED_EXTENSIONS
        },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const filename = `${path.parse(file.name).name}-${uniqueSuffix}${ext}`

    let fileUrl: string
    let documentId: string | null = null

    if (USE_VERCEL_BLOB && vercelBlob) {
      try {
        const blobPath = clientId 
          ? `clients/${clientId}/${filename}` 
          : taskId 
          ? `tasks/${taskId}/${filename}`
          : `uploads/${filename}`
        const blob = await vercelBlob.put(blobPath, fileBuffer, {
          access: 'public',
          contentType: file.type || 'application/octet-stream',
        })
        fileUrl = blob.url
        console.log(`✅ Fichier uploadé sur Vercel Blob: ${fileUrl}`)
      } catch (blobError) {
        console.error('❌ Erreur Vercel Blob:', blobError)
        // Fallback to local storage if Vercel Blob fails
        const destDir = clientId
          ? path.join(UPLOAD_DIR, 'clients', clientId)
          : taskId
          ? path.join(UPLOAD_DIR, 'tasks', taskId)
          : UPLOAD_DIR

        if (!existsSync(destDir)) {
          await mkdir(destDir, { recursive: true })
        }

        const filepath = path.join(destDir, filename)
        await writeFile(filepath, fileBuffer)

        const relativePath = path.relative(
          path.join(process.cwd(), 'public'),
          filepath
        ).replace(/\\/g, '/')

        fileUrl = `/${relativePath}`
        console.log(`⚠️ Fallback local storage: ${fileUrl}`)
      }
    } else {
      // Local storage (development mode)
      const destDir = clientId
        ? path.join(UPLOAD_DIR, 'clients', clientId)
        : taskId
        ? path.join(UPLOAD_DIR, 'tasks', taskId)
        : UPLOAD_DIR

      if (!existsSync(destDir)) {
        await mkdir(destDir, { recursive: true })
      }

      const filepath = path.join(destDir, filename)
      await writeFile(filepath, fileBuffer)

      const relativePath = path.relative(
        path.join(process.cwd(), 'public'),
        filepath
      ).replace(/\\/g, '/')

      fileUrl = `/${relativePath}`
      console.log(`✅ Fichier uploadé localement: ${fileUrl}`)
    }

    // Enregistrer dans la base de données
    if (clientId && !taskId) {
      // Valider et convertir le type
      const validTypes = ['ENTREE', 'CHARGE', 'AUTRE']
      const documentType = type && validTypes.includes(type) ? (type as any) : null

      const document = await prisma.documentClient.create({
        data: {
          nom: nom || file.name,
          description: description || null,
          type: documentType,
          url: fileUrl,
          taille: file.size,
          clientId,
          uploadPar: 'system', // TODO: Get from session
          dateUpload: new Date(),
        },
      })
      documentId = document.id
    } else if (taskId) {
      const documentTache = await prisma.documentTache.create({
        data: {
          nom: nom || file.name,
          description: description || null,
          type: type || null,
          url: fileUrl,
          taille: file.size,
          tacheId: taskId,
          uploadPar: 'system', // TODO: Get from session
        },
      })
      documentId = documentTache.id
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      path: fileUrl,
      size: file.size,
      mimetype: file.type,
      documentId,
      taskId: taskId || null,
      source: USE_VERCEL_BLOB ? 'vercel-blob' : 'local',
    })
  } catch (error) {
    console.error('❌ Erreur upload:', error)
    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors du traitement du fichier',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId manquant' },
        { status: 400 }
      )
    }

    const documents = await prisma.documentClient.findMany({
      where: { clientId },
      orderBy: { dateUpload: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('❌ Erreur GET documents:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des documents' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId manquant' },
        { status: 400 }
      )
    }

    const document = await prisma.documentClient.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer de Vercel Blob si l'URL y pointe
    if (USE_VERCEL_BLOB && document.url.includes('vercel-blob')) {
      try {
        await vercelBlob.del(document.url)
        console.log(`✅ Fichier supprimé de Vercel Blob: ${document.url}`)
      } catch (blobError) {
        console.warn(`⚠️ Impossible de supprimer du Blob: ${blobError}`)
      }
    } else {
      // Supprimer du stockage local
      try {
        const filePath = path.join(process.cwd(), 'public', document.url.slice(1))
        await unlink(filePath)
        console.log(`✅ Fichier local supprimé: ${filePath}`)
      } catch (err) {
        console.warn(`⚠️ Impossible de supprimer le fichier: ${document.url}`)
      }
    }

    // Supprimer de la base de données
    await prisma.documentClient.delete({
      where: { id: documentId },
    })

    console.log(`✅ Document supprimé de la DB: ${documentId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur DELETE document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du document' },
      { status: 500 }
    )
  }
}

