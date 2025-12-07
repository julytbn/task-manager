import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { type: string; id: string; file: string } }) {
  try {
    const { type, id, file } = params

    // Only allow known types for safety
    const allowedTypes = ['tasks', 'clients', 'projects']
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'storage', 'uploads', type, id, file)

    // check exists
    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
    } catch (e) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Allow admins and managers
    const userRole = (session?.user as Record<string, any>)?.role as string | undefined
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      // allowed
    } else {
      // For tasks, ensure the user is the uploader or the assignee of the task
      if (type === 'tasks') {
        // try to find document record
        const docUrl = `/api/uploads/tasks/${id}/${file}`
        const doc = await prisma.documentTache.findFirst({ where: { url: docUrl }, select: { uploadPar: true, tache: { select: { assigneAId: true } } } })
        if (!doc) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
        const userId = session.user.id as string
        const uploadPar = doc.uploadPar as string | null
        const assigneeId = doc.tache?.assigneAId as string | null
        if (uploadPar !== userId && assigneeId !== userId) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
      } else if (type === 'clients') {
        // Autoriser managers et client concerné (uploader ou propriétaire)
        const docUrl = `/api/uploads/clients/${id}/${file}`
        const doc = await prisma.documentClient.findFirst({ where: { url: docUrl }, select: { uploadPar: true, clientId: true } })
        if (!doc) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
        const userId = session.user.id as string
        const uploadPar = doc.uploadPar as string | null
        const clientId = doc.clientId as string | null
        // Si user est uploader ou client concerné
        if (uploadPar !== userId && clientId !== userId) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
      } else {
        // Pour projects, managers/admins uniquement
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
    }

    // Stream the file (convert Node.js stream to Web ReadableStream)
    const nodeStream = fs.createReadStream(filePath)
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', chunk => controller.enqueue(chunk))
        nodeStream.on('end', () => controller.close())
        nodeStream.on('error', err => controller.error(err))
      }
    })
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `inline; filename="${file.replace(/\"/g, '')}"`
    }
    return new Response(webStream, { headers })
  } catch (error) {
    console.error('Erreur serving upload:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
