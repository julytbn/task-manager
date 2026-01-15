import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Créer un objectif
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeId, titre, description, valeurCible } = body;

    if (!employeId || !titre || !valeurCible) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const objectif = await prisma.objectif.create({
      data: {
        employeId,
        titre,
        description,
        valeurCible,
        valeurActuelle: 0,
      },
    });

    return NextResponse.json(objectif, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Récupérer tous les objectifs
export async function GET(req: Request) {
  try {
    const objectifs = await prisma.objectif.findMany();
    return NextResponse.json(objectifs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Mettre à jour un objectif
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, valeurActuelle } = body;

    if (!id || valeurActuelle === undefined) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const objectif = await prisma.objectif.findUnique({ where: { id } });
    if (!objectif || !objectif.valeurCible) {
      return NextResponse.json({ error: 'Objectif introuvable ou valeur cible manquante' }, { status: 404 });
    }

    const updated = await prisma.objectif.update({
      where: { id },
      data: {
        valeurActuelle,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Supprimer un objectif
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.objectif.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Objectif supprimé' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}