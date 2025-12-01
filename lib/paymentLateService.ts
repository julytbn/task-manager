import { prisma } from '@/lib/prisma'

/**
 * Service pour détecter les paiements en retard et créer des notifications
 */

type FrequencePaiement = 'PONCTUEL' | 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL'

/**
 * Calcule la date d'échéance attendue du paiement basée sur la fréquence
 */
export function calculateDueDateFromFrequency(
  datePaiement: Date,
  frequencePaiement: FrequencePaiement
): Date {
  const dueDate = new Date(datePaiement)

  switch (frequencePaiement) {
    case 'MENSUEL':
      dueDate.setMonth(dueDate.getMonth() + 1)
      break
    case 'TRIMESTRIEL':
      dueDate.setMonth(dueDate.getMonth() + 3)
      break
    case 'SEMESTRIEL':
      dueDate.setMonth(dueDate.getMonth() + 6)
      break
    case 'ANNUEL':
      dueDate.setFullYear(dueDate.getFullYear() + 1)
      break
    case 'PONCTUEL':
    default:
      // Pour ponctuel, on considère 7 jours
      dueDate.setDate(dueDate.getDate() + 7)
  }

  return dueDate
}

/**
 * Vérifie si un paiement est en retard
 */
export function isPaymentLate(
  expectedDueDate: Date,
  paymentStatus: string
): boolean {
  // Un paiement n'est en retard que s'il n'a pas été payé
  if (paymentStatus === 'CONFIRME' || paymentStatus === 'REMBOURSE') {
    return false
  }

  const now = new Date()
  return now > expectedDueDate
}

/**
 * Calcule le nombre de jours de retard
 */
export function calculateDaysLate(expectedDueDate: Date): number {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - expectedDueDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Détecte tous les paiements en retard et crée des notifications
 */
export async function checkAndNotifyLatePayments() {
  try {
    // Récupère tous les paiements en attente
    const pendingPayments = await prisma.paiement.findMany({
      where: {
        statut: 'EN_ATTENTE',
      },
      include: {
        projet: true,
        client: true,
        tache: {
          include: {
            assigneA: true,
          },
        },
      },
    })

    const latePayments = []

    for (const payment of pendingPayments) {
      // Calculer la date d'échéance attendue
      const dueDate = (payment as any).datePaiementAttendu || 
        calculateDueDateFromFrequency(payment.datePaiement, (payment.projet as any).frequencePaiement)

      // Vérifier si c'est en retard
      if (isPaymentLate(dueDate, payment.statut)) {
        const daysLate = calculateDaysLate(dueDate)
        latePayments.push({
          payment,
          dueDate,
          daysLate,
        })
      }
    }

    // Créer des notifications pour les paiements en retard
    for (const { payment, daysLate } of latePayments) {
      try {
        // Trouver les managers/utilisateurs de l'entreprise pour les notifier
        const managers = await prisma.utilisateur.findMany({
          where: {
            role: 'MANAGER', // Ou selon votre logique
          },
        })

        for (const manager of managers) {
          // Créer la notification
          await prisma.notification.create({
            data: {
              utilisateurId: manager.id,
              titre: `Paiement en retard - ${payment.client.nom}`,
              message: `Le paiement de ${payment.montant} FCFA pour le projet "${payment.projet.titre}" est en retard de ${daysLate} jours. Client: ${payment.client.nom}`,
              type: 'ALERTE',
              lien: `/dashboard/manager/paiements`,
            },
          })
        }
      } catch (error) {
        console.error(`Erreur lors de la création de notification pour le paiement ${payment.id}:`, error)
      }
    }

    return {
      success: true,
      latePaymentsCount: latePayments.length,
      latePayments: latePayments.map(({ payment, daysLate }) => ({
        id: payment.id,
        clientName: payment.client.nom,
        montant: payment.montant,
        daysLate,
      })),
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des retards de paiement:', error)
    throw error
  }
}

/**
 * Obtient tous les paiements en retard
 */
export async function getLatePayments() {
  try {
    const pendingPayments = await prisma.paiement.findMany({
      where: {
        statut: 'EN_ATTENTE',
      },
      include: {
        projet: true,
        client: true,
        tache: true,
      },
      orderBy: {
        datePaiement: 'asc',
      },
    })

    const latePayments = []

    for (const payment of pendingPayments) {
      const dueDate = (payment as any).datePaiementAttendu || 
        calculateDueDateFromFrequency(payment.datePaiement, (payment.projet as any).frequencePaiement)

      if (isPaymentLate(dueDate, payment.statut)) {
        const daysLate = calculateDaysLate(dueDate)
        latePayments.push({
          ...payment,
          dueDate,
          daysLate,
        })
      }
    }

    return latePayments.sort((a, b) => b.daysLate - a.daysLate) // Tri par jours de retard décroissant
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements en retard:', error)
    throw error
  }
}
