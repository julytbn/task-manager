/**
 * Script: Générer les factures initiales manquantes pour les abonnements existants
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateNextDueDate(frequency, fromDate = new Date()) {
  const dueDate = new Date(fromDate);

  switch (frequency) {
    case 'MENSUEL':
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(15);
      break;
    case 'TRIMESTRIEL':
      dueDate.setMonth(dueDate.getMonth() + 3);
      dueDate.setDate(15);
      break;
    case 'SEMESTRIEL':
      dueDate.setMonth(dueDate.getMonth() + 6);
      dueDate.setDate(15);
      break;
    case 'ANNUEL':
      dueDate.setFullYear(dueDate.getFullYear() + 1);
      dueDate.setDate(15);
      break;
    default:
      dueDate.setDate(dueDate.getDate() + 15);
  }

  return dueDate;
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const invoiceCount = await prisma.facture.count({
    where: {
      dateCreation: {
        gte: new Date(year, new Date().getMonth(), 1),
        lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    }
  });

  const sequence = String(invoiceCount + 1).padStart(4, '0');
  return `FACT-${year}${month}-${sequence}`;
}

async function createInitialInvoice(subscription) {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    const montant = subscription.montant;

    const facture = await prisma.facture.create({
      data: {
        numero: invoiceNumber,
        clientId: subscription.clientId,
        abonnementId: subscription.id,
        montant: montant,
        statut: 'EN_ATTENTE',
        dateEmission: new Date(),
        dateEcheance: calculateNextDueDate(subscription.frequence),
        notes: `Première facture de l'abonnement: ${subscription.nom}`
      }
    });

    return {
      invoiceNumber: facture.numero,
      success: true,
      message: `Facture ${facture.numero} créée`
    };
  } catch (error) {
    console.error('Erreur création facture:', error);
    return {
      invoiceNumber: '',
      success: false,
      message: error.message
    };
  }
}

async function fixMissingInvoices() {
  try {
    console.log('\n🔧 CRÉATION DES FACTURES INITIALES MANQUANTES\n');

    const subscriptions = await prisma.abonnement.findMany({
      include: {
        factures: true,
        client: true
      }
    });

    let created = 0;
    let alreadyHave = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      if (sub.factures.length > 0) {
        alreadyHave++;
        console.log(`✅ ${sub.client.nom} -> ${sub.nom}: ${sub.factures.length} facture(s)`);
      } else {
        console.log(`⚠️  ${sub.client.nom} -> ${sub.nom}: Pas de facture (création...)`);
        
        const result = await createInitialInvoice(sub);
        
        if (result.success) {
          console.log(`   ✅ ${result.message}`);
          created++;
        } else {
          console.log(`   ❌ Erreur: ${result.message}`);
          failed++;
        }
      }
    }

    console.log(`\n✅ RÉSUMÉ:`);
    console.log(`   Abonnements avec factures: ${alreadyHave}`);
    console.log(`   Factures créées: ${created}`);
    console.log(`   Erreurs: ${failed}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixMissingInvoices();
