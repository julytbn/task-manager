export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyWithEmail } from "@/lib/notificationService";

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

    if (!body.employeeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Le champ employeeId est obligatoire",
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
        taskId: body.taskId || null,
        projectId: body.projectId || null,
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

    // Calculer le total des heures
    const totalHours = 
      (timesheet.regularHrs || 0) + 
      (timesheet.overtimeHrs || 0) + 
      (timesheet.sickHrs || 0) + 
      (timesheet.vacationHrs || 0);

    // Envoyer une notification au manager et un email
    console.log(`📋 [POST /api/timesheets] Création timesheet par ${timesheet.employee.email}`);
    
    // 1. Notification au manager d'équipe si le projet a une équipe
    if (timesheet.project?.equipeId) {
      console.log(`🔍 [POST /api/timesheets] Équipe trouvée: ${timesheet.project.equipeId}`);
      const equipe = await prisma.equipe.findUnique({
        where: { id: timesheet.project.equipeId },
        select: { leadId: true, nom: true, lead: { select: { email: true, prenom: true, nom: true } } },
      });

      if (equipe?.leadId && equipe.lead?.email) {
        try {
          console.log(`📬 [POST /api/timesheets] Envoi notification + email au manager ${equipe.lead.email}`);
          await notifyWithEmail(
            {
              utilisateurId: equipe.leadId,
              titre: "Nouveau Timesheet à valider",
              message: `${timesheet.employee.prenom} ${timesheet.employee.nom} a soumis un timesheet de ${totalHours}h pour le projet "${timesheet.project.titre}"`,
              type: "ALERTE",
              lien: `/timesheets/validation?filter=EN_ATTENTE`,
            },
            {
              to: equipe.lead.email,
              subject: `Nouveau TimeSheet à valider - ${timesheet.employee.prenom} ${timesheet.employee.nom}`,
              html: `
<!DOCTYPE html>
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
      <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">📋 Nouveau TimeSheet à valider</h2>
      
      <p>Bonjour <strong>${equipe.lead.prenom} ${equipe.lead.nom}</strong>,</p>
      
      <p><strong>${timesheet.employee.prenom} ${timesheet.employee.nom}</strong> a soumis un nouveau timesheet.</p>
      
      <div style="background-color: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0; border-radius: 4px;">
        <p style="margin-top: 0;"><strong>📌 Détails du TimeSheet :</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Employé :</strong> ${timesheet.employee.prenom} ${timesheet.employee.nom}</li>
          <li><strong>Date :</strong> ${new Date(timesheet.date).toLocaleDateString('fr-FR')}</li>
          <li><strong>Projet :</strong> ${timesheet.project.titre}</li>
          <li><strong>Description :</strong> ${timesheet.description || 'Aucune description fournie'}</li>
          <li><strong>Heures régulières :</strong> ${timesheet.regularHrs || 0}h</li>
          <li><strong>Heures supplémentaires :</strong> ${timesheet.overtimeHrs || 0}h</li>
          <li><strong>Heures de maladie :</strong> ${timesheet.sickHrs || 0}h</li>
          <li><strong>Heures de congés :</strong> ${timesheet.vacationHrs || 0}h</li>
          <li><strong>Total :</strong> <strong>${totalHours}h</strong></li>
        </ul>
      </div>

      <p><strong>Actions requises :</strong></p>
      <ol style="margin: 10px 0;">
        <li>Connectez-vous à votre <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/timesheets/validation?filter=EN_ATTENTE" style="color: #1e40af; text-decoration: none;">tableau de bord</a></li>
        <li>Validez ou rejetez le timesheet</li>
        <li>Laissez un commentaire si nécessaire</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/timesheets/validation?filter=EN_ATTENTE" style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Valider le TimeSheet
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
        <strong>Besoin d'aide ?</strong><br>
        Contactez l'équipe support.
      </p>
      <p style="font-size: 11px; color: #999; margin: 10px 0 0 0; text-align: center;">
        © 2025 KEKELI GROUP. Tous droits réservés.<br>
        Cet email a été généré automatiquement.
      </p>
    </div>
  </body>
</html>
              `,
            },
            false
          );
          console.log(`✅ [POST /api/timesheets] Notification + Email TimeSheet envoyés au manager ${equipe.lead.email}`);
        } catch (notifError) {
          console.error(`❌ [POST /api/timesheets] Erreur notification TimeSheet manager:`, notifError);
        }
      }
    } else {
      console.log(`ℹ️ [POST /api/timesheets] Aucune équipe associée au projet ${timesheet.projectId}`);
    }

    // 2. Notification aux administrateurs
    try {
      console.log(`🔍 [POST /api/timesheets] Récupération des administrateurs`);
      const admins = await prisma.utilisateur.findMany({
        where: { 
          role: 'ADMIN',
          // Ne pas notifier l'utilisateur actuel s'il est admin
          id: { not: timesheet.employeeId } 
        },
        select: { 
          id: true, 
          email: true, 
          prenom: true, 
          nom: true 
        }
      });

      console.log(`🔍 [POST /api/timesheets] ${admins.length} administrateurs trouvés`);
      
      // Envoyer une notification à chaque administrateur
      for (const admin of admins) {
        if (admin.email) {
          console.log(`📬 [POST /api/timesheets] Envoi notification + email à l'admin ${admin.email}`);
          
          await notifyWithEmail(
            {
              utilisateurId: admin.id,
              titre: "[ADMIN] Nouveau Timesheet à valider",
              message: `${timesheet.employee.prenom} ${timesheet.employee.nom} a soumis un timesheet de ${totalHours}h` + 
                      (timesheet.project ? ` pour le projet "${timesheet.project.titre}"` : ""),
              type: "ALERTE",
              lien: `/admin/timesheets/validation?filter=EN_ATTENTE`,
            },
            {
              to: admin.email,
              subject: `[ADMIN] Nouveau TimeSheet à valider - ${timesheet.employee.prenom} ${timesheet.employee.nom}`,
              html: `
<!DOCTYPE html>
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
      <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">📋 [ADMIN] Nouveau TimeSheet à valider</h2>
      
      <p>Bonjour <strong>${admin.prenom} ${admin.nom}</strong>,</p>
      
      <p>En tant qu'administrateur, vous êtes notifié qu'un nouveau timesheet a été soumis.</p>
      
      <div style="background-color: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0; border-radius: 4px;">
        <p style="margin-top: 0;"><strong>📌 Détails du TimeSheet :</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Employé :</strong> ${timesheet.employee.prenom} ${timesheet.employee.nom}</li>
          <li><strong>Date :</strong> ${new Date(timesheet.date).toLocaleDateString('fr-FR')}</li>
          ${timesheet.project ? `<li><strong>Projet :</strong> ${timesheet.project.titre}</li>` : ''}
          ${timesheet.description ? `<li><strong>Description :</strong> ${timesheet.description}</li>` : ''}
          <li><strong>Heures régulières :</strong> ${timesheet.regularHrs || 0}h</li>
          <li><strong>Heures supplémentaires :</strong> ${timesheet.overtimeHrs || 0}h</li>
          <li><strong>Heures de maladie :</strong> ${timesheet.sickHrs || 0}h</li>
          <li><strong>Heures de congés :</strong> ${timesheet.vacationHrs || 0}h</li>
          <li><strong>Total :</strong> <strong>${totalHours}h</strong></li>
        </ul>
      </div>

      <p><strong>Actions recommandées :</strong></p>
      <ol style="margin: 10px 0;">
        <li>Vérifiez le <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/timesheets/validation?filter=EN_ATTENTE" style="color: #1e40af; text-decoration: none;">tableau de bord d'administration</a></li>
        <li>Assurez-vous qu'un manager est assigné pour la validation</li>
        <li>Contactez l'équipe en cas de problème</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/timesheets/validation?filter=EN_ATTENTE" style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Accéder à l'administration
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
        <strong>Besoin d'aide ?</strong><br>
        Contactez l'équipe technique.
      </p>
      <p style="font-size: 11px; color: #999; margin: 10px 0 0 0; text-align: center;">
        © 2025 KEKELI GROUP. Tous droits réservés.<br>
        Cet email a été généré automatiquement pour les administrateurs.
      </p>
    </div>
  </body>
</html>
              `,
            },
            false
          );
          
          console.log(`✅ [POST /api/timesheets] Notification + Email TimeSheet envoyés à l'admin ${admin.email}`);
        }
      }
    } catch (adminError) {
      console.error(`❌ [POST /api/timesheets] Erreur notification administrateurs:`, adminError);
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
