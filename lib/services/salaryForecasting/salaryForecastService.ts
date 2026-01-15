import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { addDays } from "date-fns";

/**
 * Service de prévision des salaires
 * Gère:
 * - Calcul des prévisions salariales basé sur les timesheets
 * - Notifications avant le paiement
 * - Génération des prévisions mensuelles
 */

export interface SalaryForecastData {
  employeId: string;
  mois: number;
  annee: number;
  montantPrevu: number;
  heuresValidees: number;
}

class SalaryForecastService {
  /**
   * Recalculer la prévision salariale pour un mois/année donné
   * S'appelle après validation d'un timesheet
   */
  async recalculateSalaryForecast(
    employeId: string,
    dateTimesheet: Date
  ): Promise<SalaryForecastData | null> {
    try {
      const mois = dateTimesheet.getMonth() + 1; // 1-12
      const annee = dateTimesheet.getFullYear();

      // Récupérer l'employé avec son tarif horaire
      const employe = await prisma.utilisateur.findUnique({
        where: { id: employeId },
      }) as any;

      if (!employe) {
        console.warn(`[SalaryForecast] Employé ${employeId} non trouvé`);
        return null;
      }
      
      const tarif = employe.tarifHoraire;
      if (!tarif) {
        console.warn(`[SalaryForecast] Employé ${employeId} sans tarif horaire configuré`);
        return null;
      }

      // Récupérer tous les timesheets validés du mois pour cet employé
      const debut = new Date(annee, mois - 1, 1);
      const fin = new Date(annee, mois, 0, 23, 59, 59);

      const timesheets = await prisma.timeSheet.findMany({
        where: {
          employeeId: employeId,
          statut: "VALIDEE", // Uniquement les timesheets validés
          date: {
            gte: debut,
            lte: fin,
          },
        },
        select: {
          regularHrs: true,
          overtimeHrs: true,
        },
      });

      // Calculer le total des heures
      const heuresValidees = timesheets.reduce((total, ts) => {
        const regular = ts.regularHrs || 0;
        const overtime = ts.overtimeHrs || 0;
        return total + regular + overtime;
      }, 0);

      // Calculer le montant prévu
      const montantPrevu = heuresValidees * tarif;

      // Créer ou mettre à jour la prévision
      const prevision = await (prisma as any).previsionSalaire.upsert({
        where: {
          employeId_mois_annee: {
            employeId,
            mois,
            annee,
          },
        },
        create: {
          employeId,
          mois,
          annee,
          montantPrevu,
        },
        update: {
          montantPrevu,
          dateModification: new Date(),
        },
      });

      console.log(
        `[SalaryForecast] Prévision mise à jour pour ${employe.nom} ${employe.prenom}: ${montantPrevu} FCFA (${heuresValidees}h)`
      );

      return {
        employeId,
        mois,
        annee,
        montantPrevu,
        heuresValidees,
      };
    } catch (error) {
      console.error("[SalaryForecast] Erreur lors du recalcul:", error);
      throw error;
    }
  }

