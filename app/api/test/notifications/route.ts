import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification, notifyWithEmail, sendEmailSafe } from '@/lib/notificationService'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Test endpoint pour vérifier les notifications et emails
 * Usage: POST /api/test/notifications
 * 
 * En production, cette route doit être protégée ou supprimée!
 */

export async function POST(req: NextRequest) {
  try {
    // SÉCURITÉ: Vérifier l'authentification en production
    if (process.env.NODE_ENV === 'production') {
      const session = await getServerSession(authOptions)
      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Endpoint de test - Accès administrateur requis' },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const { type, userId, email } = body

    if (!type) {
      return NextResponse.json(
        { error: 'type requis: "notification", "email", ou "combined"' },
        { status: 400 }
      )
    }

    let result: any = {}

    // TEST 1: Notification seule
    if (type === 'notification' || type === 'combined') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId requis pour créer une notification' },
          { status: 400 }
        )
      }

      result.notification = await createNotification({
        utilisateurId: userId,
        titre: '🧪 Test Notification',
        message: `Ceci est une notification de test créée à ${new Date().toLocaleTimeString('fr-FR')}`,
        type: 'INFO',
        lien: '/dashboard',
        sourceType: 'TEST'
      })

      console.log(`✅ Notification test créée pour ${userId}`)
    }

    // TEST 2: Email seul
    if (type === 'email' || type === 'combined') {
      if (!email) {
        return NextResponse.json(
          { error: 'email requis pour envoyer un email' },
          { status: 400 }
        )
      }

      result.email = await sendEmailSafe({
        to: email,
        subject: '🧪 Test Email - KEKELI GROUP',
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1e40af;">🧪 Test Email</h1>
                <p>Ceci est un email de test du système de notifications.</p>
                <p><strong>Heure:</strong> ${new Date().toLocaleString('fr-FR')}</p>
                <hr>
                <p>Si vous recevez cet email, le système d'envoi fonctionne correctement! ✅</p>
              </div>
            </body>
          </html>
        `,
        nonBlocking: true
      })

      console.log(`✅ Email test envoyé à ${email}`)
    }

    // TEST 3: Notification + Email ensemble
    if (type === 'combined') {
      if (!userId || !email) {
        return NextResponse.json(
          { error: 'userId ET email requis pour le mode combined' },
          { status: 400 }
        )
      }

      result.combined = await notifyWithEmail(
        {
          utilisateurId: userId,
          titre: '🧪 Test Combiné',
          message: `Notification + Email test à ${new Date().toLocaleTimeString('fr-FR')}`,
          type: 'INFO',
          sourceType: 'TEST'
        },
        {
          to: email,
          subject: '🧪 Test Combiné - Notification + Email',
          html: `
            <h2>Test Combiné</h2>
            <p>Vous avez reçu à la fois:</p>
            <ul>
              <li>✅ Une notification in-app</li>
              <li>✅ Un email</li>
            </ul>
          `,
          nonBlocking: true
        },
        true
      )

      console.log(`✅ Test combiné créé pour ${userId} / ${email}`)
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} exécuté avec succès`,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erreur test notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Erreur lors du test'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint pour informations de diagnostic
 */
export async function GET(req: NextRequest) {
  const info = {
    smtpConfigured: !!process.env.SMTP_HOST,
    smtpHost: process.env.SMTP_HOST || 'NOT SET (using Ethereal)',
    smtpPort: process.env.SMTP_PORT || 587,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json({
    message: 'Test Notifications API',
    info,
    examples: {
      createNotification: {
        method: 'POST',
        path: '/api/test/notifications',
        body: {
          type: 'notification',
          userId: 'user-id-here'
        }
      },
      sendEmail: {
        method: 'POST',
        path: '/api/test/notifications',
        body: {
          type: 'email',
          email: 'test@example.com'
        }
      },
      combinedTest: {
        method: 'POST',
        path: '/api/test/notifications',
        body: {
          type: 'combined',
          userId: 'user-id-here',
          email: 'test@example.com'
        }
      }
    }
  })
}
