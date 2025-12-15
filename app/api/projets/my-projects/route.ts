import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

/**
 * GET /api/projets/my-projects
 * Récupère les projets de l'employé connecté
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Non authentifié',
        },
        { status: 401 }
      )
    }

    // Récupérer les projets où l'employé a au moins une tâche assignée
    const projets = await prisma.projet.findMany({
      where: {
        taches: {
          some: {
            assigneAId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        titre: true,
      },
      distinct: ['id'],
    })

    return NextResponse.json({
      success: true,
      data: projets,
    })
  } catch (error) {
    console.error('Erreur récupération projets employé:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    )
  }
}
