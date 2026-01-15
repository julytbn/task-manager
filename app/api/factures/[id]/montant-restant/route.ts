import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const factureId = params.id

    // Récupérer la facture avec ses paiements et ses lignes
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        paiements: {
          select: {
            montant: true,
            statut: true
          }
        },
        lignes: {
          select: {
            montant: true,
            type: true
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

    // Calculer le montant de main d'œuvre (bénéfice) seulement
    const montantMainDoeuvre = facture.lignes
      .filter(ligne => ligne.type === 'MAIN_D_OEUVRE')
      .reduce((sum, ligne) => sum + (ligne.montant || 0), 0)

    // Le montantTotal est ce qui doit être payé
    const montantTotal = facture.montant || 0

    // Le montantRestant = montantTotal - paiements
    const montantRestant = Math.max(0, montantTotal - totalPaiements)

    return NextResponse.json({ 
      montantRestant,
      montantTotal,
      montantMainDoeuvre,
      totalPaiements
    })
  } catch (error) {
    console.error('Erreur récupération montant restant:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: 'Erreur lors du calcul du montant restant', details: message },
      { status: 500 }
    )
  }
}
