import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { type: string } }) {
  try {
    const { type } = params

    let result

    switch (type) {
      case 'statuts-taches':
        result = await prisma.enumStatutTache.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'priorites':
        result = await prisma.enumPriorite.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'statuts-projets':
        result = await prisma.enumStatutProjet.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'categories-services':
        result = await prisma.enumCategorieService.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'types-clients':
        result = await prisma.enumTypeClient.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'statuts-factures':
        result = await prisma.enumStatutFacture.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'statuts-paiements':
        result = await prisma.enumStatutPaiement.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'moyens-paiement':
        result = await prisma.enumMoyenPaiement.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'types-notifications':
        result = await prisma.enumTypeNotification.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      default:
        return NextResponse.json(
          { error: `Type d'énumération inconnu: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ [type]: result })
  } catch (error) {
    console.error(`Erreur récupération énumération [${params.type}]:`, error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des énumérations' },
      { status: 500 }
    )
  }
}
