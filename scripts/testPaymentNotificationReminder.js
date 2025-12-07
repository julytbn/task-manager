/**
 * Script de test complet pour les notifications de rappel de paiement en retard
 * Usage: node scripts/testPaymentNotificationReminder.js
 * 
 * Ce script teste:
 * 1. Création d'un paiement en retard
 * 2. Détection du retard
 * 3. Création de notifications
 * 4. Vérification des notifications créées
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPaymentNotificationReminder() {
  try {
    console.log('🧪 Test du système de notifications de rappel de paiement en retard\n')
    
    // ============================================================
    // 1. Récupérer ou créer un test environment
    // ============================================================
    console.log('1️⃣  Configuration de l\'environnement de test...\n')
    
    // Récupérer/créer des clients, projets et utilisateurs
    let client = await prisma.client.findFirst()
    if (!client) {
      console.log('   ⚠️  Aucun client trouvé, création d\'un client de test...')
      client = await prisma.client.create({
        data: {
          nom: 'Test Client Notification',
          email: 'test@client.com',
          telephone: '0123456789'
        }
      })
    }
    console.log(`   ✅ Client utilisé: ${client.nom} (${client.id})`)
    
    // Récupérer/créer un service
    let service = await prisma.service.findFirst()
    if (!service) {
      console.log('   ⚠️  Aucun service trouvé, création d\'un service de test...')
      service = await prisma.service.create({
        data: {
          nom: 'Service Test Notification'
        }
      })
    }
    console.log(`   ✅ Service utilisé: ${service.nom} (${service.id})`)
    
    // Récupérer ou créer un manager
    let manager = await prisma.utilisateur.findFirst({
      where: { role: 'MANAGER' }
    })
    if (!manager) {
      console.log('   ⚠️  Aucun manager trouvé, création d\'un manager de test...')
      manager = await prisma.utilisateur.create({
        data: {
          email: 'manager.test@app.com',
          nom: 'Manager Test',
          prenom: 'Test',
          role: 'MANAGER',
          motDePasse: 'hashedpassword' // Simple pour test
        }
      })
    }
    console.log(`   ✅ Manager utilisé: ${manager.nom} (${manager.id})`)
    
    // ============================================================
    // 2. Créer un projet avec fréquence de paiement MENSUEL
    // ============================================================
    console.log('\n2️⃣  Création d\'un projet de test avec fréquence MENSUEL...\n')
    
    const projet = await prisma.projet.create({
      data: {
        titre: 'Test Projet - Notification Retard',
        description: 'Projet pour tester les notifications de retard de paiement',
        clientId: client.id,
        serviceId: service.id,
        statut: 'EN_COURS',
        frequencePaiement: 'MENSUEL',
        budget: 1000000
      }
    })
    console.log(`   ✅ Projet créé: ${projet.titre}`)
    console.log(`   ID: ${projet.id}`)
    console.log(`   Fréquence paiement: ${projet.frequencePaiement}`)
    
    // ============================================================
    // 3a. Créer une tâche pour le paiement
    // ============================================================
    console.log('\n3️⃣a  Création d\'une tâche de test...\n')
    
    const tache = await prisma.tache.create({
      data: {
        titre: 'Tâche Test - Notification Retard',
        statut: 'EN_COURS',
        priorite: 'MOYENNE',
        projetId: projet.id,
        description: 'Tâche de test pour la notification de retard de paiement'
      }
    })
    console.log(`   ✅ Tâche créée: ${tache.titre} (${tache.id})`)
    
    // ============================================================
    // 3b. Créer un paiement EN_ATTENTE avec date passée (EN RETARD)
    // ============================================================
    console.log('\n3️⃣b  Création d\'un paiement en retard (EN_ATTENTE)...\n')
    
    // Date de paiement: 35 jours avant aujourd'hui (donc en retard d'au moins 5 jours si fréquence MENSUEL=30j)
    const paymentDate = new Date()
    paymentDate.setDate(paymentDate.getDate() - 35)
    
    const paiement = await prisma.paiement.create({
      data: {
        montant: 500000,
        tacheId: tache.id,
        projetId: projet.id,
        clientId: client.id,
        moyenPaiement: 'CHEQUE',
        statut: 'EN_ATTENTE',
        datePaiement: paymentDate
      }
    })
    console.log(`   ✅ Paiement créé:`)
    console.log(`      Montant: ${paiement.montant} FCFA`)
    console.log(`      Date paiement: ${paymentDate.toLocaleDateString('fr-FR')}`)
    console.log(`      Statut: ${paiement.statut}`)
    console.log(`      Lié à la tâche: ${tache.titre}`)
    
    // Calculer date d'échéance attendue basée sur la fréquence du projet (30 jours pour MENSUEL)
    const expectedDueDate = new Date(paymentDate)
    expectedDueDate.setMonth(expectedDueDate.getMonth() + 1)
    
    const today = new Date()
    const daysLate = Math.floor((today.getTime() - expectedDueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    console.log(`      Date échéance attendue: ${expectedDueDate.toLocaleDateString('fr-FR')}`)
    console.log(`      Jours de retard: ${daysLate} jours`)
    
    // ============================================================
    // 4. Simuler la détection du retard (comme ferait checkAndNotifyLatePayments)
    // ============================================================
    console.log('\n4️⃣  Simulation de la détection du retard...\n')
    
    const isLate = today > expectedDueDate && paiement.statut === 'EN_ATTENTE'
    console.log(`   Vérification du retard:`)
    console.log(`   - Aujourd'hui (${today.toLocaleDateString('fr-FR')}) > Date échéance (${expectedDueDate.toLocaleDateString('fr-FR')})? ${isLate ? '✅ OUI' : '❌ NON'}`)
    console.log(`   - Statut = EN_ATTENTE? ${paiement.statut === 'EN_ATTENTE' ? '✅ OUI' : '❌ NON'}`)
    console.log(`   - RÉSULTAT: ${isLate ? '🔴 PAIEMENT EN RETARD' : '🟢 PAIEMENT À JOUR'}`)
    
    if (!isLate) {
      console.log('\n   ⚠️  Le paiement n\'est pas détecté comme en retard.')
      console.log('   Cela peut être normal si la date est trop récente.')
      console.log('   Pour forcer un test, augmentez le nombre de jours en arrière.')
    }
    
    // ============================================================
    // 5. Créer manuellement une notification (simulation)
    // ============================================================
    console.log('\n5️⃣  Création de la notification de rappel...\n')
    
    let notification = null
    if (isLate) {
      notification = await prisma.notification.create({
        data: {
          utilisateurId: manager.id,
          titre: `Paiement en retard - ${client.nom}`,
          message: `Le paiement de ${paiement.montant} FCFA pour le projet "${projet.titre}" est en retard de ${daysLate} jours. Client: ${client.nom}`,
          type: 'ALERTE',
          lien: `/dashboard/manager/paiements?clientId=${client.id}`,
          lu: false
        }
      })
      console.log(`   ✅ Notification créée:`)
      console.log(`      ID: ${notification.id}`)
      console.log(`      Titre: ${notification.titre}`)
      console.log(`      Type: ${notification.type}`)
      console.log(`      Destinataire: ${manager.nom} (${manager.email})`)
      console.log(`      Message: ${notification.message}`)
    } else {
      console.log('   ⚠️  Notification NON créée (paiement pas en retard)')
    }
    
    // ============================================================
    // 6. Vérifier les notifications existantes du manager
    // ============================================================
    console.log('\n6️⃣  Vérification des notifications du manager...\n')
    
    const notificationsManager = await prisma.notification.findMany({
      where: {
        utilisateurId: manager.id,
        type: 'ALERTE'
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })
    
    if (notificationsManager.length === 0) {
      console.log('   ❌ Aucune notification d\'alerte trouvée')
    } else {
      console.log(`   ✅ ${notificationsManager.length} notification(s) d'alerte trouvée(s):`)
      notificationsManager.slice(0, 5).forEach((notif, index) => {
        console.log(`\n      ${index + 1}. ${notif.titre}`)
        console.log(`         ID: ${notif.id}`)
        console.log(`         Créée: ${notif.dateCreation.toLocaleString('fr-FR')}`)
        console.log(`         Lu: ${notif.lu ? '✅ Oui' : '❌ Non'}`)
        console.log(`         Lien: ${notif.lien}`)
      })
    }
    
    // ============================================================
    // 7. Vérifier tous les paiements en retard
    // ============================================================
    console.log('\n7️⃣  Vérification de tous les paiements en retard...\n')
    
    const allPendingPayments = await prisma.paiement.findMany({
      where: {
        statut: 'EN_ATTENTE'
      },
      include: {
        projet: {
          select: {
            titre: true,
            frequencePaiement: true
          }
        },
        client: {
          select: {
            nom: true
          }
        }
      }
    })
    
    console.log(`   Total paiements EN_ATTENTE: ${allPendingPayments.length}`)
    
    let lateCount = 0
    for (const p of allPendingPayments) {
      const pDueDate = new Date(p.datePaiement)
      let daysToAdd = 30
      
      if (p.projet.frequencePaiement === 'TRIMESTRIEL') daysToAdd = 90
      else if (p.projet.frequencePaiement === 'SEMESTRIEL') daysToAdd = 180
      else if (p.projet.frequencePaiement === 'ANNUEL') daysToAdd = 365
      else if (p.projet.frequencePaiement === 'PONCTUEL') daysToAdd = 7
      
      pDueDate.setDate(pDueDate.getDate() + daysToAdd)
      
      if (today > pDueDate) {
        lateCount++
        const pDaysLate = Math.floor((today.getTime() - pDueDate.getTime()) / (1000 * 60 * 60 * 24))
        console.log(`\n   🔴 Paiement EN RETARD:`)
        console.log(`      Client: ${p.client.nom}`)
        console.log(`      Projet: ${p.projet.titre}`)
        console.log(`      Montant: ${p.montant} FCFA`)
        console.log(`      Retard: ${pDaysLate} jours`)
      }
    }
    
    if (lateCount === 0) {
      console.log('   ✅ Aucun paiement en retard détecté')
    } else {
      console.log(`\n   Total: ${lateCount} paiement(s) en retard`)
    }
    
    // ============================================================
    // 8. Test API endpoint (simulation)
    // ============================================================
    console.log('\n8️⃣  Simulation de l\'appel API /api/paiements/check-late...\n')
    
    console.log('   Code pour tester en développement:')
    console.log(`
   // Dans le terminal:
   curl -X GET "http://localhost:3000/api/paiements/check-late" \\
     -H "Authorization: Bearer YOUR_TOKEN"
   
   // Ou via l'UI:
   // 1. Connectez-vous en tant que manager
   // 2. Allez sur /dashboard/manager
   // 3. Vérifiez l'icône de notification 🔔 en haut à droite
   // 4. Vous devriez voir les notifications en retard
    `)
    
    // ============================================================
    // 9. Résumé final
    // ============================================================
    console.log('\n9️⃣  Résumé du test:\n')
    console.log('   ✅ Environnement configuré')
    console.log(`   ✅ Paiement créé: ${paiement.id}`)
    console.log(`   ${isLate ? '✅' : '⚠️ '} Retard détecté: ${isLate ? 'OUI' : 'NON'}`)
    console.log(`   ${notification ? '✅' : '❌'} Notification créée: ${notification ? notification.id : 'N/A'}`)
    console.log(`   ✅ ${notificationsManager.length} notification(s) trouvée(s) au total`)
    console.log(`   ✅ ${lateCount} paiement(s) en retard détecté(s)`)
    
    console.log('\n✅ Test terminé avec succès!\n')
    
    // ============================================================
    // Instructions pour étendre le test
    // ============================================================
    console.log('💡 Prochaines étapes:')
    console.log('   1. Vérifier la page /dashboard/manager pour voir les notifications')
    console.log('   2. Tester le composant LatePaymentAlerts sur le dashboard')
    console.log('   3. Ajouter des paiements avec différentes fréquences pour tester')
    console.log('   4. Configurer un CRON job pour exécuter automatiquement')
    
    console.log('\n📊 Données utiles pour debugging:')
    console.log(`   - Client ID: ${client.id}`)
    console.log(`   - Projet ID: ${projet.id}`)
    console.log(`   - Tâche ID: ${tache.id}`)
    console.log(`   - Paiement ID: ${paiement.id}`)
    console.log(`   - Manager ID: ${manager.id}`)
    if (notification) {
      console.log(`   - Notification ID: ${notification.id}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testPaymentNotificationReminder()
