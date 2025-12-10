import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClientIp, checkRateLimit } from '@/lib/security'

export async function GET(request: Request, { params }: { params: { type: string; id: string; file: string } }) {
  try {
    const { type, id, file } = params

    // ✅ Vérifier l'authentification AVANT tout
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // ✅ Rate limiting pour éviter les abus
    const clientIp = getClientIp(request as any);
    if (!checkRateLimit(clientIp, 30)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    // ✅ Only allow known types for safety
    const allowedTypes = ['tasks', 'clients', 'projects']
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 })
    }

    // ✅ Validation de l'ID (doit être un UUID/CUID valide)
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'storage', 'uploads', type, id, file)

    // ✅ Vérifier que le chemin ne contient pas ".." pour éviter la traversée de répertoires
    const normalizedPath = path.normalize(filePath);
    const basePath = path.normalize(path.join(process.cwd(), 'storage', 'uploads'));
    if (!normalizedPath.startsWith(basePath)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier que le fichier existe
    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
    } catch (e) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
    }

    // ✅ Vérifier les permissions d'accès basées sur le type et le rôle
    const userRole = (session?.user as Record<string, any>)?.role as string | undefined
    const userId = session.user.id as string

    // Admins et managers peuvent accéder à tout
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      // allowed
    } else {
      // Pour les tâches, vérifier que l'utilisateur a accès
      if (type === 'tasks') {
        const docUrl = `/api/uploads/tasks/${id}/${file}`
        const doc = await prisma.documentTache.findFirst({ 
          where: { url: docUrl }, 
          select: { uploadPar: true, tache: { select: { assigneAId: true } } } 
        })
        if (!doc) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
        const uploadPar = doc.uploadPar as string | null
        const assigneeId = doc.tache?.assigneAId as string | null
        if (uploadPar !== userId && assigneeId !== userId) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
      } else if (type === 'clients') {
        // Pour les clients
        const docUrl = `/api/uploads/clients/${id}/${file}`
        const doc = await prisma.documentClient.findFirst({ 
          where: { url: docUrl }, 
          select: { uploadPar: true, clientId: true } 
        })
        if (!doc) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
        const uploadPar = doc.uploadPar as string | null
        const clientId = doc.clientId as string | null
        if (uploadPar !== userId && clientId !== userId) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
      } else {
        // Pour les projets, managers/admins uniquement
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
    }

    // ✅ Servir le fichier
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
