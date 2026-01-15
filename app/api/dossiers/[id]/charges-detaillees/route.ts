export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      date,
      fournisseur,
      montantHT,
      avecTVA,
      tauxTVA,
      categorie,
      description,
    } = body;

    // Validation
    if (!fournisseur || !montantHT) {
      return NextResponse.json(
        { error: "fournisseur et montantHT requis" },
        { status: 400 }
      );
    }

    // Vérifier que le dossier existe
    const dossier = await prisma.dossierComptable.findUnique({
      where: { id: params.id },
    });

    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Créer la charge avec TVA automatique
    const montantTVA = avecTVA ? parseFloat(montantHT) * (parseFloat(tauxTVA || "20") / 100) : 0;
    const charge = await prisma.chargeDetaillee.create({
      data: {
        dossierComptableId: params.id,
        date: date ? new Date(date) : new Date(),
        fournisseur,
        montantHT: parseFloat(montantHT),
        avecTVA: avecTVA || false,
        tauxTVA: avecTVA ? parseFloat(tauxTVA || "20") : 0,
        montantTVA: montantTVA,
        montantTTC: parseFloat(montantHT) + montantTVA,
        categorie: categorie || "AUTRES",
        description: description || null,
      },
    });

    return NextResponse.json(charge, { status: 201 });
  } catch (error) {
    console.error("[POST /api/dossiers/[id]/charges-detaillees]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que le dossier existe
    const dossier = await prisma.dossierComptable.findUnique({
      where: { id: params.id },
    });

    if (!dossier) {
      console.error(`[GET charges-detaillees] Dossier not found: ${params.id}`);
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les charges
    const charges = await prisma.chargeDetaillee.findMany({
      where: { dossierComptableId: params.id },
      orderBy: { date: "desc" },
    });

    console.log(`[GET charges-detaillees] Found ${charges.length} charges for dossier ${params.id}`);
    
    // Toujours retourner un array JSON valide
    return NextResponse.json(charges, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("[GET /api/dossiers/[id]/charges-detaillees]", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
