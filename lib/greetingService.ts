import { prisma } from './prisma'
import { sendEmail } from './email'

type EventType = 'BIRTHDAY' | 'CHRISTMAS' | 'NEW_YEAR' | 'EASTER' | 'OTHER'

interface GreetingTemplate {
  subject: string
  html: (name: string) => string
  text: (name: string) => string
}

const templates: Record<EventType, GreetingTemplate> = {
  BIRTHDAY: {
    subject: '🎉 Joyeux Anniversaire !',
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Cher(e) ${name},</h2>
        <p>L'équipe de KEKELI GROUP vous souhaite un très joyeux anniversaire ! 🎂</p>
        <p>Que cette journée soit remplie de joie et de bonheur.</p>
        <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
      </div>
    `,
    text: (name) => `Cher(e) ${name},\n\nToute l'équipe de KEKELI GROUP vous souhaite un très joyeux anniversaire !\n\nCordialement,\nL'équipe KEKELI GROUP`
  },
  CHRISTMAS: {
    subject: '🎄 Joyeux Noël !',
    html: () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Joyeux Noël !</h2>
        <p>Que cette période des fêtes soit remplie de joie et de bonheur pour vous et vos proches.</p>
        <p>Meilleurs vœux pour les fêtes de fin d'année !</p>
        <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
      </div>
    `,
    text: () => "Joyeux Noël !\n\nQue cette période des fêtes soit remplie de joie et de bonheur pour vous et vos proches.\n\nMeilleurs vœux pour les fêtes de fin d'année !\n\nCordialement,\nL'équipe KEKELI GROUP"
  },
  // Ajoutez d'autres modèles pour les différents événements
  NEW_YEAR: {
    subject: '🎆 Bonne Année !',
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Bonne Année ${name} !</h2>
        <p>Que cette nouvelle année vous apporte bonheur, santé et succès dans tous vos projets.</p>
        <p>Meilleurs vœux pour 2025 !</p>
        <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
      </div>
    `,
    text: (name) => `Bonne Année ${name} !\n\nQue cette nouvelle année vous apporte bonheur, santé et succès dans tous vos projets.\n\nMeilleurs vœux pour 2025 !\n\nCordialement,\nL'équipe KEKELI GROUP`
  },
  EASTER: {
    subject: '🐣 Joyeuses Pâques !',
    html: () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Joyeuses Pâques !</h2>
        <p>Que cette fête de Pâques vous apporte joie et sérénité en compagnie de vos proches.</p>
        <p>Bonnes fêtes de Pâques !</p>
        <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
      </div>
    `,
    text: () => "Joyeuses Pâques !\n\nQue cette fête de Pâques vous apporte joie et sérénité en compagnie de vos proches.\n\nBonnes fêtes de Pâques !\n\nCordialement,\nL'équipe KEKELI GROUP"
  },
  OTHER: {
    subject: 'Meilleurs vœux de la part de KEKELI GROUP',
    html: () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Pensées chaleureuses</h2>
        <p>L'équipe de KEKELI GROUP pense à vous et vous souhaite le meilleur.</p>
        <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
      </div>
    `,
    text: () => "Pensées chaleureuses\n\nL'équipe de KEKELI GROUP pense à vous et vous souhaite le meilleur.\n\nCordialement,\nL'équipe KEKELI GROUP"
  }
}

export async function sendGreeting(eventType: EventType, userId: string) {
  try {
    // Récupérer les informations de l'utilisateur
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        dateNaissance: true
      }
    })

    if (!user || !user.email) {
      console.error(`Utilisateur non trouvé ou email manquant: ${userId}`)
      return { success: false, error: 'Utilisateur non trouvé ou email manquant' }
    }

    const template = templates[eventType] || templates.OTHER
    const fullName = user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : 'collaborateur'

    // Envoyer l'email
    const result = await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html(fullName)
    })

    // Enregistrer l'envoi dans la base de données
    await prisma.notification.create({
      data: {
        utilisateurId: user.id,
        titre: template.subject,
        message: `Message de vœux envoyé pour ${eventType}`,
        type: 'INFO',
        lu: false
      }
    })

    console.log(`Message de vœux ${eventType} envoyé à ${user.email}`)
    return { success: true, result }
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message de vœux:`, error)
    return { success: false, error: String(error) }
  }
}

interface UserForGreeting {
  id: string
  email: string | null
  prenom: string | null
  nom: string | null
  dateNaissance: Date | null
}

export async function sendBirthdayGreetings() {
  try {
    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1 // Les mois commencent à 0

    // Créer les dates pour la vérification des notifications existantes
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Vérifier si on a déjà envoyé des vœux aujourd'hui
    const existingGreetings = await prisma.notification.findMany({
      where: {
        titre: templates.BIRTHDAY.subject,
        dateCreation: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      select: {
        utilisateurId: true
      }
    })

    const excludedUserIds = existingGreetings.map(g => g.utilisateurId)
    
    // Formater la date de naissance au format JJ-MM
    const dateStr = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}`
    
    // Récupérer tous les utilisateurs actifs avec une date de naissance
    const allUsers = await prisma.utilisateur.findMany({
      where: {
        dateNaissance: {
          not: null
        },
        email: {
          contains: '@',
          not: ''
        },
        actif: true
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        dateNaissance: true
      }
    })

    // Filtrer les utilisateurs dont c'est l'anniversaire aujourd'hui
    const users = allUsers.filter((user: UserForGreeting) => {
      if (!user.dateNaissance) return false
      
      // Formater la date de naissance au format JJ-MM
      const birthDate = new Date(user.dateNaissance)
      const birthDay = birthDate.getDate()
      const birthMonth = birthDate.getMonth() + 1
      const birthDateStr = `${birthDay.toString().padStart(2, '0')}-${birthMonth.toString().padStart(2, '0')}`
      
      return birthDateStr === dateStr && !excludedUserIds.includes(user.id)
    })

    console.log(`Trouvé ${users.length} anniversaires aujourd'hui`)
    
    // Envoyer les messages d'anniversaire
    const results = await Promise.all(
      users.map((user: UserForGreeting) => sendGreeting('BIRTHDAY', user.id))
    )

    return {
      success: true,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: results.length
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi des vœux d\'anniversaire:', error)
    return { success: false, error: String(error) }
  }
}

export async function sendHolidayGreetings(eventType: EventType) {
  try {
    // Récupérer tous les utilisateurs actifs avec un email valide
    const users = await prisma.utilisateur.findMany({
      where: {
        email: {
          contains: '@',
          not: '' // Filtre basique pour s'assurer que l'email a un format valide
        },
        actif: true // Ne prendre que les utilisateurs actifs
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true
      }
    })

    console.log(`Envoi de vœux de ${eventType} à ${users.length} utilisateurs`)
    
    // Envoyer les messages de vœux
    const results = await Promise.all(
      users.map(user => sendGreeting(eventType, user.id))
    )

    return {
      success: true,
      event: eventType,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: results.length
    }
  } catch (error) {
    console.error(`Erreur lors de l'envoi des vœux de ${eventType}:`, error)
    return { success: false, error: String(error) }
  }
}
