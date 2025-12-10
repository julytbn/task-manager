#!/usr/bin/env pwsh

# Script PowerShell pour exécuter les tests automatisés complets

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         🚀 LANCEMENT DES TESTS AUTOMATISÉS COMPLETS 🚀   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n"

# Vérifier que le serveur est en cours d'exécution
Write-Host "⏳ Vérification du serveur API..." -ForegroundColor Yellow

$testUrl = "http://localhost:3000/api/utilisateurs"

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method Get -ErrorAction Stop
    Write-Host "✅ Serveur API disponible (http://localhost:3000)" -ForegroundColor Green
} catch {
    Write-Host "❌ Le serveur API n'est pas disponible!" -ForegroundColor Red
    Write-Host "`nAssurez-vous que:" -ForegroundColor Yellow
    Write-Host "  1. Le serveur Node.js/Next.js est en cours d'exécution" -ForegroundColor Gray
    Write-Host "  2. La base de données PostgreSQL est accessible" -ForegroundColor Gray
    Write-Host "  3. L'URL est correcte: http://localhost:3000" -ForegroundColor Gray
    exit 1
}

Write-Host "`n⏳ Exécution des tests..." -ForegroundColor Yellow
Write-Host "`nVeuillez patienter, cela peut prendre quelques secondes...`n" -ForegroundColor Gray

# Créer un script Node.js temporaire pour exécuter les tests
$scriptContent = @'
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';
const CRON_SECRET = 'test-secret';

let testData = {
  users: {},
  team: null,
  client: null,
  project: null,
  tasks: [],
  invoices: [],
  subscriptions: [],
  services: [],
};

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
    const responseData = await response.json();
    return { status: response.status, data: responseData, ok: response.ok };
  } catch (error) {
    return { status: 500, data: null, ok: false };
  }
}

function log(title, message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const colors = { success: '\x1b[32m', error: '\x1b[31m', info: '\x1b[36m', reset: '\x1b[0m' };
  console.log(`${colors[type]}${icons[type]} ${title}${colors.reset} - ${message}`);
}

async function step1() {
  log('ÉTAPE 1', 'Récupération des utilisateurs existants', 'info');
  const response = await makeRequest('GET', '/utilisateurs');
  if (response.ok && response.data.data) {
    const users = response.data.data;
    const manager = users.find(u => u.role === 'MANAGER');
    const employees = users.filter(u => u.role === 'EMPLOYE');
    testData.users = {
      manager: manager || users[0],
      employee1: employees[0] || users[1],
      employee2: employees[1] || users[2],
    };
    log('Utilisateurs trouvés', `${users.length} utilisateur(s)`, 'success');
    return true;
  }
  log('Utilisateurs trouvés', 'Erreur', 'error');
  return false;
}

async function step2() {
  log('ÉTAPE 2', 'Récupération d\'une équipe', 'info');
  const response = await makeRequest('GET', '/equipes');
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.team = response.data.data[0];
    log('Équipe trouvée', `${testData.team.nom}`, 'success');
    return true;
  }
  log('Équipe trouvée', 'Aucune équipe', 'error');
  return false;
}

async function step3() {
  log('ÉTAPE 3', 'Vérification des clients', 'info');
  const response = await makeRequest('GET', '/clients');
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.client = response.data.data[0];
    log('Client trouvé', `${testData.client.prenom} ${testData.client.nom}`, 'success');
    return true;
  }
  log('Client trouvé', 'Aucun client', 'error');
  return false;
}

async function step4() {
  log('ÉTAPE 4', 'Récupération des projets', 'info');
  const response = await makeRequest('GET', '/projets');
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.project = response.data.data[0];
    log('Projet trouvé', `${testData.project.titre}`, 'success');
    return true;
  }
  log('Projet trouvé', 'Aucun projet', 'error');
  return false;
}

async function step5() {
  log('ÉTAPE 5', 'Récupération des tâches', 'info');
  const response = await makeRequest('GET', '/taches');
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.tasks = response.data.data;
    log('Tâches trouvées', `${testData.tasks.length} tâche(s)`, 'success');
    return true;
  }
  log('Tâches trouvées', 'Aucune tâche', 'error');
  return false;
}

async function step6() {
  log('ÉTAPE 6', 'Récupération des factures', 'info');
  const response = await makeRequest('GET', '/factures');
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.invoices = response.data.data;
    log('Factures trouvées', `${testData.invoices.length} facture(s)`, 'success');
    return true;
  }
  log('Factures trouvées', 'Aucune facture', 'error');
  return false;
}

