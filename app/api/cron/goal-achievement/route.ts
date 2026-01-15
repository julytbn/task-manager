export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateObjectifAchievementEmail } from '@/lib/email'

/**
 * CRON: Vérifie les objectifs récemment atteints et envoie des emails de félicitations
 * Exécuté toutes les heures
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON
    const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🏆 [CRON] goal-achievement - Début du traitement des objectifs atteints')

    // Récupérer tous les objectifs avec leurs tâches
    const objectives = await prisma.objectif.findMany({
      include: {
        employe: {
          select: {
            id: true,
            email: true,
            prenom: true,
            nom: true
          }
        }
      }
    })

    console.log(`📊 [CRON] ${objectives.length} objectifs trouvés`)

    let sentCount = 0
    let errorCount = 0

    // Vérifier chaque objectif
    for (const objective of objectives) {
      try {
        if (!objective.employe?.email) {
          console.warn(`⚠️ [CRON] Pas d'email pour l'objectif: ${objective.id}`)
          continue
        }

        // Compter les tâches complétées pour cet employé
        const completedTasks = await prisma.tache.findMany({
          where: {
            assigneAId: objective.employe.id,
            statut: 'TERMINE'
          },
          select: { id: true }
        })

        const completedCount = completedTasks.length
        const targetValue = objective.valeurCible || 0

        // Vérifier si l'objectif est atteint
        if (completedCount >= targetValue && targetValue > 0) {
          // Vérifier si un email a déjà été envoyé pour cet objectif
          const notificationExists = await prisma.notification.findFirst({
            where: {
              utilisateurId: objective.employeId,
              sourceId: objective.id,
              sourceType: 'OBJECTIF_ATTEINT'
            }
          })

          if (!notificationExists) {
            // Envoyer l'email de félicitations
            const emailContent = generateObjectifAchievementEmail(
              objective.titre,
              objective.employe.prenom || objective.employe.nom || 'Employé',
              targetValue
            )

            const result = await sendEmail({
              to: objective.employe.email,
              subject: emailContent.subject,
              html: emailContent.html,
              from: process.env.SMTP_FROM || 'noreply@kekeligroup.com'
            })

            if (result.success) {
              // Créer une notification in-app
              await prisma.notification.create({
                data: {
                  utilisateurId: objective.employeId,
                  titre: '🏆 Objectif atteint!',
                  message: `Félicitations! Vous avez atteint votre objectif: "${objective.titre}" (${completedCount}/${targetValue})`,
                  lien: '/dashboard/employe/performance',
                  sourceId: objective.id,
                  sourceType: 'OBJECTIF_ATTEINT'
                }
              })

              console.log(`✅ [CRON] Email de félicitations envoyé à ${objective.employe.email} pour: ${objective.titre}`)
              sentCount++
            } else {
              console.error(`❌ [CRON] Erreur envoi email à ${objective.employe.email}:`, result.error)
              errorCount++
            }
          }
        }
      } catch (error) {
        console.error(`❌ [CRON] Erreur traitement objectif ${objective.id}:`, error)
        errorCount++
      }
    }

    console.log(`🏆 [CRON] goal-achievement - Traitement terminé: ${sentCount} félicitations envoyées, ${errorCount} erreurs`)

    return NextResponse.json({
      success: true,
      message: 'Objectif achievement CRON executed',
      objectivesChecked: objectives.length,
      emailsSent: sentCount,
      errors: errorCount
    })
  } catch (error) {
    console.error('❌ [CRON] Erreur goal-achievement:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erreur lors de l\'exécution du CRON'
      },
      { status: 500 }
    )
  }
}
