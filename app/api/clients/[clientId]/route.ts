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
            service: true,
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
