import { NextRequest, NextResponse } from 'next/server';
import { notifySalaryPaymentDue } from '@/lib/services/salaryForecasting/salaryNotificationService';
import { autoCreateSalaryCharges } from '@/lib/services/salaryForecasting/autoCreateChargesService';

/**
 * CRON: /api/cron/salary/payment-due
 * Exécuté le 1er de chaque mois
 * Envoie un rappel aux ADMINs et MANAGERs pour payer les salaires avant le 5
 *
 * Configuration Vercel:
 * crons:
 *   - cron: "0 8 1 * * *"
 *     path: /api/cron/salary/payment-due
 */
export async function GET(request: NextRequest) {
  // Vérifier le secret CRON
  const secret = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('CRON: Sending salary payment due reminders...');
    
    // 1. Send notifications to ADMIN/MANAGER
    await notifySalaryPaymentDue();
    
    // 2. Auto-create salary charges for current month
    console.log('CRON: Auto-creating salary charges...');
    const chargeResult = await autoCreateSalaryCharges();
    
    return NextResponse.json(
      {
        success: true,
        message: 'Salary payment reminders sent and charges created',
        charges: {
          created: chargeResult.chargesCreated,
          total: chargeResult.totalAmount,
          errors: chargeResult.errors,
        },
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
