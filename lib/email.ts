import nodemailer from 'nodemailer'

export async function sendEmail(options: { to: string; subject: string; html: string; from?: string }) {
  const { to, subject, html, from } = options

  // If SMTP env is configured, use it
  if (process.env.SMTP_HOST) {
    try {
      console.log(`[EMAIL] Tentative envoi SMTP vers: ${to}`)
      console.log(`[EMAIL] Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, Secure: ${process.env.SMTP_SECURE}`)
      
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
    } catch (smtpError) {
      console.error('❌ ERREUR SMTP:', smtpError)
      console.error('Stack:', (smtpError as any).stack)
      throw smtpError
    }
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

export function generateTaskLateNotificationEmail(
  taskTitle: string,
  taskDescription?: string,
  daysLate?: number,
  projectName?: string,
  taskUrl?: string
) {
  const daysText = daysLate ? `${daysLate} jour${daysLate > 1 ? 's' : ''}` : 'plusieurs jours'
  
  return {
    subject: `⚠️ Tâche en retard: ${taskTitle} - KEKELI GROUP`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; }
            .alert-banner { background-color: #ff4444; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 16px; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .task-title { background-color: #ff6666; color: white; padding: 15px; font-weight: bold; font-size: 18px; border-radius: 5px; margin: 20px 0; }
            .task-description { background-color: #f0f0f0; padding: 15px; border-left: 4px solid #ff4444; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 30px; background-color: #ff4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .critical { color: #ff4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEKELI GROUP</h1>
            </div>
            <div class="alert-banner">
              ⚠️ TÂCHE EN RETARD: ${daysText}
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Une de vos tâches assignées est <span class="critical">EN RETARD</span>. Veuillez agir immédiatement:</p>
              
              <div class="task-title">${taskTitle}</div>
              
              ${taskDescription ? `
              <div class="task-description">
                <strong>Description:</strong><br>
                ${taskDescription}
              </div>
              ` : ''}
              
              <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; margin: 15px 0;">
                <p><strong>Jours de retard:</strong> <span class="critical">${daysText}</span></p>
                ${projectName ? `<p><strong>Projet:</strong> ${projectName}</p>` : ''}
              </div>
              
              <p>Veuillez consulter cette tâche et mettre à jour votre statut. Cliquez sur le bouton ci-dessous:</p>
              <center>
                <a href="${taskUrl || 'https://task-manager.kekeligroup.com/dashboard'}" class="button">Voir la tâche</a>
              </center>

              <p style="color: #ff4444; font-weight: bold;">⚠️ Cet email a été généré automatiquement par le système de suivi des tâches.</p>
              <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 KEKELI GROUP. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `⚠️ TÂCHE EN RETARD\n\nBonjour,\n\nVotre tâche est en retard de ${daysText}: ${taskTitle}\n${taskDescription ? `\nDescription: ${taskDescription}\n` : ''}${projectName ? `\nProjet: ${projectName}\n` : ''}\n\nConsultez votre tableau de bord immédiatement pour mettre à jour le statut.\n\nCordialement,\nL'équipe KEKELI GROUP`
  }
}

export function generateTaskAssignmentEmail(taskTitle: string, taskDescription?: string, assignedByName?: string, taskUrl?: string) {
  return {
    subject: `Nouvelle tâche assignée: ${taskTitle} - KEKELI GROUP`,
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
            .task-title { background-color: #d4af37; color: #1a1a1a; padding: 15px; font-weight: bold; font-size: 18px; border-radius: 5px; margin: 20px 0; }
            .task-description { background-color: #f0f0f0; padding: 15px; border-left: 4px solid #d4af37; margin: 15px 0; }
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
              <p>Bonjour,</p>
              <p>Vous avez reçu une nouvelle tâche à effectuer:</p>
              
              <div class="task-title">${taskTitle}</div>
              
              ${taskDescription ? `
              <div class="task-description">
                <strong>Description:</strong><br>
                ${taskDescription}
              </div>
              ` : ''}
              
              ${assignedByName ? `
              <p><strong>Assignée par:</strong> ${assignedByName}</p>
              ` : ''}
              
              <p>Veuillez consulter cette tâche dès que possible. Cliquez sur le bouton ci-dessous pour accéder à votre tableau de bord:</p>
              <center>
                <a href="${taskUrl || 'https://task-manager.kekeligroup.com/dashboard'}" class="button">Voir ma tâche</a>
              </center>

              <p>Cordialement,<br>L'équipe KEKELI GROUP</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 KEKELI GROUP. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Bonjour,\n\nVous avez reçu une nouvelle tâche: ${taskTitle}\n${taskDescription ? `\nDescription: ${taskDescription}\n` : ''}${assignedByName ? `\nAssignée par: ${assignedByName}\n` : ''}\n\nConsultez votre tableau de bord pour plus de détails.\n\nCordialement,\nL'équipe KEKELI GROUP`
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

/**
 * Génère l'email d'encouragement pour un objectif stagnant
 */
export function generateObjectifEncouragementEmail(titreObjectif: string, nomEmploye: string) {
  const subject = `💪 Encouragement pour votre objectif: ${titreObjectif}`
  const html = `
    <!DOCTYPE html>
    <html dir="ltr" lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #4F46E5;
            margin: 10px 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .highlight {
            background-color: #FFF3CD;
            border-left: 4px solid #FFC107;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
          }
          .cta-button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
            padding-top: 15px;
            margin-top: 20px;
          }
          .emoji {
            font-size: 32px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">💪</div>
            <h1>Vous pouvez y arriver!</h1>
          </div>

          <div class="content">
            <p>Bonjour <strong>${nomEmploye}</strong>,</p>
            
            <p>Nous avons remarqué que votre objectif <strong>"${titreObjectif}"</strong> n'a pas progressé depuis une semaine.</p>
            
            <div class="highlight">
              <p><strong>Ne vous découragez pas!</strong> Chaque petit pas compte. Continuez vos efforts et vous atteindrez votre objectif.</p>
            </div>

            <p>Voici quelques conseils:</p>
            <ul>
              <li>💡 Divisez votre objectif en petites étapes réalisables</li>
              <li>⏰ Fixez-vous des délais intermédiaires</li>
              <li>📊 Suivez votre progression régulièrement</li>
              <li>🤝 N'hésitez pas à demander de l'aide à votre manager</li>
            </ul>

            <p>Rendez-vous sur votre tableau de bord pour consulter votre objectif et mettre à jour votre progression:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/employe/performance" class="cta-button">Consulter mon objectif</a>

            <p>Vous êtes capable de grandes choses! 🚀</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 KEKELI GROUP. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre directement.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return { subject, html }
}

/**
 * Génère l'email de félicitations pour un objectif atteint
 */
export function generateObjectifAchievementEmail(titreObjectif: string, nomEmploye: string, valeurCible: number) {
  const subject = `🎉 Félicitations! Vous avez atteint votre objectif: ${titreObjectif}`
  const html = `
    <!DOCTYPE html>
    <html dir="ltr" lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: linear-gradient(135deg, #f0f4ff 0%, #fff8f0 100%);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #4F46E5;
            margin: 10px 0;
            font-size: 28px;
          }
          .celebration {
            font-size: 48px;
            margin: 15px 0;
            animation: bounce 0.6s ease-in-out;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #10B981;
          }
          .achievement-badge {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
          }
          .stats {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #4F46E5;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .next-challenge {
            background-color: #FEF3C7;
            border-left: 4px solid #FCD34D;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
            padding-top: 15px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="celebration">🎉🎊🏆</div>
            <h1>Bravo, ${nomEmploye}!</h1>
          </div>

          <div class="content">
            <p>Vous venez d'accomplir quelque chose de remarquable!</p>
            
            <div class="achievement-badge">
              ✨ Objectif atteint: <strong>${titreObjectif}</strong> ✨
            </div>

            <p>Vous avez montré une détermination exceptionnelle en atteignant votre objectif de <strong>${valeurCible} tâches</strong>. C'est un témoignage de votre dévouement et de votre professionnalisme.</p>

            <div class="stats">
              <p><strong>📊 Vos accomplissements:</strong></p>
              <ul>
                <li>✅ Objectif principal atteint: ${titreObjectif}</li>
                <li>💪 Vous avez dépassé vos attentes</li>
                <li>🌟 Vous êtes un contributeur clé de l'équipe</li>
              </ul>
            </div>

            <div class="next-challenge">
              <p><strong>🚀 Et maintenant?</strong></p>
              <p>Maintenant que vous avez atteint cet objectif, pourquoi ne pas en fixer un nouveau? Continuez à progresser et à vous dépasser. Chaque nouveau défi est une opportunité de croissance!</p>
            </div>

            <p>Rendez-vous sur votre tableau de bord pour:</p>
            <ul>
              <li>📈 Consulter votre progression</li>
              <li>🎯 Définir de nouveaux objectifs</li>
              <li>🏅 Voir vos autres objectifs actifs</li>
            </ul>

            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/employe/performance" class="cta-button">Continuer sur le dashboard</a>

            <p style="text-align: center; font-size: 16px; color: #4F46E5; font-weight: bold;">Vous êtes formidable! 🌟</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 KEKELI GROUP. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre directement.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return { subject, html }
}
