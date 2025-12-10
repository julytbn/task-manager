import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/devis/:id
 * Récupérer un devis spécifique par ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
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

    if (!devis) {
      return NextResponse.json(
        {
          success: false,
          message: "Devis not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: devis,
    });
  } catch (error) {
    console.error("Error fetching devis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch devis",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/devis/:id
 * Mettre à jour un devis
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const tauxTVA = body.tauxTVA !== undefined ? body.tauxTVA : undefined;
    const montant = body.montant !== undefined ? body.montant : undefined;

    let montantTotal = undefined;
    if (montant !== undefined && tauxTVA !== undefined) {
      montantTotal = montant + montant * tauxTVA;
    }

    const devis = await prisma.devis.update({
      where: { id: params.id },
      data: {
        titre: body.titre,
        description: body.description,
        montant,
        tauxTVA,
        montantTotal,
        notes: body.notes,
        dateModification: new Date(),
      },
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
      data: devis,
      message: "Devis updated successfully",
    });
  } catch (error) {
    console.error("Error updating devis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update devis",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/devis/:id
 * Supprimer un devis
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.devis.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Devis deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting devis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete devis",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
