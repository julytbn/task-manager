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

    // Récupérer infos client
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        abonnements: {
          where: {
            statut: "ACTIF",
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Récupérer dossier comptable pour ce mois
    const dossier = await prisma.dossierComptable.findUnique({
      where: {
        clientId_mois_annee: {
          clientId,
          mois: month,
          annee: year,
        },
      },
      include: {
        chargesDetailees: true,
        entrees: true,
      },
    });

    // Calculer les totaux
    const totalEntrees = dossier?.entrees?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
    const totalCharges = dossier?.chargesDetailees?.reduce(
      (sum, c) => sum + (c.montantTTC || c.montantHT || 0),
      0
    ) || 0;
    const solde = totalEntrees - totalCharges;
    const pourcentageCharges = totalEntrees > 0
      ? Math.round((totalCharges / totalEntrees) * 100)
      : 0;

    // Agrégation par catégorie
    const parCategorie: Record<string, { montant: number; count: number }> = {};
    dossier?.chargesDetailees?.forEach((charge) => {
      const cat = charge.categorie;
      if (!parCategorie[cat]) {
        parCategorie[cat] = { montant: 0, count: 0 };
      }
      parCategorie[cat].montant += charge.montantTTC || charge.montantHT || 0;
      parCategorie[cat].count += 1;
    });

    // Compter factures et paiements pour ce mois
    const factures = await prisma.facture.findMany({
      where: {
        clientId,
        dateEmission: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    const paiements = await prisma.paiement.findMany({
      where: {
        clientId,
        datePaiement: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    const totalFactures = factures.reduce((sum, f) => sum + (f.montant || 0), 0);
    const totalPaiements = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);

    return NextResponse.json({
      client: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        type: client.type,
      },
      abonnements: client.abonnements || [],
      financials: {
        totalEntrees,
        totalCharges,
        solde,
        pourcentageCharges: `${pourcentageCharges}`,
      },
      details: {
        paiements: {
          total: totalPaiements,
          count: paiements.length,
        },
        factures: {
          total: totalFactures,
          count: factures.length,
        },
        charges: {
          total: totalCharges,
          count: dossier?.chargesDetailees?.length || 0,
          parCategorie,
        },
      },
      periode: `${month}/${year}`,
    });
  } catch (error) {
    console.error("[API] Erreur accounting-summary:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du résumé comptable" },
      { status: 500 }
    );
  }
}
