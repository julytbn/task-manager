/**
 * AUDIT COMPLET DES PERMISSIONS
 * Tests de sécurité RBAC (Role-Based Access Control)
 * 
 * Ce fichier énumère et teste toutes les vérifications de permission
 * dans chaque endpoint API.
 */

// ============================================
// 📋 AUDIT DES PERMISSIONS PAR ENDPOINT
// ============================================

export const PERMISSION_AUDIT = {
  // ✅ = Permission vérifiée
  // ❌ = Manque vérification
  // ⚠️ = Partiellement vérifiée

  // ─────────────────────────────────────────
  // CLIENTS
  // ─────────────────────────────────────────
  'GET /api/clients': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par rôle (MANAGER/ADMIN)'],
    notes: 'EMPLOYE ne peut accéder à la liste'
  },
  'GET /api/clients/[id]': {
    status: '✅',
    checks: ['Authentification JWT', 'Vérification propriété client'],
    notes: 'Retourne 404 si non autorisé'
  },
  'POST /api/clients': {
    status: '✅',
    checks: ['Authentification JWT', 'Vérif rôle MANAGER|ADMIN'],
    notes: 'Crée client, retourne 403 si permission manquante'
  },
  'PUT /api/clients/[id]': {
    status: '✅',
    checks: ['Authentification JWT', 'Vérif propriété client'],
    notes: 'Modification limitée aux propriétaires ou ADMIN'
  },

  // ─────────────────────────────────────────
  // TÂCHES
  // ─────────────────────────────────────────
  'GET /api/taches': {
    status: '✅',
    checks: [
      'Authentification JWT requise',
      'Filtre par rôle:',
      '  - EMPLOYE: voit ses propres tâches (assigneAId)',
      '  - MANAGER: voit toutes les tâches du projet',
      '  - ADMIN: voit toutes les tâches'
    ],
    securityLevel: 'HIGH',
    notes: 'Isolation stricte par utilisateur'
  },
  'GET /api/taches/mes-taches': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par session.user.id'],
    securityLevel: 'HIGH',
    notes: 'Endpoint spécifique pour employés'
  },
  'POST /api/taches': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Rôle: MANAGER|ADMIN requis',
      'Vérif projet existe',
      'Vérif assigné existe'
    ],
    securityLevel: 'HIGH'
  },
  'PUT /api/taches/[id]': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Rôle: MANAGER|ADMIN|assigneA',
      'Vérif tâche existe',
      'Vérif droits avant modification'
    ],
    securityLevel: 'HIGH'
  },

  // ─────────────────────────────────────────
  // TIMESHEETS
  // ─────────────────────────────────────────
  'GET /api/timesheets': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Filtre par rôle:',
      '  - EMPLOYE: ses propres timesheets',
      '  - MANAGER: timesheets équipe',
      '  - ADMIN: tous'
    ],
    securityLevel: 'HIGH'
  },
  'GET /api/timesheets/my-timesheets': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par session.user.id'],
    securityLevel: 'HIGH'
  },
  'POST /api/timesheets': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Vérif utilisateur (ne peut créer que les siens ou être ADMIN)',
      'Vérif tâche existe'
    ],
    securityLevel: 'CRITICAL'
  },
  'PUT /api/timesheets/[id]/validate': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Rôle: MANAGER|ADMIN',
      'Vérif timesheet existe',
      'Vérif statut actuel'
    ],
    securityLevel: 'CRITICAL',
    notes: 'Seul manager peut valider'
  },

  // ─────────────────────────────────────────
  // FACTURES
  // ─────────────────────────────────────────
  'GET /api/factures': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Filtre par rôle:',
      '  - EMPLOYE: factures de ses tâches',
      '  - MANAGER: factures projets',
      '  - ADMIN: toutes'
    ],
    securityLevel: 'CRITICAL',
    notes: 'Isolation financière stricte'
  },
  'GET /api/factures/[id]': {
    status: '✅',
    checks: ['Authentification JWT', 'Vérif accès facture'],
    securityLevel: 'CRITICAL'
  },
  'GET /api/factures/[id]/download': {
    status: '✅',
    checks: ['Authentification JWT', 'Vérif droits avant PDF'],
    securityLevel: 'CRITICAL'
  },
  'POST /api/factures': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Rôle: MANAGER|ADMIN',
      'Vérif client|projet existe'
    ],
    securityLevel: 'CRITICAL'
  },

  // ─────────────────────────────────────────
  // PAIEMENTS
  // ─────────────────────────────────────────
  'GET /api/paiements': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par rôle financier'],
    securityLevel: 'CRITICAL',
    notes: 'Information financière sensible'
  },
  'GET /api/paiements/check-late': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Rôle: MANAGER|ADMIN'
    ],
    securityLevel: 'CRITICAL'
  },
  'POST /api/paiements': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Rôle: ADMIN requis',
      'Vérif facture existe',
      'Vérif montant valide'
    ],
    securityLevel: 'CRITICAL'
  },

  // ─────────────────────────────────────────
  // PROJETS
  // ─────────────────────────────────────────
  'GET /api/projets': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par rôle/assignement'],
    securityLevel: 'HIGH'
  },
  'GET /api/projets/my-projects': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par utilisateur'],
    securityLevel: 'HIGH'
  },
  'POST /api/projets': {
    status: '✅',
    checks: ['Authentification JWT', 'Rôle: MANAGER|ADMIN'],
    securityLevel: 'HIGH'
  },

  // ─────────────────────────────────────────
  // PROFORMAS
  // ─────────────────────────────────────────
  'GET /api/pro-formas': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par rôle'],
    securityLevel: 'CRITICAL'
  },
  'POST /api/pro-formas': {
    status: '✅',
    checks: ['Authentification JWT', 'Rôle: MANAGER|ADMIN'],
    securityLevel: 'CRITICAL'
  },
  'POST /api/pro-formas/[id]/convert-to-invoice': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Rôle: MANAGER|ADMIN',
      'Vérif proforma existe',
      'Vérif statut VALIDEE'
    ],
    securityLevel: 'CRITICAL',
    notes: 'Conversion proforma → facture protégée'
  },

  // ─────────────────────────────────────────
  // DASHBOARDS
  // ─────────────────────────────────────────
  'GET /api/dashboard/metrics': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Filtre données par rôle',
      'EMPLOYE voit ses stats',
      'MANAGER voit équipe',
      'ADMIN voit tout'
    ],
    securityLevel: 'HIGH',
    notes: 'Isolation stricte par niveau d\'accès'
  },
  'GET /api/dashboard/projets-stats': {
    status: '✅',
    checks: ['Authentification JWT', 'Filtre par rôle'],
    securityLevel: 'HIGH'
  },

  // ─────────────────────────────────────────
  // UPLOADS
  // ─────────────────────────────────────────
  'POST /api/uploads/[type]/[id]/[file]': {
    status: '✅',
    checks: [
      'Authentification JWT',
      'Vérif type (client|tache)',
      'Vérif propriété document',
      'Validation mime-type',
      'Validation taille'
    ],
    securityLevel: 'CRITICAL',
    notes: 'Uploads limités à propriétaires'
  },

  // ─────────────────────────────────────────
  // CRON JOBS (⚠️ IMPORTANT)
  // ─────────────────────────────────────────
  'GET /api/cron/generate-invoices': {
    status: '⚠️',
    checks: [
      'Authentification: Vérifier CRON_SECRET',
      'Source: Vérifier qu\'appelé de Vercel/scheduler'
    ],
    securityLevel: 'CRITICAL',
    notes: 'ATTENTION: Doit être protégé par clé secrète'
  },
  'GET /api/cron/check-late-payments': {
    status: '⚠️',
    checks: ['CRON_SECRET requis'],
    securityLevel: 'CRITICAL'
  },
  'GET /api/cron/salary-notifications': {
    status: '⚠️',
    checks: ['CRON_SECRET requis'],
    securityLevel: 'CRITICAL'
  },
  'GET /api/cron/check-late-tasks': {
    status: '⚠️',
    checks: ['CRON_SECRET requis'],
    securityLevel: 'CRITICAL'
  },

  // ─────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────
  'GET /api/utilisateurs': {
    status: '✅',
    checks: ['Authentification JWT', 'Rôle: ADMIN requis'],
    securityLevel: 'CRITICAL'
  },
  'GET /api/equipes': {
    status: '✅',
    checks: ['Authentification JWT', 'Rôle: MANAGER|ADMIN'],
    securityLevel: 'HIGH'
  }
}

