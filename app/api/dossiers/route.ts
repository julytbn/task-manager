export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const disabledHandler = () => NextResponse.json(
  { error: "Cette fonctionnalitÃ© est actuellement indisponible - base de donnÃ©es reconfigurÃ©e" },
  { status: 503 }
);

export async function GET() { return disabledHandler(); }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, mois, annee, notes } = body;

    // Validation
    if (!clientId || !mois || !annee) {
      return NextResponse.json(
        { error: "clientId, mois, et annee sont requis" },
        { status: 400 }
      );
    }

    if (mois < 1 || mois > 12 || annee < 2020) {
      return NextResponse.json(
        { error: "mois (1-12) et annee (>=2020) invalides" },
        { status: 400 }
      );
    }

    // CrÃ©er le dossier
    const dossier = await prisma.dossierComptable.create({
      data: {
        clientId,
        mois,
        annee,
        notes: notes || null,
        statut: "EN_COURS",
      },
      include: {
        chargesDetailees: true,
        entrees: true,
        situationFinanciere: true,
      },
    });

    return NextResponse.json(dossier, { status: 201 });
  } catch (error) {
    console.error("[POST /api/dossiers]", error);

    if (
      error instanceof Error &&
      error.message.includes("abonnement")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

