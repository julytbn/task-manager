import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

/**
 * GET /api/timesheets/my-timesheets
 * Récupérer les timesheets de l'employé connecté
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Non authentifié",
        },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      employeeId: session.user.id,
    };

    if (statut) {
      where.statut = statut;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const timesheets = await prisma.timeSheet.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            titre: true,
          },
        },
        project: {
          select: {
            id: true,
            titre: true,
          },
        },
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Calculer les statistiques
    const stats = {
      total: timesheets.length,
      enAttente: timesheets.filter((t) => t.statut === "EN_ATTENTE").length,
      validee: timesheets.filter((t) => t.statut === "VALIDEE").length,
      rejetee: timesheets.filter((t) => t.statut === "REJETEE").length,
      totalHours: timesheets.reduce(
        (sum, t) => sum + (t.regularHrs || 0) + (t.overtimeHrs || 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: timesheets,
      stats,
      count: timesheets.length,
    });
  } catch (error) {
    console.error("Error fetching my timesheets:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch timesheets",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
