// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Fonction utilitaire pour générer une date aléatoire dans une plage donnée
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  // Nettoyer les données existantes
  await prisma.tache.deleteMany({});
  await prisma.projet.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.membreEquipe.deleteMany({});
  await prisma.equipe.deleteMany({});
  await prisma.utilisateur.deleteMany({});

  // Créer des services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        nom: 'Développement Web',
        description: 'Création de sites web et applications',
        categorie: 'MARKETING',
        prix: 100,
        dureeEstimee: 40
      }
    }),
    prisma.service.create({
      data: {
        nom: 'Comptabilité',
        description: 'Gestion comptable et fiscale',
        categorie: 'COMPTABILITE',
        prix: 150,
        dureeEstimee: 20
      }
    }),
    prisma.service.create({
      data: {
        nom: 'Formation',
        description: 'Formation en entreprise',
        categorie: 'FORMATION',
        prix: 80,
        dureeEstimee: 30
      }
    })
  ]);

  // Créer des clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        telephone: '+1234567890',
        entreprise: 'Entreprise ABC',
        adresse: '123 Rue de la Paix, Paris',
        type: 'ENTREPRISE',
        dateNaissance: new Date('1980-01-01')
      }
    }),
    prisma.client.create({
      data: {
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'sophie.martin@example.com',
        telephone: '+1987654321',
        entreprise: 'Société XYZ',
        adresse: '456 Avenue des Champs, Lyon',
        type: 'ENTREPRISE',
        dateNaissance: new Date('1985-03-15')
      }
    }),
    prisma.client.create({
      data: {
        nom: 'Bernard',
        prenom: 'Pierre',
        email: 'pierre.bernard@example.com',
        telephone: '+33612345678',
        type: 'PARTICULIER',
        adresse: '789 Boulevard du Port, Marseille',
        dateNaissance: new Date('1990-07-20')
      }
    }),
    prisma.client.create({
      data: {
        nom: 'Lemoine',
        prenom: 'Claire',
        email: 'claire.lemoine@example.com',
        telephone: '+33698765432',
        entreprise: 'Tech Innovation',
        adresse: '321 Boulevard Saint-Germain, Paris',
        type: 'ENTREPRISE',
        dateNaissance: new Date('1988-02-10')
      }
    }),
    prisma.client.create({
      data: {
        nom: 'Garnier',
        prenom: 'Hervé',
        email: 'herve.garnier@example.com',
        telephone: '+33712345678',
        entreprise: 'Consulting Partners',
        adresse: '555 Route de Nanterre, Levallois',
        type: 'ENTREPRISE',
        dateNaissance: new Date('1975-11-15')
      }
    }),
    prisma.client.create({
      data: {
        nom: 'Rousseau',
        prenom: 'Valerie',
        email: 'valerie.rousseau@example.com',
        telephone: '+33654321987',
        type: 'PARTICULIER',
        adresse: '888 Rue de Rivoli, Lyon',
        dateNaissance: new Date('1992-05-08')
      }
    })
  ]);

  // Créer des managers
  const managers = await Promise.all([
    prisma.utilisateur.create({
      data: {
        nom: 'Leroy',
        prenom: 'Thomas',
        email: 'thomas.leroy@example.com',
        telephone: '+33698765432',
        role: 'MANAGER',
        departement: 'Direction',
        motDePasse: '$2a$10$dummyhash',
        emailVerifie: new Date(),
        actif: true,
        dateNaissance: new Date('1982-11-10')
      }
    }),
    prisma.utilisateur.create({
      data: {
        nom: 'Moreau',
        prenom: 'Julie',
        email: 'julie.moreau@example.com',
        telephone: '+33654321876',
        role: 'MANAGER',
        departement: 'Marketing',
        motDePasse: '$2a$10$dummyhash',
        emailVerifie: new Date(),
        actif: true,
        dateNaissance: new Date('1985-05-22')
      }
    })
  ]);

  // Créer des employés
  const employes = await Promise.all([
    prisma.utilisateur.create({
      data: {
        nom: 'Petit',
        prenom: 'Lucas',
        email: 'lucas.petit@example.com',
        telephone: '+33611223344',
        role: 'EMPLOYE',
        departement: 'Développement',
        motDePasse: '$2a$10$dummyhash',
        emailVerifie: new Date(),
        actif: true,
        dateNaissance: new Date('1990-08-15')
      }
    }),
    prisma.utilisateur.create({
      data: {
        nom: 'Robert',
        prenom: 'Emma',
        email: 'emma.robert@example.com',
        telephone: '+33699887766',
        role: 'EMPLOYE',
        departement: 'Comptabilité',
        motDePasse: '$2a$10$dummyhash',
        emailVerifie: new Date(),
        actif: true,
        dateNaissance: new Date('1992-04-30')
      }
    }),
    prisma.utilisateur.create({
      data: {
        nom: 'Richard',
        prenom: 'Alexandre',
        email: 'alexandre.richard@example.com',
        telephone: '+33655443322',
        role: 'EMPLOYE',
        departement: 'Marketing',
        motDePasse: '$2a$10$dummyhash',
        emailVerifie: new Date(),
        actif: true,
        dateNaissance: new Date('1988-12-05')
      }
    }),
    prisma.utilisateur.create({
      data: {
        nom: 'Dupuis',
        prenom: 'Marc',
        email: 'marc.dupuis@example.com',
        telephone: '+33677889900',
        role: 'EMPLOYE',
        departement: 'Développement',
        motDePasse: '$2a$10$dummyhash',
        emailVerifie: new Date(),
        actif: true,
        dateNaissance: new Date('1991-06-12')
      }
    }),
    prisma.utilisateur.create({
      data: {
        nom: 'Fontaine',
        prenom: 'Marie',
        email: 'marie.fontaine@example.com',
        telephone: '+33688776655',
        role: 'EMPLOYE',
        departement: 'Comptabilité',
        motDePasse: '$2a$10$dummyhash',
        emailVerifie: new Date(),
        actif: true,
        dateNaissance: new Date('1993-09-25')
      }
    })
  ]);

  // Créer des équipes
  const equipes = await Promise.all([
    prisma.equipe.create({
      data: {
        nom: 'Équipe Développement',
        description: 'Équipe responsable du développement web et mobile',
        objectifs: 'Livrer des applications de qualité dans les délais',
        dateEcheance: new Date(2025, 11, 31),
        lead: { connect: { id: managers[0].id } },
        membres: {
          create: [
            { utilisateurId: employes[0].id },
            { utilisateurId: employes[3].id }
          ]
        }
      },
      include: { membres: true, lead: true }
    }),
    prisma.equipe.create({
      data: {
        nom: 'Équipe Comptabilité',
        description: 'Équipe responsable de la gestion comptable et financière',
        objectifs: 'Assurer une comptabilité précise et conforme',
        dateEcheance: new Date(2025, 11, 31),
        lead: { connect: { id: managers[1].id } },
        membres: {
          create: [
            { utilisateurId: employes[1].id },
            { utilisateurId: employes[4].id }
          ]
        }
      },
      include: { membres: true, lead: true }
    }),
    prisma.equipe.create({
      data: {
        nom: 'Équipe Marketing',
        description: 'Équipe responsable du marketing et de la communication',
        objectifs: 'Augmenter la visibilité et les leads',
        dateEcheance: new Date(2025, 11, 31),
        lead: { connect: { id: managers[0].id } },
        membres: {
          create: [
            { utilisateurId: employes[2].id }
          ]
        }
      },
      include: { membres: true, lead: true }
    })
  ]);

  // Créer des projets
  const projets = [];
  const statutsProjet = ['PROPOSITION', 'EN_ATTENTE', 'EN_COURS', 'TERMINE', 'EN_RETARD', 'ANNULE'];
  
  for (let i = 0; i < 10; i++) {
    const dateDebut = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
    const dateFin = new Date(dateDebut);
    dateFin.setMonth(dateFin.getMonth() + Math.floor(Math.random() * 6) + 1); // 1 à 6 mois de durée
    
    const projet = await prisma.projet.create({
      data: {
        titre: `Projet ${i + 1} - ${['Site Web', 'Application Mobile', 'Refonte', 'Audit', 'Formation'][i % 5]}`,
        description: `Description du projet ${i + 1} pour le client`,
        client: { connect: { id: clients[i % clients.length].id } },
        service: { connect: { id: services[i % services.length].id } },
        equipe: { connect: { id: equipes[i % equipes.length].id } },
        statut: statutsProjet[i % statutsProjet.length],
        budget: [5000, 10000, 20000, 30000, 50000][i % 5],
        dateDebut: dateDebut,
        dateFin: dateFin,
        dateEcheance: new Date(dateFin.getTime() - (7 * 24 * 60 * 60 * 1000)) // 1 semaine avant la fin
      }
    });
    projets.push(projet);
  }

  // Créer des tâches
  const statutsTache = ['A_FAIRE', 'EN_COURS', 'EN_REVISION', 'TERMINE', 'ANNULE'];
  const priorites = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'];
  const taches = [];
  
  for (let i = 0; i < 30; i++) {
    const projet = projets[i % projets.length];
    const dateEcheance = randomDate(new Date(projet.dateDebut), new Date(projet.dateFin));
    const heures = [4, 8, 16, 24, 40][i % 5];
    
    const created = await prisma.tache.create({
      data: {
        titre: `Tâche ${i + 1} - ${['Développement', 'Design', 'Test', 'Réunion', 'Documentation'][i % 5]}`,
        description: `Description de la tâche ${i + 1} pour le projet ${projet.titre}`,
        projet: { connect: { id: projet.id } },
        service: { connect: { id: services[i % services.length].id } },
        assigneA: { connect: { id: employes[i % employes.length].id } },
        equipe: { connect: { id: equipes[i % equipes.length].id } },
        statut: statutsTache[i % statutsTache.length],
        priorite: priorites[i % priorites.length],
        dateEcheance: dateEcheance,
        heuresEstimees: heures,
        heuresReelles: Math.floor(heures * (0.5 + Math.random())), // entre 50% et 150% du temps estimé
        facturable: Math.random() > 0.3, // 70% de chance d'être facturable
        estPayee: false,
        montant: Math.round(heures * 100 * (0.8 + Math.random() * 0.4) * 100) / 100 // entre 80€ et 120€ de l'heure
      }
    });
    taches.push(created);
  }

  // Créer des factures (quelques-unes) et lier des tâches facturables
  const factures = [];
  for (let i = 0; i < Math.min(8, projets.length); i++) {
    const projet = projets[i];
    const tachesProjet = taches.filter(t => t.projetId === projet.id && t.facturable);
    const tachesPourFacture = tachesProjet.slice(0, Math.min(5, tachesProjet.length));
    const montant = tachesPourFacture.reduce((s, t) => s + (t.montant || 0), 0);

    const facture = await prisma.facture.create({
      data: {
        numero: `FAC-${Date.now()}-${i}`,
        client: { connect: { id: projet.clientId } },
        projet: { connect: { id: projet.id } },
        montant: Math.round(montant * 100) / 100 || 0,
        montantTotal: Math.round((montant * (1 + 0.18)) * 100) / 100 || 0,
        tauxTVA: 0.18,
        statut: 'EN_ATTENTE',
        taches: { connect: tachesPourFacture.map(t => ({ id: t.id })) }
      }
    });
    factures.push(facture);
  }

  // Créer des paiements partiels/total pour certaines factures
  for (let i = 0; i < factures.length; i++) {
    const facture = factures[i];
    const projet = projets.find(p => p.id === facture.projetId) || projets[0];
    const tacheAssociee = taches.find(t => t.projetId === facture.projetId) || taches[0];

    // Créer 0..1 paiements par facture (aléatoire)
    const nb = Math.random() > 0.5 ? 1 : 0;
    for (let j = 0; j < nb; j++) {
      await prisma.paiement.create({
        data: {
          tache: { connect: { id: tacheAssociee.id } },
          projet: { connect: { id: projet.id } },
          client: { connect: { id: facture.clientId } },
          facture: { connect: { id: facture.id } },
          montant: Math.round((facture.montantTotal / (nb || 1)) * 100) / 100,
          moyenPaiement: 'VIREMENT_BANCAIRE',
          reference: `PAY-${Date.now()}-${i}-${j}`,
          statut: 'CONFIRME'
        }
      });
    }
  }

  console.log('✅ Données de test créées avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });