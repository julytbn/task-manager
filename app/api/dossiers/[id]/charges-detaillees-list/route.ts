export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que le dossier existe
    const dossier = await prisma.dossierComptable.findUnique({
      where: { id: params.id },
      include: {
        chargesDetailees: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Séparer les charges
    const chargesAvecTVA = dossier.chargesDetailees.filter(c => c.avecTVA);
    const chargesSansTVA = dossier.chargesDetailees.filter(c => !c.avecTVA);

    // Calculer les totaux
    const totalHTAvecTVA = chargesAvecTVA.reduce((sum, c) => sum + c.montantHT, 0);
    const totalTVA = chargesAvecTVA.reduce((sum, c) => sum + (c.montantTVA || 0), 0);
    const totalTTCAvecTVA = chargesAvecTVA.reduce((sum, c) => sum + c.montantTTC, 0);
    const totalHTSansTVA = chargesSansTVA.reduce((sum, c) => sum + c.montantHT, 0);

    return NextResponse.json({
      success: true,
      charges: dossier.chargesDetailees,
      chargesAvecTVA,
      chargesSansTVA,
      totaux: {
        avecTVA: {
          nombre: chargesAvecTVA.length,
          montantHT: totalHTAvecTVA,
          montantTVA: totalTVA,
          montantTTC: totalTTCAvecTVA
        },
        sansTVA: {
          nombre: chargesSansTVA.length,
          montantHT: totalHTSansTVA
        },
        general: {
          montantHTTotal: totalHTAvecTVA + totalHTSansTVA,
          montantTVATotal: totalTVA,
          montantTTCTotal: totalTTCAvecTVA + totalHTSansTVA
        }
      }
    });
  } catch (error) {
    console.error("[GET /api/dossiers/[id]/charges-detaillees]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Vérifier que le dossier existe
    const dossier = await prisma.dossierComptable.findUnique({
      where: { id: params.id }
    });

    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Créer la charge
    const { date, fournisseur, montantHT, avecTVA, tauxTVA, categorie, description } = body;

    // Calculer TVA
    let montantTVA = 0;
    if (avecTVA && tauxTVA) {
      montantTVA = montantHT * (tauxTVA / 100);
    }
    const montantTTC = montantHT + montantTVA;

    const charge = await prisma.chargeDetaillee.create({
      data: {
        dossierComptableId: params.id,
        date: new Date(date),
        fournisseur,
        montantHT,
        avecTVA,
        tauxTVA: avecTVA ? tauxTVA : null,
        montantTVA: avecTVA ? montantTVA : 0,
        montantTTC,
        categorie: categorie || "AUTRES_CHARGES",
        description
      }
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
