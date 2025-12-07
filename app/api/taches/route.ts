import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const where: any = {}
    // If the user is an employee, return only tasks assigned to them
    if (session?.user?.role === 'EMPLOYE' && session.user.id) {
      where.assigneAId = session.user.id
    }

    const taches = await prisma.tache.findMany({
      where,
      include: {
        projet: { select: { id: true, titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { dateCreation: 'desc' }
    })
    return NextResponse.json(taches)
  } catch (error) {
    console.error('Erreur récupération tâches:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tâches' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {

    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let uploadedFiles: any[] = []

    // handle multipart/form-data (file uploads) or JSON
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      data.titre = form.get('titre')?.toString() || ''
      data.projet = form.get('projet')?.toString() || ''
      data.service = form.get('service')?.toString() || undefined
      data.description = form.get('description')?.toString() || null
      data.priorite = form.get('priorite')?.toString() || undefined
      data.dateEcheance = form.get('dateEcheance')?.toString() || undefined
      data.heuresEstimees = form.get('heuresEstimees')?.toString() || undefined
      data.montant = form.get('montant')?.toString() || undefined
      data.facturable = form.get('facturable')?.toString() === 'true'
      data.statut = form.get('statut')?.toString() || undefined

      // collect files
      const files = form.getAll('files') || []
      uploadedFiles = files as any[]
    } else {
      data = await request.json()
    }

    const session = await getServerSession(authOptions)

    // Basic validation: require title, statut, priorite and projet (assignee is optional)
    if (!data.titre || !data.statut || !data.priorite || !data.projet) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    const createData: any = {
      titre: data.titre,
      description: data.description || null,
      statut: data.statut,
      priorite: data.priorite,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      montant: data.montant !== undefined && data.montant !== null ? parseFloat(String(data.montant)) : null,
      heuresEstimees:
        data.heuresEstimees !== undefined && data.heuresEstimees !== null
          ? parseFloat(String(data.heuresEstimees))
          : null,
      facturable: data.facturable ?? true,
      projet: { connect: { id: data.projet } }
    }

    // If an assignee is provided, validate permissions and membership
    if (data.assigneA) {
      // Determine team (équipe) context: prefer explicit équipe, else derive from projet
      let equipeId: string | null = data.equipe || null
      if (!equipeId) {
        const projet = await prisma.projet.findUnique({ where: { id: data.projet }, select: { equipeId: true } })
        equipeId = projet?.equipeId || null
      }

      // If there's a team, ensure assignee is member of that team
      if (equipeId) {
        const membre = await prisma.membreEquipe.findUnique({
          where: {
            equipeId_utilisateurId: { equipeId, utilisateurId: data.assigneA }
          }
        })
        if (!membre) {
          return NextResponse.json({ error: 'L\'utilisateur n\'est pas membre de l\'équipe' }, { status: 400 })
        }

        // Only allow assignment if requester is admin or the équipe lead
        if (session?.user?.role !== 'ADMIN') {
          const equipe = await prisma.equipe.findUnique({ where: { id: equipeId }, select: { leadId: true } })
          if (!equipe || equipe.leadId !== session?.user?.id) {
            return NextResponse.json({ error: 'Permission refusée : seulement le chef d\'équipe peut assigner' }, { status: 403 })
          }
        }
      } else {
        // No team context: allow admins and managers to assign tasks outside of a team
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MANAGER') {
          return NextResponse.json({ error: 'Permission refusée : assignment hors équipe réservé aux administrateurs' }, { status: 403 })
        }
      }

      createData.assigneA = { connect: { id: data.assigneA } }
    }
    if (data.service) {
      createData.service = { connect: { id: data.service } }
    }

    const nouvelleTache = await prisma.tache.create({
      data: createData,
      include: {
        projet: { select: { titre: true } },
        assigneA: { select: { nom: true, prenom: true } }
      }
    })

    // If files were uploaded, save them under storage/uploads/tasks/{taskId}
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        interface UploadedFile {
          name: string
          type: string
          arrayBuffer(): Promise<ArrayBuffer>
        }
        const base = path.join(process.cwd(), 'storage', 'uploads', 'tasks', nouvelleTache.id)
        await fs.promises.mkdir(base, { recursive: true })
        const saved: Array<{ name: string; originalName: string; size: number; mime: string | null; url: string }> = []
        for (const f of uploadedFiles) {
          // f is a web File-like object
          const file = f as unknown as UploadedFile
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const safeName = `${Date.now()}-${String(file.name).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
          const filePath = path.join(base, safeName)
          await fs.promises.writeFile(filePath, buffer)
          const fileMeta = {
              name: safeName,
              originalName: file.name,
              size: buffer.length,
              mime: file.type || null,
              // Serve files via protected endpoint
              url: `/api/uploads/tasks/${nouvelleTache.id}/${safeName}`
            }
          saved.push(fileMeta)
          // create a DocumentTache record in DB
          try {
            await prisma.documentTache.create({
              data: {
                nom: fileMeta.originalName || fileMeta.name,
                description: null,
                type: fileMeta.mime || undefined,
                url: fileMeta.url,
                tacheId: nouvelleTache.id,
                taille: fileMeta.size,
                uploadPar: session?.user?.id || undefined
              }
            })
          } catch (e) {
            console.error('Erreur création DocumentTache:', e)
          }
        }
        // write metadata
        await fs.promises.writeFile(path.join(base, '_files.json'), JSON.stringify(saved, null, 2))
        // attach files metadata to response
        ;(nouvelleTache as any).files = saved
      } catch (fsErr) {
        console.error('Erreur enregistrement fichiers:', fsErr)
      }
    }

    // Create notifications for managers to inform them of the new submission
    try {
      // Get submitter info if available
      let submitterName = 'Un employé'
      if (session?.user?.id) {
        try {
          const user = await prisma.utilisateur.findUnique({ where: { id: session.user.id }, select: { nom: true, prenom: true } })
          if (user) submitterName = `${user.prenom || ''} ${user.nom || ''}`.trim() || submitterName
        } catch (e) {
          // ignore
        }
      }

      const managers = await prisma.utilisateur.findMany({ where: { role: 'MANAGER' }, select: { id: true } })
      type NotificationData = {
        utilisateurId: string
        titre: string
        message: string
        lien: string
        sourceId: string
        sourceType: string
      }
      const notifications: NotificationData[] = managers.map(m => ({
        utilisateurId: m.id,
        titre: 'Nouvelle tâche soumise',
        message: `${submitterName} a soumis la tâche « ${nouvelleTache.titre} ».`,
        lien: `/taches/${nouvelleTache.id}`,
        sourceId: nouvelleTache.id,
        sourceType: 'TACHE'
      }))

      // create notifications in DB (one by manager)
      for (const n of notifications) {
        try {
          await prisma.notification.create({ data: n })
        } catch (e) {
          console.error('Erreur création notification:', e)
        }
      }
    } catch (notifErr) {
      console.error('Erreur lors de la création des notifications:', notifErr)
    }

    return NextResponse.json(nouvelleTache, { status: 201 })

  } catch (error) {
    console.error('Erreur création tâche:', error)

    const err = error as Error & { code?: string }
    
    if ((err as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Une tâche similaire existe déjà' },
        { status: 400 }
      )
    }
    
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Projet ou employé introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la tâche' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    console.log('[PUT] received id:', data.id, 'type:', typeof data.id)

    const existing = await prisma.tache.findUnique({ where: { id: data.id } })
    if (!existing) {
      console.warn('[PUT] tâche introuvable (lookup) id:', data.id)
      return NextResponse.json({ error: `Tâche introuvable (id: ${data.id})` }, { status: 404 })
    }

    const updateData: any = {}
    if (data.titre !== undefined) updateData.titre = data.titre
    if (data.description !== undefined) updateData.description = data.description
    if (data.commentaire !== undefined) updateData.commentaire = data.commentaire
    if (data.statut !== undefined) updateData.statut = data.statut
    if (data.priorite !== undefined) updateData.priorite = data.priorite
    if (data.dateEcheance !== undefined) updateData.dateEcheance = data.dateEcheance ? new Date(data.dateEcheance) : null
    if (data.montant !== undefined) updateData.montant = data.montant !== null ? parseFloat(String(data.montant)) : null
    if (data.heuresEstimees !== undefined) updateData.heuresEstimees = data.heuresEstimees !== null ? parseFloat(String(data.heuresEstimees)) : null
    if (data.facturable !== undefined) updateData.facturable = data.facturable

    // Relations
    const connect: any = {}
    if (data.projet) connect.projet = { connect: { id: data.projet } }
    if (data.service) connect.service = { connect: { id: data.service } }

    // If changing assignee, enforce permissions and membership
    if (data.assigneA) {
      // Determine team context from existing task or its project
      const task = await prisma.tache.findUnique({ where: { id: data.id }, select: { equipeId: true, projetId: true } })
      let equipeId = task?.equipeId || null
      if (!equipeId && task?.projetId) {
        const projet = await prisma.projet.findUnique({ where: { id: task.projetId }, select: { equipeId: true } })
        equipeId = projet?.equipeId || null
      }

      if (equipeId) {
        const membre = await prisma.membreEquipe.findUnique({
          where: { equipeId_utilisateurId: { equipeId, utilisateurId: data.assigneA } }
        })
        if (!membre) return NextResponse.json({ error: 'L\'utilisateur n\'est pas membre de l\'équipe' }, { status: 400 })

        if (session?.user?.role !== 'ADMIN') {
          const equipe = await prisma.equipe.findUnique({ where: { id: equipeId }, select: { leadId: true } })
          if (!equipe || equipe.leadId !== session?.user?.id) {
            return NextResponse.json({ error: 'Permission refusée : seulement le chef d\'équipe peut assigner' }, { status: 403 })
          }
        }
      } else {
        // When changing assignee and there's no team context, allow ADMIN and MANAGER
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MANAGER') {
          return NextResponse.json({ error: 'Permission refusée : assignment hors équipe réservé aux administrateurs' }, { status: 403 })
        }
      }

      connect.assigneA = { connect: { id: data.assigneA } }
    }

    const updated = await prisma.tache.update({
      where: { id: data.id },
      data: { ...updateData, ...connect },
      include: {
        projet: { select: { titre: true } },
        assigneA: { select: { nom: true, prenom: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur update tâche:', error)
    const err: any = error
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la tâche' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    console.log('[DELETE] received id:', data.id, 'type:', typeof data.id)

    const existing = await prisma.tache.findUnique({ where: { id: data.id } })
    if (!existing) {
      console.warn('[DELETE] tâche introuvable (lookup) id:', data.id)
      return NextResponse.json({ error: `Tâche introuvable (id: ${data.id})` }, { status: 404 })
    }

    await prisma.tache.delete({ where: { id: data.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur suppression tâche:', error)
    const err: any = error
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }
    if (err.code === 'P2003') {
      return NextResponse.json({ error: "Impossible de supprimer la tâche : dépendances existantes (paiements/factures)." }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur lors de la suppression de la tâche' }, { status: 500 })
  }
}
