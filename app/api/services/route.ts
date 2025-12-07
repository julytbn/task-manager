import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({ 
      orderBy: { nom: 'asc' } 
    })
    return NextResponse.json(services)
  } catch (error) {
    console.error('GET /api/services error', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nom, description, categorie, prix, dureeEstimee } = body

    // Validation
    if (!nom || !categorie) {
      return NextResponse.json(
        { error: 'Nom et catégorie du service sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier qu'aucun service avec ce nom n'existe déjà
    const existingService = await prisma.service.findUnique({
      where: { nom }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Un service avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // Créer le service
    const service = await prisma.service.create({
      data: {
        nom,
        description: description || null,
        categorie,
        prix: prix ? parseFloat(prix) : null,
        dureeEstimee: dureeEstimee ? parseInt(dureeEstimee) : null,
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/services error', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du service' },
      { status: 500 }
    )
  }
}