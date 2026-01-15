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

    // 4️⃣ RECETTES DU MOIS - DÉTAILLÉES PAR SOURCE
    // ✅ Abonnements = Revenu pur pour l'entreprise
    const subscriptionPaymentsThisMonth = await prisma.paiement.aggregate({
      where: {
        dateCreation: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        statut: 'CONFIRME',
        facture: {
          abonnement: {
            isNot: null // Factures liées à un abonnement
          }
        }
      },
      _sum: {
        montant: true,
      },
    });

    const subscriptionRevenue = subscriptionPaymentsThisMonth._sum.montant || 0;

    // 📊 Projets = Montant de main d'oeuvre uniquement = Recette nette de l'entreprise
    // Récupérer toutes les factures de projets qui ont reçu un paiement ce mois-ci
    const projectFacturesWithPayments = await prisma.facture.findMany({
      where: {
        projet: {
          isNot: null // Factures liées à un projet
        },
        paiements: {
          some: {
            dateCreation: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            statut: 'CONFIRME'
          }
        }
      },
      include: {
        lignes: {
          select: {
            montant: true,
            type: true
          }
        }
      }
    });

    // Calculer la recette = MONTANT TOTAL DE MAIN D'OEUVRE des factures payées ce mois
    let projectMainDoeuvreTotal = 0;
    let projectExternalFeesTotal = 0;
    for (const facture of projectFacturesWithPayments) {
      // Ligne MAIN_D_OEUVRE = recette (ou NULL/undefined = recette par défaut)
      const montantMainDoeuvre = facture.lignes
        ?.filter((ligne) => ligne.type === 'MAIN_D_OEUVRE' || !ligne.type)
        .reduce((sum, ligne) => sum + (ligne.montant || 0), 0) || 0;
      projectMainDoeuvreTotal += montantMainDoeuvre;
      
      // Ligne FRAIS_EXTERNES = coûts
      const montantFrais = facture.lignes
        ?.filter((ligne) => ligne.type === 'FRAIS_EXTERNES')
        .reduce((sum, ligne) => sum + (ligne.montant || 0), 0) || 0;
      projectExternalFeesTotal += montantFrais;
    }

    console.log('📊 PROJECT ANALYTICS DEBUG');
    console.log(`Nombre de factures avec paiements ce mois: ${projectFacturesWithPayments.length}`);
    projectFacturesWithPayments.forEach((f, i) => {
      console.log(`  Facture ${i+1}:`, f.lignes?.map(l => ({ type: l.type, montant: l.montant })));
    });
    console.log(`Total main d'oeuvre calculé: ${projectMainDoeuvreTotal}`);
    console.log(`Total frais externes calculé: ${projectExternalFeesTotal}`);

    const projectNetRevenue = projectMainDoeuvreTotal;
    const projectCharges = projectExternalFeesTotal;

    // Total des recettes (Abonnements + Revenu net projets)
    const revenueThisMonth = subscriptionRevenue + projectNetRevenue;

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
    // Note: Le bénéfice réel = Abonnements (revenu pur) + Paiements projets (revenu - frais - main d'œuvre)
    // Pour l'instant, on calcule: Recettes totales - Charges totales
    const estimatedProfit = revenueThisMonth - chargesThisMonthTotal;

    // DÉTAIL DU CALCUL :
    // - Abonnements (factures récurrentes) = revenu direct à 100%
    // - Paiements projets = revenu - frais de prestation - coûts main d'œuvre

    // 9️⃣ DONNÉES HISTORIQUES POUR GRAPHIQUES (12 derniers mois)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );

      // Revenus des abonnements du mois
      const monthSubscriptions = await prisma.paiement.aggregate({
        where: {
          dateCreation: {
            gte: monthStart,
            lte: monthEnd,
          },
          statut: 'CONFIRME',
          facture: {
            abonnement: {
              isNot: null
            }
          }
        },
        _sum: {
          montant: true,
        },
      });

      // Revenus des projets (montant de main d'oeuvre uniquement)
      const monthProjectFactures = await prisma.facture.findMany({
        where: {
          projet: {
            isNot: null
          },
          paiements: {
            some: {
              dateCreation: {
                gte: monthStart,
                lte: monthEnd,
              },
              statut: 'CONFIRME'
            }
          }
        },
        include: {
          lignes: {
            select: {
              montant: true,
              type: true
            }
          }
        }
      });

      // Calculer la recette = MONTANT TOTAL DE MAIN D'OEUVRE des factures payées
      let monthProjectMainDoeuvre = 0;
      let monthProjectExternalFees = 0;
      for (const facture of monthProjectFactures) {
        const montantMainDoeuvre = facture.lignes
          ?.filter(ligne => ligne.type === 'MAIN_D_OEUVRE' || !ligne.type)
          .reduce((sum, ligne) => sum + (ligne.montant || 0), 0) || 0;
        monthProjectMainDoeuvre += montantMainDoeuvre;
        
        const montantFrais = facture.lignes
          ?.filter(ligne => ligne.type === 'FRAIS_EXTERNES')
          .reduce((sum, ligne) => sum + (ligne.montant || 0), 0) || 0;
        monthProjectExternalFees += montantFrais;
      }

      // Frais de prestation facturés du mois (lignes FRAIS_EXTERNES) - utiliser la valeur calculée
      const monthExternalFeesCalculated = monthProjectExternalFees;

      const monthSubscriptionRevenue = monthSubscriptions._sum.montant || 0;
      const monthProjectRevenue = monthProjectMainDoeuvre;
      const monthTotalRevenue = monthSubscriptionRevenue + monthProjectRevenue;

      // Charges du mois (autres charges non liées aux projets)
      const monthOtherCharges = await prisma.charge.aggregate({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
          projetId: null // Charges générales de l'entreprise
        },
        _sum: {
          montant: true,
        },
      });

      const monthProjectCharges = monthExternalFeesCalculated;
      const monthTotalCharges = monthProjectCharges + (monthOtherCharges._sum.montant || 0);

      monthlyData.push({
        month: monthStart.toLocaleString("fr-FR", { month: "short", year: "2-digit" }),
        revenue: monthTotalRevenue,
        charges: monthTotalCharges,
        subscriptionRevenue: monthSubscriptionRevenue,
        projectRevenue: monthProjectRevenue,
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
        revenueThisMonth, // Revenu total = Abonnements + Projets (main d'oeuvre)
        subscriptionRevenue, // Abonnements (revenu pur)
        projectNetRevenue, // Projets (Montant de main d'oeuvre uniquement)
        projectCharges, // Frais des projets
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
