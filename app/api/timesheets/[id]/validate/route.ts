import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatutTimeSheet } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyWithEmail } from "@/lib/notificationService";

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
    const session = await getServerSession(authOptions);
    
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

    console.log('🔐 Validation timesheet - User:', {
      email: session.user.email,
      userFound: !!currentUser,
      role: currentUser?.role,
      isManager: currentUser?.role === 'MANAGER',
      isAdmin: currentUser?.role === 'ADMIN'
    });

    // Allow both MANAGER and ADMIN to validate timesheets
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          message: `Forbidden: Only managers and admins can validate timesheets. Your role: ${currentUser?.role || 'unknown'}`,
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

    // Envoyer une notification à l'employé avec email
    console.log(`📢 [PATCH /api/timesheets/:id/validate] Validation timesheet - action: ${action}`)
    let notificationMessage = "";
    let notificationType = "SUCCES";
    let emailSubject = "";
    let emailHTML = "";

    if (action === "validate") {
      notificationMessage = `Votre timesheet du ${new Date(timesheet.date).toLocaleDateString('fr-FR')} pour le projet "${updatedTimesheet.project.titre}" a été validé.`;
      emailSubject = `✅ TimeSheet Validé - ${updatedTimesheet.employee.prenom} ${updatedTimesheet.employee.nom}`;
      emailHTML = `
        <h2>TimeSheet Validé</h2>
        <p>Votre timesheet a été <strong>validé</strong> par ${updatedTimesheet.valideParUser?.prenom || 'un manager'} ${updatedTimesheet.valideParUser?.nom || ''}.</p>
        <p><strong>Projet :</strong> ${updatedTimesheet.project.titre}</p>
        <p><strong>Date :</strong> ${new Date(timesheet.date).toLocaleDateString('fr-FR')}</p>
        <p><strong>Statut :</strong> ✅ Validé</p>
      `;
    } else if (action === "reject") {
      notificationMessage = `Votre timesheet du ${new Date(timesheet.date).toLocaleDateString('fr-FR')} pour le projet "${updatedTimesheet.project.titre}" a été rejeté.`;
      notificationType = "ALERTE";
      emailSubject = `❌ TimeSheet Rejeté - ${updatedTimesheet.employee.prenom} ${updatedTimesheet.employee.nom}`;
      if (body.comment) {
        notificationMessage += ` Raison: ${body.comment}`;
        emailHTML = `
          <h2>TimeSheet Rejeté</h2>
          <p>Votre timesheet a été <strong>rejeté</strong> par ${updatedTimesheet.valideParUser?.prenom || 'un manager'} ${updatedTimesheet.valideParUser?.nom || ''}.</p>
          <p><strong>Projet :</strong> ${updatedTimesheet.project.titre}</p>
          <p><strong>Date :</strong> ${new Date(timesheet.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>Motif du rejet :</strong> ${body.comment}</p>
          <p><strong>Action :</strong> Veuillez corriger et resoumettez votre timesheet.</p>
        `;
      } else {
        emailHTML = `
          <h2>TimeSheet Rejeté</h2>
          <p>Votre timesheet a été <strong>rejeté</strong>.</p>
          <p><strong>Projet :</strong> ${updatedTimesheet.project.titre}</p>
          <p><strong>Date :</strong> ${new Date(timesheet.date).toLocaleDateString('fr-FR')}</p>
        `;
      }
    } else if (action === "correct") {
      notificationMessage = `Votre timesheet du ${new Date(timesheet.date).toLocaleDateString('fr-FR')} pour le projet "${updatedTimesheet.project.titre}" doit être corrigé.`;
      notificationType = "ALERTE";
      emailSubject = `⚠️ TimeSheet à Corriger - ${updatedTimesheet.employee.prenom} ${updatedTimesheet.employee.nom}`;
      if (body.comment) {
        notificationMessage += ` Détails: ${body.comment}`;
        emailHTML = `
          <h2>TimeSheet à Corriger</h2>
          <p>Votre timesheet doit être <strong>corrigé</strong> selon les indications de ${updatedTimesheet.valideParUser?.prenom || 'un manager'} ${updatedTimesheet.valideParUser?.nom || ''}.</p>
          <p><strong>Projet :</strong> ${updatedTimesheet.project.titre}</p>
          <p><strong>Date :</strong> ${new Date(timesheet.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>Détails à corriger :</strong> ${body.comment}</p>
        `;
      } else {
        emailHTML = `
          <h2>TimeSheet à Corriger</h2>
          <p>Votre timesheet doit être <strong>corrigé</strong>.</p>
          <p><strong>Projet :</strong> ${updatedTimesheet.project.titre}</p>
          <p><strong>Date :</strong> ${new Date(timesheet.date).toLocaleDateString('fr-FR')}</p>
        `;
      }
    }

    try {
      console.log(`📬 [PATCH /api/timesheets/:id/validate] Envoi notification + email à l'employé ${updatedTimesheet.employee.email}`)
      // Utiliser le service de notification unifié avec email
      await notifyWithEmail(
        {
          utilisateurId: updatedTimesheet.employee.id,
          titre: `TimeSheet ${action === "validate" ? "validé" : action === "reject" ? "rejeté" : "à corriger"}`,
          message: notificationMessage,
          type: notificationType as any,
          lien: `/timesheets/my-timesheets`,
          sourceId: updatedTimesheet.id,
          sourceType: "TIMESHEET",
        },
        {
          to: updatedTimesheet.employee.email,
          subject: emailSubject,
          html: `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e40af; margin: 0;">KEKELI GROUP</h1>
      </div>
      ${emailHTML}
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 12px; color: #666;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/timesheets/my-timesheets" style="color: #1e40af; text-decoration: none;">Voir mes timesheets</a>
      </p>
    </div>
  </body>
</html>`,
        },
        false // nonBlockingEmail
      );
      console.log(`✅ [PATCH /api/timesheets/:id/validate] Notification + Email envoyés à l'employé ${updatedTimesheet.employee.email}`);
    } catch (notifError) {
      console.error(`❌ [PATCH /api/timesheets/:id/validate] Erreur envoi notification:`, notifError);
    }

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
