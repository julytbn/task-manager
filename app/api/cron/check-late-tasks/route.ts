export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { checkAndNotifyLateTasks } from '@/lib/taskLateService'

/**
 * CRON endpoint pour vérifier les tâches en retard
 * Peut être appelé par un scheduler externe (GitHub Actions, etc.)
 */

const isDevMode = process.env.NODE_ENV !== 'production'

export async function GET(request: Request) {
  try {
    // Vérification du secret (sauf en dev)
    if (!isDevMode) {
      const cronSecret = request.headers.get('X-Cron-Secret')
      if (cronSecret !== process.env.CRON_SECRET) {
        console.warn('❌ Tentative d\'accès CRON sans authentification valide')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('🔍 Vérification des tâches en retard...')
    const result = await checkAndNotifyLateTasks()

    return NextResponse.json(
      {
        success: result.success,
        message: `Vérification complétée: ${result.lateTasks} tâche(s) en retard détectée(s)`,
        data: result
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Erreur CRON check-late-tasks:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Vérification du secret (sauf en dev)
    if (!isDevMode) {
      const cronSecret = request.headers.get('X-Cron-Secret')
      if (cronSecret !== process.env.CRON_SECRET) {
        console.warn('❌ Tentative d\'accès CRON sans authentification valide')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('🔍 Vérification des tâches en retard...')
    const result = await checkAndNotifyLateTasks()

    return NextResponse.json(
      {
        success: result.success,
        message: `Vérification complétée: ${result.lateTasks} tâche(s) en retard détectée(s)`,
        data: result
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Erreur CRON check-late-tasks:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error)
      },
      { status: 500 }
    )
  }
}
