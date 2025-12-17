import { NextRequest, NextResponse } from 'next/server';
import { alertSalaryPaymentLate } from '@/lib/services/salaryForecasting/salaryNotificationService';

/**
 * CRON: /api/cron/salary/payment-late
 * Exécuté le 3 de chaque mois (J-2 avant la limite du 5)
 * Envoie une ALERTE aux ADMINs si les salaires ne sont pas payés
 *
 * Configuration Vercel:
 * crons:
 *   - cron: "0 9 3 * * *"
 *     path: /api/cron/salary/payment-late
 */
export async function GET(request: NextRequest) {
  // Vérifier le secret CRON
  const secret = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('CRON: Checking late salary payments...');
    await alertSalaryPaymentLate();

    return NextResponse.json(
      {
        success: true,
        message: 'Late payment alerts sent',
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
