export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dossier = await prisma.dossierComptable.findUnique({
      where: { id: params.id },
    });

    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(dossier);
  } catch (error) {
    console.error("[GET /api/dossiers/[id]]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { statut, notes } = body;

    const dossier = await prisma.dossierComptable.findUnique({
      where: { id: params.id },
    });

    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour
    const updated = await prisma.dossierComptable.update({
      where: { id: params.id },
      data: {
        ...(statut && { statut }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        client: true,
        chargesDetailees: true,
        entrees: true,
        situationFinanciere: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/dossiers/[id]]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dossier = await prisma.dossierComptable.findUnique({
      where: { id: params.id },
    });

    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le dossier (cascade supprimera les charges + situation)
    await prisma.dossierComptable.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Dossier supprimé" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/dossiers/[id]]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
