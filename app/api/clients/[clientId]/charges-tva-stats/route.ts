import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '')

    const clientId = params.clientId

    // Trouver le dossier comptable pour ce mois/année
    const dossier = await prisma.dossierComptable.findFirst({
      where: {
        clientId: clientId,
        mois: month,
        annee: year,
      },
    })

    if (!dossier) {
      return NextResponse.json({
        avecTVA: 0,
        sansTVA: 0,
      })
    }

    // Récupérer les charges détaillées
    const charges = await prisma.chargeDetaillee.findMany({
      where: {
        dossierComptableId: dossier.id,
      },
    })

    // Séparer par TVA
    let totalAvecTVA = 0
    let totalSansTVA = 0

    charges.forEach((charge) => {
      if (charge.avecTVA) {
        totalAvecTVA += charge.montantHT || 0
      } else {
        totalSansTVA += charge.montantHT || 0
      }
    })

    return NextResponse.json({
      avecTVA: totalAvecTVA,
      sansTVA: totalSansTVA,
    })
  } catch (error) {
    console.error('Erreur récupération stats TVA:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stats TVA' },
      { status: 500 }
    )
  }
}
