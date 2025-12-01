import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Récupérer les notifications de l'utilisateur connecté
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        utilisateur: {
          email: session.user.email,
        },
      },
      orderBy: {
        dateCreation: 'desc',
      },
      take: 20, // Limite à 20 dernières notifications
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    )
  }
}

// Marquer une notification comme lue
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notification manquant' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        utilisateur: {
          email: session.user.email,
        },
      },
      data: {
        lu: true,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la notification' },
      { status: 500 }
    )
  }
}

// Créer une nouvelle notification
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { titre, message, type, lien } = await request.json()

    if (!titre || !message) {
      return NextResponse.json(
        { error: 'Titre et message sont requis' },
        { status: 400 }
      )
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!utilisateur) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const notification = await prisma.notification.create({
      data: {
        titre,
        message,
        type: type || 'INFO',
        lien: lien || null,
        utilisateurId: utilisateur.id,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la notification' },
      { status: 500 }
    )
  }
}