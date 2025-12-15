import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

/**
 * Test SMTP Configuration
 * POST /api/admin/test-smtp
 * 
 * Teste la configuration SMTP en envoyant un email
 */

export async function POST(request: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Variables SMTP manquantes',
          missing: {
            host: !process.env.SMTP_HOST ? 'SMTP_HOST' : undefined,
            user: !process.env.SMTP_USER ? 'SMTP_USER' : undefined,
            pass: !process.env.SMTP_PASS ? 'SMTP_PASS' : undefined
          }
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const testEmail = body.email || process.env.SMTP_USER

    // Envoyer l'email de test
    const result = await sendEmail({
      to: testEmail,
      subject: '🧪 Test Configuration SMTP - Kekeli Group',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 32px;">✅ Configuration SMTP Réussie</h1>
              </div>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; border-left: 4px solid #d4af37;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Serveur SMTP Validé</h2>
                
                <p><strong>Adresse email:</strong> <code>${testEmail}</code></p>
                <p><strong>Hôte SMTP:</strong> <code>${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</code></p>
                <p><strong>Timestamp:</strong> <code>${new Date().toISOString()}</code></p>
                
                <h3 style="color: #1a1a1a;">Fonctionnalités Activées:</h3>
                <ul>
                  <li>✅ Notifications de tâches</li>
                  <li>✅ Rappels de paiement</li>
                  <li>✅ Notifications d'équipe</li>
                  <li>✅ Réinitialisation de mot de passe</li>
                  <li>✅ Notifications de proforma</li>
                </ul>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  L'application est maintenant prête pour envoyer des emails en production.
                </p>
              </div>
              
              <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p>Kekeli Group - Système de Gestion de Projet</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    return NextResponse.json(
      {
        success: result.success,
        provider: result.provider,
        messageId: result.info?.messageId,
        previewUrl: result.previewUrl,
        message: 'Email de test envoyé avec succès',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[TEST-SMTP] Erreur:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as any).message,
        stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
      },
      { status: 500 }
    )
  }
}
