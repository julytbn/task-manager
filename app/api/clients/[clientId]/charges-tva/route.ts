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

    // 1. Récupérer le dossier comptable pour ce mois/année
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
      // Retourner des données vides si le dossier n'existe pas
      return NextResponse.json({
        charges: [],
        totalAvecTVA: 0,
        totalSansTVA: 0,
        montantTVA: 0,
        totalCharges: 0,
        chargesAvecTVA: [],
        chargesSansTVA: [],
      });
    }

    // 2. Récupérer toutes les charges du dossier
    const charges = await prisma.chargeDetaillee.findMany({
      where: {
        dossierComptableId: dossier.id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // 3. Séparer par TVA
    const chargesAvecTVA = charges.filter(c => c.avecTVA);
    const chargesSansTVA = charges.filter(c => !c.avecTVA);

    // 4. Calculer les totaux
    const totalAvecTVA = chargesAvecTVA.reduce((sum, c) => sum + c.montantTTC, 0);
    const totalSansTVA = chargesSansTVA.reduce((sum, c) => sum + c.montantHT, 0);
    const montantTVA = chargesAvecTVA.reduce((sum, c) => sum + (c.montantTVA || 0), 0);
    const totalCharges = totalAvecTVA + totalSansTVA;

    console.log(`[GET /api/clients/${clientId}/charges-tva] Found:`, {
      dossierID: dossier.id,
      chargesTotal: charges.length,
      chargesAvecTVACount: chargesAvecTVA.length,
      chargesSansTVACount: chargesSansTVA.length,
      totalAvecTVA,
      totalSansTVA,
      montantTVA,
      totalCharges,
    });

    return NextResponse.json({
      charges,
      totalAvecTVA,
      totalSansTVA,
      montantTVA,
      totalCharges,
      chargesAvecTVA,
      chargesSansTVA,
    });
  } catch (error) {
    console.error("[GET /api/clients/[clientId]/charges-tva]", error);
    return NextResponse.json(
      {
        error: "Erreur lors du chargement des charges par TVA",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
