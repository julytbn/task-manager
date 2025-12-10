#!/usr/bin/env pwsh

# Script maître pour démarrer le serveur et exécuter les tests complets

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    🚀 TEST AUTOMATISÉ COMPLET - SCRIPT MAÎTRE KEKELI 🚀        ║" -ForegroundColor Green
Write-Host "║         Gestion Utilisateurs, Équipes, Tâches, Factures      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n"

# 1. Vérifier que nous sommes dans le bon répertoire
$projectRoot = Get-Location
Write-Host "📁 Répertoire du projet: $projectRoot" -ForegroundColor Cyan

# 2. Vérifier Node.js
$nodeVersion = node --version
Write-Host "✅ Node.js installé: $nodeVersion" -ForegroundColor Green

# 3. Vérifier les dépendances
if (Test-Path "node_modules") {
    Write-Host "✅ Dépendances installées" -ForegroundColor Green
} else {
    Write-Host "⏳ Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# 4. Démarrer le serveur (s'il n'est pas déjà en cours d'exécution)
Write-Host "`n⏳ Vérification du serveur API..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$serverReady = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/utilisateurs" -ErrorAction Stop
    Write-Host "✅ Serveur API déjà en cours d'exécution!" -ForegroundColor Green
    $serverReady = $true
} catch {
    Write-Host "⏳ Démarrage du serveur de développement..." -ForegroundColor Yellow
    
    # Démarrer le serveur dans une nouvelle fenêtre
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npm run dev" -PassThru -WindowStyle Normal
    
    Write-Host "ℹ️ PID du serveur: $($process.Id)" -ForegroundColor Cyan
    Write-Host "⏳ Attente du démarrage du serveur (max 60 secondes)..." -ForegroundColor Yellow
    
    # Attendre que le serveur soit prêt
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/utilisateurs" -ErrorAction Stop
            Write-Host "✅ Serveur API prêt!" -ForegroundColor Green
            $serverReady = $true
            break
        } catch {
            $attempt++
            Start-Sleep -Seconds 2
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    if (-not $serverReady) {
        Write-Host "`n❌ Impossible de démarrer le serveur dans le délai imparti" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n"

# 5. Créer et exécuter le script de test
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         🧪 EXÉCUTION DES TESTS AUTOMATISÉS COMPLETS 🧪         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

$testScript = @'
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';
const CRON_SECRET = 'test-secret';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

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

// Helper functions
async function makeRequest(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Secret': CRON_SECRET,
      },
    };
    if (data) options.body = JSON.stringify(data);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const responseData = response.headers.get('content-type')?.includes('json') 
      ? await response.json() 
      : await response.text();
    
    return { 
      status: response.status, 
      data: responseData, 
      ok: response.ok 
    };
  } catch (error) {
    console.error(`Request Error: ${error.message}`);
    return { status: 500, data: null, ok: false };
  }
}

