/**
 * Script de test pour vérifier l'envoi d'emails SMTP
 * Usage: node scripts/testEmailSending.js <email_destinataire>
 */

const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

// Charger .env.local manuellement
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    }
  })
}

async function testEmail() {
  const destinataire = process.argv[2] || 'test@example.com'
  
  console.log('📧 Test d\'envoi email SMTP')
  console.log(`📬 Destinataire: ${destinataire}`)
  console.log(`📌 SMTP_HOST: ${process.env.SMTP_HOST}`)
  console.log(`📌 SMTP_PORT: ${process.env.SMTP_PORT}`)
  console.log(`📌 SMTP_USER: ${process.env.SMTP_USER}`)
  console.log()

  if (!process.env.SMTP_HOST) {
    console.error('❌ ERREUR: SMTP_HOST non configuré dans .env.local')
    process.exit(1)
  }

  try {
    // Créer le transporteur
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      logger: true,
      debug: true
    })

    // Vérifier la connexion
    console.log('[1️⃣] Vérification de la connexion SMTP...')
    await transporter.verify()
    console.log('✅ Connexion SMTP vérifiée!\n')

    // Préparer l'email de test
    const testEmail = {
      from: process.env.SMTP_FROM || 'noreply@kekeligroup.com',
      to: destinataire,
      subject: 'Test Email - Kekeli Group',
      html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">📧 Test Email SMTP</h2>
      <p>Bonjour,</p>
      <p>Cet email confirme que votre configuration SMTP fonctionne correctement!</p>
      <div style="background-color: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0;">
        <p><strong>Configuration :</strong></p>
        <ul>
          <li>Host: ${process.env.SMTP_HOST}</li>
          <li>Port: ${process.env.SMTP_PORT}</li>
          <li>From: ${process.env.SMTP_FROM || 'noreply@kekeligroup.com'}</li>
          <li>Date: ${new Date().toLocaleString('fr-FR')}</li>
        </ul>
      </div>
      <p>Cordialement,<br><strong>Équipe Kekeli Group</strong></p>
    </div>
  </body>
</html>
      `
    }

    // Envoyer l'email
    console.log('[2️⃣] Envoi de l\'email de test...')
    const info = await transporter.sendMail(testEmail)
    
    console.log('✅ Email envoyé avec succès!\n')
    console.log('📊 Détails du message :')
    console.log(`  Message ID: ${info.messageId}`)
    console.log(`  Response: ${info.response}`)
    
    if (info.response && info.response.includes('OK')) {
      console.log('\n✅ Email livré au serveur SMTP!')
      console.log(`\n📬 Vérifiez la boîte mail: ${destinataire}`)
      console.log('⚠️ L\'email peut prendre 1-2 minutes pour arriver')
      console.log('💬 Vérifiez aussi le dossier SPAM/Courrier indésirable')
    }
    
  } catch (error) {
    console.error('❌ ERREUR lors de l\'envoi:')
    console.error(`   Message: ${error.message}`)
    console.error(`   Code: ${error.code}`)
    console.error(`   Commande SMTP: ${error.command}`)
    
    if (error.message.includes('Invalid login')) {
      console.error('\n🔐 PROBLÈME: Credentials invalides')
      console.error('   Vérifiez SMTP_USER et SMTP_PASS dans .env.local')
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\n🔌 PROBLÈME: Impossible de se connecter au serveur SMTP')
      console.error('   Vérifiez SMTP_HOST et SMTP_PORT')
    }
  }
}

testEmail()
