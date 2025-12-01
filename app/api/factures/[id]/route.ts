import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        projet: true,
        taches: {
          include: { assigneA: { select: { nom: true, prenom: true } } }
        },
        paiements: true
      }
    })

    if (!facture) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    return NextResponse.json(facture)
  } catch (error) {
    console.error('Erreur récupération facture:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la facture' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    const existing = await prisma.facture.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const updateData: any = {}
    if (data.statut !== undefined) updateData.statut = data.statut
    if (data.montant !== undefined) updateData.montant = data.montant
    if (data.tauxTVA !== undefined) updateData.tauxTVA = data.tauxTVA
    if (data.dateEcheance !== undefined) updateData.dateEcheance = data.dateEcheance ? new Date(data.dateEcheance) : null
    if (data.notes !== undefined) updateData.notes = data.notes

    // Recalcul montantTotal si montant ou tauxTVA change
    if (data.montant !== undefined || data.tauxTVA !== undefined) {
      const montant = data.montant ?? existing.montant
      const tva = data.tauxTVA ?? existing.tauxTVA
      updateData.montantTotal = montant * (1 + tva)
    }

    const updated = await prisma.facture.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        projet: true,
        taches: true,
        paiements: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur update facture:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la facture' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.facture.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    await prisma.facture.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur suppression facture:', error)
    const err = error as any
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Impossible de supprimer la facture : dépendances existantes' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la facture' },
      { status: 500 }
    )
  }
}
