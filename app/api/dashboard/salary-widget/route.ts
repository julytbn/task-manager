export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getSalaryForecastCurrentMonth,
  getSalaryPaymentStatus,
} from '@/lib/services/salaryForecasting/salaryDataService';

/**
 * GET /api/dashboard/salary-widget
 * Récupère les données du widget prévisions salariales
 * Accessible par ADMIN et MANAGER
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier l'authentification
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier les droits (ADMIN ou MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Récupérer les données
    const forecast = await getSalaryForecastCurrentMonth();
    const paymentStatus = await getSalaryPaymentStatus();

    // Si aucune prévision, retourner vide
    if (!forecast) {
      return NextResponse.json(
        {
          montantTotal: 0,
          nombreEmployes: 0,
          dateLimite: new Date(),
          mois: new Date().getMonth() + 1,
          annee: new Date().getFullYear(),
          isPaid: false,
          prévisions: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ...forecast,
        isPaid: paymentStatus.isPaid,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in salary widget API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
