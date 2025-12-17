import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/timesheets
 * Récupérer tous les timesheets avec filtres optionnels
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const timesheets = await prisma.timeSheet.findMany({
      where: {
        projectId: searchParams.get("projectId") || undefined,
        employeeId: searchParams.get("employeeId") || undefined,
        statut: searchParams.get("statut") as any || undefined,
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
      orderBy: { date: "desc" },
      skip: searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : 0,
      take: searchParams.get("take") ? parseInt(searchParams.get("take")!) : 50,
    });

    return NextResponse.json({
      success: true,
      data: timesheets,
      count: timesheets.length,
    });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch timesheets",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/timesheets
 * Créer un nouveau timesheet
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.employeeId || !body.taskId || !body.projectId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: employeeId, taskId, projectId, date, regularHrs",
        },
        { status: 400 }
      );
    }

    const timesheet = await prisma.timeSheet.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        regularHrs: body.regularHrs || 0,
        overtimeHrs: body.overtimeHrs,
        sickHrs: body.sickHrs,
        vacationHrs: body.vacationHrs,
        description: body.description,
        statut: "EN_ATTENTE",
        employeeId: body.employeeId,
        taskId: body.taskId,
        projectId: body.projectId,
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
            equipeId: true,
          },
        },
      },
    });

    // Envoyer une notification au manager
    if (timesheet.project.equipeId) {
      const equipe = await prisma.equipe.findUnique({
        where: { id: timesheet.project.equipeId },
        select: { leadId: true, nom: true },
      });

      if (equipe?.leadId) {
        const totalHours = 
          (timesheet.regularHrs || 0) + 
          (timesheet.overtimeHrs || 0) + 
          (timesheet.sickHrs || 0) + 
          (timesheet.vacationHrs || 0);

        await prisma.notification.create({
          data: {
            utilisateurId: equipe.leadId,
            titre: "Nouveau Timesheet à valider",
            message: `${timesheet.employee.prenom} ${timesheet.employee.nom} a soumis un timesheet de ${totalHours}h pour le projet "${timesheet.project.titre}" (${new Date(timesheet.date).toLocaleDateString('fr-FR')})`,
            type: "ALERTE",
            lien: `/timesheets/validation?filter=EN_ATTENTE`,
            sourceId: timesheet.id,
            sourceType: "TIMESHEET",
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: timesheet,
        message: "TimeSheet created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating timesheet:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create timesheet",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
