import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const clientId = params.clientId

    // Créer un objet pour stocker les données par mois
    const monthlyData: Record<number, { entrees: number; charges: number }> = {}

    // Initialiser tous les mois de l'année
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = { entrees: 0, charges: 0 }
    }

    // Récupérer les EntreeClient pour l'année
    const entrees = await prisma.entreeClient.findMany({
      where: {
        clientId: clientId,
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    })

    // Ajouter les entrées au total par mois
    entrees.forEach((entree) => {
      const month = new Date(entree.date).getMonth() + 1
      monthlyData[month].entrees += entree.montant || 0
    })

    // Récupérer tous les DossierComptable pour l'année
    const dossiers = await prisma.dossierComptable.findMany({
      where: {
        clientId: clientId,
        annee: year,
      },
    })

    // Récupérer les ChargeDetaillee pour chaque dossier
    for (const dossier of dossiers) {
      const charges = await prisma.chargeDetaillee.findMany({
        where: {
          dossierComptableId: dossier.id,
        },
      })

      const month = dossier.mois
      if (month >= 1 && month <= 12) {
        const totalCharges = charges.reduce((sum: number, charge: any) => {
          return sum + (charge.montantHT || 0)
        }, 0)
        monthlyData[month].charges += totalCharges
      }
    }

    // Formater les données pour le graphique
    const monthNames = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ]

    const trendData = Object.entries(monthlyData).map(([monthStr, data]) => {
      const month = parseInt(monthStr)
      return {
        name: monthNames[month - 1],
        entrees: data.entrees,
        charges: data.charges,
      }
    })

    return NextResponse.json({ trendData })
  } catch (error) {
    console.error('Erreur récupération trend:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données de tendance' },
      { status: 500 }
    )
  }
}
