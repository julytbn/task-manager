export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { salaryForecastService } from "@/lib/services/salaryForecasting/salaryForecastService";

/**
 * POST /api/salary-forecasts/send-notifications - Envoyer les notifications de paiement
 * Déclenche les notifications 5 jours avant le paiement
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification si nécessaire
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.CRON_SECRET;

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const result = await salaryForecastService.sendPaymentNotifications();

    return NextResponse.json({
      success: true,
      data: result,
      message: `${result.sent} notifications envoyées, ${result.failed} erreurs`,
    });
  } catch (error) {
    console.error("[API] Erreur envoi notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des notifications" },
      { status: 500 }
    );
  }
}
