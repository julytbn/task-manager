import { prisma } from '@/lib/prisma';

/**
 * Service pour récupérer les données de prévisions salariales
 */

export interface SalaryForecastData {
  montantTotal: number;
  nombreEmployes: number;
  mois: number;
  annee: number;
  dateLimite: Date;
  prévisions: {
    id: string;
    employeId: string;
    nomEmploye: string;
    montantPrevu: number;
    dateNotification?: Date;
  }[];
}

/**
 * Récupère les prévisions salariales du mois courant
 */
export async function getSalaryForecastCurrentMonth(): Promise<SalaryForecastData | null> {
  const now = new Date();
  const mois = now.getMonth() + 1;
  const annee = now.getFullYear();

  try {
    // First try to get from PrevisionSalaire table
    const prévisions = await prisma.previsionSalaire.findMany({
      where: {
        mois,
        annee,
      },
      include: {
        employe: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
      orderBy: {
        montantPrevu: 'desc',
      },
    });

    // If previsions found in table, use them
    if (prévisions.length > 0) {
      const dateLimite = new Date(annee, mois, 5);
      const montantTotal = prévisions.reduce((sum, p) => sum + p.montantPrevu, 0);

      return {
        montantTotal,
        nombreEmployes: prévisions.length,
        mois,
        annee,
        dateLimite,
        prévisions: prévisions.map((p) => ({
          id: p.id,
          employeId: p.employeId,
          nomEmploye: `${p.employe.prenom} ${p.employe.nom}`,
          montantPrevu: p.montantPrevu,
          dateNotification: p.dateNotification || undefined,
        })),
      };
    }

    // If no previsions found, calculate from timesheets and employee rates
    console.log(`[Salary Forecast] Calculating from timesheets for ${mois}/${annee}`);
    
    // Get all employees
    const employees = await prisma.utilisateur.findMany({
      where: {
        role: 'EMPLOYE',
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        tarifHoraire: true,
        timesheets: {
          where: {
            AND: [
              {
                date: {
                  gte: new Date(annee, mois - 1, 1),
                },
              },
              {
                date: {
                  lt: new Date(annee, mois, 1),
                },
              },
            ],
          },
          select: {
            regularHrs: true,
            overtimeHrs: true,
            statut: true,
          },
        },
      },
    });

    console.log(`[Salary Forecast] Found ${employees.length} employees`);

    // Calculate salary forecasts from timesheets
    const forecasts = employees
      .map((emp) => {
        // Only count validated timesheets
        const validatedSheets = emp.timesheets.filter(
          (ts: any) => ts.statut === 'VALIDEE'
        );

        const totalHours = validatedSheets.reduce(
          (sum: number, ts: any) => sum + (ts.regularHrs || 0) + (ts.overtimeHrs || 0),
          0
        );

        const montantPrevu = totalHours * (emp.tarifHoraire || 0);

        console.log(`[Salary Forecast] ${emp.prenom} ${emp.nom}: ${totalHours}h × ${emp.tarifHoraire || 0} = ${montantPrevu}`);

        return {
          id: `forecast-${emp.id}-${mois}-${annee}`,
          employeId: emp.id,
          nomEmploye: `${emp.prenom} ${emp.nom}`,
          montantPrevu,
          dateNotification: undefined,
        };
      })
      .sort((a, b) => b.montantPrevu - a.montantPrevu);

    console.log(`[Salary Forecast] Forecasts calculated: ${forecasts.length} employees with data`);

    if (forecasts.length === 0) {
      console.log('[Salary Forecast] No employees found or no data');
      return null;
    }

    const montantTotal = forecasts.reduce((sum, f) => sum + f.montantPrevu, 0);
    const dateLimite = new Date(annee, mois, 5);

    return {
      montantTotal,
      nombreEmployes: forecasts.filter(f => f.montantPrevu > 0).length,
      mois,
      annee,
      dateLimite,
      prévisions: forecasts,
    };
  } catch (error) {
    console.error('Error fetching salary forecast:', error);
    return null;
  }
}

/**
 * Récupère les 12 derniers mois de prévisions salariales vs recettes
 */
export async function getSalaryCoverageAnalysis() {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Récupérer les prévisions salariales
    const salaryForecasts = await prisma.previsionSalaire.groupBy({
      by: ['mois', 'annee'],
      _sum: {
        montantPrevu: true,
      },
      where: {
        dateGeneration: {
          gte: startDate,
        },
      },
    });

    // Récupérer les paiements confirmés avec le détail des factures
    const paiements = await prisma.paiement.findMany({
      where: {
        datePaiement: {
          gte: startDate,
        },
        statut: 'CONFIRME',
      },
      include: {
        facture: {
          include: {
            lignes: true
          }
        }
      },
    });

    // Calculer la part main-d'œuvre des paiements
    const montantMainDOeuvre = paiements.reduce((sum, paiement) => {
      if (!paiement.facture?.lignes) return sum;
      
      // Calculer le ratio main-d'œuvre / montant total de la facture
      const montantTotalFacture = paiement.facture.lignes.reduce(
        (total, ligne) => total + (ligne.montant || 0), 0
      );
      
      const montantMainDOeuvreFacture = paiement.facture.lignes
        .filter(ligne => ligne.type === 'MAIN_D_OEUVRE')
        .reduce((sum, ligne) => sum + (ligne.montant || 0), 0);
      
      // Si le montant total est 0, on évite la division par zéro
      const ratio = montantTotalFacture > 0 
        ? montantMainDOeuvreFacture / montantTotalFacture 
        : 0;
      
      // On applique ce ratio au montant du paiement
      return sum + (paiement.montant * ratio);
    }, 0);
    
    const revenues = { _sum: { montant: montantMainDOeuvre } };

    // Transformer les données pour le graphique
    const monthlyData = salaryForecasts.map((sf) => {
      const monthLabel = new Date(sf.annee, sf.mois - 1).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });

      const revenueAmount = revenues._sum.montant || 0;
      return {
        mois: sf.mois,
        annee: sf.annee,
        label: monthLabel,
        salaires: sf._sum.montantPrevu || 0,
        recettes: revenueAmount,
        couverture: revenueAmount
          ? Math.round((revenueAmount / (sf._sum.montantPrevu || 1)) * 100)
          : 0,
      };
    });

    return monthlyData.sort((a, b) => {
      if (a.annee !== b.annee) return a.annee - b.annee;
      return a.mois - b.mois;
    });
  } catch (error) {
    console.error('Error fetching salary coverage analysis:', error);
    return [];
  }
}

