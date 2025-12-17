import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Récupérer tous les projets disponibles pour cet employé
    const projects = await prisma.projet.findMany({
      include: {
        client: true,
        equipe: { select: { id: true, nom: true, leadId: true } },
        taches: { select: { id: true, titre: true, statut: true } }
      },
      orderBy: { titre: 'asc' }
    });

    return NextResponse.json({ 
      success: true,
      data: projects 
    });
  } catch (error) {
    console.error('Error fetching my projects:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
