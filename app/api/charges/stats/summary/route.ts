import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charges/stats/summary
 * Obtenir un résumé des charges par catégorie, projet, etc.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projetId = searchParams.get("projetId");
    const dateDebut = searchParams.get("dateDebut")
      ? new Date(searchParams.get("dateDebut")!)
      : undefined;
    const dateFin = searchParams.get("dateFin")
      ? new Date(searchParams.get("dateFin")!)
      : undefined;

    // Total des charges par catégorie
    const chargesByCategory = await prisma.charge.groupBy({
      by: ["categorie"],
      where: {
        projetId,
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      _sum: {
        montant: true,
      },
      _count: {
        id: true,
      },
    });

    // Total global des charges
    const totalCharges = await prisma.charge.aggregate({
      where: {
        projetId,
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      _sum: {
        montant: true,
      },
      _count: {
        id: true,
      },
    });

    // Charges par projet (si pas de projetId filtré)
    let chargesByProject: any[] = [];
    if (!projetId) {
      // Récupérer d'abord les IDs de projet uniques
      const projectCharges = await prisma.charge.groupBy({
        by: ['projetId'],
        where: {
          date: {
            gte: dateDebut,
            lte: dateFin,
          },
        },
      });

      // Pour chaque projet, calculer les sommes et les comptes
      chargesByProject = await Promise.all(projectCharges.map(async (project) => {
        if (!project.projetId) return null; // Ignorer les projets sans ID
        const sumResult = await prisma.charge.aggregate({
          where: {
            projetId: project.projetId,
            date: {
              gte: dateDebut,
              lte: dateFin,
            },
          },
          _sum: {
            montant: true,
          },
          _count: true,
        });

        return {
          projetId: project.projetId || '',
          _sum: {
            montant: sumResult._sum.montant || 0,
          },
          _count: {
            id: sumResult._count,
          },
        };
      }));
    }

    // Charges par employé
    const chargesByEmployee = await prisma.charge.groupBy({
      by: ["employeId"],
      where: {
        projetId,
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      _sum: {
        montant: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalMontant: totalCharges._sum.montant || 0,
        nombreCharges: totalCharges._count.id,
        byCategory: chargesByCategory.map((c) => ({
          categorie: c.categorie || 'Autre',
          totalMontant: c._sum.montant || 0,
          count: c._count.id,
        })),
        byProject: chargesByProject
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map((c) => ({
            projetId: c.projetId || '',
            totalMontant: c._sum.montant || 0,
            count: c._count.id,
          })),
        byEmployee: chargesByEmployee.map((c) => ({
          employeId: c.employeId,
          totalMontant: c._sum.montant || 0,
          count: c._count.id,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching charges summary:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch charges summary",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