  /**
   * Récupérer la prévision salariale pour un mois/année
   */
  async getSalaryForecast(
    employeId: string,
    mois?: number,
    annee?: number
  ) {
    const where: any = { employeId };

    if (mois !== undefined && annee !== undefined) {
      where.mois = mois;
      where.annee = annee;
    }

    return (prisma as any).previsionSalaire.findMany({
      where,
      include: {
        employe: {
          select: {
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
      orderBy: [{ annee: "desc" }, { mois: "desc" }],
    });
  }

  /**
   * Envoyer les notifications 5 jours avant le paiement (dernière jour du mois)
   * À appeler régulièrement (daily/hourly)
   */
  async sendPaymentNotifications(): Promise<{
    sent: number;
    failed: number;
  }> {
    try {
      const now = new Date();
      const mois = now.getMonth() + 1;
      const annee = now.getFullYear();

      // Trouver le dernier jour du mois
      const dernierJourMois = new Date(annee, mois, 0);
      const joursAvantPaiement = Math.floor(
        (dernierJourMois.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Si on est à 5 jours avant le paiement
      if (joursAvantPaiement === 5) {
        const previsions = await (prisma as any).previsionSalaire.findMany({
          where: {
            mois,
            annee,
            dateNotification: null, // Pas encore notifié ce mois-ci
          },
          include: {
            employe: {
              select: {
                id: true,
                email: true,
                nom: true,
                prenom: true,
                tarifHoraire: true,
              },
            },
          },
        });

        let sent = 0;
        let failed = 0;

        for (const prevision of previsions) {
          try {
            await this.sendPaymentNotificationEmail(prevision);
            
            // Marquer comme notifié
            await (prisma as any).previsionSalaire.update({
              where: { id: prevision.id },
              data: {
                dateNotification: now,
                montantNotifie: prevision.montantPrevu,
              },
            });

            // Créer une notification in-app
            await prisma.notification.create({
              data: {
                utilisateurId: prevision.employeId,
                titre: "💰 Notification de paiement",
                message: `Votre salaire pour ${this.getMonthName(mois)} sera payé dans 5 jours. Montant prévu: ${prevision.montantPrevu.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })}`,
                type: "ALERTE",
                sourceId: prevision.id,
                sourceType: "SALARY_FORECAST",
              },
            });

            sent++;
          } catch (error) {
            console.error(
              `[SalaryForecast] Erreur envoi notification pour ${prevision.employe.email}:`,
              error
            );
            failed++;
          }
        }

        console.log(
          `[SalaryForecast] Notifications envoyées: ${sent} succès, ${failed} erreurs`
        );
        return { sent, failed };
      }

      return { sent: 0, failed: 0 };
    } catch (error) {
      console.error("[SalaryForecast] Erreur lors de l'envoi des notifications:", error);
      throw error;
    }
  }

  /**
   * Envoyer l'email de notification de paiement
   */
  private async sendPaymentNotificationEmail(prevision: any) {
    const { employe, montantPrevu, mois, annee } = prevision;
    const monthName = this.getMonthName(mois);
    const dernierJourMois = new Date(annee, mois, 0);
    const dateFormatted = dernierJourMois.toLocaleDateString("fr-FR");

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; }
      .alert-banner { background-color: #4CAF50; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 16px; }
      .content { padding: 20px; background-color: #f9f9f9; }
      .salary-box { background-color: white; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; }
      .salary-amount { font-size: 32px; font-weight: bold; color: #4CAF50; }
      .details { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .detail-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
      .detail-label { font-weight: bold; }
      .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>💰 KEKELI GROUP</h1>
        <p>Prévision de Salaire</p>
      </div>
      
      <div class="alert-banner">
        ✅ Votre salaire sera payé dans 5 jours
      </div>
      
      <div class="content">
        <p>Bonjour <strong>${employe.prenom} ${employe.nom}</strong>,</p>
        
        <p>Nous vous informons que votre salaire pour <strong>${monthName} ${annee}</strong> sera payé le <strong>${dateFormatted}</strong>.</p>
        
        <div class="salary-box">
          <p>Montant prévu:</p>
          <div class="salary-amount">${montantPrevu.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })}</div>
        </div>
        
        <div class="details">
          <div class="detail-item">
            <span class="detail-label">Mois:</span>
            <span>${monthName} ${annee}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Date de paiement:</span>
            <span>${dateFormatted}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Statut:</span>
            <span style="color: #4CAF50;">✓ Confirmé</span>
          </div>
        </div>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Cette prévision est basée sur les timesheets validés. Si vous avez des questions, 
          veuillez contacter votre manager ou l'équipe RH.
        </p>
      </div>
      
      <div class="footer">
        <p>© 2025 KEKELI GROUP - Tous droits réservés</p>
        <p>Cet email a été généré automatiquement</p>
      </div>
    </div>
  </body>
</html>
    `;

    return sendEmail({
      to: employe.email,
      subject: `💰 Notification de paiement - ${monthName} ${annee}`,
      html,
    });
  }

  /**
   * Helper pour obtenir le nom du mois en français
   */
  private getMonthName(mois: number): string {
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return monthNames[mois - 1] || "Mois inconnu";
  }

  /**
   * Récupérer les statistiques salariales pour un employé
   */
  async getSalaryStatistics(employeId: string, dernierseMois: number = 12) {
    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth() - dernierseMois + 1, 1);

    const previsions = await (prisma as any).previsionSalaire.findMany({
      where: {
        employeId,
        dateGeneration: {
          gte: debut,
        },
      },
      orderBy: [{ annee: "asc" }, { mois: "asc" }],
    });

    const montantTotal = previsions.reduce((sum: number, p: any) => sum + p.montantPrevu, 0);
    const montantMoyen =
      previsions.length > 0 ? montantTotal / previsions.length : 0;

    return {
      total: montantTotal,
      moyenne: montantMoyen,
      nombreMois: previsions.length,
      previsions,
    };
  }
}

export const salaryForecastService = new SalaryForecastService();
