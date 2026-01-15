import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateObjectifEncouragementEmail } from '@/lib/email'

/**
 * CRON: Vérifie les objectifs stagnants et envoie des emails d'encouragement
 * Exécuté chaque lundi à 08:00
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

    console.log('🎯 [CRON] goal-encouragement - Début du traitement des objectifs stagnants')

    // Récupérer les objectifs sans mise à jour depuis 7 jours
    const dateLimite = new Date()
    dateLimite.setDate(dateLimite.getDate() - 7)

    const stagnantObjectives = await prisma.objectif.findMany({
      where: {
        dateModification: {
          lt: dateLimite
        }
      },
      include: {
        employe: {
          select: {
            email: true,
            prenom: true,
            nom: true
          }
        }
      }
    })

    console.log(`📊 [CRON] ${stagnantObjectives.length} objectifs stagnants trouvés`)

    let sentCount = 0
    let errorCount = 0

    // Envoyer les emails d'encouragement
    for (const objective of stagnantObjectives) {
      try {
        if (!objective.employe?.email) {
          console.warn(`⚠️ [CRON] Pas d'email pour l'objectif: ${objective.id}`)
          continue
        }

        const emailContent = generateObjectifEncouragementEmail(
          objective.titre,
          objective.employe.prenom || objective.employe.nom || 'Employé'
        )

        const result = await sendEmail({
          to: objective.employe.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: process.env.SMTP_FROM || 'noreply@kekeligroup.com'
        })

        if (result.success) {
          console.log(`✅ [CRON] Email d'encouragement envoyé à ${objective.employe.email} pour: ${objective.titre}`)
          sentCount++
        } else {
          console.error(`❌ [CRON] Erreur envoi email à ${objective.employe.email}:`, result.error)
          errorCount++
        }
      } catch (error) {
        console.error(`❌ [CRON] Erreur traitement objectif ${objective.id}:`, error)
        errorCount++
      }
    }

    console.log(`🎯 [CRON] goal-encouragement - Traitement terminé: ${sentCount} emails envoyés, ${errorCount} erreurs`)

    return NextResponse.json({
      success: true,
      message: 'Objectif encouragement CRON executed',
      stagnantObjectivesFound: stagnantObjectives.length,
      emailsSent: sentCount,
      errors: errorCount
    })
  } catch (error) {
    console.error('❌ [CRON] Erreur goal-encouragement:', error)
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
