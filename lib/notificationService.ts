import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * Service centralisé pour les notifications et emails
 * Gère:
 * - Création de notifications in-app
 * - Envoi d'emails (avec gestion d'erreurs robuste)
 * - Logging des tentatives
 */

export interface NotificationPayload {
  utilisateurId: string
  titre: string
  message: string
  type?: 'ALERTE' | 'INFO' | 'EQUIPE' | 'TACHE' | 'SUCCES' | 'TIMESHEET' | 'SALAIRE'
  lien?: string
  sourceId?: string
  sourceType?: string
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
  nonBlocking?: boolean // Si true, n'arrête pas si l'email échoue
}

/**
 * Crée une notification in-app (toujours)
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    console.log(`📢 [createNotification] Création notification pour userId=${payload.utilisateurId}, titre="${payload.titre}"`)
    
    const notification = await (prisma as any).notification.create({
      data: {
        utilisateurId: payload.utilisateurId,
        titre: payload.titre,
        message: payload.message,
        type: payload.type || 'INFO',
        lien: payload.lien || null,
        sourceId: payload.sourceId || null,
        sourceType: payload.sourceType || null,
        lu: false
      }
    })

    console.log(`✅ [createNotification] Notification créée avec succès: ID=${notification.id}, utilisateur=${payload.utilisateurId}`)
    return { success: true, notification }
  } catch (error) {
    console.error(`❌ [createNotification] Erreur création notification:`, error)
    return { success: false, error: String(error) }
  }
}

/**
 * Envoie un email (non-blocking par défaut)
 */
export async function sendEmailSafe(payload: EmailPayload) {
  const { to, subject, html, from, nonBlocking = true } = payload

  try {
    // Validation basique
    if (!to || !subject || !html) {
      throw new Error('Email: to, subject, et html sont requis')
    }

    // Valider l'email
    if (!isValidEmail(to)) {
      console.warn(`⚠️ Email invalide: ${to}`)
      if (!nonBlocking) {
        throw new Error(`Email invalide: ${to}`)
      }
      return { success: false, error: 'Invalid email address' }
    }

    console.log(`📧 Tentative envoi email à: ${to}`)

    // Essayer d'envoyer l'email
    const result = await sendEmail({ to, subject, html, from })

    if (result.success) {
      console.log(`✅ Email envoyé avec succès à: ${to}`)
      return { success: true, result }
    } else {
      console.warn(`⚠️ Erreur envoi email à ${to}: ${result.error}`)
      if (!nonBlocking) {
        throw new Error(result.error)
      }
      return { success: false, error: result.error }
    }
  } catch (error) {
    const errorMsg = String(error)
    console.error(`❌ Erreur sendEmailSafe:`, error)

    if (nonBlocking) {
      console.log(`⚠️ Email non-bloquant: l'erreur n'arrête pas le processus`)
      return { success: false, error: errorMsg }
    } else {
      throw error
    }
  }
}

/**
 * Crée une notification ET envoie un email de manière coordonnée
 */
export async function notifyWithEmail(
  notificationPayload: NotificationPayload,
  emailPayload: EmailPayload,
  nonBlockingEmail: boolean = true
) {
  try {
    console.log(`📬 [notifyWithEmail] Envoi notification + email pour userId=${notificationPayload.utilisateurId}`)
    
    // 1. Toujours créer la notification in-app
    const notifResult = await createNotification(notificationPayload)
    console.log(`📮 [notifyWithEmail] Résultat notification: success=${notifResult.success}`)

    // 2. Essayer d'envoyer l'email
    const emailResult = await sendEmailSafe({
      ...emailPayload,
      nonBlocking: nonBlockingEmail
    })
    console.log(`📧 [notifyWithEmail] Résultat email: success=${emailResult.success}, email="${emailPayload.to}"`)

    return {
      success: notifResult.success && emailResult.success,
      notification: notifResult,
      email: emailResult
    }
  } catch (error) {
    console.error(`❌ [notifyWithEmail] Erreur dans notifyWithEmail:`, error)
    return {
      success: false,
      error: String(error)
    }
  }
}

/**
 * Valide une adresse email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Templates de notifications courantes
 */
export const notificationTemplates = {
  taskAssigned: (taskTitle: string, assignedByName: string): Partial<NotificationPayload> => ({
    type: 'TACHE',
    titre: `Nouvelle tâche assignée: ${taskTitle}`,
    message: `Vous avez une nouvelle tâche assignée par ${assignedByName}.`
  }),

  timesheetSubmitted: (employeeName: string, hours: number, projectName: string): Partial<NotificationPayload> => ({
    type: 'TIMESHEET',
    titre: 'Nouveau timesheet à valider',
    message: `${employeeName} a soumis un timesheet de ${hours}h pour le projet "${projectName}".`
  }),

  teamMemberAdded: (teamName: string): Partial<NotificationPayload> => ({
    type: 'EQUIPE',
    titre: `Bienvenue dans l'équipe ${teamName}`,
    message: `Vous avez été ajouté(e) à l'équipe **${teamName}**.`
  }),

  taskLate: (taskTitle: string, daysLate: number): Partial<NotificationPayload> => ({
    type: 'ALERTE',
    titre: 'Tâche en retard',
    message: `La tâche « ${taskTitle} » est en retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}.`
  }),

  salaryForecast: (amount: number, month: string): Partial<NotificationPayload> => ({
    type: 'SALAIRE',
    titre: 'Prévision salariale disponible',
    message: `Votre prévision salariale pour ${month} est de ${amount} FCFA.`
  })
}
