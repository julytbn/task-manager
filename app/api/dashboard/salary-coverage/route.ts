import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSalaryCoverageAnalysis } from '@/lib/services/salaryForecasting/salaryDataService';

/**
 * GET /api/dashboard/salary-coverage
 * Récupère les données de couverture des salaires vs recettes
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
    const data = await getSalaryCoverageAnalysis();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in salary coverage API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
