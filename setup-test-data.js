const http = require('http');

const API_BASE_URL = 'http://localhost:3000/api';

function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(API_BASE_URL + endpoint);
      const options = { 
        method, 
        hostname: url.hostname || 'localhost',
        port: url.port || 3000,
        path: url.pathname || endpoint,
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const responseData = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: responseData, ok: res.statusCode >= 200 && res.statusCode < 300 });
          } catch (e) {
            resolve({ status: res.statusCode, data: {}, ok: res.statusCode >= 200 && res.statusCode < 300 });
          }
        });
      });
      
      req.on('error', (err) => resolve({ status: 500, data: null, ok: false }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 500, data: null, ok: false }); });
      
      if (data) req.write(JSON.stringify(data));
      req.end();
    } catch (error) {
      resolve({ status: 500, data: null, ok: false });
    }
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function createTestData() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        🔧 CRÉATION DES DONNÉES DE TEST KEKELI 🔧                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Attendre le serveur
    console.log('⏳ Attente du serveur...');
    let ready = false;
    for (let i = 0; i < 10; i++) {
      const r = await makeRequest('GET', '/utilisateurs');
      if (r.ok) {
        ready = true;
        console.log('✅ Serveur prêt!\n');
        break;
      }
      await delay(1000);
    }
    
    if (!ready) {
      console.log('❌ Serveur non disponible\n');
      process.exit(1);
    }

    // 1. Récupérer les utilisateurs
    console.log('📌 ÉTAPE 1: Récupération des utilisateurs');
    const usersResp = await makeRequest('GET', '/utilisateurs');
    if (!usersResp.ok || !usersResp.data || usersResp.data.length < 2) {
      console.log('❌ Erreur: Pas assez d\'utilisateurs en base de données');
      process.exit(1);
    }
    
    const manager = usersResp.data.find(u => u.role === 'MANAGER') || usersResp.data[0];
    const employee1 = usersResp.data.filter(u => u.role === 'EMPLOYE')[0] || usersResp.data[1];
    const employee2 = usersResp.data.filter(u => u.role === 'EMPLOYE')[1] || usersResp.data[2];
    
    console.log(`✅ ${usersResp.data.length} utilisateur(s) trouvé(s)`);
    console.log(`  👤 Manager: ${manager.email}`);
    console.log(`  👤 Employé 1: ${employee1?.email}`);
    console.log(`  👤 Employé 2: ${employee2?.email}\n`);

    // 2. Créer une équipe
    console.log('📌 ÉTAPE 2: Création d\'une équipe');
    let teamId = null;
    const teamsResp = await makeRequest('GET', '/equipes');
    
    if (teamsResp.ok && teamsResp.data?.data?.length > 0) {
      teamId = teamsResp.data.data[0].id;
      console.log(`✅ Équipe existante trouvée: ${teamsResp.data.data[0].nom}\n`);
    } else {
      const teamData = {
        nom: `Équipe Test ${Date.now()}`,
        description: 'Équipe créée automatiquement pour les tests',
        chefEquipeId: manager.id,
      };
      const teamResp = await makeRequest('POST', '/equipes', teamData);
      if (teamResp.ok && teamResp.data?.data?.id) {
        teamId = teamResp.data.data.id;
        console.log(`✅ Équipe créée: ${teamResp.data.data.nom}\n`);
      } else {
        console.log(`❌ Erreur création équipe\n`);
      }
    }

    // 3. Créer un client
    console.log('📌 ÉTAPE 3: Création d\'un client');
    let clientId = null;
    const clientsResp = await makeRequest('GET', '/clients');
    
    if (clientsResp.ok && clientsResp.data?.data?.length > 0) {
      clientId = clientsResp.data.data[0].id;
      console.log(`✅ Client existant trouvé: ${clientsResp.data.data[0].prenom} ${clientsResp.data.data[0].nom}\n`);
    } else {
      const clientData = {
        prenom: 'Acme',
        nom: 'Corporation',
        email: `contact${Date.now()}@acme.com`,
        telephone: '+33123456789',
        entreprise: 'ACME Inc',
        adresse: '123 Avenue des Clients, Paris',
        type: 'ENTREPRISE',
      };
      const clientResp = await makeRequest('POST', '/clients', clientData);
      if (clientResp.ok && clientResp.data?.data?.id) {
        clientId = clientResp.data.data.id;
        console.log(`✅ Client créé: ${clientResp.data.data.prenom} ${clientResp.data.data.nom}\n`);
      } else {
        console.log(`❌ Erreur création client\n`);
      }
    }

    // 4. Créer un projet
    console.log('📌 ÉTAPE 4: Création d\'un projet');
    let projectId = null;
    const projectsResp = await makeRequest('GET', '/projets');
    
    if (projectsResp.ok && projectsResp.data?.data?.length > 0) {
      projectId = projectsResp.data.data[0].id;
      console.log(`✅ Projet existant trouvé: ${projectsResp.data.data[0].titre}\n`);
    } else if (teamId && clientId) {
      const projectData = {
        titre: `Projet Test ${Date.now()}`,
        description: 'Projet créé automatiquement pour les tests',
        clientId: clientId,
        equipeId: teamId,
        chefProjetId: manager.id,
        budget: 50000,
        statut: 'EN_COURS',
        dateDebut: new Date('2024-12-01'),
        dateFin: new Date('2025-12-31'),
      };
      const projectResp = await makeRequest('POST', '/projets', projectData);
      if (projectResp.ok && projectResp.data?.data?.id) {
        projectId = projectResp.data.data.id;
        console.log(`✅ Projet créé: ${projectResp.data.data.titre}\n`);
      } else {
        console.log(`❌ Erreur création projet\n`);
      }
    }

    // 5. Créer des services
    console.log('📌 ÉTAPE 5: Création de services');
    let serviceId = null;
    const servicesResp = await makeRequest('GET', '/services');
    
    if (servicesResp.ok && servicesResp.data?.data?.length > 0) {
      serviceId = servicesResp.data.data[0].id;
      console.log(`✅ ${servicesResp.data.data.length} service(s) existant(s) trouvé(s)\n`);
    } else {
      const serviceData = {
        nom: `Service Test ${Date.now()}`,
        categorie: 'COMPTABILITE',
        description: 'Service créé automatiquement pour les tests',
        prix: 150000,
        disponible: true,
      };
      const serviceResp = await makeRequest('POST', '/services', serviceData);
      if (serviceResp.ok && serviceResp.data?.data?.id) {
        serviceId = serviceResp.data.data.id;
        console.log(`✅ Service créé: ${serviceResp.data.data.nom}\n`);
      } else {
        console.log(`❌ Erreur création service\n`);
      }
    }

    // 6. Créer des tâches
    console.log('📌 ÉTAPE 6: Création de tâches');
    if (projectId && employee1) {
      const taskData = {
        titre: `Tâche Test ${Date.now()}`,
        description: 'Tâche créée automatiquement pour les tests',
        projetId: projectId,
        statut: 'A_FAIRE',
        priorite: 'MOYENNE',
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        heuresEstimees: 8,
        montant: 3000,
        facturable: true,
        assigneeId: employee1.id,
      };
      const taskResp = await makeRequest('POST', '/taches', taskData);
      if (taskResp.ok && taskResp.data?.data?.id) {
        console.log(`✅ Tâche créée: ${taskResp.data.data.titre}\n`);
      } else {
        console.log(`❌ Erreur création tâche\n`);
      }
    }

    // 7. Créer une facture
    console.log('📌 ÉTAPE 7: Création de factures');
    if (clientId && projectId) {
      const invoiceData = {
        numero: `FAC-TEST-${Date.now()}`,
        clientId: clientId,
        projetId: projectId,
        montantHT: 25000,
        tauxTVA: 18,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        statut: 'EN_ATTENTE',
      };
      const invoiceResp = await makeRequest('POST', '/factures', invoiceData);
      if (invoiceResp.ok && invoiceResp.data?.data?.id) {
        console.log(`✅ Facture créée: ${invoiceResp.data.data.numero}\n`);
      } else {
        console.log(`❌ Erreur création facture\n`);
      }
    }

    // 8. Créer un abonnement
    console.log('📌 ÉTAPE 8: Création d\'un abonnement');
    if (clientId && serviceId) {
      const subscriptionData = {
        nom: `Abonnement Test ${Date.now()}`,
        description: 'Abonnement créé automatiquement pour les tests',
        clientId: clientId,
        serviceId: serviceId,
        montant: 150000,
        frequence: 'MENSUEL',
        dateDebut: new Date(),
        statut: 'ACTIF',
      };
      const subscriptionResp = await makeRequest('POST', '/abonnements', subscriptionData);
      if (subscriptionResp.ok && subscriptionResp.data?.data?.id) {
        console.log(`✅ Abonnement créé: ${subscriptionResp.data.data.nom}\n`);
      } else {
        console.log(`❌ Erreur création abonnement\n`);
      }
    }

    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║              ✨ CRÉATION DES DONNÉES TERMINÉE ✨                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

createTestData().catch(console.error);
