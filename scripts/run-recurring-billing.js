'use strict';

/**
 * SCRIPT DE FACTURATION RÉCURRENTE
 * 
 * Ce script automatise la génération des factures récurrentes pour les abonnements actifs
 * et envoie des rappels pour les factures en retard.
 * 
 * POUR EXÉCUTER :
 * 
 * 1. En développement :
 *    node scripts/run-recurring-billing.js
 * 
 * 2. Pour Windows :
 *    set NODE_ENV=development && node scripts/run-recurring-billing.js
 */

const path = require('path');
const { recurringBillingService } = require('../lib/services/billing/recurringBillingService');
const { prisma } = require('../lib/prisma');

// Configuration des chemins
const currentDir = process.cwd();

/**
 * Fonction utilitaire pour formater la durée en secondes
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

// Configuration du logger
const log = (message) => {
  if (typeof message === 'object') {
    console.log(`[${new Date().toISOString()}]`, message);
  } else {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
};

/**
 * Fonction pour journaliser les résultats
 * @param {Array} results - Tableau de résultats
 * @param {string} type - Type de résultats à logger
 */
function logResults(results, type) {
  if (!results || !Array.isArray(results)) {
    log(`Aucun résultat pour: ${type}`);
    return;
  }
  
  log(`${type} (${results.length}) :`);
  
  results.forEach((result, index) => {
    if (!result) return;
    
    const status = result.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
    const message = result.message || (type.includes('Factures') ? 'Opération effectuée' : 'Rappel envoyé');
    const subscriptionId = result.subscriptionId || 'N/A';
    const invoiceId = result.invoiceId || 'N/A';
    
    log(`   ${index + 1}. [${status}] ${message}`);
    log(`      Abonnement: ${subscriptionId}, Facture: ${invoiceId}`);
    
    if (result.error) {
      log(`      Erreur: ${result.error}`);
    }
  });
}

/**
 * Journalise un message avec un horodatage
 * @param {string} message - Message à journaliser
 */
function log(message) {
  const timestamp = new Date().toISOString();
  // Format de sortie compatible avec GitHub Actions
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Fonction principale du script
 */
async function main() {
  const startTime = new Date();
  
  log('=== DÉBUT DU PROCESSUS DE FACTURATION RÉCURRENTE ===');
  log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
  log(`Heure de début: ${startTime.toISOString()}`);

  try {
    // 1. Générer les factures récurrentes pour les abonnements échus
    log('1/2 - Génération des factures récurrentes...');
    const billingResults = await recurringBillingService.generateRecurringInvoices();
    log(`→ ${billingResults?.length || 0} factures traitées`);

    // 2. Vérifier les factures en retard et envoyer des rappels
    log('2/2 - Vérification des factures en retard...');
    const overdueResults = await recurringBillingService.checkOverdueInvoices();
    log(`→ ${overdueResults?.length || 0} rappels traités`);

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    // Enregistrer un résumé dans les logs
    log('=== RÉSUMÉ ===');
    log(`- Factures générées : ${billingResults?.length || 0}`);
    log(`- Rappels envoyés   : ${overdueResults?.length || 0}`);
    log(`- Durée d'exécution : ${formatDuration(duration)}`);
    
    // Journaliser un résumé détaillé des opérations
    logResults(billingResults || [], 'Factures générées');
    logResults(overdueResults || [], 'Rappels envoyés');

    log('=== PROCESSUS TERMINÉ AVEC SUCCÈS ===');
    process.exit(0);
  } catch (error) {
    const errorTime = new Date();
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    // Journaliser l'erreur de manière détaillée
    log('=== ERREUR LORS DE L\'EXÉCUTION ===');
    log(`Heure de l'erreur: ${errorTime.toISOString()}`);
    log(`Message: ${errorMessage}`);
    
    if (stackTrace) {
      log('Stack Trace:');
      console.error(stackTrace);
    }
    
    // Afficher les détails supplémentaires de l'erreur si disponibles
    if (error && typeof error === 'object') {
      const errorDetails = {};
      
      // Extraire les propriétés pertinentes de l'erreur
      ['code', 'name', 'details', 'meta'].forEach(prop => {
        if (error[prop] !== undefined) {
          errorDetails[prop] = error[prop];
        }
      });
      
      const detailKeys = Object.keys(errorDetails);
      if (detailKeys.length > 0) {
        log('Détails supplémentaires:');
        console.dir(errorDetails, { depth: 2, colors: true });
      }
    }
    
    log('=== PROCESSUS TERMINÉ AVEC ERREUR ===');
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error('Erreur lors de la fermeture de la connexion Prisma:', e);
    }
  }
}

// Gestion des erreurs globales non attrapées
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}\n${error.stack}`);
  process.exit(1);
});

// Exécuter le script uniquement si c'est le module principal
if (require.main === module) {
  main().catch(error => {
    log(`Erreur dans le script principal: ${error.message}\n${error.stack}`);
    process.exit(1);
  });
}

// Exporter pour les tests
module.exports = {
  main,
  logResults,
  formatDuration,
  log
};
