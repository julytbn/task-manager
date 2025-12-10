import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/devis/:id/status
 * Changer le statut d'un devis
 * Transitions autorisées:
 * - BROUILLON → ENVOYE
 * - ENVOYE → ACCEPTE
 * - ENVOYE/BROUILLON → REFUSE
 * - Any → ANNULE
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required field: newStatus",
        },
        { status: 400 }
      );
    }

    // Récupérer le devis actuel
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
    });

    if (!devis) {
      return NextResponse.json(
        {
          success: false,
          message: "Devis not found",
        },
        { status: 404 }
      );
    }

    // Valider les transitions de statut
    const validTransitions: Record<string, string[]> = {
      BROUILLON: ["ENVOYE", "ANNULE"],
      ENVOYE: ["ACCEPTE", "REFUSE", "ANNULE"],
      ACCEPTE: ["ANNULE"],
      REFUSE: ["ANNULE"],
      ANNULE: [],
    };

    const allowedStatuses = validTransitions[devis.statut] || [];
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot transition from ${devis.statut} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: Record<string, any> = {
      statut: newStatus,
    };

    if (newStatus === "ENVOYE") {
      updateData.dateEnvoi = new Date();
    } else if (newStatus === "ACCEPTE") {
      updateData.dateAccept = new Date();
    } else if (newStatus === "REFUSE") {
      updateData.dateRefus = new Date();
    }

    // Mettre à jour le devis
    const updatedDevis = await prisma.devis.update({
      where: { id: params.id },
      data: updateData,
      include: {
        services: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            entreprise: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDevis,
      message: `Devis status changed to ${newStatus}`,
    });
  } catch (error) {
    console.error("Error updating devis status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update devis status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
