const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n📊 VÉRIFICATION DES ABONNEMENTS ET FACTURES\n');
    
    // Chercher les clients avec abonnements
    const clients = await prisma.client.findMany({
      include: {
        abonnements: true,
        factures: true
      },
      take: 10
    });

    console.log(`Total clients: ${clients.length}\n`);
    
    let clientsWithSubs = 0;
    let clientsWithoutInvoices = 0;

    for (const client of clients) {
      if (client.abonnements.length === 0) continue;
      
      clientsWithSubs++;
      console.log(`👤 Client: ${client.nom} (${client.id})`);
      console.log(`   Abonnements: ${client.abonnements.length}`);
      console.log(`   Factures total: ${client.factures.length}`);
      
      for (const ab of client.abonnements) {
        const facturesAb = client.factures.filter(f => f.abonnementId === ab.id);
        console.log(`   - ${ab.nom}: ${facturesAb.length} facture(s) liée(s)`);
        
        if (facturesAb.length === 0) {
          clientsWithoutInvoices++;
          console.log(`     ❌ PROBLÈME: Pas de facture pour cet abonnement!`);
        }
      }
      console.log('');
    }

    console.log(`\n📈 RÉSUMÉ:`);
    console.log(`   Clients avec abonnements: ${clientsWithSubs}`);
    console.log(`   Clients avec abonnements SANS factures: ${clientsWithoutInvoices}`);

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();
