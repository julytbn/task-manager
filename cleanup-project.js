#!/usr/bin/env node

/**
 * Script de nettoyage du projet
 * Supprime les fichiers et dossiers inutilisés avant le déploiement
 */

const fs = require('fs');
const path = require('path');

// Fichiers/dossiers à SUPPRIMER
const itemsToDelete = [
  // Fichiers de test
  'check_db.js',
  'check_dossiers.js',
  'check_latest.js',
  'check-and-create-clients.js',
  'check-endpoints.js',
  'create_test_file.py',
  'create-test-file.js',
  'diagnostic-notifications-soumises.js',
  'diagnostic-notifications.js',
  'gmail-oauth2.js',
  'reset-db.js',
  'run-full-test.js',
  'run-test.js',
  'search_test.js',
  'security-check.js',
  'setup-prisma.js',
  'setup-test-data.js',
  'test-auto-invoices.sh',
  'test-charges-api.js',
  'test-charges-dual-sections.xlsx',
  'test-charges-import.xlsx',
  'test-create-timesheets-cron.ps1',
  'test-cron-reminder.js',
  'test-etape5.js',
  'test-extraction-direct.js',
  'test-invoice-endpoints.ps1',
  'test-notifications-audit.js',
  'test-notifications-full.js',
  'test-notifications.js',
  'test-parsing.js',
  'test-proforma-debug.js',
  'test-proforma-types.js',
  'test-progressive-reminders-cron.ps1',
  'test-projet-service.js',
  'test-subscription-invoices.js',
  'test-timesheet-cron.ps1',
  'test-timesheet-cron.sh',
  'test-upload-connection.js',
  'test-upload-extraction.js',
  'test_parsing.js',
  'TEST_NOTIFICATIONS.sh',
  'TEST_VIP_ACCOUNTING_SYSTEM.ps1',
  'TEST_VIP_ACCOUNTING_SYSTEM.sh',
  'test-results.txt',
  
  // Fichiers de log
  'build2.log',
  'build_final.log',
  'build_output.txt',
  
  // Documentation de développement (garder seulement les essentiels)
  'ALIGNEMENT_VIP_COMPTABILITE.md',
  'AUDIT_CLIENTS_VIP_COMPTABILITE.md',
  'AUDIT_COMPLET_NOTIFICATIONS.md',
  'BIENVENUE.txt',
  'CHECKLIST_DEBUG_NOTIFICATIONS.md',
  'CHECKLIST_FINAL.md',
  'CHECKLIST_PRODUCTION.md',
  'COMPLETION_TIMESHEET_REMINDER.md',
  'DEPLOYMENT_SUMMARY.md',
  'FIX_NOTIFICATIONS_DASHBOARD.md',
  'FRONTEND_DESIGN_IMPROVEMENTS.md',
  'GUIDE_DEMARRAGE_RAPIDE.md',
  'GUIDE_VERIFICATION_NOTIFICATIONS_RAPPELS.md',
  'INDEX_DOCUMENTATION.md',
  'INVENTAIRE_FICHIERS.md',
  'LIVRAISON_FINALE.md',
  'MANDATORY_TIMESHEET_IMPLEMENTATION_FINAL.md',
  'MANDATORY_TIMESHEET_SYSTEM.md',
  'NOTIFICATIONS_EMAILS_FIX.md',
  'NOTIFICATIONS_USAGE_GUIDE.md',
  'PHASE2_SERVICES_COMPLETED.md',
  'PHASE3_API_ROUTES_COMPLETED.md',
  'PHASE_4_FRONTEND_COMPLETE.md',
  'PROBLEME_NOTIFICATIONS_TACHES_SOUMISES.md',
  'PROJECT_STATUS_FINAL.md',
  'README_KEKELI_DASHBOARD.md',
  'README_PROJETS_STATS.md',
  'README_SALAIRES_IMPLEMENTATION.md',
  'README_SALARY_FORECAST.md',
  'README_SCENARIO_DOCUMENTATION.md',
  'RESUME_EXECUTIF.md',
  'SUMMARY_5_PERCENT_COMPLETE.txt',
  'SYSTEME_VIP_COMPTABILITE_RECAP.md',
  'TIMESHEET_REMINDER_DOCUMENTATION.md',
  'TIMESHEET_REMINDER_FINAL.md',
  '🎉_COMPLETION_SUCCESS.txt',
  'API_REFERENCE.md',
  
  // Scripts PowerShell de test
  'run-tests.ps1',
  'RUN_TESTS_MASTER.ps1',
  'start-all.ps1',
  'pre-deploy.sh',
  'complete-production.sh',
  
  // Dossiers inutilisés
  'DOCS_ARCHIVE',
  'dist',
  'temp-upload-test',
  'tests',
  'data',
  'storage',
];

console.log('\n🧹 === NETTOYAGE DU PROJET ===\n');

let deletedCount = 0;
let skippedCount = 0;

itemsToDelete.forEach((item) => {
  const fullPath = path.join(process.cwd(), item);
  
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        // Supprimer dossier
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Dossier supprimé: ${item}/`);
      } else {
        // Supprimer fichier
        fs.unlinkSync(fullPath);
        console.log(`✅ Fichier supprimé: ${item}`);
      }
      deletedCount++;
    } else {
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Erreur suppression ${item}:`, error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ ${deletedCount} éléments supprimés`);
console.log(`⏭️  ${skippedCount} éléments non trouvés (ignorés)`);
console.log('='.repeat(60) + '\n');

console.log('📋 Fichiers/dossiers conservés:');
console.log('  ✅ app/          - Code Next.js');
console.log('  ✅ components/   - Composants React');
console.log('  ✅ lib/          - Utilitaires');
console.log('  ✅ hooks/        - Custom React hooks');
console.log('  ✅ pages/        - Pages Next.js');
console.log('  ✅ public/       - Assets statiques');
console.log('  ✅ prisma/       - Configuration DB');
console.log('  ✅ scripts/      - Scripts de production');
console.log('  ✅ styles/       - CSS/SCSS');
console.log('  ✅ types/        - Types TypeScript');
console.log('  ✅ README.md     - Documentation principale');
console.log('  ✅ package.json  - Dépendances');
console.log('  ✅ next.config.js - Configuration Next.js\n');

console.log('🚀 Prêt pour le commit!\n');
