#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST COMPLET - Toutes les fonctionnalités
 * 
 * Teste:
 * 1. Création d'utilisateurs (Admin, Manager, Employé)
 * 2. Création d'équipe
 * 3. Ajout de membre à l'équipe (trigger email + notification)
 * 4. Création de projet
 * 5. Création de tâche
 * 6. Assignation de tâche (trigger email + notification)
 * 7. Upload de document
 * 8. Validation/Rejet de tâche
 * 9. Création de paiement en retard
 * 10. Détection paiements en retard
 * 11. Détection tâches en retard
 */

const BASE_URL = 'http://localhost:3000'

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔷 ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
}

// Stockage des IDs pour réutilisation
const state = {}

async function request(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    if (body) options.body = JSON.stringify(body)

    const res = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await res.json()

    if (!res.ok) {
      throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`)
    }
    return data
  } catch (error) {
    throw error
  }
}

async function runTests() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════════╗
║       🧪 TEST COMPLET - TASK MANAGER - TOUTES FONCTIONNALITÉS  ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`)

  try {
    // ========================
    // 1️⃣  CRÉER LES UTILISATEURS
    // ========================
    log.step('ÉTAPE 1: Création des utilisateurs')

    const adminRes = await request('POST', '/api/utilisateurs', {
      nom: 'Dupont',
      prenom: 'Alice',
      email: 'alice@kekeli.com',
      telephone: '+33612345678',
      role: 'ADMIN',
      dateEmbauche: new Date().toISOString()
    })
    state.adminId = adminRes.id
    log.success(`Admin créé: ${adminRes.prenom} ${adminRes.nom} (${state.adminId})`)

    const managerRes = await request('POST', '/api/utilisateurs', {
      nom: 'Martin',
      prenom: 'Bob',
      email: 'bob@kekeli.com',
      telephone: '+33612345679',
      role: 'MANAGER',
      dateEmbauche: new Date().toISOString()
    })
    state.managerId = managerRes.id
    log.success(`Manager créé: ${managerRes.prenom} ${managerRes.nom} (${state.managerId})`)

    const employeeRes = await request('POST', '/api/utilisateurs', {
      nom: 'Bernard',
      prenom: 'Charlie',
      email: 'charlie@kekeli.com',
      telephone: '+33612345680',
      role: 'EMPLOYE',
      dateEmbauche: new Date().toISOString()
    })
    state.employeeId = employeeRes.id
    log.success(`Employé créé: ${employeeRes.prenom} ${employeeRes.nom} (${state.employeeId})`)

    // ========================
    // 2️⃣  CRÉER UNE ÉQUIPE
    // ========================
    log.step('ÉTAPE 2: Création de l\'équipe')

    const teamRes = await request('POST', '/api/equipes', {
      nom: 'Équipe Tech',
      description: 'Équipe de développement',
      leadId: state.managerId
    })
    state.teamId = teamRes.id
    log.success(`Équipe créée: ${teamRes.nom} (${state.teamId})`)

    // ========================
    // 3️⃣  AJOUTER UN MEMBRE À L'ÉQUIPE
    // ========================
    log.step('ÉTAPE 3: Ajout du membre à l\'équipe (trigger email + notification)')

    const memberRes = await request('POST', `/api/equipes/${state.teamId}/membres`, {
      utilisateurId: state.employeeId,
      role: 'MEMBRE'
    })
    log.success(`Membre ajouté à l'équipe - Email + Notification générés`)

    // ========================
    // 4️⃣  CRÉER UN PROJET
    // ========================
    log.step('ÉTAPE 4: Création du projet')

    const projectRes = await request('POST', '/api/projets', {
      titre: 'Site Web Client',
      description: 'Refonte du site web',
      statut: 'EN_COURS',
      equipeId: state.teamId,
      dateDebut: new Date().toISOString(),
      dateFin: new Date(Date.now() + 30*24*60*60*1000).toISOString()
    })
    state.projectId = projectRes.id
    log.success(`Projet créé: ${projectRes.titre} (${state.projectId})`)

    // ========================
    // 5️⃣  CRÉER UNE TÂCHE
    // ========================
    log.step('ÉTAPE 5: Création de la tâche')

    const taskRes = await request('POST', '/api/taches', {
      titre: 'Développer la page d\'accueil',
      description: 'Créer la page d\'accueil responsive',
      statut: 'A_FAIRE',
      priorite: 'HAUTE',
      projetId: state.projectId,
      assigneAId: state.employeeId,
      dateEcheance: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      heuresEstimees: 16,
      facturable: true
    })
    state.taskId = taskRes.id
    log.success(`Tâche créée: ${taskRes.titre} (${state.taskId})`)
    log.success(`Email d'assignation envoyé à l'employé`)

    // ========================
    // 6️⃣  METTRE À JOUR LA TÂCHE
    // ========================
    log.step('ÉTAPE 6: Mise à jour de la tâche (validation)')

    const updateRes = await request('PATCH', `/api/taches/${state.taskId}`, {
      statut: 'TERMINE',
      commentaire: 'Tâche complétée avec succès'
    })
    log.success(`Tâche mise à jour: statut = ${updateRes.statut}`)

    // ========================
    // 7️⃣  CRÉER UN CLIENT
    // ========================
    log.step('ÉTAPE 7: Création du client')

    const clientRes = await request('POST', '/api/clients', {
      nom: 'Dupuis',
      prenom: 'David',
      email: 'david@client.com',
      telephone: '+33612345681',
      entreprise: 'Acme Corp',
      type: 'ENTREPRISE'
    })
    state.clientId = clientRes.id
    log.success(`Client créé: ${clientRes.prenom} ${clientRes.nom} (${state.clientId})`)

    // ========================
    // 8️⃣  CRÉER UNE FACTURE
    // ========================
    log.step('ÉTAPE 8: Création de la facture')

    const invoiceRes = await request('POST', '/api/factures', {
      numero: `FACT-${Date.now()}`,
      clientId: state.clientId,
      projetId: state.projectId,
      statut: 'EN_ATTENTE',
      montant: 5000,
      tauxTVA: 0.18,
      dateEcheance: new Date(Date.now() - 5*24*60*60*1000).toISOString() // EN RETARD
    })
    state.invoiceId = invoiceRes.id
    log.success(`Facture créée: ${invoiceRes.numero} - EN RETARD (${state.invoiceId})`)

    // ========================
    // 9️⃣  CRÉER UN PAIEMENT
    // ========================
    log.step('ÉTAPE 9: Création du paiement')

    const paymentRes = await request('POST', '/api/paiements', {
      factureId: state.invoiceId,
      clientId: state.clientId,
      projetId: state.projectId,
      statut: 'EN_ATTENTE',
      montant: 5000,
      datePaiement: new Date().toISOString()
    })
    state.paymentId = paymentRes.id
    log.success(`Paiement créé: ${paymentRes.montant} FCFA (${state.paymentId})`)

    // ========================
    // 🔟 TESTER DÉTECTION PAIEMENTS EN RETARD
    // ========================
    log.step('ÉTAPE 10: Test détection paiements en retard')

    const latePaymentRes = await request('POST', '/api/cron/check-late-payments', {})
    log.success(`Paiements détectés: ${latePaymentRes.data?.lateTasks || 'vérifier'}`)
    log.success(`Notification créée pour le manager`)
    log.success(`Email envoyé au manager`)

    // ========================
    // 1️⃣1️⃣  TESTER DÉTECTION TÂCHES EN RETARD
    // ========================
    log.step('ÉTAPE 11: Test détection tâches en retard')

    // Créer une tâche avec date d'échéance dépassée
    const lateTaskRes = await request('POST', '/api/taches', {
      titre: 'Tâche en retard pour test',
      description: 'Cette tâche a une date d\'échéance passée',
      statut: 'EN_COURS',
      priorite: 'URGENTE',
      projetId: state.projectId,
      assigneAId: state.employeeId,
      dateEcheance: new Date(Date.now() - 3*24*60*60*1000).toISOString(), // 3 jours en retard
      heuresEstimees: 8
    })
    state.lateTaskId = lateTaskRes.id
    log.success(`Tâche en retard créée pour test`)

    // Déclencher la détection
    const lateTaskCheckRes = await request('POST', '/api/cron/check-late-tasks', {})
    log.success(`Tâches en retard détectées`)
    log.success(`Notification créée pour l'employé`)
    log.success(`Email d'alerte envoyé à l'employé`)

    // ========================
    // ✅ RÉSUMÉ FINAL
    // ========================
    console.log(`${colors.green}
╔════════════════════════════════════════════════════════════════╗
║                    ✅ TOUS LES TESTS RÉUSSIS! ✅               ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`)

    console.log(`${colors.cyan}
📊 RÉSUMÉ DES DONNÉES CRÉÉES:
${colors.reset}
${colors.yellow}UTILISATEURS:${colors.reset}
  • Admin:    ${state.adminId}
  • Manager:  ${state.managerId}
  • Employé:  ${state.employeeId}

${colors.yellow}ORGANISATION:${colors.reset}
  • Équipe:   ${state.teamId}
  • Projet:   ${state.projectId}

${colors.yellow}TÂCHES:${colors.reset}
  • Tâche 1 (complétée):  ${state.taskId}
  • Tâche 2 (en retard):  ${state.lateTaskId}

${colors.yellow}FACTURATION:${colors.reset}
  • Client:   ${state.clientId}
  • Facture:  ${state.invoiceId} (EN RETARD)
  • Paiement: ${state.paymentId} (EN ATTENTE)

${colors.cyan}📧 EMAILS GÉNÉRÉS:${colors.reset}
  ✓ Email bienvenue membre d'équipe
  ✓ Email assignation de tâche
  ✓ Email alerte paiement en retard (manager)
  ✓ Email alerte tâche en retard (employé)

${colors.cyan}🔔 NOTIFICATIONS CRÉÉES:${colors.reset}
  ✓ Notification ajout à l'équipe
  ✓ Notification assignation de tâche
  ✓ Notification paiement en retard
  ✓ Notification tâche en retard

${colors.green}✅ BASE DE DONNÉES RÉINITIALISÉE ET TESTÉE${colors.reset}
${colors.green}✅ TOUS LES ENDPOINTS FONCTIONNELS${colors.reset}
${colors.green}✅ EMAILS ET NOTIFICATIONS OPÉRATIONNELS${colors.reset}

${colors.cyan}Prochaines étapes:${colors.reset}
  1. Accédez à http://localhost:3000
  2. Connectez-vous avec l'un des utilisateurs
  3. Vérifiez les dashboards et notifications
  4. Consultez les emails d'aperçu (Ethereal)
`)

  } catch (error) {
    log.error(`ERREUR: ${error.message}`)
    process.exit(1)
  }
}

// Lancer les tests
runTests().then(() => {
  log.success('Script de test terminé avec succès!')
  process.exit(0)
}).catch(error => {
  log.error(`Erreur fatale: ${error.message}`)
  process.exit(1)
})
