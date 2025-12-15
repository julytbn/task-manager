import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatutTimeSheet } from "@prisma/client";

/**
 * PATCH /api/timesheets/:id/validate
 * Valider un timesheet (EN_ATTENTE → VALIDEE)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { validePar, action } = body; // action: "validate" | "reject" | "correct"

    if (!action || !validePar) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: action, validePar (manager ID)",
        },
        { status: 400 }
      );
    }

    // Récupérer le timesheet actuel
    const timesheet = await prisma.timeSheet.findUnique({
      where: { id: params.id },
    });

    if (!timesheet) {
      return NextResponse.json(
        {
          success: false,
          message: "TimeSheet not found",
        },
        { status: 404 }
      );
    }

    let newStatus: StatutTimeSheet = "EN_ATTENTE";
    if (action === "validate") {
      newStatus = "VALIDEE";
    } else if (action === "reject") {
      newStatus = "REJETEE";
    } else if (action === "correct") {
      newStatus = "CORRIGEE";
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action. Must be: validate, reject, or correct",
        },
        { status: 400 }
      );
    }

    // Mettre à jour le timesheet
    const updatedTimesheet = await prisma.timeSheet.update({
      where: { id: params.id },
      data: {
        statut: newStatus,
        validePar,
        dateModification: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            titre: true,
          },
        },
        project: {
          select: {
            id: true,
            titre: true,
          },
        },
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTimesheet,
      message: `TimeSheet ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error validating timesheet:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to validate timesheet",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
