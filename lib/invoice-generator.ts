/**
 * Service de génération automatique de factures
 * Gère la création de factures basées sur les abonnements actifs
 */

import { prisma } from './prisma'

interface InvoiceGenerationResult {
  success: boolean
  invoicesGenerated: number
  details: Array<{
    subscriptionId: string
    clientName: string
    invoiceNumber: string
    amount: number
    status: 'success' | 'error'
    message?: string
  }>
}

/**
 * Calcule la prochaine date d'échéance basée sur la fréquence
 */
function calculateNextDueDate(frequency: string, fromDate: Date = new Date()): Date {
  const dueDate = new Date(fromDate)

  switch (frequency) {
    case 'MENSUEL':
      dueDate.setMonth(dueDate.getMonth() + 1)
      dueDate.setDate(15) // Échéance 15 jours après
      break
    case 'TRIMESTRIEL':
      dueDate.setMonth(dueDate.getMonth() + 3)
      dueDate.setDate(15)
      break
    case 'SEMESTRIEL':
      dueDate.setMonth(dueDate.getMonth() + 6)
      dueDate.setDate(15)
      break
    case 'ANNUEL':
      dueDate.setFullYear(dueDate.getFullYear() + 1)
      dueDate.setDate(15)
      break
    default:
      dueDate.setDate(dueDate.getDate() + 15)
  }

  return dueDate
}

/**
 * Génère un numéro de facture unique
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Compter le nombre de factures pour ce mois
  const invoiceCount = await prisma.facture.count({
    where: {
      dateCreation: {
        gte: new Date(year, new Date().getMonth(), 1),
        lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    }
  })

  const sequence = String(invoiceCount + 1).padStart(4, '0')
  return `FACT-${year}${month}-${sequence}`
}

/**
 * Crée une facture pour un abonnement
 */
async function createSubscriptionInvoice(subscription: any): Promise<{
  invoiceNumber: string
  amount: number
  success: boolean
  message?: string
}> {
  try {
    // Valider que l'abonnement est actif
    if (subscription.statut !== 'ACTIF') {
      return {
        invoiceNumber: '',
        amount: 0,
        success: false,
        message: `Abonnement non actif (statut: ${subscription.statut})`
      }
    }

    // Vérifier la date de fin si elle existe
    if (subscription.dateFin && new Date(subscription.dateFin) < new Date()) {
      return {
        invoiceNumber: '',
        amount: 0,
        success: false,
        message: 'Abonnement expiré'
      }
    }

    // Générer le numéro de facture
    const invoiceNumber = await generateInvoiceNumber()

    // Calculer les dates
    const now = new Date()
    const dueDate = calculateNextDueDate(subscription.frequence, now)

    // Déterminer la période couverte
    const lastPaymentDate = subscription.dernierPaiement 
      ? new Date(subscription.dernierPaiement)
      : new Date(subscription.dateDebut)

    // Montant sans TVA
    const montant = subscription.montant

    // Créer la facture
    const facture = await prisma.facture.create({
      data: {
        numero: invoiceNumber,
        clientId: subscription.clientId,
        abonnementId: subscription.id,
        montant: montant,
        statut: 'EN_ATTENTE',
        dateEmission: now,
        dateEcheance: dueDate,
        notes: `Facture générée automatiquement pour l'abonnement: ${subscription.nom}`
      }
    } as any)

    // Mettre à jour la date de prochaine facturation de l'abonnement
    await prisma.abonnement.update({
      where: { id: subscription.id },
      data: {
        dateProchainFacture: calculateNextDueDate(subscription.frequence, now),
        nombrePaiementsEffectues: {
          increment: 1
        }
      }
    })

    return {
      invoiceNumber: facture.numero,
      amount: facture.montant,
      success: true,
      message: 'Facture créée avec succès'
    }
  } catch (error) {
    console.error('Erreur création facture pour abonnement:', error)
    return {
      invoiceNumber: '',
      amount: 0,
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Génère automatiquement les factures pour tous les abonnements
 * Appelé par le cron job ou manuellement
 */
export async function generateSubscriptionInvoices(): Promise<InvoiceGenerationResult> {
  const result: InvoiceGenerationResult = {
    success: true,
    invoicesGenerated: 0,
    details: []
  }

  try {
    // Récupérer tous les abonnements actifs dont la date de facturation est dépassée
    const subscriptions = await prisma.abonnement.findMany({
      where: {
        statut: 'ACTIF',
        dateProchainFacture: {
          lte: new Date() // La date de prochaine facturation est dépassée ou aujourd'hui
        },
        AND: [
          {
            OR: [
              { dateFin: { gt: new Date() } }, // Date de fin dans le futur
              { dateFin: null }                 // Pas de date de fin
            ]
          }
        ]
      },
      include: {
        client: true,
      }
    })

    console.log(`[INVOICE GENERATOR] ${subscriptions.length} abonnements à facturer`)

    // Créer une facture pour chaque abonnement
    for (const subscription of subscriptions) {
      const invoiceResult = await createSubscriptionInvoice(subscription)
      const client = await prisma.client.findUnique({
        where: { id: subscription.clientId }
      })

      result.details.push({
        subscriptionId: subscription.id,
        clientName: client?.nom || 'Client inconnu',
        invoiceNumber: invoiceResult.invoiceNumber || 'N/A',
        amount: invoiceResult.amount,
        status: invoiceResult.success ? 'success' : 'error',
        message: invoiceResult.message
      })

      if (invoiceResult.success) {
        result.invoicesGenerated++
      } else {
        result.success = false
      }
    }

    console.log(`[INVOICE GENERATOR] ${result.invoicesGenerated} factures générées avec succès`)

    return result
  } catch (error) {
    console.error('[INVOICE GENERATOR] Erreur globale:', error)
    result.success = false
    return result
  }
}

/**
 * Génère une facture lors de la création d'un abonnement
 */
export async function generateInitialInvoiceForSubscription(subscription: any): Promise<{
  invoiceNumber: string
  success: boolean
}> {
  try {
    const invoiceNumber = await generateInvoiceNumber()

    const montant = subscription.montant

    await prisma.facture.create({
      data: {
        numero: invoiceNumber,
        clientId: subscription.clientId,
        abonnementId: subscription.id,
        montant: montant,
        statut: 'EN_ATTENTE',
        dateEmission: new Date(),
        dateEcheance: calculateNextDueDate(subscription.frequence),
        notes: `Première facture de l'abonnement: ${subscription.nom}`
      }
    } as any)

    return {
      invoiceNumber,
      success: true
    }
  } catch (error) {
    console.error('Erreur création facture initiale:', error)
    return {
      invoiceNumber: '',
      success: false
    }
  }
}
