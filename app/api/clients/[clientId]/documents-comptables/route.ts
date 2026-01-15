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
    
    // Récupérer le dossier comptable pour ce mois/année
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

    // Combiner charges et entrées en documents
    const documents = [];
    
    if (dossier?.chargesDetailees) {
      documents.push(
        ...dossier.chargesDetailees.map((charge) => ({
          id: charge.id,
          nom: `${charge.fournisseur}`,
          montant: charge.montantTTC || charge.montantHT,
          categorie: charge.categorie,
          type: "CHARGE" as const,
          description: charge.description,
          dateDocument: charge.date.toISOString(),
          url: charge.justificatifUrl,
          notes: charge.notes,
        }))
      );
    }

    if (dossier?.entrees) {
      documents.push(
        ...dossier.entrees.map((entree) => ({
          id: entree.id,
          nom: `${entree.description || "Entrée"}`,
          montant: entree.montant,
          categorie: entree.sourceType,
          type: "ENTREE" as const,
          description: entree.description,
          dateDocument: entree.date.toISOString(),
          url: null,
          notes: entree.notes,
        }))
      );
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[API] Erreur documents-comptables:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des documents" },
      { status: 500 }
    );
  }
}
