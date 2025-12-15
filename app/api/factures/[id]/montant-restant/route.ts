import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const factureId = params.id

    // Récupérer la facture avec ses paiements
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        paiements: {
          select: {
            montant: true,
            statut: true
          }
        }
      }
    })

    if (!facture) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      )
    }

    // Calculer le montant total des paiements confirmés
    const totalPaiements = facture.paiements
      .filter(p => p.statut === 'CONFIRME' || p.statut === 'EN_ATTENTE')
      .reduce((sum, p) => sum + (p.montant || 0), 0)

    // Calculer le montant restant
    const montantRestant = Math.max(0, (facture.montant || 0) - totalPaiements)

    return NextResponse.json({ 
      montantRestant,
      montantTotal: facture.montant || 0,
      totalPaiements
    })
  } catch (error) {
    console.error('Erreur récupération montant restant:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul du montant restant' },
      { status: 500 }
    )
  }
}
