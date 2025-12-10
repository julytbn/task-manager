import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/timesheets/:id
 * Récupérer un timesheet spécifique
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timesheet = await prisma.timeSheet.findUnique({
      where: { id: params.id },
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

    if (!timesheet) {
      return NextResponse.json(
        {
          success: false,
          message: "TimeSheet not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch timesheet",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/timesheets/:id
 * Mettre à jour un timesheet
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const timesheet = await prisma.timeSheet.update({
      where: { id: params.id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        regularHrs: body.regularHrs,
        overtimeHrs: body.overtimeHrs,
        sickHrs: body.sickHrs,
        vacationHrs: body.vacationHrs,
        description: body.description,
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
      },
    });

    return NextResponse.json({
      success: true,
      data: timesheet,
      message: "TimeSheet updated successfully",
    });
  } catch (error) {
    console.error("Error updating timesheet:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update timesheet",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/timesheets/:id
 * Supprimer un timesheet
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.timeSheet.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "TimeSheet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timesheet:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete timesheet",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
