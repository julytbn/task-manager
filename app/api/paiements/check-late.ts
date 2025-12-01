import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAndNotifyLatePayments, getLatePayments } from '@/lib/paymentLateService'

/**
 * GET /api/paiements/check-late
 * Vérifie les paiements en retard et crée des notifications
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier que l'utilisateur est authentifié et a les droits appropriés
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Optionnel: limiter à MANAGER
    if (session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Accès réservé aux managers' },
        { status: 403 }
      )
    }

    // Vérifier les retards et créer les notifications
    const result = await checkAndNotifyLatePayments()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur dans check-late:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification des retards' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/paiements/check-late
 * Récupère la liste des paiements actuellement en retard (sans créer de notifications)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Accès réservé aux managers' },
        { status: 403 }
      )
    }

    const latePayments = await getLatePayments()

    return NextResponse.json({
      success: true,
      count: latePayments.length,
      latePayments: latePayments.map(payment => ({
        id: payment.id,
        clientName: payment.client.nom,
        montant: payment.montant,
        daysLate: (payment as any).daysLate,
        dueDate: (payment as any).dueDate,
        projectName: payment.projet.titre,
      })),
    })
  } catch (error) {
    console.error('Erreur dans check-late POST:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paiements en retard' },
      { status: 500 }
    )
  }
}
