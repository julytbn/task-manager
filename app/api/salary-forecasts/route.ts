import { NextRequest, NextResponse } from "next/server";
import { salaryForecastService } from "@/lib/services/salaryForecasting/salaryForecastService";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/salary-forecasts - Récupérer les prévisions salariales
 * Query params:
 *  - employeeId: ID de l'employé
 *  - month: Mois (1-12)
 *  - year: Année
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId est requis" },
        { status: 400 }
      );
    }

    const mois = month ? parseInt(month) : undefined;
    const annee = year ? parseInt(year) : undefined;

    const forecasts = await salaryForecastService.getSalaryForecast(
      employeeId,
      mois,
      annee
    );

    return NextResponse.json({
      success: true,
      data: forecasts,
      count: forecasts.length,
    });
  } catch (error) {
    console.error("[API] Erreur récupération prévisions salariales:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des prévisions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/salary-forecasts - Recalculer une prévision salariale
 * Body:
 *  - employeeId: ID de l'employé
 *  - date: Date du timesheet (pour déterminer le mois)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date } = body;

    if (!employeeId || !date) {
      return NextResponse.json(
        { error: "employeeId et date sont requis" },
        { status: 400 }
      );
    }

    const result = await salaryForecastService.recalculateSalaryForecast(
      employeeId,
      new Date(date)
    );

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Impossible de calculer la prévision (tarif horaire manquant?)",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Prévision salariale recalculée",
    });
  } catch (error) {
    console.error("[API] Erreur recalcul prévision salariale:", error);
    return NextResponse.json(
      { error: "Erreur lors du recalcul de la prévision" },
      { status: 500 }
    );
  }
}
