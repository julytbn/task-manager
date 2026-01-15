export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, generateTaskAssignmentEmail } from '@/lib/email'
import { notifyWithEmail, notificationTemplates } from '@/lib/notificationService'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const queryUserId = url.searchParams.get('userId')
    
    // Logs uniquement en développement pour éviter d'exposer les données sensibles
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [GET /api/taches] User authenticated:', !!session?.user?.id)
      console.log('📋 [GET /api/taches] User role:', session?.user?.role)
      console.log('📋 [GET /api/taches] Query userId:', queryUserId)
    }

    const where: any = {}
    
    // Si un userId est spécifié en query, l'utiliser
    if (queryUserId) {
      where.OR = [
        { assigneAId: queryUserId },    // Tâches assignées à l'utilisateur
        { creeParId: queryUserId }      // Tâches créées par l'utilisateur
      ]
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 [GET /api/taches] Filtre par userId appliqué (assignées + créées):', queryUserId)
      }
    }
    // Sinon, si l'utilisateur est un employé, retourner ses tâches (assignées OU créées par lui)
    else if (session?.user?.role === 'EMPLOYE' && session.user.id) {
      where.OR = [
        { assigneAId: session.user.id },      // Tâches assignées à l'employé
        { creeParId: session.user.id }        // Tâches créées par l'employé
      ]
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 [GET /api/taches] Filtre EMPLOYE appliqué - show assigned and created tasks')
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 [GET /api/taches] Filtre MANAGER/ADMIN - Returning ALL tasks')
      }
    }

    const taches = await prisma.tache.findMany({
      where,
      include: {
        projet: { select: { id: true, titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true, email: true } },
        creeePar: { select: { id: true, nom: true, prenom: true } },
        DocumentTache: {
          select: {
            id: true,
            nom: true,
            url: true,
            type: true,
            taille: true,
            dateUpload: true
          }
        }
      },
      orderBy: { dateCreation: 'desc' }
    })
    
    console.log(`📋 [GET /api/taches] Total tasks returned: ${taches.length}`)
    if (taches.length > 0) {
      console.log('📋 [GET /api/taches] Task statuses:', taches.slice(0, 5).map(t => `${t.titre}(${t.statut})`).join(', '))
    }
    
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
      data.projetId = form.get('projetId')?.toString() || form.get('projet')?.toString() || ''
      data.description = form.get('description')?.toString() || null
      data.priorite = form.get('priorite')?.toString() || undefined
      data.dateEcheance = form.get('dateEcheance')?.toString() || undefined
      data.assigneAId = form.get('assigneAId')?.toString() || undefined
      data.statut = form.get('statut')?.toString() || undefined

      // collect files
      const files = form.getAll('files') || []
      uploadedFiles = files as any[]
    } else {
      data = await request.json()
    }

    const session = await getServerSession(authOptions)

    // For employees: force status to SOUMISE (waiting for manager validation)
    if (session?.user?.role === 'EMPLOYE') {
      data.statut = 'SOUMISE'
    }

    // Basic validation: require title, statut, priorite and projetId (assignee is optional)
    if (!data.titre || !data.statut || !data.priorite || !data.projetId) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (titre, statut, priorite, projetId)' },
        { status: 400 }
      )
    }

    const createData: any = {
      titre: data.titre,
      description: data.description || null,
      statut: data.statut,
      priorite: data.priorite,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      projet: { connect: { id: data.projetId } }
    }
    
    // Track who created the task
    if (session?.user?.id) {
      createData.creeePar = { connect: { id: session.user.id } }
    }

    // If an assignee is provided, validate permissions and membership
    if (data.assigneAId) {
      // Determine team (équipe) context: prefer explicit équipe, else derive from projet
      let equipeId: string | null = data.equipe || null
      if (!equipeId) {
        const projet = await prisma.projet.findUnique({ where: { id: data.projetId }, select: { equipeId: true } })
        equipeId = projet?.equipeId || null
      }

      // If there's a team, ensure assignee is member of that team
      if (equipeId) {
        const membre = await prisma.membreEquipe.findUnique({
          where: {
            equipeId_utilisateurId: { equipeId, utilisateurId: data.assigneAId }
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
        // Employees creating SOUMISE tasks don't need assignment permission
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MANAGER') {
          // For employees: only allow if creating a SOUMISE task (waiting for validation)
          if (data.statut !== 'SOUMISE') {
            return NextResponse.json({ error: 'Permission refusée : assignment hors équipe réservé aux administrateurs' }, { status: 403 })
          }
          // If SOUMISE, ignore the assigneAId from employee - let manager assign after validation
          data.assigneAId = undefined
        }
      }

      // Only connect if assigneAId is still set (not cleared for employee SOUMISE tasks)
      if (data.assigneAId) {
        createData.assigneA = { connect: { id: data.assigneAId } }
      }
    }

    const nouvelleTache = await prisma.tache.create({
      data: createData,
      include: {
        projet: { select: { titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true, email: true } }
      }
    })

    // Send email and create notification for assignee if a task is assigned
    if (data.assigneAId && nouvelleTache.assigneA?.email) {
      try {
        console.log(`📢 [POST /api/taches] Création notification d'assignation pour assigneAId=${data.assigneAId}`)
        
        // Get assigner name (the user creating the task)
        let assignerName = 'Un manager'
        if (session?.user?.id) {
          const assigner = await prisma.utilisateur.findUnique({
            where: { id: session.user.id },
            select: { nom: true, prenom: true }
          })
          if (assigner) {
            assignerName = `${assigner.prenom || ''} ${assigner.nom || ''}`.trim() || assignerName
          }
        }

        const emailContent = generateTaskAssignmentEmail(
          nouvelleTache.titre,
          nouvelleTache.description || undefined,
          assignerName,
          `https://task-manager.kekeligroup.com/taches/${nouvelleTache.id}`
        )

        // Créer notification in-app ET envoyer email
        const notificationResult = await notifyWithEmail(
          {
            utilisateurId: data.assigneAId,
            titre: `Nouvelle tâche assignée: ${nouvelleTache.titre}`,
            message: `${assignerName} vous a assigné une nouvelle tâche: "${nouvelleTache.titre}".${nouvelleTache.description ? ` \n${nouvelleTache.description}` : ''}`,
            type: 'TACHE',
            lien: `/taches/${nouvelleTache.id}`,
            sourceId: nouvelleTache.id,
            sourceType: 'TACHE_ASSIGNEE'
          },
          {
            to: nouvelleTache.assigneA.email,
            subject: emailContent.subject,
            html: emailContent.html
          },
          true // nonBlockingEmail: n'arrête pas si l'email échoue
        )

        console.log(`✅ [POST /api/taches] Notification et email d'assignation traités: ${JSON.stringify(notificationResult)}`)
      } catch (error) {
        console.error('❌ [POST /api/taches] Erreur envoi notification/email assignation tâche:', error)
        // Continue without failing the entire operation
      }
    }

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
      console.log(`📢 [POST /api/taches] Début création notifications pour managers...`)
      
      // Get submitter info if available
      let submitterName = 'Un employé'
      let submitterEmail = ''
      if (session?.user?.id) {
        try {
          const user = await prisma.utilisateur.findUnique({ where: { id: session.user.id }, select: { nom: true, prenom: true, email: true } })
          if (user) {
            submitterName = `${user.prenom || ''} ${user.nom || ''}`.trim() || submitterName
            submitterEmail = user.email || ''
          }
        } catch (e) {
          // ignore
        }
      }

      const managers = await prisma.utilisateur.findMany({ where: { role: 'MANAGER' }, select: { id: true, email: true } })
      console.log(`👥 [POST /api/taches] ${managers.length} managers trouvés`)
      
      type NotificationData = {
        utilisateurId: string
        titre: string
        message: string
        type: 'TACHE' | 'INFO'
        lien: string
        sourceId: string
        sourceType: string
      }
      // Déterminer si c'est une tâche soumise ou créée
      const isSubmitted = data.statut === 'SOUMISE'
      console.log(`📋 [POST /api/taches] Tâche soumise? ${isSubmitted}`)
      
      const notifications: NotificationData[] = managers.map(m => ({
        utilisateurId: m.id,
        titre: isSubmitted ? `Nouvelle tâche soumise par ${submitterName}` : 'Nouvelle tâche créée',
        message: isSubmitted 
          ? `${submitterName} a soumis la tâche « ${nouvelleTache.titre} » pour validation.`
          : `${submitterName} a créé la tâche « ${nouvelleTache.titre} ».`,
        type: 'TACHE',
        lien: `/taches/${nouvelleTache.id}`,
        sourceId: nouvelleTache.id,
        sourceType: 'TACHE'
      }))

      // create notifications in DB (one by manager)
      let notificationsCreated = 0
      for (const n of notifications) {
        try {
          await prisma.notification.create({ data: n })
          notificationsCreated++
          console.log(`✅ [POST /api/taches] Notification créée pour manager ${n.utilisateurId}: "${n.titre}"`)
        } catch (e) {
          console.error(`❌ [POST /api/taches] Erreur création notification:`, e)
        }
      }
      console.log(`📊 [POST /api/taches] ${notificationsCreated}/${managers.length} notifications créées en BD`)

      // Send emails to managers if task is submitted for validation
      if (isSubmitted && managers.length > 0) {
        console.log(`📧 [POST /api/taches] Envoi emails aux ${managers.length} managers...`)
        try {
          let emailsSent = 0
          for (const manager of managers) {
            if (manager.email) {
              try {
                const emailContent = {
                  subject: `Nouvelle tâche soumise pour validation - ${nouvelleTache.titre}`,
                  html: `
                    <h2>Nouvelle tâche soumise pour validation</h2>
                    <p><strong>${submitterName}</strong> a soumis une tâche pour validation.</p>
                    <p><strong>Titre:</strong> ${nouvelleTache.titre}</p>
                    <p><strong>Projet:</strong> ${nouvelleTache.projet?.titre || 'N/A'}</p>
                    ${nouvelleTache.description ? `<p><strong>Description:</strong> ${nouvelleTache.description}</p>` : ''}
                    <p><strong>Priorité:</strong> ${data.priorite}</p>
                    <p>
                      <a href="https://task-manager.kekeligroup.com/taches/${nouvelleTache.id}" style="background-color: #d4af37; color: #1a1a1a; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Consulter la tâche
                      </a>
                    </p>
                    <p>Veuillez valider ou rejeter cette tâche.</p>
                  `
                }

                await sendEmail({
                  to: manager.email,
                  subject: emailContent.subject,
                  html: emailContent.html
                })

                emailsSent++
                console.log(`✅ [POST /api/taches] Email envoyé à ${manager.email}`)
              } catch (e) {
                console.error(`❌ [POST /api/taches] Erreur envoi email à ${manager.email}:`, e)
              }
            }
          }
          console.log(`📊 [POST /api/taches] ${emailsSent}/${managers.length} emails envoyés`)
        } catch (emailErr) {
          console.error('❌ [POST /api/taches] Erreur envoi emails managers:', emailErr)
        }
      } else {
        console.log(`⏭️ [POST /api/taches] Pas d'emails à envoyer (isSubmitted=${isSubmitted}, managers=${managers.length})`)
      }
    } catch (notifErr) {
      console.error('❌ [POST /api/taches] Erreur lors de la création des notifications:', notifErr)
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
        // Employees can't change assignee outside of team context
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
        assigneA: { select: { nom: true, prenom: true, email: true } },
        DocumentTache: {
          select: {
            id: true,
            nom: true,
            url: true,
            type: true,
            taille: true,
            dateUpload: true
          }
        }
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

export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const session = await getServerSession(authOptions)
    
    // Only managers and admins can validate/reject tasks
    if (session?.user?.role !== 'MANAGER' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission refusée : seuls les managers et administrateurs peuvent valider des tâches' }, { status: 403 })
    }

    const tache = await prisma.tache.findUnique({ 
      where: { id: data.id }
    }) as any
    if (!tache) {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }

    // Update task status and add comment if provided
    const updateData: any = {
      statut: data.statut || tache.statut
    }
    
    if (data.commentaire) {
      updateData.commentaire = data.commentaire
    }

    const updated = await prisma.tache.update({
      where: { id: data.id },
      data: updateData,
      include: {
        projet: { select: { titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true, email: true } },
        DocumentTache: {
          select: {
            id: true,
            nom: true,
            url: true,
            type: true,
            taille: true,
            dateUpload: true
          }
        }
      }
    })

    // If task status changed from SOUMISE, notify the creator
    if (tache.statut === 'SOUMISE' && data.statut !== 'SOUMISE' && tache.creeParId) {
      try {
        // Get creator info
        const creator = await prisma.utilisateur.findUnique({
          where: { id: tache.creeParId },
          select: { id: true, email: true, nom: true, prenom: true }
        })

        if (creator) {
          const isValidated = data.statut === 'TERMINE'
          const statusLabel = isValidated ? 'validée' : 'rejetée'
          const managerInfo = session?.user || {}
          const managerName = `${managerInfo.prenom || managerInfo.nom || 'Un manager'}`
          
          // Utiliser le service de notification unifié
          await notifyWithEmail(
            {
              utilisateurId: creator.id,
              titre: `Tâche ${statusLabel}: ${tache.titre}`,
              message: `Votre tâche "${tache.titre}" a été ${statusLabel} par ${managerName}.${data.commentaire ? ` Commentaire: ${data.commentaire}` : ''}`,
              type: 'TACHE',
              lien: `/taches/${tache.id}`,
            },
            {
              to: creator.email,
              subject: `Tâche ${statusLabel}: ${tache.titre}`,
              html: `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e40af; margin: 0;">KEKELI GROUP</h1>
      </div>
      <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">📋 Tâche ${statusLabel}</h2>
      
      <p>Bonjour <strong>${creator.prenom} ${creator.nom}</strong>,</p>
      
      <p>Votre tâche <strong>"${tache.titre}"</strong> a été <strong>${statusLabel}</strong> par ${managerName}.</p>
      
      <div style="background-color: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0; border-radius: 4px;">
        <p style="margin-top: 0;"><strong>📌 Détails :</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Tâche :</strong> ${tache.titre}</li>
          <li><strong>Statut :</strong> ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}</li>
          <li><strong>Validée par :</strong> ${managerName}</li>
        </ul>
        ${data.commentaire ? `<p style="margin: 10px 0;"><strong>💬 Commentaire du manager:</strong></p><p style="margin: 5px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">${data.commentaire}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/taches/${tache.id}" style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Voir la tâche
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
        <strong>Besoin d'aide ?</strong><br>
        Contactez votre responsable ou l'équipe support.
      </p>
      <p style="font-size: 11px; color: #999; margin: 10px 0 0 0; text-align: center;">
        © 2025 KEKELI GROUP. Tous droits réservés.<br>
        Cet email a été généré automatiquement.
      </p>
    </div>
  </body>
</html>
              `
            },
            false
          );
          console.log(`✅ Notification + Email de validation envoyés à ${creator.email}`);
        }
      } catch (notifErr) {
        console.error('❌ Erreur notification tâche validée:', notifErr)
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur validation tâche:', error)
    const err: any = error
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la validation de la tâche' }, { status: 500 })
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
