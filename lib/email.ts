import nodemailer from 'nodemailer'

export async function sendEmail(options: { to: string; subject: string; html: string; from?: string }) {
  const { to, subject, html, from } = options

  // If SMTP env is configured, use it
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    })

    const info = await transporter.sendMail({
      from: from || process.env.SMTP_FROM || 'noreply@kekeligroup.com',
      to,
      subject,
      html
    })

    console.log('✅ Email SMTP envoyé à:', to, '| Message ID:', info.messageId)
    return { provider: 'smtp', info, success: true }
  }

  // Otherwise use Ethereal for dev/testing and return preview URL
  try {
    const testAccount = await nodemailer.createTestAccount()
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    })

    const info = await transporter.sendMail({
      from: from || 'noreply@kekeligroup.com',
      to,
      subject,
      html
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log('📧 Email de test (Ethereal) envoyé à:', to)
    console.log('🔗 Aperçu:', previewUrl)
    return { provider: 'ethereal', info, previewUrl, success: true }
  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    return { success: false, error: String(error) }
  }
}

export function generatePasswordResetEmail(resetUrl: string, userName?: string) {
  const name = userName ? ` ${userName}` : ''
  
  return {
    subject: 'Réinitialisation de votre mot de passe - KEKELI GROUP',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEKELI GROUP</h1>
            </div>
            <div class="content">
              <p>Bonjour${name},</p>
              <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
              <center>
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              </center>
              <p>Ce lien expire dans <strong>1 heure</strong>.</p>
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 KEKELI GROUP. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour${name},

Vous avez demandé une réinitialisation de votre mot de passe. 
Ouvrez ce lien pour créer un nouveau mot de passe:

${resetUrl}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe KEKELI GROUP
    `
  }
}

export function generateLatePaymentEmail(options: {
  managerName: string
  clientName: string
  amount: number
  daysLate: number
  projectName?: string
  dashboardUrl: string
}) {
  const { managerName, clientName, amount, daysLate, projectName, dashboardUrl } = options

  return {
    subject: `⚠️ ALERTE PAIEMENT EN RETARD - ${clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #d4af37; color: #1a1a1a; padding: 20px; text-align: center; }
            .alert-banner { background-color: #ff4444; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 16px; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .details { background-color: white; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #1a1a1a; font-weight: bold; }
            .button { display: inline-block; padding: 12px 30px; background-color: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .critical { color: #ff4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 KEKELI GROUP - ALERTE PAIEMENT</h1>
            </div>
            <div class="alert-banner">
              Paiement en retard depuis ${daysLate} jour${daysLate > 1 ? 's' : ''}
            </div>
            <div class="content">
              <p>Bonjour ${managerName},</p>
              <p>Un paiement est <span class="critical">EN RETARD</span>. Action requise immédiatement.</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Client:</span>
                  <span class="detail-value">${clientName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Montant:</span>
                  <span class="detail-value">${amount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Jours de retard:</span>
                  <span class="detail-value critical">${daysLate} jour${daysLate > 1 ? 's' : ''}</span>
                </div>
                ${projectName ? `
                <div class="detail-row">
                  <span class="detail-label">Projet:</span>
                  <span class="detail-value">${projectName}</span>
                </div>
                ` : ''}
              </div>

              <p>Veuillez suivre immédiatement cette situation. Cliquez sur le bouton ci-dessous pour accéder au tableau de bord:</p>
              <center>
                <a href="${dashboardUrl}" class="button">Accéder au Dashboard</a>
              </center>

              <p style="color: #ff4444; font-weight: bold;">⚠️ Cet email a été généré automatiquement par le système de suivi des paiements.</p>
              <p>Cordialement,<br>Le système automatisé KEKELI GROUP</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 KEKELI GROUP. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre directement.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}
