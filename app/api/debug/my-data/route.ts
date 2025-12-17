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

    const user = await prisma.utilisateur.findUnique({
      where: { id: session.user.id },
      include: {
        tachesAssignees: { take: 5 },
        equipesLead: { take: 3 }
      }
    });

    return NextResponse.json({
      user,
      session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/debug/my-data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
