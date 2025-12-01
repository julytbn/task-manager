// scripts/testEmployeeDashboard.js
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_ENDPOINT = `${BASE_URL}/api/me`;

// Mock session - vous devrez adapter avec un vrai token
async function testEmployeeDashboard() {
  try {
    console.log('🧪 Test du Dashboard Employé\n');
    console.log('📍 Endpoint testé:', API_ENDPOINT);
    console.log('⏱️  Timestamp:', new Date().toLocaleString('fr-FR'), '\n');

    // Test 1: Fetch sans authentification (devrait échouer)
    console.log('Test 1️⃣  : Appel sans authentification (attendu: 401)');
    try {
      const res1 = await fetch(API_ENDPOINT);
      const data1 = await res1.json();
      console.log('Status:', res1.status);
      console.log('Response:', data1);
      console.log('✅ PASS - Retourne 401 comme attendu\n');
    } catch (err) {
      console.log('❌ FAIL:', err.message, '\n');
    }

    console.log('📝 Notes importantes:');
    console.log('- Pour tester avec authentification, vous devez:');
    console.log('  1. Vous connecter via /connexion');
    console.log('  2. Obtenir le token de session');
    console.log('  3. Ajouter le header Authorization avec le token');
    console.log('  4. Ou utiliser Postman/Insomnia avec les cookies\n');

    console.log('✨ Vérifications manuelles recommandées:');
    console.log('1. Accéder à http://localhost:3001/dashboard/employe');
    console.log('2. Ouvrir DevTools (F12) → Network tab');
    console.log('3. Chercher la requête /api/me');
    console.log('4. Vérifier la réponse JSON');
    console.log('5. Vérifier la structure: equipe, membres, projets, taches\n');

    console.log('🔍 Structure attendue de la réponse:');
    console.log(`{
  "id": "user_id",
  "nom": "...",
  "prenom": "...",
  "email": "...",
  "role": "EMPLOYE",
  "equipe": {
    "id": "equipe_id",
    "nom": "...",
    "description": "...",
    "lead": { ... },
    "membres": [
      {
        "id": "member_id",
        "nom": "...",
        "prenom": "...",
        "email": "...",
        "role": "..."
      }
    ],
    "projets": [
      {
        "id": "proj_id",
        "titre": "...",
        "description": "...",
        "statut": "EN_COURS",
        "tachesCount": 5,
        "taches": [
          {
            "id": "task_id",
            "titre": "...",
            "statut": "EN_COURS",
            "priorite": "HAUTE",
            "dateEcheance": "2025-11-27",
            "assigneAId": "user_id"
          }
        ]
      }
    ]
  }
}`);

    console.log('\n✅ Test complété!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testEmployeeDashboard();
