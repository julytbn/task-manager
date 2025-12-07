#!/usr/bin/env node

/**
 * Script de génération automatique de factures (Cron Job)
 * 
 * Usage:
 *   node scripts/generate-invoices.js
 *   ts-node scripts/generate-invoices.ts
 *   npm run cron:invoices
 * 
 * À configurer dans un service de cron:
 * - Vercel: vercel.json avec crons
 * - Linux: crontab -e : "0 8 * * * cd /app && npm run cron:invoices"
 * - Docker: Service external ou appel à l'API REST
 */

import { generateSubscriptionInvoices } from '../lib/invoice-generator'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🔄 GÉNÉRATEUR DE FACTURES AUTOMATIQUES')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`⏰ Exécuté à: ${new Date().toLocaleString('fr-FR')}`)
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    // Exécuter la génération de factures
    const result = await generateSubscriptionInvoices()

    // Afficher le résumé
    console.log('\n📊 RÉSUMÉ DE L\'EXÉCUTION:')
    console.log('───────────────────────────────────────────────────────────────')
    console.log(`✅ Factures générées: ${result.invoicesGenerated}`)
    console.log(`📋 Abonnements traités: ${result.details.length}`)
    console.log(`🔧 Statut global: ${result.success ? '✅ SUCCÈS' : '❌ ERREUR'}`)

    if (result.details.length > 0) {
      console.log('\n📝 DÉTAILS:')
      console.log('───────────────────────────────────────────────────────────────')

      result.details.forEach((detail, index) => {
        const status = detail.status === 'success' ? '✅' : '❌'
        console.log(`${index + 1}. ${status} ${detail.clientName}`)
        console.log(`   Facture: ${detail.invoiceNumber}`)
        console.log(`   Montant: ${detail.amount.toLocaleString('fr-FR')} FCFA`)
        if (detail.message) {
          console.log(`   Message: ${detail.message}`)
        }
      })
    }

    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('✨ Exécution terminée avec succès\n')

    // Code de sortie
    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:')
    console.error('───────────────────────────────────────────────────────────────')
    console.error(error)
    console.log('\n═══════════════════════════════════════════════════════════════\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
