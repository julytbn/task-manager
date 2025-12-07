import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Vérifier les champs obligatoires
    if (!data.montant || !data.clientId) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (montant, clientId)' }, { status: 400 });
    }

    // Créer le paiement
    const paiement = await prisma.paiement.create({
      data: {
        montant: data.montant,
        moyenPaiement: data.moyenPaiement || 'VIREMENT_BANCAIRE',
        datePaiement: data.datePaiement ? new Date(data.datePaiement) : new Date(),
        statut: data.statut || 'EN_ATTENTE',
        factureId: data.factureId || undefined,
        clientId: data.clientId,
        tacheId: data.tacheId || undefined,
        projetId: data.projetId || data.serviceId || undefined,
        notes: data.notes || null,
        reference: data.reference || null,
      },
      include: { facture: true, client: true, projet: true }
    });

    // Si une facture est associée, mettre à jour son statut
    if (data.factureId) {
      const paiementsFacture = await prisma.paiement.findMany({
        where: { factureId: data.factureId, statut: { in: ['EN_ATTENTE', 'CONFIRME'] } },
      });
      const totalPayé = paiementsFacture.reduce((sum, p) => sum + (p.montant || 0), 0);

      const facture = await prisma.facture.findUnique({ where: { id: data.factureId } });
      let nouveauStatut: 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' = 'EN_ATTENTE';
      if (totalPayé >= (facture?.montantTotal || facture?.montant || 0)) {
        nouveauStatut = 'PAYEE';
      } else if (totalPayé > 0) {
        nouveauStatut = 'PARTIELLEMENT_PAYEE';
      }

      await prisma.facture.update({
        where: { id: data.factureId },
        data: { statut: nouveauStatut }
      });
    }

    return NextResponse.json({ paiement });
  } catch (error) {
    console.error('Erreur création paiement:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du paiement', details: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const allParam = url.searchParams.get('all')

    // Build base where clause
    const where: any = {}
    
    // Try to get session, but don't fail if it errors
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.role === 'EMPLOYE' && session.user.id) {
        where.tache = { assigneAId: session.user.id }
      }
    } catch (e) {
      console.log('Session fetch failed, continuing without session filter')
    }

    if (allParam === 'true') {
      try {
        const allPayments = await prisma.paiement.findMany({
          where,
          include: { client: true, tache: true, projet: true, facture: true }
        })

        // compute totals for this set
        const totals = allPayments.reduce(
          (acc, p) => {
            acc.total += p.montant || 0
            if (p.statut === 'CONFIRME') acc.paid += p.montant || 0
            else if (p.statut === 'EN_ATTENTE') acc.pending += p.montant || 0
            else acc.other += p.montant || 0
            return acc
          },
          { total: 0, paid: 0, pending: 0, other: 0 }
        )

        return NextResponse.json({ totals, payments: allPayments })
      } catch (err) {
        console.error('Error fetching all payments:', err)
        return NextResponse.json({ totals: { total: 0, paid: 0, pending: 0, other: 0 }, payments: [] })
      }
    }

    // Default behavior: recent + totals (for dashboard summary)
    try {
      const recent = await prisma.paiement.findMany({
        where,
        take: 10,
        include: { client: true, tache: true, projet: true, facture: true }
      })

      const some = await prisma.paiement.findMany({ where, select: { montant: true, statut: true } })
      const totals = some.reduce(
        (acc, p) => {
          acc.total += p.montant || 0
          if (p.statut === 'CONFIRME') acc.paid += p.montant || 0
          else if (p.statut === 'EN_ATTENTE') acc.pending += p.montant || 0
          else acc.other += p.montant || 0
          return acc
        },
        { total: 0, paid: 0, pending: 0, other: 0 }
      )

      return NextResponse.json({ totals, recent })
    } catch (err) {
      console.error('Error fetching recent payments:', err)
      return NextResponse.json({ totals: { total: 0, paid: 0, pending: 0, other: 0 }, recent: [] })
    }
  } catch (error) {
    console.error('GET /api/paiements error', error)
    return NextResponse.json({ error: 'Erreur récupération paiements', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json()
    const { id } = data

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const paiement = await prisma.paiement.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, paiement })
  } catch (error) {
    console.error('DELETE /api/paiements error', error)
    return NextResponse.json({ error: 'Erreur suppression paiement' }, { status: 500 })
  }
}
