#!/usr/bin/env node

/**
 * Script de test pour valider les endpoints Devis, Charge, TimeSheet
 * Utilisation: node test-etape5.js
 */

const BASE_URL = "http://localhost:3000";

// Couleurs pour le terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function request(method, endpoint, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function testDevisEndpoints() {
  log("\n=== TEST DEVIS ENDPOINTS ===\n", "cyan");

  // Test 1: POST /api/devis - Créer un devis
  log("1️⃣  POST /api/devis - Créer un devis", "blue");

  // Récupérer un clientId valide (adapter si nécessaire)
  const clientId = "test-client-id"; // À remplacer par un ID réel

  const createDevisResponse = await request("POST", "/api/devis", {
    clientId,
    titre: "Devis Test - Audit Comptable",
    description: "Test creation devis",
    montant: 5000,
    tauxTVA: 0.18,
    notes: "Test notes",
    services: [],
  });

  if (createDevisResponse.ok) {
    log(`✅ Devis créé: ${createDevisResponse.data.data?.numero}`, "green");
    var devisId = createDevisResponse.data.data?.id;
  } else {
    log(
      `❌ Erreur: ${createDevisResponse.data?.message || "Unknown error"}`,
      "red"
    );
    log(JSON.stringify(createDevisResponse.data, null, 2), "yellow");
  }

  // Test 2: GET /api/devis - Lister les devis
  log("\n2️⃣  GET /api/devis - Lister les devis", "blue");

  const listDevisResponse = await request("GET", "/api/devis");

  if (listDevisResponse.ok) {
    log(
      `✅ Devis listés: ${listDevisResponse.data.count} devis trouvés`,
      "green"
    );
  } else {
    log(
      `❌ Erreur: ${listDevisResponse.data?.message || "Unknown error"}`,
      "red"
    );
  }

  // Test 3: GET /api/devis/:id - Récupérer un devis
  if (devisId) {
    log("\n3️⃣  GET /api/devis/:id - Récupérer un devis", "blue");

    const getDevisResponse = await request("GET", `/api/devis/${devisId}`);

    if (getDevisResponse.ok) {
      log(`✅ Devis récupéré: ${getDevisResponse.data.data?.numero}`, "green");
    } else {
      log(
        `❌ Erreur: ${getDevisResponse.data?.message || "Unknown error"}`,
        "red"
      );
    }

    // Test 4: PATCH /api/devis/:id/status - Changer le statut
    log("\n4️⃣  PATCH /api/devis/:id/status - Changer le statut", "blue");

    const statusResponse = await request(
      "PATCH",
      `/api/devis/${devisId}/status`,
      { newStatus: "ENVOYE" }
    );

    if (statusResponse.ok) {
      log(`✅ Statut changé à ENVOYE`, "green");
    } else {
      log(
        `❌ Erreur: ${statusResponse.data?.message || "Unknown error"}`,
        "red"
      );
    }
  }
}

