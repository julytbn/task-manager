import cron from 'node-cron'
import { sendBirthdayGreetings, sendHolidayGreetings } from './greetingService'

// Activer le planificateur uniquement en production
const ENABLE_SCHEDULER = process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true'

export function startScheduler() {
  if (!ENABLE_SCHEDULER) {
    console.log('🔇 Planificateur désactivé (NODE_ENV n\'est pas en production)')
    return
  }

  console.log('⏰ Démarrage du planificateur de messages de vœux...')

  // Planifier l'envoi des messages d'anniversaire tous les jours à 9h00
  cron.schedule('0 9 * * *', async () => {
    console.log('🎂 Vérification des anniversaires...')
    try {
      const result = await sendBirthdayGreetings()
      console.log(`Résultat de l'envoi des vœux d'anniversaire:`, result)
    } catch (error) {
      console.error('Erreur lors de l\'envoi des vœux d\'anniversaire:', error)
    }
  })

  // Planifier les vœux de Noël (25 décembre)
  cron.schedule('0 9 25 12 *', async () => {
    console.log('🎄 Envoi des vœux de Noël...')
    try {
      const result = await sendHolidayGreetings('CHRISTMAS')
      console.log('Résultat de l\'envoi des vœux de Noël:', result)
    } catch (error) {
      console.error('Erreur lors de l\'envoi des vœux de Noël:', error)
    }
  })

  // Planifier les vœux de Nouvel An (1er janvier)
  cron.schedule('0 9 1 1 *', async () => {
    console.log('🎆 Envoi des vœux de Nouvel An...')
    try {
      const result = await sendHolidayGreetings('NEW_YEAR')
      console.log('Résultat de l\'envoi des vœux de Nouvel An:', result)
    } catch (error) {
      console.error('Erreur lors de l\'envoi des vœux de Nouvel An:', error)
    }
  })

  // Planifier les vœux de Pâques (date variable, à calculer)
  // Note: Pour Pâques, vous devrez implémenter une logique pour calculer la date
  cron.schedule('0 9 1-7 4 0', async () => {
    // Vérifier si c'est bien le dimanche de Pâques
    const today = new Date()
    if (isEasterSunday(today)) {
      console.log('🐣 Envoi des vœux de Pâques...')
      try {
        const result = await sendHolidayGreetings('EASTER')
        console.log('Résultat de l\'envoi des vœux de Pâques:', result)
      } catch (error) {
        console.error('Erreur lors de l\'envoi des vœux de Pâques:', error)
      }
    }
  })

  console.log('✅ Planificateur démarré avec succès')
}

// Fonction utilitaire pour calculer le dimanche de Pâques (algorithme de Meeus/Jones/Butcher)
function isEasterSunday(date: Date): boolean {
  const year = date.getFullYear()
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return date.getMonth() === month && date.getDate() === day
}
