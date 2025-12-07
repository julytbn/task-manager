// app/api/projets/[id]/factures/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Récupérer toutes les factures du projet
    const factures = await prisma.facture.findMany({
      where: {
        projetId: projectId
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    return NextResponse.json(factures)
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    // Valider les données requises
    if (!body.numero || !body.numero.trim()) {
      return NextResponse.json(
        { error: 'Le numéro de facture est requis' },
        { status: 400 }
      )
    }

    if (!body.montant || parseFloat(body.montant) <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être supérieur à 0' },
        { status: 400 }
      )
    }

    // Vérifier que le numéro de facture n'existe pas déjà
    const existingInvoice = await prisma.facture.findUnique({
      where: { numero: body.numero }
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Ce numéro de facture existe déjà' },
        { status: 400 }
      )
    }

    // Vérifier que le projet existe
    const project = await prisma.projet.findUnique({
      where: { id: projectId },
      select: { serviceId: true, clientId: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    // Créer la nouvelle facture
    const newFacture = await prisma.facture.create({
      data: {
        numero: body.numero,
        montant: parseFloat(body.montant),
        tauxTVA: parseFloat(body.tauxTVA) || 18,
        montantTotal: parseFloat(body.montantTotal),
        dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
        notes: body.notes || null,
        client: { connect: { id: body.clientId || project.clientId } },
        service: { connect: { id: project.serviceId } },
        projet: { connect: { id: projectId } },
        statut: 'EN_ATTENTE'
      }
    })

    return NextResponse.json(newFacture, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la facture' },
      { status: 500 }
    )
  }
}