async function testChargeEndpoints() {
  log("\n=== TEST CHARGE ENDPOINTS ===\n", "cyan");

  // Test 1: POST /api/charges - Créer une charge
  log("1️⃣  POST /api/charges - Créer une charge", "blue");

  const createChargeResponse = await request("POST", "/api/charges", {
    montant: 1500,
    categorie: "SALAIRES_CHARGES_SOCIALES",
    description: "Salaire test",
    date: new Date().toISOString(),
    notes: "Test charge",
  });

  if (createChargeResponse.ok) {
    log(`✅ Charge créée: ${createChargeResponse.data.data?.id}`, "green");
    var chargeId = createChargeResponse.data.data?.id;
  } else {
    log(
      `❌ Erreur: ${createChargeResponse.data?.message || "Unknown error"}`,
      "red"
    );
    log(JSON.stringify(createChargeResponse.data, null, 2), "yellow");
  }

  // Test 2: GET /api/charges - Lister les charges
  log("\n2️⃣  GET /api/charges - Lister les charges", "blue");

  const listChargesResponse = await request("GET", "/api/charges");

  if (listChargesResponse.ok) {
    log(
      `✅ Charges listées: ${listChargesResponse.data.count} charges trouvées`,
      "green"
    );
  } else {
    log(
      `❌ Erreur: ${listChargesResponse.data?.message || "Unknown error"}`,
      "red"
    );
  }

  // Test 3: GET /api/charges/stats/summary - Statistiques
  log("\n3️⃣  GET /api/charges/stats/summary - Statistiques", "blue");

  const statsResponse = await request("GET", "/api/charges/stats/summary");

  if (statsResponse.ok) {
    log(
      `✅ Stats: ${statsResponse.data.data?.totalMontant} (total), ${statsResponse.data.data?.nombreCharges} charges`,
      "green"
    );
  } else {
    log(
      `❌ Erreur: ${statsResponse.data?.message || "Unknown error"}`,
      "red"
    );
  }

  // Test 4: GET /api/charges/:id - Récupérer une charge
  if (chargeId) {
    log("\n4️⃣  GET /api/charges/:id - Récupérer une charge", "blue");

    const getChargeResponse = await request("GET", `/api/charges/${chargeId}`);

    if (getChargeResponse.ok) {
      log(`✅ Charge récupérée: ${getChargeResponse.data.data?.id}`, "green");
    } else {
      log(
        `❌ Erreur: ${getChargeResponse.data?.message || "Unknown error"}`,
        "red"
      );
    }
  }
}

async function testTimesheetEndpoints() {
  log("\n=== TEST TIMESHEET ENDPOINTS ===\n", "cyan");

  // Test 1: POST /api/timesheets - Créer un timesheet
  log("1️⃣  POST /api/timesheets - Créer un timesheet", "blue");

  const createTsResponse = await request("POST", "/api/timesheets", {
    employeeId: "test-employee-id",
    taskId: "test-task-id",
    projectId: "test-project-id",
    date: new Date().toISOString(),
    regularHrs: 8,
    overtimeHrs: 1,
    description: "Test timesheet",
  });

  if (createTsResponse.ok) {
    log(`✅ TimeSheet créé: ${createTsResponse.data.data?.id}`, "green");
    var timesheetId = createTsResponse.data.data?.id;
  } else {
    log(
      `❌ Erreur: ${createTsResponse.data?.message || "Unknown error"}`,
      "red"
    );
    log(JSON.stringify(createTsResponse.data, null, 2), "yellow");
  }

  // Test 2: GET /api/timesheets - Lister les timesheets
  log("\n2️⃣  GET /api/timesheets - Lister les timesheets", "blue");

  const listTsResponse = await request("GET", "/api/timesheets");

  if (listTsResponse.ok) {
    log(
      `✅ TimeSheets listés: ${listTsResponse.data.count} timesheets trouvés`,
      "green"
    );
  } else {
    log(
      `❌ Erreur: ${listTsResponse.data?.message || "Unknown error"}`,
      "red"
    );
  }

  // Test 3: PATCH /api/timesheets/:id/validate - Valider un timesheet
  if (timesheetId) {
    log(
      "\n3️⃣  PATCH /api/timesheets/:id/validate - Valider un timesheet",
      "blue"
    );

    const validateTsResponse = await request(
      "PATCH",
      `/api/timesheets/${timesheetId}/validate`,
      {
        action: "validate",
        validePar: "test-manager-id",
      }
    );

    if (validateTsResponse.ok) {
      log(`✅ TimeSheet validé`, "green");
    } else {
      log(
        `❌ Erreur: ${validateTsResponse.data?.message || "Unknown error"}`,
        "red"
      );
    }
  }
}

async function runAllTests() {
  log("\n🧪 DÉBUT DES TESTS - ÉTAPE 5 BACKEND SERVICES", "cyan");
  log(`Server: ${BASE_URL}\n`, "yellow");

  await testDevisEndpoints();
  await testChargeEndpoints();
  await testTimesheetEndpoints();

  log("\n✅ TESTS COMPLÉTÉS\n", "green");
}

// Lancer les tests
runAllTests().catch((error) => {
  log(`\n❌ ERREUR: ${error.message}`, "red");
  process.exit(1);
});
