import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StatutTimeSheet } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Récupérer les query params
    const searchParams = new URL(req.url).searchParams;
    const statutParam = searchParams.get('statut');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const statut = statutParam as StatutTimeSheet | undefined;

    // Construire le where clause
    const whereClause: any = { 
      employeeId: session.user.id,
    };

    // Ajouter le statut si fourni
    if (statut) {
      whereClause.statut = statut;
    }

    // Ajouter les dates si fournies
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999); // Inclure toute la journée
      
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const timesheets = await prisma.timeSheet.findMany({
      where: whereClause,
      include: {
        project: true,
        task: true,
        employee: true,
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculer les stats
    const stats = {
      total: timesheets.length,
      enAttente: timesheets.filter(ts => ts.statut === 'EN_ATTENTE').length,
      validee: timesheets.filter(ts => ts.statut === 'VALIDEE').length,
      rejetee: timesheets.filter(ts => ts.statut === 'REJETEE').length,
      totalHours: timesheets.reduce((sum, ts) => sum + (ts.regularHrs || 0) + (ts.overtimeHrs || 0) + (ts.sickHrs || 0) + (ts.vacationHrs || 0), 0)
    };

    return NextResponse.json({
      success: true,
      data: timesheets,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching my timesheets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
