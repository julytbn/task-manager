import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const factures = await prisma.facture.findMany({
      include: {
        client: { select: { id: true, nom: true } },
        projet: { select: { id: true, titre: true } }
      },
      orderBy: { dateEmission: 'desc' }
    })

    return NextResponse.json(factures)
  } catch (error) {
    console.error('Erreur récupération factures:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.numero || !data.clientId || !data.montant) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (numero, clientId, montant)' },
        { status: 400 }
      )
    }

    const montantTotal = data.montant * (1 + (data.tauxTVA || 0.18))

    const facture = await prisma.facture.create({
      data: {
        numero: data.numero,
        client: { connect: { id: data.clientId } },
        projet: data.projetId ? { connect: { id: data.projetId } } : undefined,
        statut: data.statut || 'EN_ATTENTE',
        montant: data.montant,
        tauxTVA: data.tauxTVA || 0.18,
        montantTotal,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : undefined,
        notes: data.notes || null
      },
      include: {
        client: { select: { id: true, nom: true } },
        projet: { select: { id: true, titre: true } }
      }
    })

    return NextResponse.json(facture, { status: 201 })
  } catch (error) {
    console.error('Erreur création facture:', error)
    const err = error as any
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Le numéro de facture existe déjà' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur lors de la création de la facture' },
      { status: 500 }
    )
  }
}
