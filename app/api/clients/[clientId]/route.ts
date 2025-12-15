import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { clientId: string } }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      include: {
        abonnements: true,
        projets: {
          include: {
            projetServices: {
              include: {
                service: {
                  select: {
                    id: true,
                    nom: true,
                    prix: true,
                    categorie: true,
                    description: true,
                  }
                }
              }
            }
          },
        },
        factures: true,
        paiements: true,
        documents: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur récupération client:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { clientId: string } }) {
  try {
    const data = await request.json()

    const updated = await prisma.client.update({
      where: { id: params.clientId },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || null,
        telephone: data.telephone || null,
        entreprise: data.entreprise || null,
        adresse: data.adresse || null,
        type: data.type,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        gudefUrl: data.gudefUrl || null,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/clients/[clientId] error', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { clientId: string } }) {
  try {
    await prisma.client.delete({
      where: { id: params.clientId }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/clients/[clientId] error', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
