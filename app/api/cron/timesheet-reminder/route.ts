/**
 * API pour envoyer des notifications quotidiennes de timesheet
 * 
 * POST /api/cron/timesheet-reminder
 * 
 * Déclenché chaque jour à 17h pour rappeler aux employés
 * de créer/compléter leur timesheet
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

    console.log('[CRON] Démarrage des notifications de timesheet (17h)')

    // Récupérer tous les utilisateurs actifs (employés)
    const employees = await prisma.utilisateur.findMany({
      where: {
        actif: true,
        role: {
          in: ['EMPLOYE', 'MANAGER']
        }
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true
      }
    })

    console.log(`[CRON] Trouvé ${employees.length} employés actifs`)

    let successCount = 0
    let errorCount = 0

    // Envoyer notification à chaque employé
    for (const employee of employees) {
      try {
        const fullName = `${employee.prenom} ${employee.nom}`
        
        // Créer notification in-app + envoyer email
        await notifyWithEmail(
          {
            utilisateurId: employee.id,
            titre: 'Rappel: Créer votre timesheet',
            message: `Bonjour ${fullName},\n\nC'est l'heure de compléter votre timesheet pour la journée d'aujourd'hui.\n\nAccédez à votre timesheet: https://app.taskmanager.local/timesheets/my-timesheets`,
            type: 'ALERTE',
            lien: '/timesheets/my-timesheets',
            sourceType: 'TIMESHEET'
          },
          {
            to: employee.email,
            subject: `Rappel 17h - Complétez votre timesheet`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Rappel: Timesheet</h2>
                <p>Bonjour ${fullName},</p>
                <p>Il est <strong>17h</strong> et c'est le moment de compléter votre timesheet pour la journée d'aujourd'hui.</p>
                
                <p>Cliquez sur le bouton ci-dessous pour accéder à votre timesheet:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.taskmanager.local'}/timesheets/my-timesheets" 
                     style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Créer/Modifier mon Timesheet
                  </a>
                </div>
                
                <p>N'oubliez pas de :</p>
                <ul>
                  <li>Enregistrer les heures travaillées</li>
                  <li>Ajouter la description des tâches effectuées</li>
                  <li>Soumettre votre timesheet pour validation</li>
                </ul>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                  Cet email a été envoyé automatiquement à 17h.
                </p>
              </div>
            `
          },
          true // nonBlocking: continuer même si l'email échoue
        )
        successCount++
      } catch (error) {
        console.error(`[CRON] Erreur notification pour ${employee.email}:`, error)
        errorCount++
      }
    }

    const result = {
      success: true,
      message: `Notifications de timesheet envoyées`,
      totalEmployees: employees.length,
      notificationsSent: successCount,
      errors: errorCount
    }

    console.log('[CRON] Résultat:', result)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[CRON] Erreur notification timesheet:', error)
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
