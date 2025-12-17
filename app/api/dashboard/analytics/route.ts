import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/analytics
 * Retourne les KPIs et données analytics pour le dashboard manager
 */
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1️⃣ CLIENTS TOTAUX
    const activeClients = await prisma.client.count();

    // 2️⃣ PROJETS EN COURS ET TERMINÉS
    const projectsInProgress = await prisma.projet.count({
      where: {
        statut: { in: ["EN_COURS", "EN_ATTENTE"] },
      },
    });

    const projectsCompleted = await prisma.projet.count({
      where: {
        statut: "TERMINE",
      },
    });

    // 3️⃣ HEURES TRAVAILLÉES CE MOIS
    const hoursThisMonth = await prisma.timeSheet.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        regularHrs: true,
        overtimeHrs: true,
      },
    });

    const totalHours =
      (hoursThisMonth._sum.regularHrs || 0) +
      (hoursThisMonth._sum.overtimeHrs || 0);

    // 4️⃣ RECETTES DU MOIS (Factures)
    const invoicesThisMonth = await prisma.facture.aggregate({
      where: {
        dateCreation: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        montant: true,
      },
    });

    const revenueThisMonth = invoicesThisMonth._sum.montant || 0;

    // 5️⃣ CHARGES DU MOIS
    const chargesThisMonth = await prisma.charge.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        montant: true,
      },
    });

    const chargesThisMonthTotal = chargesThisMonth._sum.montant || 0;

    // 6️⃣ BÉNÉFICE ESTIMÉ
    const estimatedProfit = revenueThisMonth - chargesThisMonthTotal;

    // 7️⃣ DONNÉES HISTORIQUES POUR GRAPHIQUES (12 derniers mois)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );

      // Recettes du mois
      const monthRevenue = await prisma.facture.aggregate({
        where: {
          dateCreation: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          montant: true,
        },
      });

      // Charges du mois
      const monthCharges = await prisma.charge.aggregate({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          montant: true,
        },
      });

      monthlyData.push({
        month: monthStart.toLocaleString("fr-FR", { month: "short", year: "2-digit" }),
        revenue: monthRevenue._sum.montant || 0,
        charges: monthCharges._sum.montant || 0,
      });
    }

    // 8️⃣ PRODUCTIVITÉ PAR EMPLOYÉ
    const employeeProductivityRaw = await prisma.timeSheet.groupBy({
      by: ["employeeId"],
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        regularHrs: true,
        overtimeHrs: true,
      },
    });

    const employeeNames = await Promise.all(
      employeeProductivityRaw.map(async (emp) => {
        const user = await prisma.utilisateur.findUnique({
          where: { id: emp.employeeId },
          select: { nom: true, prenom: true },
        });
        return {
          name: `${user?.prenom || ""} ${user?.nom || ""}`.trim() || "Non assigné",
          hours:
            (emp._sum.regularHrs || 0) + (emp._sum.overtimeHrs || 0),
        };
      })
    );

    // 9️⃣ ALERTES
    const alerts = [];

    // Feuilles de temps en attente de validation
    const pendingTimesheets = await prisma.timeSheet.count({
      where: {
        statut: "EN_ATTENTE",
      },
    });

    if (pendingTimesheets > 0) {
      alerts.push({
        type: "warning",
        title: "Feuilles de temps en attente",
        message: `${pendingTimesheets} feuille(s) de temps à valider`,
        icon: "clock",
      });
    }

    // Factures impayées (pas encore payées = EN_ATTENTE ou PARTIELLEMENT_PAYEE)
    const unpaidInvoices = await prisma.facture.count({
      where: {
        statut: { in: ["EN_ATTENTE", "PARTIELLEMENT_PAYEE"] },
      },
    });

    if (unpaidInvoices > 0) {
      alerts.push({
        type: "danger",
        title: "Factures impayées",
        message: `${unpaidInvoices} facture(s) non payée(s)`,
        icon: "alert-circle",
      });
    }

    // Projets en retard
    const overdueProjects = await prisma.projet.count({
      where: {
        dateEcheance: {
          lt: now,
        },
        statut: { not: "TERMINE" },
      },
    });

    if (overdueProjects > 0) {
      alerts.push({
        type: "danger",
        title: "Projets en retard",
        message: `${overdueProjects} projet(s) en retard`,
        icon: "alert-triangle",
      });
    }

    // Salaires à payer (J-5)
    const salaryDueDate = new Date(now);
    salaryDueDate.setDate(salaryDueDate.getDate() + 5);
    const pendingPayments = await prisma.paiement.count({
      where: {
        statut: "EN_ATTENTE",
        dateCreation: {
          lte: salaryDueDate,
        },
      },
    });

    if (pendingPayments > 0) {
      alerts.push({
        type: "info",
        title: "Paiements à venir",
        message: `${pendingPayments} paiement(s) planifié(s) dans les 5 jours`,
        icon: "dollar-sign",
      });
    }

    return NextResponse.json({
      success: true,
      kpis: {
        activeClients,
        projectsInProgress,
        projectsCompleted,
        totalHours,
        revenueThisMonth,
        chargesThisMonthTotal,
        estimatedProfit,
      },
      monthlyData,
      employeeProductivity: employeeNames,
      alerts,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
