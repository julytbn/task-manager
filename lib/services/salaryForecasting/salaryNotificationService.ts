import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

/**
 * Service pour gérer les notifications des prévisions salariales
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Envoie une notification de fin de calcul de prévisions (31 du mois)
 */
export async function notifySalaryForecastCalculated() {
  try {
    const now = new Date();
    const mois = now.getMonth() + 1;
    const annee = now.getFullYear();

    // Récupérer les prévisions calculées aujourd'hui
    const forecasts = await prisma.previsionSalaire.findMany({
      where: {
        mois,
        annee,
        dateGeneration: {
          gte: new Date(annee, mois - 1, now.getDate()),
          lt: new Date(annee, mois - 1, now.getDate() + 1),
        },
      },
      include: {
        employe: {
          select: {
            email: true,
            prenom: true,
            nom: true,
          },
        },
      },
    });

    if (forecasts.length === 0) {
      console.log('No salary forecasts to notify');
      return;
    }

    // Obtenir tous les admins
    const admins = await prisma.utilisateur.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, prenom: true, nom: true },
    });

    const monthName = new Date(annee, mois - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    const totalAmount = forecasts.reduce((sum, f) => sum + f.montantPrevu, 0);

    // Créer notification in-app pour chaque admin
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          utilisateurId: admin.id,
          titre: '📊 Prévisions salariales calculées',
          message: `Les prévisions salariales de ${monthName} ont été calculées. Total: ${totalAmount.toLocaleString('fr-FR')} FCFA pour ${forecasts.length} employés.`,
          type: 'INFO',
          sourceType: 'SALARY_FORECAST',
        },
      });

      // Envoyer email
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: admin.email,
        subject: `✅ Prévisions salariales ${monthName} - Kekeli`,
        html: `
          <h2>Prévisions salariales calculées</h2>
          <p>Bonjour ${admin.prenom},</p>
          <p>Les prévisions salariales du mois de <strong>${monthName}</strong> ont été calculées avec succès.</p>
          <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Montant total:</strong> ${totalAmount.toLocaleString('fr-FR')} FCFA</p>
            <p><strong>Nombre d'employés:</strong> ${forecasts.length}</p>
            <p><strong>Date limite de paiement:</strong> 5 ${monthName}</p>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Voir le détail →</a></p>
        `,
      });
    }

    console.log(`✅ Salary forecast notifications sent to ${admins.length} admins`);
  } catch (error) {
    console.error('Error in notifySalaryForecastCalculated:', error);
  }
}

/**
 * Envoie notification de paiement des salaires (1er du mois)
 */
export async function notifySalaryPaymentDue() {
  try {
    const now = new Date();
    const mois = now.getMonth() + 1;
    const annee = now.getFullYear();

    // Récupérer les prévisions du mois précédent
    const prevMonth = mois === 1 ? 12 : mois - 1;
    const prevYear = mois === 1 ? annee - 1 : annee;

    const forecasts = await prisma.previsionSalaire.aggregate({
      where: {
        mois: prevMonth,
        annee: prevYear,
      },
      _sum: {
        montantPrevu: true,
      },
    });

    if (!forecasts._sum.montantPrevu) {
      console.log('No salary forecasts to pay');
      return;
    }

    // Obtenir tous les admins et managers
    const notifyUsers = await prisma.utilisateur.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
      },
      select: { id: true, email: true, prenom: true, nom: true, role: true },
    });

    const monthName = new Date(prevYear, prevMonth - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    const totalAmount = forecasts._sum.montantPrevu;

    // Créer notifications
    for (const user of notifyUsers) {
      await prisma.notification.create({
        data: {
          utilisateurId: user.id,
          titre: '💰 Salaires à payer',
          message: `Les salaires du mois de ${monthName} doivent être payés avant le 5. Montant total: ${totalAmount?.toLocaleString('fr-FR')} FCFA`,
          type: 'ALERTE',
          sourceType: 'SALARY_PAYMENT',
        },
      });

      // Envoyer email
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: `💰 Rappel: Salaires à payer - ${monthName}`,
        html: `
          <h2>Rappel: Salaires à payer</h2>
          <p>Bonjour ${user.prenom},</p>
          <p>Un rappel que les salaires du mois de <strong>${monthName}</strong> doivent être payés avant le <strong>5 du mois courant</strong>.</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>💰 Montant total à payer:</strong> ${totalAmount?.toLocaleString('fr-FR')} FCFA</p>
            <p><strong>📅 Date limite:</strong> 5 ${new Date(now.getFullYear(), now.getMonth()).toLocaleDateString('fr-FR', { month: 'long' })}</p>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Voir les détails →</a></p>
        `,
      });
    }

    console.log(`✅ Salary payment reminders sent to ${notifyUsers.length} users`);
  } catch (error) {
    console.error('Error in notifySalaryPaymentDue:', error);
  }
}

