import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Generate unique ProForma number
 * Format: PF/YYYY/XXXXX (where XXXXX is incremental)
 */
async function generateProFormaNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const lastProForma = await prisma.proForma.findFirst({
    where: {
      numero: {
        startsWith: `PF/${year}/`
      }
    },
    orderBy: {
      numero: 'desc'
    }
  })

  let nextNumber = 1
  if (lastProForma) {
    const parts = lastProForma.numero.split('/')
    const lastNum = parseInt(parts[2]) || 0
    nextNumber = lastNum + 1
  }

  return `PF/${year}/${String(nextNumber).padStart(5, '0')}`
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const statut = searchParams.get('statut')

    const where: any = {}
    if (clientId) where.clientId = clientId
    if (statut) where.statut = statut

    const proFormas = await prisma.proForma.findMany({
      where,
      include: {
        client: {
          select: { id: true, nom: true, prenom: true, entreprise: true, adresse: true }
        },
        projet: {
          select: { id: true, titre: true }
        },
        lignes: {
          orderBy: { ordre: 'asc' }
        }
      },
      orderBy: { dateCreation: 'desc' }
    })

    return NextResponse.json(proFormas)
  } catch (error) {
    console.error('Erreur récupération pro-formas:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pro-formas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const data = await request.json()

    // Validation champs obligatoires
    if (!data.clientId || !data.montant) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (clientId, montant)' },
        { status: 400 }
      )
    }

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Générer le numéro unique
    const numero = await generateProFormaNumber()

    // Préparer les lignes si présentes
    const lignesCreate = Array.isArray(data.lignes) && data.lignes.length
      ? data.lignes.map((l: any, index: number) => ({
          designation: l.designation,
          montant: Number(l.montant) || 0,
          intervenant: l.intervenant || null,
          type: l.type || 'MAIN_D_OEUVRE', // Ajouter le type pour différencier les lignes
          ordre: index
        }))
      : undefined

    // Créer la ProForma
    const proForma = await prisma.proForma.create({
      data: {
        numero,
        clientId: data.clientId,
        projetId: data.projetId || null,
        montant: parseFloat(data.montant),
        description: data.description || null,
        statut: data.statut || 'EN_COURS',
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        creePar: session.user?.id || null,
        notes: data.notes || null,
        lignes: lignesCreate ? { create: lignesCreate } : undefined
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

    return NextResponse.json(proForma, { status: 201 })
  } catch (error) {
    console.error('Erreur création pro-forma:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la pro-forma' },
      { status: 500 }
    )
  }
}
