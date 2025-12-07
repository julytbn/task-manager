import { prisma } from '@/lib/prisma'
import { sendEmail, generateLatePaymentEmail } from '@/lib/email'

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
        facture: true,
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
      // CORRECTION: Utiliser facture.dateEcheance au lieu de datePaiementAttendu (inexistant)
      let dueDate = payment.facture?.dateEcheance
      
      if (!dueDate) {
        // Fallback: calculer à partir de la fréquence si pas de facture/dateEcheance
        dueDate = calculateDueDateFromFrequency(
          payment.datePaiement, 
          (payment.projet as any)?.frequencePaiement || 'PONCTUEL'
        )
      }

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
          // Avoid duplicate notifications for the same payment -> check existing
          const lien = `/dashboard/manager/paiements/${payment.id}`
          const sourceId = payment.id
          const sourceType = 'PAIEMENT'

          // Try to avoid duplicate alerts for same payment and manager within last 7 days or if unread
          const existing = await prisma.notification.findFirst({
            where: ({
              utilisateurId: manager.id,
              type: 'ALERTE',
              OR: [
                { sourceId },
                {
                  AND: [
                    { lien },
                    { lu: false }
                  ]
                },
                {
                  AND: [
                    { lien },
                    { dateCreation: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
                  ]
                }
              ]
            } as any)
          } as any)

          if (existing) {
            // already notified recently for this manager
            continue
          }

          // Create the notification with sourceId/sourceType
          await prisma.notification.create({
            data: ({
              utilisateurId: manager.id,
              titre: `Paiement en retard - ${payment.client.nom}`,
              message: `Le paiement de ${payment.montant} FCFA pour le projet \"${payment.projet?.titre || 'N/A'}\" est en retard de ${daysLate} jours. Client: ${payment.client.nom}`,
              type: 'ALERTE',
              lien,
              sourceId,
              sourceType,
            } as any)
          } as any)

          // 📧 NOUVEAU: Envoyer email d'alerte
          try {
            const emailTemplate = generateLatePaymentEmail({
              managerName: `${manager.prenom || ''} ${manager.nom || manager.email}`.trim(),
              clientName: payment.client.nom,
              amount: payment.montant || 0,
              daysLate,
              projectName: payment.projet?.titre,
              dashboardUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/dashboard/manager/paiements`
            })

            const result = await sendEmail({
              to: manager.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              from: process.env.SMTP_FROM || 'noreply@kekeligroup.com'
            })

            if (result.success) {
              console.log(`📧 Email alerte retard envoyé à ${manager.email}`)
            } else {
              console.warn(`⚠️ Erreur envoi email à ${manager.email}:`, result.error)
            }
          } catch (emailError) {
            console.error(`❌ Erreur lors de l'envoi d'email à ${manager.email}:`, emailError)
            // Continuer même si l'email échoue - la notification est créée en BDD
          }
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
