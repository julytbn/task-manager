import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePaiementReceiptPDF } from '@/lib/pdfUtils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paiement = await prisma.paiement.findUnique({
      where: { id: params.id },
      include: { 
        facture: true, 
        client: true,
        projet: true
      }
    })

    if (!paiement) {
      return NextResponse.json(
        { error: 'Paiement introuvable' },
        { status: 404 }
      )
    }

    // Générer le PDF du reçu
    const pdfBuffer = await generatePaiementReceiptPDF(paiement)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recu_paiement_${paiement.id}.pdf"`
      }
    })
  } catch (error) {
    console.error('Erreur génération reçu:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du reçu' },
      { status: 500 }
    )
  }
}