async function step7() {
  log('ÉTAPE 7', 'Récupération des services', 'info');
  const response = await makeRequest('GET', '/services');
  if (response.ok && response.data.data && response.data.data.length > 0) {
    testData.services = response.data.data;
    log('Services trouvés', `${testData.services.length} service(s)`, 'success');
    return true;
  }
  log('Services trouvés', 'Aucun service', 'error');
  return false;
}

async function step8() {
  log('ÉTAPE 8', 'Récupération des notifications', 'info');
  const response = await makeRequest('GET', '/notifications');
  if (response.ok && response.data.data) {
    log('Notifications trouvées', `${response.data.data.length} notification(s)`, 'success');
    return true;
  }
  log('Notifications trouvées', 'Erreur', 'error');
  return false;
}

async function step9() {
  log('ÉTAPE 9', 'Test CRON paiements en retard', 'info');
  const response = await makeRequest('POST', '/cron/check-late-payments', {});
  if (response.ok && response.data.data) {
    log('CRON Paiements', `${response.data.data.latePayments} en retard`, 'success');
    return true;
  }
  log('CRON Paiements', 'Erreur', 'error');
  return false;
}

async function step10() {
  log('ÉTAPE 10', 'Test CRON tâches en retard', 'info');
  const response = await makeRequest('POST', '/cron/check-late-tasks', {});
  if (response.ok && response.data.data) {
    log('CRON Tâches', `${response.data.data.lateTasks} en retard`, 'success');
    return true;
  }
  log('CRON Tâches', 'Erreur', 'error');
  return false;
}

async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      🚀 TEST AUTOMATISÉ DU SYSTÈME KEKELI 🚀             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results = [];
  const steps = [
    { step: 1, name: 'Utilisateurs', fn: step1 },
    { step: 2, name: 'Équipe', fn: step2 },
    { step: 3, name: 'Clients', fn: step3 },
    { step: 4, name: 'Projets', fn: step4 },
    { step: 5, name: 'Tâches', fn: step5 },
    { step: 6, name: 'Factures', fn: step6 },
    { step: 7, name: 'Services', fn: step7 },
    { step: 8, name: 'Notifications', fn: step8 },
    { step: 9, name: 'CRON Paiements', fn: step9 },
    { step: 10, name: 'CRON Tâches', fn: step10 },
  ];

  for (const {step, name, fn} of steps) {
    try {
      const passed = await fn();
      results.push({ step, name, passed });
    } catch (error) {
      results.push({ step, name, passed: false });
    }
    await new Promise(r => setTimeout(r, 300)); // Petit délai entre les requêtes
  }

  // Afficher le résumé
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    📋 RÉSUMÉ DES TESTS 📋                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ÉTAPE ${result.step}: ${result.name}`);
  });

  console.log('\n');
  console.log(`📊 Résultat: ${passedCount}/${totalCount} tests réussis`);
  const percentage = ((passedCount / totalCount) * 100).toFixed(1);
  console.log(`📈 Taux de réussite: ${percentage}%\n`);

  // Afficher les données
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              📊 DONNÉES TESTÉES 📊                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (testData.users.manager) {
    console.log(`📌 Manager: ${testData.users.manager.email}`);
  }
  if (testData.team) {
    console.log(`📌 Équipe: ${testData.team.nom}`);
  }
  if (testData.client) {
    console.log(`📌 Client: ${testData.client.prenom} ${testData.client.nom}`);
  }
  if (testData.project) {
    console.log(`📌 Projet: ${testData.project.titre}`);
  }
  console.log(`📌 Tâches: ${testData.tasks.length}`);
  console.log(`📌 Factures: ${testData.invoices.length}`);
  console.log(`📌 Services: ${testData.services.length}\n`);

  console.log('✨ Test automatisé complété!\n');
}

runTests().catch(console.error);
'@

# Sauvegarder et exécuter le script
$tempScript = Join-Path $env:TEMP "test-kekeli.js"
Set-Content -Path $tempScript -Value $scriptContent -Encoding UTF8

node $tempScript

# Nettoyer
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host "`n"
Write-Host "✨ Tests terminés! Consultez les résultats ci-dessus." -ForegroundColor Green
Write-Host "`n"
