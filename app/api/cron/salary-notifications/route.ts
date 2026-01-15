export const dynamic = 'force-dynamic';

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
async function handleSalaryNotifications(request: Request) {
  try {
    // Vérifier la clé secrète pour sécuriser l'endpoint
    const cronSecret = process.env.CRON_SECRET;

    // Vérifier le header X-Cron-Secret (GitHub Actions)
    const xCronSecret = request.headers.get("x-cron-secret");
    // Pour Vercel Cron
    const vercelCronSecret = request.headers.get("x-vercel-cron-secret");
    // Pour Bearer token (legacy)
    const authHeader = request.headers.get("authorization");

    const isAuthorized =
      (xCronSecret && xCronSecret === cronSecret) ||
      (vercelCronSecret && vercelCronSecret === cronSecret) ||
      (authHeader && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (xCronSecret) {
      console.log("[CRON] Exécution via GitHub Actions");
    } else if (vercelCronSecret) {
      console.log("[CRON] Exécution via Vercel Cron");
    } else if (authHeader) {
      console.log("[CRON] Exécution via Bearer token");
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

export async function GET(request: Request) {
  return handleSalaryNotifications(request);
}

export async function POST(request: Request) {
  return handleSalaryNotifications(request);
}
