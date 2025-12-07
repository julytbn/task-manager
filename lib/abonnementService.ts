import { prisma } from '@/lib/prisma'

/**
 * Service pour gérer les abonnements et la génération automatique de factures
 */

type FrequencePaiementType = 'PONCTUEL' | 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL'

/**
 * Calcule la prochaine date de facturation basée sur la fréquence
 */
export function calculateNextBillingDate(
  currentDate: Date,
  frequency: FrequencePaiementType
): Date {
  const nextDate = new Date(currentDate)

  switch (frequency) {
    case 'MENSUEL':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'TRIMESTRIEL':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'SEMESTRIEL':
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case 'ANNUEL':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case 'PONCTUEL':
    default:
      nextDate.setDate(nextDate.getDate() + 7)
  }

  return nextDate
}

/**
 * Obtient le nombre de jours pour une fréquence
 */
export function getDaysForFrequency(frequency: FrequencePaiementType): number {
  switch (frequency) {
    case 'MENSUEL':
      return 30
    case 'TRIMESTRIEL':
      return 90
    case 'SEMESTRIEL':
      return 180
    case 'ANNUEL':
      return 365
    case 'PONCTUEL':
    default:
      return 7
  }
}

/**
 * Crée un nouvel abonnement
 */
export async function createSubscription(data: {
  nom: string
  description?: string
  clientId: string
  serviceId: string
  montant: number
  frequence: FrequencePaiementType
  dateDebut: Date
  dateFin?: Date
}) {
  const dateProchainFacture = calculateNextBillingDate(data.dateDebut, data.frequence)

  const sub = await prisma.abonnement.create({
    data: {
      nom: data.nom,
      description: data.description,
      clientId: data.clientId,
      serviceId: data.serviceId,
      montant: data.montant,
      frequence: data.frequence as FrequencePaiementType,
      statut: 'ACTIF',
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      dateProchainFacture: dateProchainFacture,
    },
    include: {
      client: true,
      service: true,
    },
  })
}

/**
 * Génère automatiquement les factures pour les abonnements à date d'aujourd'hui
 */
export async function generateDueInvoices() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Récupérer tous les abonnements actifs dont la date de facturation est aujourd'hui ou avant
  const subscriptionsToInvoice = await prisma.abonnement.findMany({
    where: {
      statut: 'ACTIF',
      dateProchainFacture: {
        lte: today,
      },
      // Exclure les abonnements terminés
      OR: [
        {
          dateFin: null,
        },
        {
          dateFin: {
            gte: today,
          },
        },
      ],
    },
    include: {
      client: true,
      service: true,
    },
  })

  const invoices = []

  for (const subscription of subscriptionsToInvoice) {
    try {
      // Générer un numéro de facture unique
      const invoiceNumber = `FAC-${subscription.id.toUpperCase().slice(0, 8)}-${Date.now()}`

      // Calculer montant TTC
      const tauxTVA = 0.18
      const montantHT = subscription.montant
      const montantTTC = montantHT * (1 + tauxTVA)

      // Créer la facture
      const invoice = await prisma.facture.create({
        data: {
          numero: invoiceNumber,
          clientId: subscription.clientId,
          serviceId: subscription.serviceId,
          abonnementId: subscription.id,
          statut: 'EN_ATTENTE',
          montant: montantHT,
          tauxTVA: tauxTVA,
          montantTotal: montantTTC,
          dateEmission: today,
          dateEcheance: calculateNextBillingDate(today, subscription.frequence as FrequencePaiementType),
          notes: `Facturation ${subscription.frequence} - ${subscription.nom}`,
        } as any,
        include: {
          client: true,
          abonnement: true,
        },
      })

      // Mettre à jour l'abonnement avec la prochaine date de facturation
      const nextBillingDate = calculateNextBillingDate(
        subscription.dateProchainFacture,
        subscription.frequence as FrequencePaiementType
      )

      await prisma.abonnement.update({
        where: { id: subscription.id },
        data: {
          dateProchainFacture: nextBillingDate,
          nombrePaiementsEffectues: {
            increment: 1,
          },
        },
      })

      invoices.push({
        id: invoice.id,
        numero: invoice.numero,
        abonnementNom: subscription.nom,
        clientNom: subscription.client.nom,
        montant: invoice.montantTotal,
        dateEmission: invoice.dateEmission,
      })
    } catch (error) {
      console.error(`Erreur lors de la génération de facture pour l'abonnement ${subscription.id}:`, error)
    }
  }

  return invoices
}

