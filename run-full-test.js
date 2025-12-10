const http = require('http');
const https = require('https');

const API_BASE_URL = 'http://localhost:3000/api';

let testResults = { passed: 0, failed: 0, tests: [] };
let testData = {
  users: {},
  team: null,
  client: null,
  project: null,
  tasks: [],
  invoices: [],
  subscriptions: [],
  services: [],
  notifications: []
};

// Helper pour faire les requêtes HTTP
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(API_BASE_URL + endpoint);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = http.request(options, (res) => {
        let body = '';

        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const responseData = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: responseData, ok: res.statusCode >= 200 && res.statusCode < 300 });
          } catch (e) {
            resolve({ status: res.statusCode, data: { error: body }, ok: res.statusCode >= 200 && res.statusCode < 300 });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ status: 500, data: null, ok: false });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    } catch (error) {
      resolve({ status: 500, data: null, ok: false });
    }
  });
}

function logTest(testName, passed, message) {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}: ${message}`);
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  testResults.tests.push({ name: testName, passed, message });
}

// Délai d'attente
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Tests
async function test1GetUsers() {
  console.log('\n📌 TEST 1: Récupération des utilisateurs\n');
  const response = await makeRequest('GET', '/utilisateurs');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    const users = response.data.data;
    
    testData.users = {
      manager: users.find(u => u.role === 'MANAGER') || users[0],
      employee1: users.filter(u => u.role === 'EMPLOYE')[0] || users[1],
      employee2: users.filter(u => u.role === 'EMPLOYE')[1] || users[2],
      admin: users.find(u => u.role === 'ADMIN') || users[0],
    };
    
    logTest('GET /utilisateurs', true, `${users.length} utilisateur(s)`);
    
    if (testData.users.manager) console.log(`  - Manager: ${testData.users.manager.email}`);
    if (testData.users.employee1) console.log(`  - Employé 1: ${testData.users.employee1.email}`);
    if (testData.users.employee2) console.log(`  - Employé 2: ${testData.users.employee2.email}`);
    
    return true;
  } else {
    logTest('GET /utilisateurs', false, 'Erreur ou aucun utilisateur');
    return false;
  }
}

async function test2GetTeams() {
  console.log('\n📌 TEST 2: Récupération des équipes\n');
  const response = await makeRequest('GET', '/equipes');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.team = response.data.data[0];
    logTest('GET /equipes', true, `${response.data.data.length} équipe(s)`);
    if (testData.team) console.log(`  - ${testData.team.nom}`);
    return true;
  } else {
    logTest('GET /equipes', false, 'Aucune équipe');
    return false;
  }
}

async function test3GetClients() {
  console.log('\n📌 TEST 3: Récupération des clients\n');
  const response = await makeRequest('GET', '/clients');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.client = response.data.data[0];
    logTest('GET /clients', true, `${response.data.data.length} client(s)`);
    if (testData.client) console.log(`  - ${testData.client.prenom} ${testData.client.nom}`);
    return true;
  } else {
    logTest('GET /clients', false, 'Aucun client');
    return false;
  }
}

async function test4GetProjects() {
  console.log('\n📌 TEST 4: Récupération des projets\n');
  const response = await makeRequest('GET', '/projets');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.project = response.data.data[0];
    logTest('GET /projets', true, `${response.data.data.length} projet(s)`);
    if (testData.project) console.log(`  - ${testData.project.titre}`);
    return true;
  } else {
    logTest('GET /projets', false, 'Aucun projet');
    return false;
  }
}

async function test5GetTasks() {
  console.log('\n📌 TEST 5: Récupération des tâches\n');
  const response = await makeRequest('GET', '/taches');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.tasks = response.data.data;
    logTest('GET /taches', true, `${response.data.data.length} tâche(s)`);
    testData.tasks.slice(0, 3).forEach((task, i) => {
      console.log(`  ${i + 1}. ${task.titre} (${task.statut})`);
    });
    return true;
  } else {
    logTest('GET /taches', false, 'Aucune tâche');
    return false;
  }
}

async function test6GetInvoices() {
  console.log('\n📌 TEST 6: Récupération des factures\n');
  const response = await makeRequest('GET', '/factures');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.invoices = response.data.data;
    logTest('GET /factures', true, `${response.data.data.length} facture(s)`);
    testData.invoices.slice(0, 3).forEach((inv, i) => {
      console.log(`  ${i + 1}. ${inv.numero} (${inv.statut})`);
    });
    return true;
  } else {
    logTest('GET /factures', false, 'Aucune facture');
    return false;
  }
}

async function test7GetServices() {
  console.log('\n📌 TEST 7: Récupération des services\n');
  const response = await makeRequest('GET', '/services');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.services = response.data.data;
    logTest('GET /services', true, `${response.data.data.length} service(s)`);
    return true;
  } else {
    logTest('GET /services', false, 'Aucun service');
    return false;
  }
}

async function test8GetAbonnements() {
  console.log('\n📌 TEST 8: Récupération des abonnements\n');
  const response = await makeRequest('GET', '/abonnements');
  
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.subscriptions = response.data.data;
    logTest('GET /abonnements', true, `${response.data.data.length} abonnement(s)`);
    return true;
  } else {
    logTest('GET /abonnements', false, 'Aucun abonnement');
    return false;
  }
}

async function test9GetNotifications() {
  console.log('\n📌 TEST 9: Récupération des notifications\n');
  const response = await makeRequest('GET', '/notifications');
  
  if (response.ok && response.data.data) {
    testData.notifications = response.data.data;
    logTest('GET /notifications', true, `${response.data.data.length} notification(s)`);
    return true;
  } else {
    logTest('GET /notifications', false, 'Erreur');
    return false;
  }
}

async function test10CronLatePay() {
  console.log('\n📌 TEST 10: CRON paiements en retard\n');
  const response = await makeRequest('POST', '/cron/check-late-payments', {});
  
  if (response.ok && response.data.data) {
    const { latePayments } = response.data.data;
    logTest('POST /cron/check-late-payments', true, `${latePayments} paiement(s) en retard`);
    return true;
  } else {
    logTest('POST /cron/check-late-payments', false, 'Erreur');
    return false;
  }
}

async function test11CronLateTasks() {
  console.log('\n📌 TEST 11: CRON tâches en retard\n');
  const response = await makeRequest('POST', '/cron/check-late-tasks', {});
  
  if (response.ok && response.data.data) {
    const { lateTasks } = response.data.data;
    logTest('POST /cron/check-late-tasks', true, `${lateTasks} tâche(s) en retard`);
    return true;
  } else {
    logTest('POST /cron/check-late-tasks', false, 'Erreur');
    return false;
  }
}

async function test12DashboardManager() {
  console.log('\n📌 TEST 12: Dashboard Manager\n');
  const response = await makeRequest('GET', '/dashboard/manager');
  
  if (response.ok) {
    logTest('GET /dashboard/manager', true, 'Dashboard disponible');
    return true;
  } else {
    logTest('GET /dashboard/manager', false, 'Erreur');
    return false;
  }
}

async function test13DashboardEmployee() {
  console.log('\n📌 TEST 13: Dashboard Employé\n');
  const response = await makeRequest('GET', '/dashboard/employe');
  
  if (response.ok) {
    logTest('GET /dashboard/employe', true, 'Dashboard disponible');
    return true;
  } else {
    logTest('GET /dashboard/employe', false, 'Erreur');
    return false;
  }
}

async function test14SubmitTask() {
  console.log('\n📌 TEST 14: Soumettre une nouvelle tâche\n');
  
  if (!testData.project || !testData.users.employee1) {
    logTest('POST /taches', false, 'Données manquantes');
    return false;
  }
  
  const taskData = {
    titre: `Test Automatisé ${new Date().getTime()}`,
    description: 'Tâche créée par le script de test',
    projetId: testData.project.id,
    statut: 'A_FAIRE',
    priorite: 'MOYENNE',
    dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    heuresEstimees: 8,
    montant: 3000,
    facturable: true,
    assigneeId: testData.users.employee1.id,
  };
  
  const response = await makeRequest('POST', '/taches', taskData);
  
  if (response.ok && response.data.data) {
    logTest('POST /taches', true, 'Tâche soumise');
    testData.tasks.unshift(response.data.data);
    return true;
  } else {
    logTest('POST /taches', false, 'Erreur');
    return false;
  }
}

async function test15UpdateTask() {
  console.log('\n📌 TEST 15: Mettre à jour une tâche (Manager)\n');
  
  if (testData.tasks.length === 0) {
    logTest('PATCH /taches', false, 'Aucune tâche');
    return false;
  }
  
  const task = testData.tasks[0];
  const newStatus = task.statut === 'A_FAIRE' ? 'EN_COURS' : 'TERMINE';
  
  const response = await makeRequest('PATCH', `/taches/${task.id}`, {
    statut: newStatus,
    commentaire: 'Mise à jour par test automatisé',
  });
  
  if (response.ok) {
    logTest('PATCH /taches', true, `Statut -> ${newStatus}`);
    return true;
  } else {
    logTest('PATCH /taches', false, 'Erreur');
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 TEST AUTOMATISÉ COMPLET DU SYSTÈME KEKELI 🚀           ║');
  console.log('║            ' + new Date().toLocaleString('fr-FR'));
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Attendre que le serveur soit prêt
    console.log('⏳ Attente du démarrage du serveur...\n');
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        const response = await makeRequest('GET', '/utilisateurs');
        if (response.ok) {
          ready = true;
          console.log('✅ Serveur prêt!\n');
          break;
        }
      } catch (e) {
        // Continue
      }
      await delay(1000);
    }
    
    if (!ready) {
      console.log('❌ Le serveur n\'est pas prêt après 30 secondes\n');
      process.exit(1);
    }

    // Exécuter les tests
    await test1GetUsers();
    await delay(300);
    await test2GetTeams();
    await delay(300);
    await test3GetClients();
    await delay(300);
    await test4GetProjects();
    await delay(300);
    await test5GetTasks();
    await delay(300);
    await test6GetInvoices();
    await delay(300);
    await test7GetServices();
    await delay(300);
    await test8GetAbonnements();
    await delay(300);
    await test9GetNotifications();
    await delay(300);
    await test10CronLatePay();
    await delay(300);
    await test11CronLateTasks();
    await delay(300);
    await test12DashboardManager();
    await delay(300);
    await test13DashboardEmployee();
    await delay(300);
    await test14SubmitTask();
    await delay(300);
    await test15UpdateTask();
    
    // Résumé
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                  📊 RÉSUMÉ FINAL DES TESTS 📊                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`✅ Tests réussis: ${testResults.passed}`);
    console.log(`❌ Tests échoués: ${testResults.failed}`);
    
    const total = testResults.passed + testResults.failed;
    const percentage = ((testResults.passed / total) * 100).toFixed(1);
    
    console.log(`\n📈 Taux de réussite: ${percentage}% (${testResults.passed}/${total})\n`);
    
    // Résumé des données
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║              📊 RÉSUMÉ DES DONNÉES TESTÉES 📊                     ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('👥 Utilisateurs:');
    if (testData.users.manager) console.log(`   Manager: ${testData.users.manager.email}`);
    if (testData.users.employee1) console.log(`   Employé 1: ${testData.users.employee1.email}`);
    if (testData.users.employee2) console.log(`   Employé 2: ${testData.users.employee2.email}`);
    
    console.log('\n📦 Ressources:');
    if (testData.team) console.log(`   Équipe: ${testData.team.nom}`);
    if (testData.client) console.log(`   Client: ${testData.client.prenom} ${testData.client.nom}`);
    if (testData.project) console.log(`   Projet: ${testData.project.titre}`);
    console.log(`   Tâches: ${testData.tasks.length}`);
    console.log(`   Factures: ${testData.invoices.length}`);
    console.log(`   Services: ${testData.services.length}`);
    console.log(`   Abonnements: ${testData.subscriptions.length}`);
    console.log(`   Notifications: ${testData.notifications.length}`);
    
    console.log('\n✨ Test automatisé complété avec succès!\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

runAllTests().catch(console.error);
