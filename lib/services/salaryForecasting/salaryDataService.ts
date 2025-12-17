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

    if (prévisions.length === 0) {
      return null;
    }

    // Calculer la date limite (5 du mois suivant)
    const dateLimite = new Date(annee, mois, 5);

    // Calculer le total
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

    // Récupérer les recettes (factures payées)
    const revenues = await prisma.paiement.aggregate({
      _sum: {
        montant: true,
      },
      where: {
        datePaiement: {
          gte: startDate,
        },
        statut: 'CONFIRME',
      },
    });

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
