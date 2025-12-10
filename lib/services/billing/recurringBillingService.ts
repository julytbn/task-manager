import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Service pour gérer la facturation récurrente
 * Responsabilités :
 * - Générer des factures récurrentes pour les abonnements actifs
 * - Gérer les échéances des factures
 * - Suivre les paiements récurrents
 */

class RecurringBillingService {
  /**
   * Générer des factures pour les abonnements actifs dont la date d'échéance est atteinte
   */
  async generateRecurringInvoices() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Récupérer les abonnements actifs dont la date de prochaine facture est aujourd'hui ou antérieure
    const activeSubscriptions = await prisma.abonnement.findMany({
      where: {
        statut: 'ACTIF',
        dateProchainFacture: {
          lte: today
        }
      },
      include: {
        client: true,
        service: true
      }
    });

    const results = [];

    // 2. Pour chaque abonnement, générer une facture
    for (const subscription of activeSubscriptions) {
      try {
        // Créer la facture
        const invoice = await this.createInvoiceFromSubscription(subscription);
        
        // Mettre à jour la date de la prochaine facture et incrémenter le compteur de paiements
        const nextBillingDate = this.calculateNextBillingDate(
          new Date(), // Utiliser la date actuelle comme date de référence
          subscription.frequence
        );

        await prisma.abonnement.update({
          where: { id: subscription.id },
          data: {
            dernierPaiement: new Date(),
            dateProchainFacture: nextBillingDate,
            nombrePaiementsEffectues: {
              increment: 1
            }
          }
        });

        results.push({
          success: true,
          subscriptionId: subscription.id,
          invoiceId: invoice.id,
          message: 'Facture générée avec succès'
        });
      } catch (error) {
        console.error(`Erreur lors de la génération de la facture pour l'abonnement ${subscription.id}:`, error);
        results.push({
          success: false,
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return results;
  }

  /**
   * Créer une facture à partir d'un abonnement
   */
  private async createInvoiceFromSubscription(subscription: any) {
    // Calculer les montants
    const tauxTVA = 0.18; // 18% de TVA par défaut
    const montantHT = subscription.montant;
    const montantTVA = montantHT * tauxTVA;
    const montantTTC = montantHT + montantTVA;
    
    // Générer un numéro de facture unique
    const numeroFacture = `FACT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(subscription.id).substring(0, 4).toUpperCase()}`;

    // Créer la facture
    const invoice = await prisma.facture.create({
      data: {
        numero: numeroFacture,
        client: {
          connect: { id: subscription.clientId }
        },
        statut: 'EN_ATTENTE',
        montant: montantHT,
        tauxTVA: tauxTVA,
        montantTotal: montantTTC,
        dateEmission: new Date(),
        dateEcheance: this.calculateDueDate(30), // 30 jours pour payer
        abonnement: {
          connect: { id: subscription.id }
        },
        notes: `Facture pour l'abonnement ${subscription.nom} (${subscription.service?.nom || 'Service'})`
      }
    });

    return invoice;
  }

  /**
   * Calculer la date d'échéance (30 jours par défaut)
   */
  private calculateDueDate(days = 30): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  /**
   * Calculer la prochaine date de facturation en fonction de la fréquence
   */
  private calculateNextBillingDate(lastBillingDate: Date, frequency: string): Date {
    const nextDate = new Date(lastBillingDate);
    
    switch (frequency) {
      case 'MENSUEL':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'TRIMESTRIEL':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'ANNUEL':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1); // Par défaut, mensuel
    }

    return nextDate;
  }

  /**
   * Vérifier les factures en retard et envoyer des rappels si nécessaire
   */
  async checkOverdueInvoices() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Récupérer les factures en retard de paiement
    const overdueInvoices = await prisma.facture.findMany({
      where: {
        statut: 'EN_ATTENTE',
        dateEcheance: {
          lt: today
        },
        // Vérifier qu'il n'y a pas de paiement associé
        paiements: {
          none: {}
        }
      },
      include: {
        client: true,
        abonnement: true
      }
    });

    const results = [];

    for (const invoice of overdueInvoices) {
      try {
        // Envoyer un email de rappel (à implémenter)
        await this.sendReminderEmail(invoice);
        
        // Mettre à jour les notes de la facture pour indiquer qu'un rappel a été envoyé
        await prisma.facture.update({
          where: { id: invoice.id },
          data: {
            notes: `[${new Date().toISOString()}] Rappel de paiement envoyé.\n${invoice.notes || ''}`
          }
        });

        results.push({
          success: true,
          invoiceId: invoice.id,
          message: 'Rappel envoyé avec succès'
        });
      } catch (error) {
        console.error(`Erreur lors de l'envoi du rappel pour la facture ${invoice.id}:`, error);
        results.push({
          success: false,
          invoiceId: invoice.id,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return results;
  }

  /**
   * Envoyer un email de rappel pour une facture en retard
   */
  private async sendReminderEmail(invoice: any) {
    // TODO: Implémenter l'envoi d'email
    console.log(`Envoi d'un rappel pour la facture ${invoice.reference} à ${invoice.client.email}`);
    // Utiliser un service d'email comme SendGrid, Nodemailer, etc.
  }

  /**
   * Exécuter toutes les tâches de facturation récurrente
   */
  async runBillingTasks() {
    const results = {
      invoicesGenerated: await this.generateRecurringInvoices(),
      overdueReminders: await this.checkOverdueInvoices()
    };

    return results;
  }
}

export const recurringBillingService = new RecurringBillingService();