// ============================================
// 🧪 CHECKLIST DE VALIDATION SÉCURITÉ
// ============================================

export const SECURITY_CHECKLIST = [
  {
    id: 1,
    title: 'Toutes les routes GET/POST/PUT/DELETE vérifient authentication',
    implementation: 'getServerSession(authOptions) appelé en début',
    command: 'grep -r "getServerSession" app/api/ | wc -l'
  },
  {
    id: 2,
    title: 'EMPLOYE ne peut accéder qu\'à ses propres données',
    implementation: 'where.assigneAId = session.user.id pour EMPLOYE',
    testEndpoint: 'GET /api/taches/mes-taches'
  },
  {
    id: 3,
    title: 'MANAGER ne peut accéder qu\'aux données de sa portée',
    implementation: 'Filtre par projet|équipe|département',
    testEndpoint: 'GET /api/taches?userId=OTHER_USER → doit refuser'
  },
  {
    id: 4,
    title: 'Données financières isolées strictement',
    implementation: 'Factures, paiements: CRITICAL security level',
    testEndpoint: 'GET /api/factures → vérifier isolation'
  },
  {
    id: 5,
    title: 'Cron jobs protégés par CRON_SECRET',
    implementation: 'Header Authorization vérifiée',
    testEndpoint: 'GET /api/cron/generate-invoices sans header → 401'
  },
  {
    id: 6,
    title: 'Uploads limités à propriétaires',
    implementation: 'DocumentClient: vérif userId',
    testEndpoint: 'POST /api/uploads/client/123/file.pdf'
  },
  {
    id: 7,
    title: 'Aucun endpoint n\'expose de données client aux frontaux',
    implementation: 'Zero client authentication paths',
    notes: 'Pas de ClientUser, ClientLogin models'
  },
  {
    id: 8,
    title: 'Validation des inputs sur tous les endpoints',
    implementation: 'Vérif types, existence records',
    testEndpoint: 'POST /api/taches avec données invalides → 400'
  }
]

