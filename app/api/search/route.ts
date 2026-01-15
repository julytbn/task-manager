export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (!query.trim() || query.length < 2) {
      return NextResponse.json([]);
    }

    const results: any[] = [];

    // Recherche dans les clients
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { nom: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { telephone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    results.push(
      ...clients.map((c) => ({
        id: c.id,
        type: 'client',
        title: c.nom,
        description: c.email,
        url: `/clients/${c.id}`,
      }))
    );

    // Recherche dans les projets
    const projets = await prisma.projet.findMany({
      where: {
        OR: [
          { titre: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    results.push(
      ...projets.map((p) => ({
        id: p.id,
        type: 'projet',
        title: p.titre,
        description: p.description,
        url: `/projets/${p.id}`,
      }))
    );

    // Recherche dans les tâches
    const taches = await prisma.tache.findMany({
      where: {
        OR: [
          { titre: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        projet: true,
      },
      take: 5,
    });

    results.push(
      ...taches.map((t) => ({
        id: t.id,
        type: 'tache',
        title: t.titre,
        description: t.projet?.titre,
        url: `/kanban`,
      }))
    );

    // Recherche dans les factures
    const factures = await prisma.facture.findMany({
      where: {
        OR: [
          { numero: { contains: query, mode: 'insensitive' } },
          { client: { nom: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        client: true,
      },
      take: 5,
    });

    results.push(
      ...factures.map((f) => ({
        id: f.id,
        type: 'facture',
        title: f.numero,
        description: f.client?.nom,
        url: `/factures/${f.id}`,
      }))
    );

    // Limiter les résultats totaux à 20
    return NextResponse.json(results.slice(0, 20));
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
