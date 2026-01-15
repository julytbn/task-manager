export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');
    const clientId = params.clientId;

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year parameters required" },
        { status: 400 }
      );
    }

    // Trouver le dossier comptable
    const dossier = await prisma.dossierComptable.findFirst({
      where: {
        clientId,
        mois: month,
        annee: year,
      },
    });

    if (!dossier) {
      return NextResponse.json({ entrees: [] });
    }

    // Récupérer les entrées du dossier
    const entrees = await prisma.entreeClient.findMany({
      where: {
        dossierComptableId: dossier.id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ 
      entrees: entrees.map(e => ({
        id: e.id,
        date: e.date,
        reference: e.reference,
        description: e.description,
        montantHT: e.montantHT,
        montantTVA: e.montantTVA,
        montant: e.montant,
        sourceType: e.sourceType,
        lignes: e.lignesJSON ? JSON.parse(e.lignesJSON) : [],
        notes: e.notes,
      })),
      dossierId: dossier.id,
    });
  } catch (error) {
    console.error('[GET /api/clients/[clientId]/entrees]', error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entrées" },
      { status: 500 }
    );
  }
}
