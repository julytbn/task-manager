/**
 * Script de migration: Lier les factures orphelines aux abonnements
 * 
 * Problème: Certaines factures ne sont pas liées aux abonnements même si elles
 * devraient l'être (créées avant le fix)
 * 
 * Solution: 
 * 1. Trouver les clients avec des abonnements
 * 2. Trouver leurs factures sans abonnement liée
 * 3. Lier les factures aux abonnements appropriés
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOrphanedInvoices() {
  try {
    console.log('\n🔧 MIGRATION: Liaison des factures orphelines aux abonnements\n');

    // Récupérer les clients avec des abonnements
    const clientsWithSubscriptions = await prisma.client.findMany({
      include: {
        abonnements: {
          orderBy: { dateCreation: 'asc' }
        },
        factures: {
          orderBy: { dateEmission: 'desc' }
        }
      }
    });

    let totalFixed = 0;
    let totalChecked = 0;

    for (const client of clientsWithSubscriptions) {
      if (client.abonnements.length === 0) continue;

      console.log(`👤 Client: ${client.nom} (${client.abonnements.length} abonnement(s))`);

      // Trouver les factures orphelines (sans abonnement)
      const orphanedInvoices = client.factures.filter(f => !f.abonnementId);

      if (orphanedInvoices.length === 0) {
        console.log(`   ✅ Toutes les factures sont liées\n`);
        continue;
      }

      console.log(`   ⚠️  ${orphanedInvoices.length} facture(s) orpheline(s) trouvée(s)`);

      // Pour chaque facture orpheline, la lier au premier abonnement actif du client
      // (ou on peut être plus intelligent et chercher celui qui correspond à la date)
      for (const invoice of orphanedInvoices) {
        // Chercher l'abonnement le plus proche de la date d'émission de la facture
        const matchingSubscription = client.abonnements.find(sub => {
          const invoiceDate = new Date(invoice.dateEmission);
          const subStart = new Date(sub.dateDebut);
          const subEnd = sub.dateFin ? new Date(sub.dateFin) : new Date('2099-12-31');
          
          return invoiceDate >= subStart && invoiceDate <= subEnd;
        });

        if (matchingSubscription) {
          await prisma.facture.update({
            where: { id: invoice.id },
            data: { abonnementId: matchingSubscription.id }
          });
          console.log(`   ✅ Facture ${invoice.numero} liée à ${matchingSubscription.nom}`);
          totalFixed++;
        } else {
          // Si on ne trouve pas de match parfait, la lier au premier (le plus ancien)
          const firstSub = client.abonnements[0];
          await prisma.facture.update({
            where: { id: invoice.id },
            data: { abonnementId: firstSub.id }
          });
          console.log(`   ⚠️  Facture ${invoice.numero} liée au premier abonnement (${firstSub.nom})`);
          totalFixed++;
        }

        totalChecked++;
      }

      console.log('');
    }

    console.log(`\n✅ MIGRATION COMPLÉTÉE`);
    console.log(`   Factures traitées: ${totalChecked}`);
    console.log(`   Factures liées: ${totalFixed}`);

    // Vérifier les résultats
    console.log('\n📊 VÉRIFICATION FINALE:\n');

    const clients = await prisma.client.findMany({
      include: {
        abonnements: true,
        factures: true
      }
    });

    let clientsOk = 0;
    let clientsStillBroken = 0;

    for (const client of clients) {
      if (client.abonnements.length === 0) continue;

      const allLinked = client.factures.every(f => f.abonnementId !== null);
      
      if (allLinked) {
        clientsOk++;
      } else {
        clientsStillBroken++;
        console.log(`❌ ${client.nom}: Encore ${client.factures.filter(f => !f.abonnementId).length} facture(s) orpheline(s)`);
      }
    }

    console.log(`\n✅ Clients OK: ${clientsOk}`);
    console.log(`❌ Clients avec problèmes: ${clientsStillBroken}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
}

migrateOrphanedInvoices();