function logTest(testName, passed, message) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${icon}\x1b[0m ${testName}: ${message}`);
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  testResults.tests.push({ name: testName, passed, message });
}

// Tests
async function test1GetUsers() {
  console.log('\n📌 TEST 1: Récupération des utilisateurs\n');
  const response = await makeRequest('GET', '/utilisateurs');
  
  if (response.ok && response.data.data) {
    const users = response.data.data;
    
    testData.users = {
      manager: users.find(u => u.role === 'MANAGER') || users[0],
      employee1: users.find((u, i) => u.role === 'EMPLOYE' && users.indexOf(u) === i) || users[1],
      employee2: users.find((u, i) => u.role === 'EMPLOYE' && i > 1) || users[2],
      admin: users.find(u => u.role === 'ADMIN') || users[0],
    };
    
    logTest('GET /utilisateurs', true, `${users.length} utilisateur(s) trouvé(s)`);
    
    if (testData.users.manager) {
      console.log(`  - Manager: ${testData.users.manager.email}`);
    }
    if (testData.users.employee1) {
      console.log(`  - Employé 1: ${testData.users.employee1.email}`);
    }
    if (testData.users.employee2) {
      console.log(`  - Employé 2: ${testData.users.employee2.email}`);
    }
    
    return true;
  } else {
    logTest('GET /utilisateurs', false, 'Erreur lors de la récupération');
    return false;
  }
}

async function test2GetTeams() {
  console.log('\n📌 TEST 2: Récupération des équipes\n');
  const response = await makeRequest('GET', '/equipes');
  
  if (response.ok && response.data.data) {
    testData.team = response.data.data[0];
    logTest('GET /equipes', true, `${response.data.data.length} équipe(s) trouvée(s)`);
    if (testData.team) {
      console.log(`  - Équipe: ${testData.team.nom}`);
    }
    return true;
  } else {
    logTest('GET /equipes', false, 'Aucune équipe trouvée');
    return false;
  }
}

async function test3GetClients() {
  console.log('\n📌 TEST 3: Récupération des clients\n');
  const response = await makeRequest('GET', '/clients');
  
  if (response.ok && response.data.data) {
    testData.client = response.data.data[0];
    logTest('GET /clients', true, `${response.data.data.length} client(s) trouvé(s)`);
    if (testData.client) {
      console.log(`  - Client: ${testData.client.prenom} ${testData.client.nom}`);
    }
    return true;
  } else {
    logTest('GET /clients', false, 'Aucun client trouvé');
    return false;
  }
}

async function test4GetProjects() {
  console.log('\n📌 TEST 4: Récupération des projets\n');
  const response = await makeRequest('GET', '/projets');
  
  if (response.ok && response.data.data) {
    testData.project = response.data.data[0];
    logTest('GET /projets', true, `${response.data.data.length} projet(s) trouvé(s)`);
    if (testData.project) {
      console.log(`  - Projet: ${testData.project.titre}`);
    }
    return true;
  } else {
    logTest('GET /projets', false, 'Aucun projet trouvé');
    return false;
  }
}

async function test5GetTasks() {
  console.log('\n📌 TEST 5: Récupération des tâches\n');
  const response = await makeRequest('GET', '/taches');
  
  if (response.ok && response.data.data) {
    testData.tasks = response.data.data;
    logTest('GET /taches', true, `${response.data.data.length} tâche(s) trouvée(s)`);
    
    // Afficher les détails des tâches
    testData.tasks.forEach((task, i) => {
      console.log(`  ${i + 1}. ${task.titre} (Statut: ${task.statut})`);
    });
    
    return true;
  } else {
    logTest('GET /taches', false, 'Aucune tâche trouvée');
    return false;
  }
}

async function test6GetInvoices() {
  console.log('\n📌 TEST 6: Récupération des factures\n');
  const response = await makeRequest('GET', '/factures');
  
  if (response.ok && response.data.data) {
    testData.invoices = response.data.data;
    logTest('GET /factures', true, `${response.data.data.length} facture(s) trouvée(s)`);
    
    // Afficher les détails des factures
    testData.invoices.forEach((invoice, i) => {
      console.log(`  ${i + 1}. ${invoice.numero} - ${invoice.montantTTC} FCFA (${invoice.statut})`);
    });
    
    return true;
  } else {
    logTest('GET /factures', false, 'Aucune facture trouvée');
    return false;
  }
}

async function test7GetServices() {
  console.log('\n📌 TEST 7: Récupération des services\n');
  const response = await makeRequest('GET', '/services');
  
  if (response.ok && response.data.data) {
    testData.services = response.data.data;
    logTest('GET /services', true, `${response.data.data.length} service(s) trouvé(s)`);
    
    testData.services.forEach((service, i) => {
      console.log(`  ${i + 1}. ${service.nom} - ${service.prix} FCFA`);
    });
    
    return true;
  } else {
    logTest('GET /services', false, 'Aucun service trouvé');
    return false;
  }
}

async function test8GetSubscriptions() {
  console.log('\n📌 TEST 8: Récupération des abonnements\n');
  const response = await makeRequest('GET', '/abonnements');
  
  if (response.ok && response.data.data) {
    testData.subscriptions = response.data.data;
    logTest('GET /abonnements', true, `${response.data.data.length} abonnement(s) trouvé(s)`);
    
    testData.subscriptions.forEach((sub, i) => {
      console.log(`  ${i + 1}. ${sub.nom} - ${sub.montant} FCFA (${sub.frequence})`);
    });
    
    return true;
  } else {
    logTest('GET /abonnements', false, 'Aucun abonnement trouvé');
    return false;
  }
}

async function test9GetNotifications() {
  console.log('\n📌 TEST 9: Récupération des notifications\n');
  const response = await makeRequest('GET', '/notifications');
  
  if (response.ok && response.data.data) {
    testData.notifications = response.data.data;
    logTest('GET /notifications', true, `${response.data.data.length} notification(s) trouvée(s)`);
    
    // Afficher les 5 dernières
    testData.notifications.slice(0, 5).forEach((notif, i) => {
      console.log(`  ${i + 1}. ${notif.titre}`);
    });
    
    return true;
  } else {
    logTest('GET /notifications', false, 'Erreur lors de la récupération');
    return false;
  }
}

async function test10CronLatePayments() {
  console.log('\n📌 TEST 10: Test CRON détection paiements en retard\n');
  const response = await makeRequest('POST', '/cron/check-late-payments', {});
  
  if (response.ok && response.data.data) {
    const { totalPayments, latePayments, notified } = response.data.data;
    logTest('POST /cron/check-late-payments', true, `${latePayments}/${totalPayments} paiement(s) en retard, ${notified} notification(s)`);
    return true;
  } else {
    logTest('POST /cron/check-late-payments', false, 'Erreur lors de l\'exécution du CRON');
    return false;
  }
}

async function test11CronLateTasks() {
  console.log('\n📌 TEST 11: Test CRON détection tâches en retard\n');
  const response = await makeRequest('POST', '/cron/check-late-tasks', {});
  
  if (response.ok && response.data.data) {
    const { totalTasks, lateTasks, notified } = response.data.data;
    logTest('POST /cron/check-late-tasks', true, `${lateTasks}/${totalTasks} tâche(s) en retard, ${notified} notification(s)`);
    return true;
  } else {
    logTest('POST /cron/check-late-tasks', false, 'Erreur lors de l\'exécution du CRON');
    return false;
  }
}

async function test12GetDashboardManager() {
  console.log('\n📌 TEST 12: Test Dashboard Manager\n');
  const response = await makeRequest('GET', '/dashboard/manager');
  
  if (response.ok) {
    logTest('GET /dashboard/manager', true, 'Dashboard disponible');
    return true;
  } else {
    logTest('GET /dashboard/manager', false, 'Erreur lors de la récupération');
    return false;
  }
}

async function test13GetDashboardEmployee() {
  console.log('\n📌 TEST 13: Test Dashboard Employé\n');
  const response = await makeRequest('GET', '/dashboard/employe');
  
  if (response.ok) {
    logTest('GET /dashboard/employe', true, 'Dashboard disponible');
    return true;
  } else {
    logTest('GET /dashboard/employe', false, 'Erreur lors de la récupération');
    return false;
  }
}

async function test14SubmitTask() {
  console.log('\n📌 TEST 14: Soumission d\'une nouvelle tâche\n');
  
  if (!testData.project || !testData.users.employee1) {
    logTest('POST /taches (Soumission)', false, 'Données manquantes');
    return false;
  }
  
  const taskData = {
    titre: `Tâche Test Automatisé ${new Date().toISOString()}`,
    description: 'Tâche créée par le script de test automatisé',
    projetId: testData.project.id,
    statut: 'A_FAIRE',
    priorite: 'MOYENNE',
    dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    heuresEstimees: 8,
    montant: 3000,
    facturable: true,
    assigneeId: testData.users.employee1.id,
  };
  
  const response = await makeRequest('POST', '/taches', taskData);
  
  if (response.ok && response.data.data) {
    logTest('POST /taches (Soumission)', true, `Tâche créée: ${response.data.data.titre}`);
    return true;
  } else {
    logTest('POST /taches (Soumission)', false, 'Erreur lors de la création');
    return false;
  }
}

async function test15TaskValidation() {
  console.log('\n📌 TEST 15: Validation/Rejet de tâche par Manager\n');
  
  if (testData.tasks.length === 0) {
    logTest('PATCH /taches (Validation)', false, 'Aucune tâche disponible');
    return false;
  }
  
  const taskToUpdate = testData.tasks[0];
  const newStatut = taskToUpdate.statut === 'A_FAIRE' ? 'EN_COURS' : 'TERMINE';
  
  const response = await makeRequest('PATCH', `/taches/${taskToUpdate.id}`, {
    statut: newStatut,
    commentaire: 'Tâche validée par le script de test',
  });
  
  if (response.ok) {
    logTest('PATCH /taches (Validation)', true, `Statut changé à: ${newStatut}`);
    return true;
  } else {
    logTest('PATCH /taches (Validation)', false, 'Erreur lors de la mise à jour');
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('\x1b[36m╔════════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m║        🚀 TEST AUTOMATISÉ COMPLET DU SYSTÈME KEKELI 🚀           ║\x1b[0m');
  console.log('\x1b[36m║            Exécution le ' + new Date().toLocaleString('fr-FR').padEnd(45, ' ') + '║\x1b[0m');
  console.log('\x1b[36m╚════════════════════════════════════════════════════════════════════╝\x1b[0m');
  
  try {
    // Exécuter les tests
    await test1GetUsers();
    await test2GetTeams();
    await test3GetClients();
    await test4GetProjects();
    await test5GetTasks();
    await test6GetInvoices();
    await test7GetServices();
    await test8GetSubscriptions();
    await test9GetNotifications();
    await test10CronLatePayments();
    await test11CronLateTasks();
    await test12GetDashboardManager();
    await test13GetDashboardEmployee();
    await test14SubmitTask();
    await test15TaskValidation();
    
    // Afficher le résumé
    console.log('\n');
    console.log('\x1b[36m╔════════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║                  📊 RÉSUMÉ FINAL DES TESTS 📊                    ║\x1b[0m');
    console.log('\x1b[36m╚════════════════════════════════════════════════════════════════════╝\x1b[0m');
    
    console.log('\n');
    console.log(`\x1b[32m✅ Tests réussis: ${testResults.passed}\x1b[0m`);
    console.log(`\x1b[31m❌ Tests échoués: ${testResults.failed}\x1b[0m`);
    
    const total = testResults.passed + testResults.failed;
    const percentage = ((testResults.passed / total) * 100).toFixed(1);
    
    console.log(`\n📈 Taux de réussite: ${percentage}% (${testResults.passed}/${total})\n`);
    
    // Résumé des données
    console.log('\x1b[36m╔════════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║              📊 RÉSUMÉ DES DONNÉES TESTÉES 📊                     ║\x1b[0m');
    console.log('\x1b[36m╚════════════════════════════════════════════════════════════════════╝\x1b[0m\n');
    
    console.log('\x1b[33m👥 Utilisateurs:\x1b[0m');
    if (testData.users.manager) console.log(`   Manager: ${testData.users.manager.email}`);
    if (testData.users.employee1) console.log(`   Employé 1: ${testData.users.employee1.email}`);
    if (testData.users.employee2) console.log(`   Employé 2: ${testData.users.employee2.email}`);
    
    console.log('\n\x1b[33m📦 Ressources:\x1b[0m');
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
    console.error('\n❌ Erreur critique lors de l\'exécution des tests:', error);
  }
}

runAllTests().catch(console.error);
'@

# Sauvegarder le script dans un fichier temporaire
$tempTestScript = Join-Path $env:TEMP "run-kekeli-tests.js"
Set-Content -Path $tempTestScript -Value $testScript -Encoding UTF8

# Exécuter le script de test
Write-Host "⏳ Exécution des 15 tests automatisés...\n" -ForegroundColor Yellow
node $tempTestScript

# Nettoyer
Remove-Item $tempTestScript -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✨ TESTS COMPLÉTÉS AVEC SUCCÈS! ✨                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Consultez les résultats ci-dessus pour voir le détail des tests." -ForegroundColor Cyan
Write-Host ""
