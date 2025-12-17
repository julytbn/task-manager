import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    console.log('[API CLIENTS] Fetching clients...')
    const clients = await prisma.client.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { projets: true } },
        factures: { select: { montant: true } },
        projets: { select: { montantTotal: true, budget: true } }
      }
    })

    console.log(`[API CLIENTS] Found ${clients.length} clients`)

    // Calculer un résumé allégé pour le frontend :
    // - projetsCount : nombre de projets
    // - montantProjets : somme des montants totaux des projets
    // - montantFactures : somme des factures.montantTotal
    // Par compatibilité, `montantTotal` sera défini sur `montantProjets` (demande: montant total des projets)
    const result = clients.map((c) => {
      const montantFactures = (c.factures || []).reduce((sum, f) => sum + (f.montant || 0), 0)
      const montantProjets = (c.projets || []).reduce((sum, p) => sum + ((p.montantTotal ?? p.budget) || 0), 0)
      return {
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
        telephone: c.telephone,
        entreprise: c.entreprise,
        adresse: c.adresse,
        type: c.type,
        dateCreation: c.dateCreation,
        projetsCount: c._count?.projets ?? 0,
        montantProjets,
        montantFactures,
        montantTotal: montantProjets
      }
    })

    console.log(`[API CLIENTS] Returning ${result.length} clients`)
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/clients error', error)
    return NextResponse.json({ error: 'Failed to fetch clients', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    if (!data.nom || !data.prenom) {
      return NextResponse.json({ error: 'nom et prenom requis' }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || null,
        telephone: data.telephone || null,
        entreprise: data.entreprise || null,
        adresse: data.adresse || null,
        type: data.type || 'PARTICULIER',
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        gudefUrl: data.gudefUrl || null
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('POST /api/clients error', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const updated = await prisma.client.update({
      where: { id: data.id },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || null,
        telephone: data.telephone || null,
        entreprise: data.entreprise || null,
        adresse: data.adresse || null,
        type: data.type,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        gudefUrl: data.gudefUrl || null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/clients error', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const clientId = url.pathname.split('/').pop()
    
    if (!clientId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    await prisma.client.delete({ where: { id: clientId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/clients error', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
