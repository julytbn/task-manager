import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/taches/mes-taches
 * Récupère toutes les tâches assignées à l'employé connecté
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer toutes les tâches assignées à l'employé connecté
    // Ces tâches peuvent être dans n'importe quel statut (A_FAIRE, EN_COURS, TERMINE, etc)
    const mesTaches = await prisma.tache.findMany({
      where: {
        assigneAId: session.user.id,
      },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
          }
        },
        service: {
          select: {
            id: true,
            nom: true,
          }
        },
        DocumentTache: {
          select: {
            id: true,
            nom: true,
            url: true,
            type: true,
            taille: true,
            dateUpload: true
          }
        }
      },
      orderBy: { dateCreation: 'desc' }
    })

    console.log(`📝 [GET /api/taches/mes-taches] Employé ${session.user.id} a ${mesTaches.length} tâche(s) assignée(s)`)

    return NextResponse.json({
      success: true,
      data: mesTaches
    })
  } catch (error) {
    console.error('Erreur récupération mes-taches:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tâches' },
      { status: 500 }
    )
  }
}
