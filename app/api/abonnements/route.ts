/**
 * API pour gérer les abonnements
 * Routes:
 * GET  /api/abonnements           - Récupérer tous les abonnements
 * POST /api/abonnements           - Créer un nouvel abonnement
 * GET  /api/abonnements/:id       - Récupérer un abonnement
 * PUT  /api/abonnements/:id       - Modifier un abonnement
 * DELETE /api/abonnements/:id     - Supprimer/annuler un abonnement
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInitialInvoiceForSubscription } from '@/lib/invoice-generator'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les abonnements
    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId')

    const whereClause: any = {}
    if (clientId) {
      whereClause.clientId = clientId
    }

    const abonnements = await (prisma as any).abonnement.findMany({
      where: whereClause,
      include: {
        client: true,
        service: true,
        factures: {
          orderBy: { dateEmission: 'desc' },
          take: 3,
        },
      },
      orderBy: { dateCreation: 'desc' },
    })

    return NextResponse.json(abonnements)
  } catch (error) {
    console.error('Erreur récupération abonnements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des abonnements' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Accès réservé aux managers' }, { status: 403 })
    }

    const data = await request.json()

    // Valider les champs obligatoires
    if (!data.nom || !data.clientId || !data.serviceId || !data.montant || !data.frequence) {
      return NextResponse.json(
        { error: 'Champs obligatoires: nom, clientId, serviceId, montant, frequence' },
        { status: 400 }
      )
    }

    // Calculer la date de prochaine facturation
    const dateDebut = new Date(data.dateDebut || new Date())
    const dateProchainFacture = new Date(dateDebut)

    switch (data.frequence) {
      case 'MENSUEL':
        dateProchainFacture.setMonth(dateProchainFacture.getMonth() + 1)
        break
      case 'TRIMESTRIEL':
        dateProchainFacture.setMonth(dateProchainFacture.getMonth() + 3)
        break
      case 'SEMESTRIEL':
        dateProchainFacture.setMonth(dateProchainFacture.getMonth() + 6)
        break
      case 'ANNUEL':
        dateProchainFacture.setFullYear(dateProchainFacture.getFullYear() + 1)
        break
      default:
        dateProchainFacture.setDate(dateProchainFacture.getDate() + 7)
    }

    const abonnement = await (prisma as any).abonnement.create({
      data: {
        nom: data.nom,
        description: data.description,
        clientId: data.clientId,
        serviceId: data.serviceId,
        montant: parseFloat(data.montant),
        frequence: data.frequence,
        statut: 'ACTIF',
        dateDebut,
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        dateProchainFacture,
      },
      include: {
        client: true,
        service: true,
      },
    })

    // Générer automatiquement la première facture de l'abonnement
    try {
      const invoiceResult = await generateInitialInvoiceForSubscription(abonnement)
      if (invoiceResult.success) {
        console.log(`✅ Facture initiale créée: ${invoiceResult.invoiceNumber} pour l'abonnement ${abonnement.id}`)
      } else {
        console.error(`❌ Erreur création facture initiale pour l'abonnement ${abonnement.id}`)
        throw new Error('Impossible de créer la facture initiale pour l\'abonnement')
      }
    } catch (invoiceError) {
      console.error('Erreur critique création facture initiale:', invoiceError)
      // Annuler la création de l'abonnement si la facture ne peut pas être créée
      await (prisma as any).abonnement.delete({ where: { id: abonnement.id } })
      throw invoiceError
    }

    return NextResponse.json(abonnement, { status: 201 })
  } catch (error) {
    console.error('Erreur création abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'abonnement' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Accès réservé aux managers' }, { status: 403 })
    }

    const data = await request.json()
    const abonnementId = params.id

    const updateData: any = {}
    if (data.nom) updateData.nom = data.nom
    if (data.description !== undefined) updateData.description = data.description
    if (data.montant) updateData.montant = parseFloat(data.montant)
    if (data.frequence) updateData.frequence = data.frequence
    if (data.statut) updateData.statut = data.statut
    if (data.dateFin !== undefined) updateData.dateFin = data.dateFin ? new Date(data.dateFin) : null

    const abonnement = await (prisma as any).abonnement.update({
      where: { id: abonnementId },
      data: updateData,
      include: {
        client: true,
        service: true,
      },
    })

    return NextResponse.json(abonnement)
  } catch (error) {
    console.error('Erreur mise à jour abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'abonnement' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Accès réservé aux managers' }, { status: 403 })
    }

    const abonnementId = params.id

    const abonnement = await (prisma as any).abonnement.update({
      where: { id: abonnementId },
      data: {
        statut: 'ANNULE',
        dateFin: new Date(),
      },
    })

    return NextResponse.json({ message: 'Abonnement annulé', abonnement })
  } catch (error) {
    console.error('Erreur annulation abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de l\'abonnement' },
      { status: 500 }
    )
  }
}
