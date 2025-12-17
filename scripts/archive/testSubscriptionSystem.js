/**
 * Script de test complet du système d'abonnements avec facturation automatique
 * Usage: node scripts/testSubscriptionSystem.js
 * 
 * Ce script teste:
 * 1. Création d'abonnements avec différentes fréquences
 * 2. Génération automatique de factures
 * 3. Détection des abonnements en retard
 * 4. Création de notifications
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSubscriptionSystem() {
  try {
    console.log('🧪 Test du système d\'abonnements avec facturation automatique\n')
    console.log('=' .repeat(70) + '\n')

    // ============================================================
    // 1. Setup environnement de test
    // ============================================================
    console.log('1️⃣  Configuration de l\'environnement de test...\n')

    let client = await prisma.client.findFirst()
    if (!client) {
      client = await prisma.client.create({
        data: { nom: 'Client Test', prenom: 'Abonnement', email: 'test@abonnement.com' },
      })
    }
    console.log(`   ✅ Client: ${client.nom} (${client.id})`)

    let service = await prisma.service.findFirst()
    if (!service) {
      service = await prisma.service.create({
        data: {
          nom: 'Service Test Abonnement',
          categorie: 'COMPTABILITE',
          prix: 100000,
        },
      })
    }
    console.log(`   ✅ Service: ${service.nom} (${service.id})`)

    let manager = await prisma.utilisateur.findFirst({
      where: { role: 'MANAGER' },
    })
    if (!manager) {
      manager = await prisma.utilisateur.create({
        data: {
          email: 'manager.abonnement@app.com',
          nom: 'Manager',
          prenom: 'Test',
          role: 'MANAGER',
          motDePasse: 'hashedpassword',
        },
      })
    }
    console.log(`   ✅ Manager: ${manager.nom} (${manager.id})\n`)

    // ============================================================
    // 2. Créer des abonnements avec différentes fréquences
    // ============================================================
    console.log('2️⃣  Création des abonnements test avec différentes fréquences...\n')

    const subscriptions = []
    const frequencies = [
      { freq: 'MENSUEL', days: 30, label: 'Mensuel (30 jours)' },
      { freq: 'TRIMESTRIEL', days: 90, label: 'Trimestriel (90 jours)' },
      { freq: 'SEMESTRIEL', days: 180, label: 'Semestriel (180 jours)' },
      { freq: 'ANNUEL', days: 365, label: 'Annuel (365 jours)' },
    ]

    for (const { freq, days, label } of frequencies) {
      // Créer un abonnement avec date de début 40+ jours dans le passé (pour simuler un retard)
      const dateDebut = new Date()
      dateDebut.setDate(dateDebut.getDate() - (days + 10))

      const sub = await prisma.abonnement.create({
        data: {
          nom: `Abonnement ${label}`,
          description: `Service avec fréquence ${label}`,
          clientId: client.id,
          serviceId: service.id,
          montant: 50000,
          frequence: freq,
          statut: 'ACTIF',
          dateDebut,
          dateProchainFacture: new Date(dateDebut.setDate(dateDebut.getDate() + days)),
        },
        include: { client: true, service: true },
      })

      subscriptions.push(sub)
      console.log(`   ✅ Abonnement créé: ${sub.nom}`)
      console.log(`      Fréquence: ${sub.frequence}`)
      console.log(`      Prochain paiement: ${sub.dateProchainFacture.toLocaleDateString('fr-FR')}`)
      console.log(`      Montant: ${sub.montant} FCFA\n`)
    }

    // ============================================================
    // 3. Afficher les abonnements actifs
    // ============================================================
    console.log('\n3️⃣  Abonnements actifs avant facturation:\n')

    const activeSubscriptions = await prisma.abonnement.findMany({
      where: { statut: 'ACTIF' },
      include: { client: true, service: true },
      orderBy: { dateProchainFacture: 'asc' },
    })

    activeSubscriptions.slice(0, 5).forEach((sub, index) => {
      const today = new Date()
      const isOverdue = sub.dateProchainFacture < today
      console.log(`   ${index + 1}. ${sub.nom}`)
      console.log(`      Prochaine facture: ${sub.dateProchainFacture.toLocaleDateString('fr-FR')} ${isOverdue ? '🔴 EN RETARD' : '✅'}`)
      console.log(`      Nombre de paiements: ${sub.nombrePaiementsEffectues}`)
    })

    // ============================================================
    // 4. Simuler la génération de factures
    // ============================================================
    console.log('\n4️⃣  Simulation de la génération de factures...\n')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const toInvoice = await prisma.abonnement.findMany({
      where: {
        statut: 'ACTIF',
        dateProchainFacture: { lte: today },
      },
      include: { client: true, service: true },
    })

    console.log(`   ${toInvoice.length} abonnement(s) à facturer aujourd'hui\n`)

    let invoiceCount = 0

    for (const sub of toInvoice) {
      try {
        const invoiceNumber = `FAC-${sub.id.toUpperCase().slice(0, 8)}-${Date.now()}`
        const tauxTVA = 0.18
        const montantTTC = sub.montant * (1 + tauxTVA)

        // Calculer échéance
        let daysToAdd = 30
        if (sub.frequence === 'TRIMESTRIEL') daysToAdd = 90
        else if (sub.frequence === 'SEMESTRIEL') daysToAdd = 180
        else if (sub.frequence === 'ANNUEL') daysToAdd = 365

        const dateEcheance = new Date(today)
        dateEcheance.setDate(dateEcheance.getDate() + daysToAdd)

        const invoice = await prisma.facture.create({
          data: {
            numero: invoiceNumber,
            clientId: sub.clientId,
            statut: 'EN_ATTENTE',
            montant: sub.montant,
            tauxTVA,
            montantTotal: montantTTC,
            dateEmission: today,
            dateEcheance,
            notes: `Facturation ${sub.frequence} - ${sub.nom}`,
          },
        })

        // Calculer prochaine date
        const nextDate = new Date(sub.dateProchainFacture)
        let monthsToAdd = 1
        if (sub.frequence === 'TRIMESTRIEL') monthsToAdd = 3
        else if (sub.frequence === 'SEMESTRIEL') monthsToAdd = 6
        else if (sub.frequence === 'ANNUEL') monthsToAdd = 12

        nextDate.setMonth(nextDate.getMonth() + monthsToAdd)

        await prisma.abonnement.update({
          where: { id: sub.id },
          data: {
            dateProchainFacture: nextDate,
            nombrePaiementsEffectues: { increment: 1 },
          },
        })

        invoiceCount++
        console.log(`   ✅ Facture générée: ${invoiceNumber}`)
        console.log(`      Client: ${sub.client.nom}`)
        console.log(`      Montant TTC: ${montantTTC.toFixed(2)} FCFA`)
        console.log(`      Échéance: ${dateEcheance.toLocaleDateString('fr-FR')}\n`)
      } catch (error) {
        console.error(`   ❌ Erreur: ${error}`)
      }
    }

    // ============================================================
    // 5. Vérifier les retards
    // ============================================================
    console.log('\n5️⃣  Vérification des factures en retard...\n')

    const overdueInvoices = await prisma.facture.findMany({
      where: {
        statut: 'EN_ATTENTE',
        dateEcheance: {
          lt: today,
        },
      },
      include: {
        client: true,
        abonnement: true,
      },
    })

    console.log(`   ${overdueInvoices.length} facture(s) en retard détectée(s)\n`)

    if (overdueInvoices.length > 0) {
      overdueInvoices.slice(0, 3).forEach((inv) => {
        const daysOverdue = Math.floor((today.getTime() - new Date(inv.dateEcheance).getTime()) / (1000 * 60 * 60 * 24))
        console.log(`   🔴 ${inv.numero} - ${inv.client.nom}`)
        console.log(`      Montant: ${inv.montantTotal.toFixed(2)} FCFA`)
        console.log(`      Retard: ${daysOverdue} jours\n`)
      })
    }

    // ============================================================
    // 6. Statistiques finales
    // ============================================================
    console.log('\n6️⃣  Statistiques finales:\n')

    const stats = {
      totalSubscriptions: await prisma.abonnement.count({
        where: { statut: 'ACTIF' },
      }),
      totalInvoices: await prisma.facture.count(),
      overdueInvoices: await prisma.facture.count({
        where: {
          statut: 'EN_ATTENTE',
          dateEcheance: { lt: today },
        },
      }),
      factures_paid: await prisma.facture.count({
        where: { statut: 'PAYEE' },
      }),
    }

    console.log(`   📊 Abonnements actifs: ${stats.totalSubscriptions}`)
    console.log(`   📄 Total factures générées: ${stats.totalInvoices}`)
    console.log(`   💰 Factures payées: ${stats.factures_paid}`)
    console.log(`   🔴 Factures en retard: ${stats.overdueInvoices}`)

    // ============================================================
    // 7. Résumé
    // ============================================================
    console.log('\n' + '=' .repeat(70))
    console.log('\n✅ Test complété avec succès!\n')

    console.log('📌 Prochaines étapes:')
    console.log('   1. Vérifier les factures dans le dashboard')
    console.log('   2. Configurer un CRON job pour exécuter generateSubscriptionInvoices.js chaque jour')
    console.log('   3. Implémenter l\'UI pour gérer les abonnements')
    console.log('   4. Ajouter les notifications aux managers\n')

    console.log('💡 Données utiles pour debugging:')
    console.log(`   - Client ID: ${client.id}`)
    console.log(`   - Service ID: ${service.id}`)
    console.log(`   - Manager ID: ${manager.id}`)
    console.log(`   - Abonnements créés: ${subscriptions.length}`)
    console.log(`   - Factures générées: ${invoiceCount}`)
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testSubscriptionSystem()
