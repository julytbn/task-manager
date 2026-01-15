/**
 * API Route: Proxy CRON pour vérifier les paiements en retard
 * 
 * Endpoint unifié: POST /api/cron/check-late-payments
 * 
 * Cette route sert de proxy vers /api/paiements/check-late
 * pour unifier la documentation et simplifier les appels CRON
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Vérifier le secret du CRON
    const authHeader = request.headers.get('x-cron-secret') || 
                       request.headers.get('x-internal-secret')
    const expectedSecret = process.env.CRON_SECRET || 'development-secret'

    // En développement, accepter sans secret ou avec n'importe quel secret
    // En production, vérifier le secret strictement
    const isDevMode = process.env.NODE_ENV !== 'production'
    if (!isDevMode && authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Non autorisé - Secret CRON invalide' },
        { status: 401 }
      )
    }

    console.log('[CRON] Proxy: Appel reçu pour /api/cron/check-late-payments')

    // Proxy vers la route réelle
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const proxyUrl = `${baseUrl}/api/paiements/check-late`

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': expectedSecret,
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()

    console.log('[CRON] Proxy: Réponse reçue:', data)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[CRON] Erreur proxy:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Vérifier le secret du CRON
    const url = new URL(request.url)
    const authParam = url.searchParams.get('secret')
    const expectedSecret = process.env.CRON_SECRET || 'development-secret'

    // En développement, accepter sans secret ou avec n'importe quel secret
    // En production, vérifier le secret strictement
    const isDevMode = process.env.NODE_ENV !== 'production'
    if (!isDevMode && authParam !== expectedSecret) {
      return NextResponse.json(
        { error: 'Non autorisé - Secret CRON invalide' },
        { status: 401 }
      )
    }

    console.log('[CRON] Proxy GET: Appel reçu pour /api/cron/check-late-payments')

    // Proxy vers la route réelle
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const proxyUrl = `${baseUrl}/api/paiements/check-late`

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'x-internal-secret': expectedSecret,
      },
    })

    const data = await response.json()

    console.log('[CRON] Proxy GET: Réponse reçue:', data)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[CRON] Erreur proxy GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
