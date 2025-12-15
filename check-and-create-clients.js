#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║            🔍 VÉRIFICATION DES CLIENTS DANS LA BD 🔍                ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Compter les clients
    const clientCount = await prisma.client.count();
    console.log(`📊 Total clients dans la base de données: ${clientCount}`);

    if (clientCount === 0) {
      console.log('\n⚠️  Aucun client trouvé! Génération de données de test...\n');
      
      // Créer 5 clients de test
      const testClients = [
        {
          nom: 'Dupont',
          prenom: 'Marie',
          email: 'marie.dupont@example.com',
          telephone: '+33 6 12 34 56 78',
          entreprise: 'Dupont & Cie',
          adresse: '123 Rue de la Paix, 75000 Paris',
          type: 'ENTREPRISE'
        },
        {
          nom: 'Martin',
          prenom: 'Jean',
          email: 'jean.martin@example.com',
          telephone: '+33 6 87 65 43 21',
          entreprise: 'Martin Services',
          adresse: '456 Avenue des Champs, 75008 Paris',
          type: 'ENTREPRISE'
        },
        {
          nom: 'Bernard',
          prenom: 'Pierre',
          email: 'pierre.bernard@example.com',
          telephone: '+33 6 11 22 33 44',
          entreprise: null,
          adresse: '789 Rue Saint-Laurent, 69000 Lyon',
          type: 'PARTICULIER'
        },
        {
          nom: 'Leclerc',
          prenom: 'Sophie',
          email: 'sophie.leclerc@example.com',
          telephone: '+33 6 55 66 77 88',
          entreprise: 'Leclerc Consulting',
          adresse: '321 Boulevard Saint-Germain, 75005 Paris',
          type: 'ENTREPRISE'
        },
        {
          nom: 'Fournier',
          prenom: 'Thomas',
          email: 'thomas.fournier@example.com',
          telephone: '+33 6 99 88 77 66',
          entreprise: 'Fournier Tech',
          adresse: '654 Route Nationale, 13000 Marseille',
          type: 'ENTREPRISE'
        }
      ];

      for (const clientData of testClients) {
        const client = await prisma.client.create({
          data: clientData
        });
        console.log(`✅ Client créé: ${client.prenom} ${client.nom} (${client.id})`);
      }

      console.log(`\n✨ ${testClients.length} clients de test ont été créés!\n`);
    } else {
      console.log('\n✅ La base de données contient déjà des clients!\n');
      
      // Afficher les 5 premiers clients
      const clients = await prisma.client.findMany({
        take: 5,
        orderBy: { dateCreation: 'desc' }
      });

      console.log('📋 Derniers clients créés:\n');
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.prenom} ${client.nom}`);
        console.log(`   Email: ${client.email || 'Non renseigné'}`);
        console.log(`   Entreprise: ${client.entreprise || 'Non renseigné'}`);
        console.log(`   Type: ${client.type}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
