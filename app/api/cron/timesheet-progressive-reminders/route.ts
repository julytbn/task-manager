/**
 * API pour envoyer des rappels progressifs de timesheet
 * 
 * POST /api/cron/timesheet-progressive-reminders
 * 
 * Déclenché à 17h, 18h et 19h pour rappeler les employés
 * dont le timesheet n'est pas encore complété (avec heures > 0)
 * 
 * Authentification: Nécessite un header X-CRON-SECRET valide
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyWithEmail } from '@/lib/notificationService'

export async function POST(request: Request) {
  try {
    // Vérifier le secret du cron job
    const authHeader = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET || 'development-secret'

    // En développement, accepter aussi sans secret
    if (process.env.NODE_ENV === 'production' && authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    console.log('[CRON] Démarrage des rappels progressifs de timesheet')

    // Déterminer l'heure actuelle pour personnaliser le message
    const now = new Date()
    const hour = now.getHours()
    let reminderLevel = 'first' // 17h
    let urgency = 'normal'

    if (hour >= 19) {
      reminderLevel = 'third'
      urgency = 'critical'
    } else if (hour >= 18) {
      reminderLevel = 'second'
      urgency = 'high'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Récupérer les timesheets du jour qui ne sont pas complétés
    // (regularHrs = 0, overtimeHrs = 0, sickHrs = 0, vacationHrs = 0)
    const incompleteTimesheets = await prisma.timeSheet.findMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        statut: 'EN_ATTENTE',
        regularHrs: 0,
        overtimeHrs: null,
        sickHrs: null,
        vacationHrs: null
      },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true
          }
        }
      }
    })

    console.log(`[CRON] Trouvé ${incompleteTimesheets.length} timesheets incomplets`)

    let successCount = 0
    let errorCount = 0

    // Envoyer rappels
    for (const timesheet of incompleteTimesheets) {
      try {
        const employee = timesheet.employee
        const fullName = `${employee.prenom} ${employee.nom}`

        // Personnaliser le message selon l'heure
        let messageTitle = 'Rappel: Complétez votre timesheet'
        let messageBody = `Bonjour ${fullName},\n\nN'oubliez pas de compléter votre timesheet avant la fin de la journée.`
        let emailSubject = 'Rappel - Complétez votre timesheet'
        let colorClass = 'bg-yellow-100'

        if (reminderLevel === 'second') {
          messageTitle = '⚠️ Rappel urgent: Complétez votre timesheet'
          messageBody = `Bonjour ${fullName},\n\nC'est bientôt la fin de la journée ! Complétez rapidement votre timesheet.`
          emailSubject = '⚠️ Rappel urgent - Complétez votre timesheet maintenant'
          colorClass = 'bg-orange-100'
        } else if (reminderLevel === 'third') {
          messageTitle = '🚨 URGENT: Timesheet à compléter AVANT DE PARTIR'
          messageBody = `${fullName},\n\nC'EST LA DERNIÈRE HEURE ! Vous devez obligatoirement compléter votre timesheet avant de quitter le bureau.`
          emailSubject = '🚨 URGENT - Timesheet obligatoire à compléter MAINTENANT'
          colorClass = 'bg-red-100'
        }

        // Créer notification in-app + envoyer email
        await notifyWithEmail(
          {
            utilisateurId: employee.id,
            titre: messageTitle,
            message: messageBody,
            type: urgency === 'critical' ? 'ALERTE' : 'ALERTE',
            lien: '/timesheets/my-timesheets',
            sourceType: 'TIMESHEET'
          },
          {
            to: employee.email,
            subject: emailSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: ${urgency === 'critical' ? '#fee2e2' : '#fef3c7'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${urgency === 'critical' ? '#dc2626' : '#f59e0b'};">
                  <h2 style="color: ${urgency === 'critical' ? '#991b1b' : '#92400e'}; margin-top: 0;">
                    ${messageTitle}
                  </h2>
                  <p style="color: ${urgency === 'critical' ? '#7f1d1d' : '#78350f'};">
                    ${messageBody.replace(/\n/g, '<br>')}
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.taskmanager.local'}/timesheets/my-timesheets" 
                       style="background-color: ${urgency === 'critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                      ✓ Compléter mon timesheet MAINTENANT
                    </a>
                  </div>
                  
                  ${urgency === 'critical' ? '<p style="color: #991b1b; font-weight: bold; text-align: center;">Ceci est votre dernier rappel avant la fin de la journée!</p>' : ''}
                </div>
                
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  Rappel ${reminderLevel === 'first' ? 'initial' : reminderLevel === 'second' ? 'second' : 'final'} - ${new Date().toLocaleTimeString('fr-FR')}
                </p>
              </div>
            `
          },
          true // nonBlocking
        )
        successCount++
      } catch (error) {
        console.error(`[CRON] Erreur rappel pour timesheet:`, error)
        errorCount++
      }
    }

    const result = {
      success: true,
      message: `Rappels progressifs de timesheet envoyés`,
      reminderLevel: reminderLevel,
      urgency: urgency,
      incompleteTimesheets: incompleteTimesheets.length,
      remindersSent: successCount,
      errors: errorCount
    }

    console.log('[CRON] Résultat:', result)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[CRON] Erreur rappels progressifs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET || 'development-secret'

    if (process.env.NODE_ENV === 'production' && authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Pour les tests en GET
    return POST(request)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
