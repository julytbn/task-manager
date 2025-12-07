/**
 * API pour générer automatiquement les factures des abonnements
 * 
 * POST /api/cron/generate-invoices
 * 
 * Cette route peut être appelée par:
 * - Un cron job externe (Vercel Cron, AWS Lambda, etc.)
 * - Directement via l'application pour test
 * 
 * Authentification: Nécessite un header X-CRON-SECRET valide
 */

import { NextResponse } from 'next/server'
import { generateSubscriptionInvoices } from '@/lib/invoice-generator'

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

    console.log('[CRON] Déclenchement de la génération de factures automatiques')

    // Générer les factures
    const result = await generateSubscriptionInvoices()

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[CRON] Erreur génération factures:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        invoicesGenerated: 0
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Vérifier le secret du cron job
    const url = new URL(request.url)
    const authParam = url.searchParams.get('secret')
    const expectedSecret = process.env.CRON_SECRET || 'development-secret'

    // En développement, accepter aussi sans secret
    if (process.env.NODE_ENV === 'production' && authParam !== expectedSecret) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    console.log('[CRON] Déclenchement de la génération de factures automatiques (GET)')

    // Générer les factures
    const result = await generateSubscriptionInvoices()

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[CRON] Erreur génération factures:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        invoicesGenerated: 0
      },
      { status: 500 }
    )
  }
}
