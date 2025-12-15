import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    console.log('[DEBUG CLIENTS] Starting debug...')
    
    // Test 1: Vérifier la connexion à la base de données
    console.log('[DEBUG CLIENTS] Testing database connection...')
    const clientCount = await prisma.client.count()
    console.log(`[DEBUG CLIENTS] Total clients in database: ${clientCount}`)
    
    // Test 2: Récupérer les clients simplement
    console.log('[DEBUG CLIENTS] Fetching clients without relations...')
    const simpleClients = await prisma.client.findMany({
      take: 5,
      orderBy: { nom: 'asc' }
    })
    console.log(`[DEBUG CLIENTS] Simple fetch returned ${simpleClients.length} clients`)
    console.log('[DEBUG CLIENTS] Sample client:', simpleClients[0])
    
    // Test 3: Récupérer avec relations
    console.log('[DEBUG CLIENTS] Fetching clients with relations...')
    const clientsWithRelations = await prisma.client.findMany({
      take: 5,
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { projets: true } },
        factures: { select: { montant: true } },
        projets: { select: { montantTotal: true, budget: true } }
      }
    })
    console.log(`[DEBUG CLIENTS] With relations returned ${clientsWithRelations.length} clients`)
    
    return NextResponse.json({
      success: true,
      totalClients: clientCount,
      simpleClientsCount: simpleClients.length,
      relationsClientsCount: clientsWithRelations.length,
      sampleSimpleClient: simpleClients[0] || null,
      sampleClientWithRelations: clientsWithRelations[0] || null
    })
  } catch (error) {
    console.error('[DEBUG CLIENTS] Error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      errorDetails: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : null
    }, { status: 500 })
  }
}
