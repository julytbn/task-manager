const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        📊 CRÉATION DES DONNÉES DE TEST VIA PRISMA 📊            ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Récupérer les utilisateurs
    console.log('📌 ÉTAPE 1: Récupération des utilisateurs');
    const users = await prisma.utilisateur.findMany();
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé\n');
      process.exit(1);
    }

    const manager = users.find(u => u.role === 'MANAGER') || users[0];
    const employee1 = users.filter(u => u.role === 'EMPLOYE')[0] || users[1];
    const employee2 = users.filter(u => u.role === 'EMPLOYE')[1] || users[2];

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s)`);
    console.log(`  👤 Manager: ${manager.email}`);
    console.log(`  👤 Employé 1: ${employee1?.email}`);
    console.log(`  👤 Employé 2: ${employee2?.email}\n`);

    // 2. Créer ou récupérer une équipe
    console.log('📌 ÉTAPE 2: Équipe');
    let team = await prisma.equipe.findFirst();
    
    if (!team) {
      team = await prisma.equipe.create({
        data: {
          nom: 'Équipe Dev Test',
          description: 'Équipe de développement pour tests',
          chefEquipeId: manager.id,
        }
      });
      console.log('✅ Équipe créée');
    } else {
      console.log('✅ Équipe existante trouvée');
    }
    console.log(`  🏢 ${team.nom}\n`);

    // 3. Ajouter les membres à l'équipe si pas présents
    console.log('📌 ÉTAPE 3: Ajout des membres à l\'équipe');
    
    // Ajouter les membres directement à l'équipe
    try {
      await prisma.equipe.update({
        where: { id: team.id },
        data: {
          membres: {
            connectOrCreate: [
              {
                where: { equipeId_userId: { equipeId: team.id, userId: employee1.id } },
                create: { userId: employee1.id, role: 'MEMBRE' }
              },
              ...(employee2 ? [{
                where: { equipeId_userId: { equipeId: team.id, userId: employee2.id } },
                create: { userId: employee2.id, role: 'MEMBRE' }
              }] : [])
            ]
          }
        }
      });
      console.log(`✅ Membres ajoutés à l'équipe`);
    } catch (e) {
      console.log(`⚠️  Membres déjà existants ou erreur: ${e.message}`);
    }
    console.log();

    // 4. Créer ou récupérer un client
    console.log('📌 ÉTAPE 4: Client');
    let client = await prisma.client.findFirst();
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          prenom: 'Acme',
          nom: 'Corporation',
          email: 'contact@acme.com',
          telephone: '+33123456789',
          entreprise: 'ACME Inc',
          adresse: '123 Avenue des Clients, Paris',
          type: 'ENTREPRISE',
        }
      });
      console.log('✅ Client créé');
    } else {
      console.log('✅ Client existant trouvé');
    }
    console.log(`  🤝 ${client.prenom} ${client.nom}\n`);

    // 5. Créer ou récupérer un projet
    console.log('📌 ÉTAPE 5: Projet');
    let project = await prisma.projet.findFirst();
    
    if (!project) {
      project = await prisma.projet.create({
        data: {
          titre: 'Projet Website Acme',
          description: 'Création du site web pour ACME Corp',
          clientId: client.id,
          equipeId: team.id,
          budget: 50000,
          montantTotal: 0, // Sera calculé après ajout des services
          statut: 'EN_COURS',
          dateDebut: new Date('2024-12-01'),
          dateFin: new Date('2025-12-31'),
        }
      });
      console.log('✅ Projet créé');
    } else {
      console.log('✅ Projet existant trouvé');
    }
    console.log(`  📊 ${project.titre}\n`);

    // 6. Créer les services s'ils n'existent pas
    console.log('📌 ÉTAPE 6: Services');
    const serviceNames = ['Service Comptable', 'Service Audit Fiscal', 'Service Consulting'];
    let services = await prisma.service.findMany();
    
    if (services.length === 0) {
      services = await Promise.all([
        prisma.service.create({
          data: {
            nom: 'Service Comptable',
            categorie: 'COMPTABILITE',
            description: 'Services de comptabilité générale',
            prix: 150000,
          }
        }),
        prisma.service.create({
          data: {
            nom: 'Service Audit Fiscal',
            categorie: 'AUDIT_FISCALITE',
            description: 'Audit fiscal et conformité',
            prix: 500000,
          }
        }),
        prisma.service.create({
          data: {
            nom: 'Service Consulting',
            categorie: 'COACHING',
            description: 'Conseil et expertise',
            prix: 200000,
          }
        }),
      ]);
      console.log(`✅ ${services.length} services créés`);
    } else {
      console.log(`✅ ${services.length} services existants trouvés`);
    }
    services.forEach(s => console.log(`  🛠️  ${s.nom}`));
    console.log();

    // 6.5 Associer les services au projet (nouvelle relation)
    console.log('📌 ÉTAPE 6.5: Association Services → Projet');
    const existingProjetServices = await prisma.projetService.findMany({
      where: { projetId: project.id }
    });
    
    if (existingProjetServices.length === 0) {
      let montantTotalProjet = 0;
      for (let i = 0; i < services.length; i++) {
        const montantService = services[i].prix || 0;
        montantTotalProjet += montantService;
        
        await prisma.projetService.create({
          data: {
            projetId: project.id,
            serviceId: services[i].id,
            montant: montantService,
            ordre: i + 1,
          }
        });
      }
      
      // Mettre à jour le montantTotal du projet
      await prisma.projet.update({
        where: { id: project.id },
        data: { montantTotal: montantTotalProjet }
      });
      
      console.log(`✅ ${services.length} services associés au projet`);
      console.log(`  💰 Montant total du projet: ${montantTotalProjet} FCFA\n`);
    } else {
      console.log(`✅ Services déjà associés au projet\n`);
    }

    // 7. Créer les tâches
    console.log('📌 ÉTAPE 7: Tâches');
    let tasks = await prisma.tache.findMany({ where: { projetId: project.id } });
    
    if (tasks.length === 0) {
      tasks = await Promise.all([
        prisma.tache.create({
          data: {
            titre: 'Implémenter la page d\'accueil',
            description: 'Créer la page d\'accueil du site avec design responsive',
            projetId: project.id,
            statut: 'EN_COURS',
            priorite: 'HAUTE',
            dateEcheance: new Date('2024-12-15'),
            heuresEstimees: 16,
            montant: 5000,
            facturable: true,
            assigneeId: employee1.id,
          }
        }),
        prisma.tache.create({
          data: {
            titre: 'Corriger les bugs critiques',
            description: 'Corriger les bugs identifiés',
            projetId: project.id,
            statut: 'EN_COURS',
            priorite: 'URGENTE',
            dateEcheance: new Date('2024-12-05'), // Date passée
            heuresEstimees: 8,
            montant: 2000,
            facturable: true,
            assigneeId: employee2?.id || employee1.id,
          }
        }),
        prisma.tache.create({
          data: {
            titre: 'Design et UX du dashboard',
            description: 'Créer les maquettes du dashboard manager',
            projetId: project.id,
            statut: 'A_FAIRE',
            priorite: 'MOYENNE',
            dateEcheance: new Date('2025-01-10'),
            heuresEstimees: 20,
            montant: 6000,
            facturable: true,
            assigneeId: manager.id,
          }
        }),
      ]);
      console.log(`✅ ${tasks.length} tâches créées`);
    } else {
      console.log(`✅ ${tasks.length} tâches existantes trouvées`);
    }
    tasks.forEach(t => console.log(`  ✅ ${t.titre}`));
    console.log();

    // 8. Créer les factures
    console.log('📌 ÉTAPE 8: Factures');
    let invoices = await prisma.facture.findMany({ where: { clientId: client.id } });
    
    if (invoices.length === 0) {
      invoices = await Promise.all([
        prisma.facture.create({
          data: {
            numero: `FAC-${Date.now()}-001`,
            clientId: client.id,
            projetId: project.id,
            montant: 25000,
            montantTotal: 25000,
            dateEmission: new Date('2024-12-08'),
            dateEcheance: new Date('2024-12-22'),
            statut: 'EN_ATTENTE',
          }
        }),
        prisma.facture.create({
          data: {
            numero: `FAC-${Date.now()}-002`,
            clientId: client.id,
            projetId: project.id,
            montant: 15000,
            montantTotal: 15000,
            dateEmission: new Date('2024-11-01'),
            dateEcheance: new Date('2024-11-15'), // Date passée
            statut: 'EN_ATTENTE',
          }
        }),
      ]);
      console.log(`✅ ${invoices.length} factures créées`);
    } else {
      console.log(`✅ ${invoices.length} factures existantes trouvées`);
    }
    invoices.forEach(inv => console.log(`  💰 ${inv.numero}`));
    console.log();

    // 9. Créer un abonnement
    console.log('📌 ÉTAPE 9: Abonnement');
    let subscriptions = await prisma.abonnement.findMany({ where: { clientId: client.id } });
    
    if (subscriptions.length === 0 && services.length > 0) {
      subscriptions = await Promise.all([
        prisma.abonnement.create({
          data: {
            nom: 'Audit Comptable Mensuel',
            description: 'Service d\'audit comptable récurrent',
            clientId: client.id,
            serviceId: services[0].id,
            montant: 150000,
            frequence: 'MENSUEL',
            dateDebut: new Date('2025-12-08'),
            dateFin: null,
            statut: 'ACTIF',
            dateProchainFacture: new Date('2026-01-08'),
          }
        }),
      ]);
      console.log(`✅ ${subscriptions.length} abonnement(s) créé(s)`);
    } else {
      console.log(`✅ ${subscriptions.length} abonnement(s) existant(s) trouvé(s)`);
    }
    subscriptions.forEach(sub => console.log(`  🔄 ${sub.nom}`));
    console.log();

    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║              ✨ CRÉATION DES DONNÉES TERMINÉE ✨                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 RÉSUMÉ:');
    console.log(`   ✓ Équipe: 1`);
    console.log(`   ✓ Clients: 1`);
    console.log(`   ✓ Projets: 1`);
    console.log(`   ✓ Tâches: ${tasks.length}`);
    console.log(`   ✓ Factures: ${invoices.length}`);
    console.log(`   ✓ Services: ${services.length}`);
    console.log(`   ✓ Abonnements: ${subscriptions.length}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData().catch(console.error);
