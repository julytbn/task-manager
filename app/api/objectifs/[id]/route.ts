import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/objectifs/[id] - Modifier un objectif
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { titre, valeurCible } = body

    if (!titre || !valeurCible) {
      return NextResponse.json(
        { error: 'Titre et valeur cible requis' },
        { status: 400 }
      )
    }

    const objectif = await prisma.objectif.update({
      where: { id },
      data: {
        titre,
        valeurCible,
      }
    })

    return NextResponse.json(objectif, { status: 200 })
  } catch (error) {
    console.error('Error updating objective:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'objectif' },
      { status: 500 }
    )
  }
}
