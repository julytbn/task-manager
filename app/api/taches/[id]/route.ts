import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, generateTaskAssignmentEmail } from '@/lib/email'

/**
 * GET /api/taches/:id
 * Récupère une tâche spécifique
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const tache = await prisma.tache.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!tache) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    return NextResponse.json(tache)
  } catch (error) {
    console.error('Erreur récupération tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la tâche' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/taches/:id
 * Met à jour une tâche (notamment l'assignation)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const data = await request.json()
    
    // Récupérer la tâche actuelle
    const tacheActuelle = await prisma.tache.findUnique({
      where: { id: params.id },
      include: {
        assigneA: { select: { id: true, nom: true, prenom: true, email: true } }
      }
    })

    if (!tacheActuelle) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions: l'utilisateur doit être admin ou manager
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (data.titre !== undefined) updateData.titre = data.titre
    if (data.description !== undefined) updateData.description = data.description
    if (data.statut !== undefined) updateData.statut = data.statut
    if (data.priorite !== undefined) updateData.priorite = data.priorite
    if (data.dateEcheance !== undefined) {
      updateData.dateEcheance = data.dateEcheance ? new Date(data.dateEcheance) : null
    }

    // Gestion de l'assignation
    let nouvelAssigne = false
    if (data.assigneAId !== undefined) {
      if (data.assigneAId) {
        // Vérifier que l'utilisateur existe
        const utilisateur = await prisma.utilisateur.findUnique({
          where: { id: data.assigneAId },
          select: { id: true, nom: true, prenom: true, email: true }
        })

        if (!utilisateur) {
          return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
        }

        updateData.assigneA = { connect: { id: data.assigneAId } }
        
        // Vérifier si c'est une nouvelle assignation (assignation change)
        if (!tacheActuelle.assigneA || tacheActuelle.assigneA.id !== data.assigneAId) {
          nouvelAssigne = true
        }
      } else {
        // Désassigner la tâche
        updateData.assigneA = { disconnect: true }
      }
    }

    // Mettre à jour la tâche
    const tacheMaj = await prisma.tache.update({
      where: { id: params.id },
      data: updateData,
      include: {
        projet: { select: { id: true, titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true, email: true } }
      }
    })

    // Envoyer un email si c'est une nouvelle assignation
    if (nouvelAssigne && tacheMaj.assigneA?.email) {
      try {
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
          tacheMaj.titre,
          tacheMaj.description || undefined,
          assignerName,
          `https://task-manager.kekeligroup.com/taches/${tacheMaj.id}`
        )

        await sendEmail({
          to: tacheMaj.assigneA.email,
          subject: emailContent.subject,
          html: emailContent.html
        })

        console.log(`✅ Email d'assignation de tâche envoyé à ${tacheMaj.assigneA.email}`)
      } catch (emailError) {
        console.error('❌ Erreur envoi email assignation tâche:', emailError)
        // Continue without failing
      }
    }

    return NextResponse.json(tacheMaj)
  } catch (error) {
    console.error('Erreur mise à jour tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la tâche' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/taches/:id
 * Supprime une tâche
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const tache = await prisma.tache.findUnique({
      where: { id: params.id }
    })

    if (!tache) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    // Supprimer les documents associés d'abord
    await prisma.documentTache.deleteMany({
      where: { tacheId: params.id }
    })

    // Supprimer la tâche
    await prisma.tache.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Tâche supprimée' })
  } catch (error) {
    console.error('Erreur suppression tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la tâche' },
      { status: 500 }
    )
  }
}
