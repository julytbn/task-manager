import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const proForma = await prisma.proForma.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: { id: true, nom: true, prenom: true, entreprise: true, email: true, adresse: true }
        },
        projet: {
          select: { id: true, titre: true }
        },
        lignes: {
          orderBy: { ordre: 'asc' }
        }
      }
    })

    if (!proForma) {
      return NextResponse.json(
        { error: 'Pro-forma non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(proForma)
  } catch (error) {
    console.error('Erreur récupération pro-forma:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const data = await request.json()

    // Vérifier que la pro-forma existe
    const proForma = await prisma.proForma.findUnique({
      where: { id: params.id }
    })

    if (!proForma) {
      return NextResponse.json(
        { error: 'Pro-forma non trouvée' },
        { status: 404 }
      )
    }

    // Préparer les lignes si modifiées
    let lignesUpdate = undefined
    if (Array.isArray(data.lignes)) {
      // Supprimer les anciennes lignes
      await prisma.proFormaLigne.deleteMany({
        where: { proFormaId: params.id }
      })

      // Créer les nouvelles lignes
      if (data.lignes.length > 0) {
        lignesUpdate = {
          create: data.lignes.map((l: any, index: number) => ({
            designation: l.designation,
            montant: Number(l.montant) || 0,
            intervenant: l.intervenant || null,
            ordre: index
          }))
        }
      }
    }

    // Mettre à jour la pro-forma
    const updated = await prisma.proForma.update({
      where: { id: params.id },
      data: {
        description: data.description ?? proForma.description,
        montant: data.montant ?? proForma.montant,
        statut: data.statut ?? proForma.statut,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : proForma.dateEcheance,
        notes: data.notes ?? proForma.notes,
        ...(lignesUpdate && { lignes: lignesUpdate })
      },
      include: {
        client: {
          select: { id: true, nom: true, prenom: true, entreprise: true }
        },
        projet: {
          select: { id: true, titre: true }
        },
        lignes: {
          orderBy: { ordre: 'asc' }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur mise à jour pro-forma:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que la pro-forma existe
    const proForma = await prisma.proForma.findUnique({
      where: { id: params.id }
    })

    if (!proForma) {
      return NextResponse.json(
        { error: 'Pro-forma non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer la pro-forma (les lignes seront supprimées en cascade)
    await prisma.proForma.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression pro-forma:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
