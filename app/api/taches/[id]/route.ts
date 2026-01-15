import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyWithEmail } from '@/lib/notificationService'

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

        // Utiliser le service de notification unifié
        await notifyWithEmail(
          {
            utilisateurId: tacheMaj.assigneAId!,
            titre: `Nouvelle tâche assignée: ${tacheMaj.titre}`,
            message: `${assignerName} vous a assigné la tâche **${tacheMaj.titre}**`,
            type: 'TACHE',
            lien: `/taches/${tacheMaj.id}`
          },
          {
            to: tacheMaj.assigneA.email,
            subject: `Nouvelle tâche assignée: ${tacheMaj.titre}`,
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
      <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">✅ Nouvelle tâche assignée</h2>
      
      <p>Bonjour <strong>${tacheMaj.assigneA.prenom} ${tacheMaj.assigneA.nom}</strong>,</p>
      
      <p><strong>${assignerName}</strong> vous a assigné une nouvelle tâche.</p>
      
      <div style="background-color: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0; border-radius: 4px;">
        <p style="margin-top: 0;"><strong>📋 Détails de la tâche :</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Titre :</strong> ${tacheMaj.titre}</li>
          ${tacheMaj.description ? `<li><strong>Description :</strong> ${tacheMaj.description}</li>` : ''}
          <li><strong>Priorité :</strong> ${tacheMaj.priorite || 'Non définie'}</li>
          ${tacheMaj.dateEcheance ? `<li><strong>Échéance :</strong> ${new Date(tacheMaj.dateEcheance).toLocaleDateString('fr-FR')}</li>` : ''}
          <li><strong>Statut :</strong> ${tacheMaj.statut}</li>
        </ul>
      </div>

      <p><strong>📋 Prochaines étapes :</strong></p>
      <ol style="margin: 10px 0;">
        <li>Connectez-vous à votre <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/taches" style="color: #1e40af; text-decoration: none;">tableau de bord</a></li>
        <li>Consultez les détails de la tâche</li>
        <li>Commencez à travailler sur la tâche</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/taches/${tacheMaj.id}" style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
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
        )

        console.log(`✅ Notification + Email d'assignation envoyés à ${tacheMaj.assigneA.email}`)
      } catch (emailError) {
        console.error('❌ Erreur notification assignation tâche:', emailError)
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