/**
 * Récupère les abonnements actifs
 */
export async function getActiveSubscriptions() {
  return prisma.abonnement.findMany({
    where: {
      statut: 'ACTIF',
    },
    include: {
      client: true,
      service: true,
    },
    orderBy: {
      dateProchainFacture: 'asc',
    },
  })
}

/**
 * Récupère les abonnements d'un client
 */
export async function getClientSubscriptions(clientId: string) {
  return prisma.abonnement.findMany({
    where: {
      clientId,
    },
    include: {
      service: true,
      factures: {
        orderBy: {
          dateEmission: 'desc',
        },
        take: 5,
      },
    },
    orderBy: {
      dateCreation: 'desc',
    },
  })
}

/**
 * Met à jour un abonnement
 */
export async function updateSubscription(
  id: string,
  data: {
    nom?: string
    description?: string
    montant?: number
    frequence?: FrequencePaiementType
    statut?: 'ACTIF' | 'SUSPENDU' | 'EN_RETARD' | 'ANNULE' | 'TERMINE'
    dateFin?: Date | null
  }
) {
  return prisma.abonnement.update({
    where: { id },
    data: {
      ...data,
      frequence: data.frequence ? (data.frequence as FrequencePaiementType) : undefined,
    },
    include: {
      client: true,
      service: true,
    },
  })
}

/**
 * Annule un abonnement
 */
export async function cancelSubscription(id: string) {
  return prisma.abonnement.update({
    where: { id },
    data: {
      statut: 'ANNULE',
      dateFin: new Date(),
    },
  })
}

/**
 * Récupère les factures dues dans les 7 prochains jours
 */
export async function getUpcomingInvoices(daysAhead: number = 7) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return prisma.abonnement.findMany({
    where: {
      statut: 'ACTIF',
      dateProchainFacture: {
        gte: today,
        lte: futureDate,
      },
    },
    include: {
      client: true,
      service: true,
    },
    orderBy: {
      dateProchainFacture: 'asc',
    },
  })
}

/**
 * Détecte et met à jour les abonnements en retard
 */
export async function checkAndUpdateLateSubscriptions() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Récupérer les abonnements actifs avec factures non payées
  const lateSubscriptions = await prisma.abonnement.findMany({
    where: {
      statut: {
        notIn: ['ANNULE', 'TERMINE'],
      },
      factures: {
        some: {
          statut: {
            in: ['EN_ATTENTE'],
          },
          dateEcheance: {
            lt: today,
          },
        },
      },
    },
    include: {
      client: true,
      factures: {
        where: {
          statut: 'EN_ATTENTE',
          dateEcheance: {
            lt: today,
          },
        },
      },
    },
  })

  // Mettre à jour le statut à EN_RETARD
  for (const subscription of lateSubscriptions) {
    await prisma.abonnement.update({
      where: { id: subscription.id },
      data: {
        statut: 'EN_RETARD',
      },
    })
  }

  return lateSubscriptions.map((sub: any) => ({
    id: sub.id,
    nom: sub.nom,
    clientNom: sub.client.nom,
    nombreJoursRetard: Math.floor((today.getTime() - Math.min(...sub.factures.map((f: any) => new Date(f.dateEcheance!).getTime()))) / (1000 * 60 * 60 * 24)),
    montant: sub.montant,
  }))
}
