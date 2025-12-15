#!/usr/bin/env node

/**
 * Script de test SMTP - Valide la configuration email
 * Usage: node scripts/test-smtp.js
 * 
 * Ce script teste:
 * 1. Connexion SMTP
 * 2. Authentification
 * 3. Envoi d'email
 */

require('dotenv').config()
const nodemailer = require('nodemailer')

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(type, message) {
  const prefix = {
    '✅': `${COLORS.green}${COLORS.bright}✅${COLORS.reset}`,
    '❌': `${COLORS.red}${COLORS.bright}❌${COLORS.reset}`,
    '⚠️': `${COLORS.yellow}${COLORS.bright}⚠️${COLORS.reset}`,
    'ℹ️': `${COLORS.cyan}${COLORS.bright}ℹ️${COLORS.reset}`,
    '🔍': `${COLORS.blue}${COLORS.bright}🔍${COLORS.reset}`
  }
  console.log(`${prefix[type] || type} ${message}`)
}

async function testSMTP() {
  console.log(`\n${COLORS.bright}${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`)
  console.log(`${COLORS.bright}🧪 TEST CONFIGURATION SMTP - KEKELI GROUP${COLORS.reset}`)
  console.log(`${COLORS.bright}${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`)

  // Vérifier les variables d'environnement
  log('🔍', 'Vérification des variables d\'environnement...')
  
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
  const missing = requiredVars.filter(v => !process.env[v])
  
  if (missing.length > 0) {
    log('❌', `Variables manquantes: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log(`${COLORS.dim}SMTP_HOST: ${process.env.SMTP_HOST}${COLORS.reset}`)
  console.log(`${COLORS.dim}SMTP_PORT: ${process.env.SMTP_PORT}${COLORS.reset}`)
  console.log(`${COLORS.dim}SMTP_SECURE: ${process.env.SMTP_SECURE || 'false'}${COLORS.reset}`)
  console.log(`${COLORS.dim}SMTP_USER: ${process.env.SMTP_USER}${COLORS.reset}`)
  console.log(`${COLORS.dim}SMTP_FROM: ${process.env.SMTP_FROM}${COLORS.reset}\n`)

  // Créer le transporteur
  log('🔍', 'Création du transporteur SMTP...')
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  // Vérifier la connexion
  log('🔍', 'Test de connexion au serveur SMTP...')
  
  try {
    await transporter.verify()
    log('✅', 'Connexion au serveur SMTP réussie')
  } catch (error) {
    log('❌', `Erreur connexion SMTP: ${error.message}`)
    console.error(`${COLORS.dim}Détails: ${error.stack}${COLORS.reset}`)
    process.exit(1)
  }

  // Envoyer un email de test
  log('🔍', 'Envoi d\'un email de test...')
  
  const testEmail = process.env.SMTP_USER

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: testEmail,
    subject: '🧪 Test SMTP - Kekeli Group',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 32px;">✅ Test Réussi!</h1>
            </div>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; border-left: 4px solid #d4af37;">
              <h2 style="color: #1a1a1a; margin-top: 0;">Configuration SMTP Validée</h2>
              
              <p><strong>Email Reçu à:</strong> <code>${testEmail}</code></p>
              
              <h3 style="color: #1a1a1a;">Configuration valide pour:</h3>
              <ul>
                <li>✅ Notifications de tâches en retard</li>
                <li>✅ Assignation de tâches</li>
                <li>✅ Reinitialisation de mot de passe</li>
                <li>✅ Invitations d'équipe</li>
                <li>✅ Notifications de proformas</li>
                <li>✅ Rappels de paiement</li>
              </ul>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Prochaines étapes:</strong><br>
                1. Configurer les emails personnalisés dans les templates<br>
                2. Tester les workflows réels (assignation, notifications)<br>
                3. Mettre en production
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p>Kekeli Group - Système de Gestion de Projet</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    log('✅', `Email envoyé avec succès - Message ID: ${info.messageId}`)
    console.log(`${COLORS.dim}Recipient: ${info.accepted}${COLORS.reset}`)
  } catch (error) {
    log('❌', `Erreur lors de l'envoi: ${error.message}`)
    console.error(`${COLORS.dim}Détails: ${error.stack}${COLORS.reset}`)
    process.exit(1)
  }

  // Résumé final
  console.log(`\n${COLORS.bright}${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`)
  log('✅', `${COLORS.bright}Configuration SMTP validée avec succès!${COLORS.reset}`)
  console.log(`${COLORS.bright}${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`)
  
  process.exit(0)
}

// Exécuter
testSMTP().catch(error => {
  log('❌', `Erreur critique: ${error.message}`)
  console.error(error)
  process.exit(1)
})
