import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/my-data
 * Endpoint de diagnostic pour voir les données de l'employé connecté
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

    // Récupérer les infos de l'utilisateur
    const user = await prisma.utilisateur.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
      }
    })

    // Récupérer toutes les tâches assignées à cet utilisateur
    const tachesAssignees = await prisma.tache.findMany({
      where: {
        assigneAId: session.user.id,
      },
      select: {
        id: true,
        titre: true,
        assigneAId: true,
        projetId: true,
      }
    })

    // Récupérer tous les projets
    const projets = await prisma.projet.findMany({
      select: {
        id: true,
        titre: true,
        _count: {
          select: { taches: true }
        }
      },
      take: 10
    })

    // Récupérer toutes les tâches (pour voir la structure)
    const toutesLesTaches = await prisma.tache.findMany({
      select: {
        id: true,
        titre: true,
        assigneAId: true,
        projetId: true,
      },
      take: 10
    })

    return NextResponse.json({
      success: true,
      user,
      tachesAssigneeAMoi: {
        count: tachesAssignees.length,
        data: tachesAssignees
      },
      mesProjetsDirect: {
        count: projets.length,
        data: projets
      },
      echantillonToutesTaches: {
        count: toutesLesTaches.length,
        data: toutesLesTaches
      }
    })
  } catch (error) {
    console.error('Erreur diagnostic:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur lors du diagnostic' },
      { status: 500 }
    )
  }
}
