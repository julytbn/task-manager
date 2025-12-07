/**
 * Script CRON pour générer automatiquement les factures des abonnements
 * À exécuter chaque jour via un CRON job ou un scheduler
 * 
 * Usage: node scripts/generateSubscriptionInvoices.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generateSubscriptionInvoices() {
  try {
    console.log('🔄 Début de la génération automatique des factures d\'abonnements\n')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log(`📅 Date actuelle: ${today.toLocaleDateString('fr-FR')}\n`)

    // 1. Récupérer les abonnements à facturer
    console.log('1️⃣  Recherche des abonnements à facturer...\n')

    const subscriptionsToInvoice = await prisma.abonnement.findMany({
      where: {
        statut: 'ACTIF',
        dateProchainFacture: {
          lte: today,
        },
        OR: [
          { dateFin: null },
          { dateFin: { gte: today } },
        ],
      },
      include: {
        client: true,
        service: true,
      },
    })

    console.log(`✅ ${subscriptionsToInvoice.length} abonnement(s) à facturer trouvé(s)\n`)

    if (subscriptionsToInvoice.length === 0) {
      console.log('✅ Aucun abonnement à facturer pour aujourd\'hui')
      await prisma.$disconnect()
      return
    }

    // 2. Générer les factures
    console.log('2️⃣  Génération des factures...\n')

    const generatedInvoices = []

    for (const subscription of subscriptionsToInvoice) {
      try {
        // Générer un numéro de facture unique
        const invoiceNumber = `FAC-${subscription.id.toUpperCase().slice(0, 8)}-${Date.now()}`

        // Calculer montant TTC
        const tauxTVA = 0.18
        const montantHT = subscription.montant
        const montantTTC = montantHT * (1 + tauxTVA)

        // Calculer date d'échéance basée sur la fréquence
        let daysToAdd = 30
        if (subscription.frequence === 'TRIMESTRIEL') daysToAdd = 90
        else if (subscription.frequence === 'SEMESTRIEL') daysToAdd = 180
        else if (subscription.frequence === 'ANNUEL') daysToAdd = 365
        else if (subscription.frequence === 'PONCTUEL') daysToAdd = 7

        const dateEcheance = new Date(today)
        dateEcheance.setDate(dateEcheance.getDate() + daysToAdd)

        // Créer la facture
        const invoice = await prisma.facture.create({
          data: {
            numero: invoiceNumber,
            clientId: subscription.clientId,
            statut: 'EN_ATTENTE',
            montant: montantHT,
            tauxTVA: tauxTVA,
            montantTotal: montantTTC,
            dateEmission: today,
            dateEcheance: dateEcheance,
            notes: `Facturation ${subscription.frequence} - ${subscription.nom}`,
          },
        })

        // Calculer la prochaine date de facturation
        const nextBillingDate = new Date(subscription.dateProchainFacture)

        switch (subscription.frequence) {
          case 'MENSUEL':
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
            break
          case 'TRIMESTRIEL':
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 3)
            break
          case 'SEMESTRIEL':
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 6)
            break
          case 'ANNUEL':
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
            break
          default:
            nextBillingDate.setDate(nextBillingDate.getDate() + 7)
        }

        // Mettre à jour l'abonnement
        await prisma.abonnement.update({
          where: { id: subscription.id },
          data: {
            dateProchainFacture: nextBillingDate,
            nombrePaiementsEffectues: {
              increment: 1,
            },
          },
        })

        generatedInvoices.push({
          numero: invoiceNumber,
          montant: montantTTC,
          client: subscription.client.nom,
          abonnement: subscription.nom,
          dateEcheance: dateEcheance.toLocaleDateString('fr-FR'),
        })

        console.log(`   ✅ Facture générée: ${invoiceNumber}`)
        console.log(`      Client: ${subscription.client.nom}`)
        console.log(`      Abonnement: ${subscription.nom}`)
        console.log(`      Montant: ${montantTTC.toFixed(2)} FCFA`)
        console.log(`      Échéance: ${dateEcheance.toLocaleDateString('fr-FR')}\n`)
      } catch (error) {
        console.error(`   ❌ Erreur pour l'abonnement ${subscription.id}:`, error)
      }
    }

    // 3. Vérifier les abonnements en retard
    console.log('\n3️⃣  Vérification des abonnements en retard...\n')

    const lateSubscriptions = await prisma.abonnement.findMany({
      where: {
        statut: { notIn: ['ANNULE', 'TERMINE'] },
        factures: {
          some: {
            statut: 'EN_ATTENTE',
            dateEcheance: { lt: today },
          },
        },
      },
      include: {
        client: true,
        factures: {
          where: {
            statut: 'EN_ATTENTE',
            dateEcheance: { lt: today },
          },
        },
      },
    })

    let lateCount = 0

    for (const subscription of lateSubscriptions) {
      try {
        await prisma.abonnement.update({
          where: { id: subscription.id },
          data: { statut: 'EN_RETARD' },
        })
        lateCount++

        const maxRetardDate = Math.max(...subscription.factures.map(f => new Date(f.dateEcheance).getTime()))
        const daysLate = Math.floor((today.getTime() - maxRetardDate) / (1000 * 60 * 60 * 24))

        console.log(`   🔴 Abonnement en retard: ${subscription.nom}`)
        console.log(`      Client: ${subscription.client.nom}`)
        console.log(`      Jours de retard: ${daysLate} jours\n`)
      } catch (error) {
        console.error(`   ❌ Erreur mise à jour abonnement ${subscription.id}:`, error)
      }
    }

    // 4. Créer des notifications pour les managers
    console.log('\n4️⃣  Création des notifications...\n')

    const managers = await prisma.utilisateur.findMany({
      where: { role: 'MANAGER' },
    })

    let notificationCount = 0

    // Notifications pour les factures générées
    for (const invoice of generatedInvoices) {
      for (const manager of managers) {
        try {
          await prisma.notification.create({
            data: {
              utilisateurId: manager.id,
              titre: `Nouvelle facture générée - ${invoice.client}`,
              message: `Facture ${invoice.numero} générée pour ${invoice.abonnement}. Montant: ${invoice.montant.toFixed(2)} FCFA. Échéance: ${invoice.dateEcheance}`,
              type: 'ALERTE',
              lien: '/dashboard/manager/factures',
            },
          })
          notificationCount++
        } catch (error) {
          console.error('Erreur création notification:', error)
        }
      }
    }

    // Notifications pour les retards
    for (const subscription of lateSubscriptions) {
      for (const manager of managers) {
        try {
          await prisma.notification.create({
            data: {
              utilisateurId: manager.id,
              titre: `Abonnement en retard - ${subscription.client.nom}`,
              message: `L'abonnement "${subscription.nom}" est en retard de paiement. Client: ${subscription.client.nom}`,
              type: 'ALERTE',
              lien: '/dashboard/manager/abonnements',
            },
          })
          notificationCount++
        } catch (error) {
          console.error('Erreur création notification:', error)
        }
      }
    }

    // 5. Résumé
    console.log('\n5️⃣  Résumé:\n')
    console.log(`   ✅ Factures générées: ${generatedInvoices.length}`)
    console.log(`   🔴 Abonnements en retard: ${lateCount}`)
    console.log(`   📧 Notifications créées: ${notificationCount}`)

    console.log('\n✅ Tâche complétée avec succès!')
  } catch (error) {
    console.error('❌ Erreur lors de la génération des factures:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la fonction
generateSubscriptionInvoices()