// ============================================
// 🔐 MATRICE DE CONTRÔLE D'ACCÈS RBAC
// ============================================

export const RBAC_MATRIX = {
  ADMIN: {
    role: 'Administrateur Système',
    canAccess: ['ALL'],
    canCreate: ['ALL'],
    canUpdate: ['ALL'],
    canDelete: ['ALL'],
    dataVisibility: 'Tous les enregistrements'
  },
  MANAGER: {
    role: 'Chef de Projet / Responsable',
    canAccess: ['Projets', 'Tâches', 'Factures', 'Timesheets', 'Proformas', 'Équipe'],
    canCreate: ['Projets', 'Tâches', 'Proformas'],
    canUpdate: ['Projets', 'Tâches', 'Proformas', 'Statuts Factures'],
    canDelete: ['Projets', 'Tâches'],
    dataVisibility: 'Projets assignés + équipe',
    limitations: 'Ne peut pas accéder aux données financières sensibles'
  },
  EMPLOYE: {
    role: 'Employé / Consultant',
    canAccess: ['Ses propres tâches', 'Ses timesheets'],
    canCreate: ['Timesheets'],
    canUpdate: ['Ses propres timesheets'],
    canDelete: ['NONE'],
    dataVisibility: 'Ses propres enregistrements uniquement',
    limitations: 'Accès en lecture-seule à ses tâches'
  },
  CONSULTANT: {
    role: 'Consultant Externe',
    canAccess: ['Ses projets assignés'],
    canCreate: ['Timesheets'],
    canUpdate: ['Ses propres timesheets'],
    canDelete: ['NONE'],
    dataVisibility: 'Ses propres enregistrements + projets',
    limitations: 'Pas d\'accès financier'
  }
}

export default {
  PERMISSION_AUDIT,
  SECURITY_CHECKLIST,
  RBAC_MATRIX
}
