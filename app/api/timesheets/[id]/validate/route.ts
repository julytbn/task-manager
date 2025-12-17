import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatutTimeSheet } from "@prisma/client";
import { getServerSession } from "next-auth";

/**
 * PATCH /api/timesheets/:id/validate
 * Valider un timesheet (EN_ATTENTE → VALIDEE)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer la session de l'utilisateur courant (manager)
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User not authenticated",
        },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur courant pour avoir son ID
    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== "MANAGER") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Only managers can validate timesheets",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body; // action: "validate" | "reject" | "correct"

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required field: action",
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

    // Mettre à jour le timesheet avec l'ID du manager courant
    const updatedTimesheet = await prisma.timeSheet.update({
      where: { id: params.id },
      data: {
        statut: newStatus,
        validePar: currentUser.id, // ✅ Utiliser l'utilisateur courant
        dateModification: new Date(),
        commentaire: body.comment || null, // Ajouter le commentaire de rejet
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

    // Envoyer une notification à l'employé
    let notificationMessage = "";
    let notificationType = "SUCCES";

    if (action === "validate") {
      notificationMessage = `Votre timesheet du ${new Date(timesheet.date).toLocaleDateString('fr-FR')} pour le projet "${updatedTimesheet.project.titre}" a été validé.`;
    } else if (action === "reject") {
      notificationMessage = `Votre timesheet du ${new Date(timesheet.date).toLocaleDateString('fr-FR')} pour le projet "${updatedTimesheet.project.titre}" a été rejeté.`;
      notificationType = "ALERTE";
      if (body.comment) {
        notificationMessage += ` Raison: ${body.comment}`;
      }
    } else if (action === "correct") {
      notificationMessage = `Votre timesheet du ${new Date(timesheet.date).toLocaleDateString('fr-FR')} pour le projet "${updatedTimesheet.project.titre}" doit être corrigé.`;
      notificationType = "ALERTE";
      if (body.comment) {
        notificationMessage += ` Détails: ${body.comment}`;
      }
    }

    await prisma.notification.create({
      data: {
        utilisateurId: updatedTimesheet.employee.id,
        titre: `Timesheet ${action === "validate" ? "validé" : action === "reject" ? "rejeté" : "à corriger"}`,
        message: notificationMessage,
        type: notificationType as any,
        lien: `/timesheets/my-timesheets`,
        sourceId: updatedTimesheet.id,
        sourceType: "TIMESHEET",
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
