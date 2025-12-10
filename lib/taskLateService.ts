import { prisma } from '@/lib/prisma'
import { sendEmail, generateTaskLateNotificationEmail } from '@/lib/email'

/**
 * Service pour détecter les tâches en retard et créer des notifications
 */

/**
 * Vérifie si une tâche est en retard
 */
export function isTaskLate(
  dateEcheance: Date | null | undefined,
  statut: string
): boolean {
  // Une tâche n'est pas en retard si elle est complétée ou annulée
  if (statut === 'TERMINE' || statut === 'ANNULE') {
    return false
  }

  // Une tâche doit avoir une date d'échéance pour être en retard
  if (!dateEcheance) {
    return false
  }

  const now = new Date()
  return now > dateEcheance
}

/**
 * Calcule le nombre de jours de retard
 */
export function calculateTaskDaysLate(dateEcheance: Date): number {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - dateEcheance.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Détecte toutes les tâches en retard et crée des notifications
 */
export async function checkAndNotifyLateTasks() {
  try {
    // Récupère toutes les tâches non complétées avec une date d'échéance
    const allTasks = await prisma.tache.findMany({
      where: {
        statut: {
          notIn: ['TERMINE', 'ANNULE']
        },
        dateEcheance: {
          not: null
        }
      },
      include: {
        assigneA: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true
          }
        },
        projet: {
          select: {
            id: true,
            titre: true
          }
        }
      }
    })

    const lateTasks = []

    for (const task of allTasks) {
      if (isTaskLate(task.dateEcheance, task.statut)) {
        lateTasks.push(task)
      }
    }

    console.log(`📋 Tâches détectées: ${allTasks.length}, En retard: ${lateTasks.length}`)

    // Pour chaque tâche en retard, créer une notification et envoyer un email
    for (const task of lateTasks) {
      try {
        const daysLate = calculateTaskDaysLate(task.dateEcheance!)
        
        // Récupérer les infos complètes de l'assigné et du projet
        const assignedUser = task.assigneA
        const project = task.projet
        
        // Créer une notification pour l'employé assigné
        if (task.assigneAId) {
          try {
            // Vérifie si une notification existe déjà pour cette tâche (pour éviter les doublons)
            const existingNotification = await prisma.notification.findFirst({
              where: {
                utilisateurId: task.assigneAId,
                sourceId: task.id,
                sourceType: 'TACHE_EN_RETARD'
              }
            })

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  utilisateurId: task.assigneAId,
                  titre: 'Tâche en retard',
                  message: `La tâche « ${task.titre} » est en retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}.`,
                  lien: `/taches/${task.id}`,
                  sourceId: task.id,
                  sourceType: 'TACHE_EN_RETARD'
                }
              })
              console.log(`✅ Notification créée pour tâche en retard: ${task.titre}`)
            }
          } catch (notifError) {
            console.error(`❌ Erreur création notification pour tâche ${task.id}:`, notifError)
          }
        }

        // Envoyer un email à l'employé assigné
        if (assignedUser?.email) {
          try {
            const emailContent = generateTaskLateNotificationEmail(
              task.titre,
              task.description || undefined,
              daysLate,
              project?.titre || undefined,
              `https://task-manager.kekeligroup.com/taches/${task.id}`
            )

            await sendEmail({
              to: assignedUser.email,
              subject: emailContent.subject,
              html: emailContent.html
            })

            console.log(`📧 Email d'alerte tâche en retard envoyé à ${assignedUser.email}`)
          } catch (emailError) {
            console.error(`❌ Erreur envoi email pour tâche ${task.id}:`, emailError)
          }
        }
      } catch (taskError) {
        console.error(`❌ Erreur traitement tâche ${task.id}:`, taskError)
      }
    }

    return {
      totalTasks: allTasks.length,
      lateTasks: lateTasks.length,
      notified: lateTasks.length,
      success: true
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des tâches en retard:', error)
    return {
      success: false,
      error: String(error)
    }
  }
}

export default {
  isTaskLate,
  calculateTaskDaysLate,
  checkAndNotifyLateTasks
}
