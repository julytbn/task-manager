import { NextRequest, NextResponse } from 'next/server';
import { notifySalaryForecastCalculated } from '@/lib/services/salaryForecasting/salaryNotificationService';

/**
 * CRON: /api/cron/salary/forecast-calculated
 * Exécuté le 31/1 de chaque mois (ou fin du mois)
 * Envoie une notification aux ADMINs quand les prévisions sont calculées
 *
 * Configuration Vercel:
 * crons:
 *   - cron: "0 0 31 * * *"
 *     path: /api/cron/salary/forecast-calculated
 */
export async function GET(request: NextRequest) {
  // Vérifier le secret CRON
  const secret = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('CRON: Sending salary forecast calculated notifications...');
    await notifySalaryForecastCalculated();

    return NextResponse.json(
      {
        success: true,
        message: 'Salary forecast notifications sent',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('CRON Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