/**
 * Récupère le statut de paiement des salaires du mois courant
 */
export async function getSalaryPaymentStatus(): Promise<{
  isPaid: boolean;
  totalAmount: number;
  paidAmount: number;
  lastPaymentDate?: Date;
}> {
  const now = new Date();
  const mois = now.getMonth() + 1;
  const annee = now.getFullYear();

  try {
    // Prévisions salariales du mois
    const forecast = await prisma.previsionSalaire.aggregate({
      where: { mois, annee },
      _sum: { montantPrevu: true },
    });

    // Paiements effectués ce mois
    const payments = await prisma.paiement.aggregate({
      where: {
        datePaiement: {
          gte: new Date(annee, mois - 1, 1),
          lte: new Date(annee, mois, 0),
        },
        statut: 'CONFIRME',
      },
      _sum: { montant: true },
    });

    const totalAmount = forecast._sum.montantPrevu || 0;
    const paidAmount = payments._sum.montant || 0;

    return {
      isPaid: paidAmount >= totalAmount,
      totalAmount,
      paidAmount,
      lastPaymentDate: new Date(), // À améliorer avec vraie date du dernier paiement
    };
  } catch (error) {
    console.error('Error fetching salary payment status:', error);
    return {
      isPaid: false,
      totalAmount: 0,
      paidAmount: 0,
    };
  }
}