/**
 * Envoie alerte si salaires non payés (3 du mois = J-2)
 */
export async function alertSalaryPaymentLate() {
  try {
    const now = new Date();
    const mois = now.getMonth() + 1;
    const annee = now.getFullYear();

    // Récupérer les prévisions du mois précédent
    const prevMonth = mois === 1 ? 12 : mois - 1;
    const prevYear = mois === 1 ? annee - 1 : annee;

    const forecasts = await prisma.previsionSalaire.aggregate({
      where: {
        mois: prevMonth,
        annee: prevYear,
      },
      _sum: {
        montantPrevu: true,
      },
    });

    // Vérifier les paiements effectués
    const payments = await prisma.paiement.aggregate({
      where: {
        datePaiement: {
          gte: new Date(prevYear, prevMonth - 1, 1),
          lte: new Date(prevYear, prevMonth, 0),
        },
        statut: 'CONFIRME',
      },
      _sum: {
        montant: true,
      },
    });

    const totalDue = forecasts._sum.montantPrevu || 0;
    const totalPaid = payments._sum.montant || 0;

    if (totalPaid >= totalDue) {
      console.log('✅ Salary payments are up to date');
      return;
    }

    // Obtenir tous les admins
    const admins = await prisma.utilisateur.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, prenom: true, nom: true },
    });

    const monthName = new Date(prevYear, prevMonth - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    const remaining = totalDue - totalPaid;

    // Créer alerte
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          utilisateurId: admin.id,
          titre: '🚨 ALERTE: Salaires non payés',
          message: `Les salaires du mois de ${monthName} n'ont pas été intégralement payés. Montant restant: ${remaining.toLocaleString('fr-FR')} FCFA (J-2)`,
          type: 'ALERTE',
          sourceType: 'SALARY_LATE_PAYMENT',
        },
      });

      // Envoyer email urgent
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: admin.email,
        subject: `🚨 URGENT: Salaires non payés - ${monthName}`,
        html: `
          <h2 style="color: #d32f2f;">⚠️ ALERTE: Salaires non payés</h2>
          <p>Bonjour ${admin.prenom},</p>
          <p style="color: #d32f2f; font-weight: bold;">Les salaires du mois de ${monthName} n'ont pas été intégralement payés!</p>
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <p><strong>Montant prévu:</strong> ${totalDue.toLocaleString('fr-FR')} FCFA</p>
            <p><strong>Montant payé:</strong> ${totalPaid.toLocaleString('fr-FR')} FCFA</p>
            <p style="color: #d32f2f;"><strong>Montant restant:</strong> ${remaining.toLocaleString('fr-FR')} FCFA</p>
            <p><strong style="color: #d32f2f;">📅 Délai: J-2 (paiement attendu le 5)</strong></p>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">Action requise immédiatement!</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Voir les détails →</a></p>
        `,
      });
    }

    console.log(`🚨 Late salary payment alerts sent to ${admins.length} admins`);
  } catch (error) {
    console.error('Error in alertSalaryPaymentLate:', error);
  }
}
