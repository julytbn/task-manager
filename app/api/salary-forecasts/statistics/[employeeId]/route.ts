import { NextRequest, NextResponse } from "next/server";
import { salaryForecastService } from "@/lib/services/salaryForecasting/salaryForecastService";

export const dynamic = 'force-dynamic';

/**
 * GET /api/salary-forecasts/statistics/[employeeId] - Récupérer les statistiques salariales
 * Query params:
 *  - months: Nombre de derniers mois à inclure (défaut: 12)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params;
    const searchParams = request.nextUrl.searchParams;
    const months = searchParams.get("months");
    const dernierseMois = months ? parseInt(months) : 12;

    const stats = await salaryForecastService.getSalaryStatistics(
      employeeId,
      dernierseMois
    );

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[API] Erreur récupération statistiques:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
