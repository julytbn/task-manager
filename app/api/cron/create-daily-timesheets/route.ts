/**
 * API pour créer automatiquement les timesheets quotidiens obligatoires
 * 
 * POST /api/cron/create-daily-timesheets
 * 
 * Déclenché chaque jour à minuit pour créer les timesheets du jour
 * pour tous les employés actifs
 * 
 * Authentification: Nécessite un header X-CRON-SECRET valide
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    console.log('[CRON] Démarrage de la création des timesheets quotidiens')

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

    // Récupérer un projet par défaut ou le premier disponible
    const defaultProject = await prisma.projet.findFirst({
      select: { id: true }
    })

    if (!defaultProject) {
      console.warn('[CRON] Aucun projet disponible pour créer les timesheets')
      return NextResponse.json({
        success: false,
        error: 'Aucun projet disponible',
        timesheetsCreated: 0,
        errors: employees.length
      }, { status: 400 })
    }

    // Récupérer une tâche par défaut ou la première disponible
    const defaultTask = await prisma.tache.findFirst({
      select: { id: true }
    })

    if (!defaultTask) {
      console.warn('[CRON] Aucune tâche disponible pour créer les timesheets')
      return NextResponse.json({
        success: false,
        error: 'Aucune tâche disponible',
        timesheetsCreated: 0,
        errors: employees.length
      }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let successCount = 0
    let errorCount = 0
    const createdTimesheets: string[] = []

    // Créer un timesheet pour chaque employé s'il n'existe pas déjà
    for (const employee of employees) {
      try {
        // Vérifier si un timesheet existe déjà pour aujourd'hui
        const existingTimesheet = await prisma.timeSheet.findFirst({
          where: {
            employeeId: employee.id,
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        })

        if (existingTimesheet) {
          console.log(`[CRON] Timesheet déjà existant pour ${employee.prenom} ${employee.nom}`)
          continue
        }

        // Créer un nouveau timesheet obligatoire
        const timesheet = await prisma.timeSheet.create({
          data: {
            date: today,
            regularHrs: 0,
            overtimeHrs: 0,
            sickHrs: 0,
            vacationHrs: 0,
            description: 'À compléter obligatoirement',
            statut: 'EN_ATTENTE',
            employeeId: employee.id,
            projectId: defaultProject.id,
            taskId: defaultTask.id,
            commentaire: 'Timesheet obligatoire créé automatiquement'
          }
        })

        console.log(`[CRON] Timesheet créé pour ${employee.prenom} ${employee.nom}`)
        createdTimesheets.push(timesheet.id)
        successCount++
      } catch (error) {
        console.error(`[CRON] Erreur création timesheet pour ${employee.email}:`, error)
        errorCount++
      }
    }

    const result = {
      success: true,
      message: `Timesheets quotidiens créés obligatoirement`,
      totalEmployees: employees.length,
      timesheetsCreated: successCount,
      errors: errorCount,
      createdIds: createdTimesheets
    }

    console.log('[CRON] Résultat:', result)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[CRON] Erreur création timesheets:', error)
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
