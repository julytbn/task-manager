const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Vérifier que les tables existent en testant une requête simple
    const dossiers = await prisma.dossierComptable.count();
    console.log('✅ Table dossiers_comptables existe - Count:', dossiers);
    
    const charges = await prisma.chargeDetaillee.count();
    console.log('✅ Table charges_detaillees existe - Count:', charges);
    
    const entrees = await prisma.entreeClient.count();
    console.log('✅ Table entrees_clients existe - Count:', entrees);
    
    const situations = await prisma.situationFinanciere.count();
    console.log('✅ Table situations_financieres existe - Count:', situations);
    
    console.log('\n✅ Toutes les tables comptables existent en production!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
