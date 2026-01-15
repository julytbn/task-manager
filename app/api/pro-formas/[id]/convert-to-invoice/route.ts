import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Generate unique Invoice number
 * Format: FAC/YYYY/XXXXX
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const lastInvoice = await prisma.facture.findFirst({
    where: {
      numero: {
        startsWith: `FAC/${year}/`
      }
    },
    orderBy: {
      numero: 'desc'
    }
  })

  let nextNumber = 1
  if (lastInvoice) {
    const parts = lastInvoice.numero.split('/')
    const lastNum = parseInt(parts[2]) || 0
    nextNumber = lastNum + 1
  }

  return `FAC/${year}/${String(nextNumber).padStart(5, '0')}`
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer la pro-forma
    const proForma = await prisma.proForma.findUnique({
      where: { id: params.id },
      include: {
        lignes: true,
        client: true,
        projet: true
      }
    })

    if (!proForma) {
      return NextResponse.json(
        { error: 'Pro-forma non trouvée' },
        { status: 404 }
      )
    }

    // Générer le numéro de facture
    const factureNumero = await generateInvoiceNumber()

    // Créer les lignes de facture à partir des lignes pro-forma
    const factureLignes = proForma.lignes.map((l: any) => ({
      designation: l.designation,
      intervenant: l.intervenant || null,
      montant: l.montant,
      type: l.type || 'MAIN_D_OEUVRE',  // Préserver le type de la pro-forma
      ordre: l.ordre
    }))

    // Créer la facture avec référence à la pro-forma dans une transaction
    const facture = await prisma.$transaction(async (tx) => {
      // 1. Créer d'abord la facture sans la référence à la pro-forma
      const nouvelleFacture = await tx.facture.create({
        data: {
          numero: factureNumero,
          clientId: proForma.clientId,
          projetId: proForma.projetId || null,
          montant: proForma.montant,
          description: proForma.description || 'Convertie depuis pro-forma ' + proForma.numero,
          statut: 'EN_ATTENTE',
          dateEmission: new Date()
        }
      });

      // 2. Note: Pro-forma reference will be tracked separately
      // Pro-forma will be marked as converted to invoice

      // 3. Ajouter les lignes de facture
      if (factureLignes.length > 0) {
        await tx.factureLigne.createMany({
          data: factureLignes.map(l => ({
            ...l,
            factureId: nouvelleFacture.id
          }))
        });
      }

      // 4. Mettre à jour la pro-forma pour indiquer la conversion
      await tx.proForma.update({
        where: { id: proForma.id },
        data: {
          statut: 'FACTUREE',
          dateConversion: new Date()
        }
      });

      // 5. Récupérer la facture complète avec les relations
      return await tx.facture.findUnique({
        where: { id: nouvelleFacture.id },
        include: {
          client: { select: { id: true, nom: true } },
          projet: { select: { id: true, titre: true } },
          lignes: true
        }
      });
    });

    return NextResponse.json({
      success: true,
      proForma: proForma,
      facture: facture
    })
  } catch (error) {
    console.error('Erreur conversion pro-forma en facture:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la conversion' },
      { status: 500 }
    )
  }
}
