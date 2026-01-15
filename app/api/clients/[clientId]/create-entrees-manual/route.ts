export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface LigneEntree {
  id: string
  designation: string
  quantite: number
  prixUnitaire: number
  totalHT: number
}

interface Entree {
  id: string
  date: string
  reference: string
  lignes: LigneEntree[]
  remise: number
  sousTotal: number
  tauxTVA: number
  montantTVA: number
  montantTTC: number
}

export async function POST(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const body = await request.json();
    const { entrees } = body;

    if (!entrees || !Array.isArray(entrees) || entrees.length === 0) {
      return NextResponse.json(
        { error: "Aucune entrée fournie" },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const clientId = params.clientId;

    // Récupérer ou créer le dossier comptable
    let dossier = await prisma.dossierComptable.findFirst({
      where: {
        clientId,
        mois: month,
        annee: year,
      },
    });

    if (!dossier) {
      dossier = await prisma.dossierComptable.create({
        data: {
          clientId,
          mois: month,
          annee: year,
          statut: "EN_COURS",
        },
      });
      console.log("📄 [create-entrees-manual] Created dossier comptable:", dossier.id);
    }

    // Créer les entrées
    const createdEntries = [];
    let entreesCreated = 0;
    const errors: string[] = [];

    for (let i = 0; i < entrees.length; i++) {
      try {
        const entry: Entree = entrees[i];

        // Validation
        if (!entry.date) {
          errors.push(`Entrée ${i + 1}: Date requise`);
          continue;
        }

        if (!entry.lignes || entry.lignes.length === 0) {
          errors.push(`Entrée ${i + 1}: Au moins une ligne requise`);
          continue;
        }

        if (entry.montantTTC <= 0) {
          errors.push(`Entrée ${i + 1}: Montant TTC invalide`);
          continue;
        }

        // Génération de la description depuis les lignes
        const descriptions = entry.lignes
          .map((l) => l.designation)
          .filter((d) => d)
          .slice(0, 3)
          .join(", ");
        const description = descriptions || "Entrée sans désignation";

        // Créer l'entrée avec tous les champs
        const createdEntry = await prisma.entreeClient.create({
          data: {
            clientId,
            dossierComptableId: dossier.id,
            date: new Date(entry.date),
            description: description.substring(0, 500),
            montant: entry.montantTTC, // Montant TTC
            montantHT: entry.sousTotal - entry.remise,
            montantTVA: entry.montantTVA,
            sourceType: "MANUAL",
            notes: `Créée manuellement via formulaire - ${entry.lignes.length} ligne(s)`,
          },
        });

        createdEntries.push({
          date: createdEntry.date.toISOString(),
          description: createdEntry.description,
          montantHT: createdEntry.montantHT,
          montantTVA: createdEntry.montantTVA,
          montantTTC: createdEntry.montant,
          lignesCount: entry.lignes.length,
        });

        entreesCreated++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
        errors.push(`Entrée ${i + 1}: ${errorMsg}`);
        console.error(`[create-entrees-manual] Error creating entry ${i + 1}:`, error);
      }
    }

    if (entreesCreated === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune entrée n'a pu être créée",
          errors,
        },
        { status: 400 }
      );
    }

    console.log(
      `✅ [create-entrees-manual] Created ${entreesCreated} entries for client ${clientId}`
    );

    return NextResponse.json({
      success: true,
      message: `${entreesCreated} entrée(s) créée(s) avec succès${errors.length > 0 ? ` (${errors.length} erreur(s) ignorée(s))` : ""}`,
      entreesCreated,
      entries: createdEntries,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[create-entrees-manual] Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Erreur serveur: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
