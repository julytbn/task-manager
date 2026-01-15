export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const clientId = params.clientId;

    // Récupérer le dossier comptable
    const dossier = await prisma.dossierComptable.findUnique({
      where: {
        clientId_mois_annee: {
          clientId,
          mois: month,
          annee: year,
        },
      },
    });

    if (!dossier) {
      // Créer automatiquement le dossier s'il n'existe pas
      const newDossier = await prisma.dossierComptable.create({
        data: {
          clientId,
          mois: month,
          annee: year,
          statut: "EN_COURS",
        },
      });
      return NextResponse.json(newDossier);
    }

    return NextResponse.json(dossier);
  } catch (error) {
    console.error("[API] Erreur dossier-comptable:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du dossier comptable" },
      { status: 500 }
    );
  }
}
