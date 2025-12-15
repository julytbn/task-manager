import { NextResponse } from "next/server";
import { salaryForecastService } from "@/lib/services/salaryForecasting/salaryForecastService";

/**
 * Cron job pour envoyer les notifications de paiement
 * À configurer avec Vercel Cron Jobs ou un service externe
 *
 * Configuration Vercel (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/salary-notifications",
 *     "schedule": "0 9 * * *"  // 9h chaque jour
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Vérifier la clé secrète pour sécuriser l'endpoint
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Pour Vercel Cron, vérifier le header spécifique
    const vercelCronSecret = request.headers.get("x-vercel-cron-secret");

    if (vercelCronSecret && vercelCronSecret === cronSecret) {
      console.log("[CRON] Exécution via Vercel Cron");
    } else if (authHeader && authHeader === `Bearer ${cronSecret}`) {
      console.log("[CRON] Exécution via Bearer token");
    } else {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    console.log("[CRON] Début de l'envoi des notifications de paiement");

    const result = await salaryForecastService.sendPaymentNotifications();

    console.log(
      `[CRON] Notifications envoyées: ${result.sent} succès, ${result.failed} erreurs`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      message: `${result.sent} notifications envoyées, ${result.failed} erreurs`,
    });
  } catch (error) {
    console.error("[CRON] Erreur lors de l'exécution:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'exécution du cron",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
