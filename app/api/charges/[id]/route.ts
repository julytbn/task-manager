import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charges/:id
 * Récupérer une charge spécifique
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const charge = await prisma.charge.findUnique({
      where: { id: params.id },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    if (!charge) {
      return NextResponse.json(
        {
          success: false,
          message: "Charge not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: charge,
    });
  } catch (error) {
    console.error("Error fetching charge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch charge",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/charges/:id
 * Mettre à jour une charge
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const charge = await prisma.charge.update({
      where: { id: params.id },
      data: {
        montant: body.montant,
        categorie: body.categorie,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        projetId: body.projetId,
        employeId: body.employeId,
        justificatifUrl: body.justificatifUrl,
        notes: body.notes,
        dateModification: new Date(),
      },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: charge,
      message: "Charge updated successfully",
    });
  } catch (error) {
    console.error("Error updating charge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update charge",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/charges/:id
 * Supprimer une charge
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.charge.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Charge deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting charge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete charge",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
