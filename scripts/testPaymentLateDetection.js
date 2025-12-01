/**
 * Script de test pour la détection des paiements en retard
 * Usage: node scripts/testPaymentLateDetection.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPaymentLateDetection() {
  try {
    console.log('🧪 Démarrage des tests de détection des paiements en retard...\n')

    // 1. Vérifier les projets avec fréquence de paiement
    console.log('1️⃣  Vérification des projets avec fréquence...')
    const projets = await prisma.projet.findMany({
      select: {
        id: true,
        titre: true,
        frequencePaiement: true,
      },
      take: 5,
    })

    if (projets.length === 0) {
      console.log('❌ Aucun projet trouvé')
      return
    }

    console.log(`✅ ${projets.length} projets trouvés:`)
    projets.forEach(p => {
      console.log(`  - ${p.titre} (Fréquence: ${p.frequencePaiement})`)
    })

    // 2. Vérifier les paiements en attente
    console.log('\n2️⃣  Vérification des paiements en attente...')
    const pendingPayments = await prisma.paiement.findMany({
      where: {
        statut: 'EN_ATTENTE',
      },
      include: {
        client: {
          select: {
            nom: true,
          },
        },
        projet: {
          select: {
            titre: true,
            frequencePaiement: true,
          },
        },
      },
      take: 10,
    })

    if (pendingPayments.length === 0) {
      console.log('❌ Aucun paiement en attente trouvé')
      return
    }

    console.log(`✅ ${pendingPayments.length} paiements en attente trouvés:`)

    // 3. Simuler la détection des retards
    console.log('\n3️⃣  Simulation de la détection des retards...')

    const today = new Date()
    const latePayments = []

    for (const payment of pendingPayments) {
      // Calculer la date d'échéance basée sur la fréquence
      let daysToAdd = 7 // Par défaut pour PONCTUEL
      if (payment.projet.frequencePaiement === 'MENSUEL') daysToAdd = 30
      else if (payment.projet.frequencePaiement === 'TRIMESTRIEL') daysToAdd = 90
      else if (payment.projet.frequencePaiement === 'SEMESTRIEL') daysToAdd = 180
      else if (payment.projet.frequencePaiement === 'ANNUEL') daysToAdd = 365

      const dueDate = new Date(payment.datePaiement)
      dueDate.setDate(dueDate.getDate() + daysToAdd)

      const isLate = today > dueDate
      const daysLate = isLate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

      console.log(`\n  💳 Paiement: ${payment.montant} FCFA`)
      console.log(`     Client: ${payment.client.nom}`)
      console.log(`     Projet: ${payment.projet.titre}`)
      console.log(`     Fréquence: ${payment.projet.frequencePaiement}`)
      console.log(`     Date paiement: ${payment.datePaiement.toLocaleDateString('fr-FR')}`)
      console.log(`     Date échéance: ${dueDate.toLocaleDateString('fr-FR')}`)
      console.log(`     Statut: ${isLate ? `🔴 EN RETARD (${daysLate} jours)` : '🟢 À jour'}`)

      if (isLate) {
        latePayments.push({
          id: payment.id,
          client: payment.client.nom,
          montant: payment.montant,
          daysLate,
          dueDate,
        })
      }
    }

    // 4. Résumé
    console.log('\n4️⃣  Résumé:')
    console.log(`   Total paiements vérifiés: ${pendingPayments.length}`)
    console.log(`   Paiements en retard: ${latePayments.length}`)

    if (latePayments.length > 0) {
      console.log('\n   📌 Paiements en retard à relancer:')
      latePayments.forEach(p => {
        console.log(`     - ${p.client}: ${p.montant} FCFA (retard de ${p.daysLate} jours)`)
      })
    }

    // 5. Vérifier la notification
    console.log('\n5️⃣  Vérification de la table notifications...')
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'ALERTE',
      },
      include: {
        utilisateur: {
          select: {
            email: true,
          },
        },
      },
      take: 5,
    })

    if (notifications.length === 0) {
      console.log('⚠️  Aucune notification d\'alerte trouvée')
    } else {
      console.log(`✅ ${notifications.length} notifications d'alerte trouvées`)
    }

    console.log('\n✅ Test terminé avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPaymentLateDetection()
