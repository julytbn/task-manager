import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/timesheets
 * Récupérer tous les timesheets avec filtres optionnels
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const where: any = {
      projectId: searchParams.get("projectId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
    };

    // Valider le statut s'il est fourni
    const statutParam = searchParams.get("statut");
    if (statutParam && ["EN_ATTENTE", "VALIDEE", "REJETEE", "CORRIGEE"].includes(statutParam)) {
      where.statut = statutParam;
    }

    const timesheets = await prisma.timeSheet.findMany({
      where,
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

    // Validation des champs requis
    const missingFields: string[] = [];
    if (!body.employeeId) missingFields.push('employeeId');
    if (!body.taskId) missingFields.push('taskId');
    if (!body.projectId) missingFields.push('projectId');
    if (!body.date) missingFields.push('date');
    if (body.regularHrs === undefined || body.regularHrs === null) missingFields.push('regularHrs');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    const timesheet = await prisma.timeSheet.create({
      data: {
        date: new Date(body.date),
        regularHrs: Math.round(body.regularHrs),
        overtimeHrs: body.overtimeHrs ? Math.round(body.overtimeHrs) : 0,
        sickHrs: body.sickHrs ? Math.round(body.sickHrs) : 0,
        vacationHrs: body.vacationHrs ? Math.round(body.vacationHrs) : 0,
        description: body.description || null,
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
          },
        },
      },
    });

    // Créer une notification pour les admins/managers
    try {
      const admins = await prisma.utilisateur.findMany({
        where: {
          OR: [
            { role: "ADMIN" },
            { role: "MANAGER" }
          ]
        }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            titre: "Nouveau TimeSheet soumis",
            message: `${timesheet.employee.prenom} ${timesheet.employee.nom} a soumis un timesheet pour la tâche "${timesheet.task.titre}" du projet "${timesheet.project.titre}"`,
            type: "TACHE",
            utilisateurId: admin.id,
            sourceId: timesheet.id,
          },
        }).catch(err => console.error("Erreur création notification:", err));
      }
    } catch (notifError) {
      console.error("Erreur lors de la création des notifications:", notifError);
      // Ne pas bloquer la création du timesheet si les notifications échouent
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
