#!/usr/bin/env node

/**
 * Script de vérification de sécurité
 * À exécuter avant chaque déploiement
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: [],
  warnings: [],
};

console.log('🔒 Vérification de sécurité du projet...\n');

// ✅ Check 1: CORS Configuration
console.log('Check 1: Configuration CORS');
try {
  const projetsRoute = fs.readFileSync(
    path.join(__dirname, 'app/api/projets/route.ts'),
    'utf-8'
  );
  
  if (projetsRoute.includes("'Access-Control-Allow-Origin': '*'")) {
    checks.failed.push('❌ CORS wildcard détecté - risque de sécurité!');
  } else if (projetsRoute.includes('process.env.NODE_ENV') && projetsRoute.includes('FRONTEND_URL')) {
    checks.passed.push('✅ CORS configuré correctement');
  } else {
    checks.warnings.push('⚠️ CORS config à vérifier manuellement');
  }
} catch (e) {
  checks.warnings.push('⚠️ Impossible de vérifier CORS');
}

// ✅ Check 2: Logs sensibles
console.log('Check 2: Vérification des logs sensibles');
try {
  const tacesRoute = fs.readFileSync(
    path.join(__dirname, 'app/api/taches/route.ts'),
    'utf-8'
  );
  
  if (tacesRoute.includes("console.log('📋 [GET /api/taches] User role:")) {
    checks.failed.push('❌ Logs sensibles trouvées - exposent les IDs d\'utilisateur');
  } else if (tacesRoute.includes('process.env.NODE_ENV === \'development\'')) {
    checks.passed.push('✅ Logs sécurisés (dev-only)');
  } else {
    checks.warnings.push('⚠️ Logs à vérifier');
  }
} catch (e) {
  checks.warnings.push('⚠️ Impossible de vérifier les logs');
}

// ✅ Check 3: Security module exists
console.log('Check 3: Module de sécurité');
try {
  if (fs.existsSync(path.join(__dirname, 'lib/security.ts'))) {
    checks.passed.push('✅ Module de sécurité présent');
  } else {
    checks.failed.push('❌ Module /lib/security.ts manquant');
  }
} catch (e) {
  checks.warnings.push('⚠️ Impossible de vérifier le module');
}

// ✅ Check 4: Environment variables
console.log('Check 4: Variables d\'environnement');
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.production.example'), 'utf-8');
  
  if (envContent.includes('NEXTAUTH_SECRET')) {
    checks.passed.push('✅ .env.production.example configuré');
  } else {
    checks.failed.push('❌ .env.production.example manquant');
  }
} catch (e) {
  checks.warnings.push('⚠️ .env.production.example non trouvé');
}

// ✅ Check 5: NextAuth configuration
console.log('Check 5: Configuration NextAuth');
try {
  const authFile = fs.readFileSync(
    path.join(__dirname, 'lib/auth.ts'),
    'utf-8'
  );
  
  if (authFile.includes('NEXTAUTH_SECRET') && authFile.includes('bcryptjs')) {
    checks.passed.push('✅ NextAuth configuré avec sécurité');
  } else {
    checks.warnings.push('⚠️ Vérifier la config NextAuth');
  }
} catch (e) {
  checks.warnings.push('⚠️ Impossible de vérifier NextAuth');
}

// ✅ Check 6: Rate limiting
console.log('Check 6: Rate limiting');
try {
  const secFile = fs.readFileSync(
    path.join(__dirname, 'lib/security.ts'),
    'utf-8'
  );
  
  if (secFile.includes('checkRateLimit') && secFile.includes('RATE_LIMIT_CONFIG')) {
    checks.passed.push('✅ Rate limiting implémenté');
  } else {
    checks.failed.push('❌ Rate limiting manquant');
  }
} catch (e) {
  checks.failed.push('❌ Rate limiting non trouvé');
}

// ✅ Check 7: File upload validation
console.log('Check 7: Validation des fichiers');
try {
  const secFile = fs.readFileSync(
    path.join(__dirname, 'lib/security.ts'),
    'utf-8'
  );
  
  if (secFile.includes('FILE_CONFIG') && secFile.includes('MAX_FILE_SIZE')) {
    checks.passed.push('✅ Validation des fichiers en place');
  } else {
    checks.failed.push('❌ Validation fichiers incomplète');
  }
} catch (e) {
  checks.warnings.push('⚠️ Impossible de vérifier validation fichiers');
}

// ✅ Check 8: Authentication on file serving
console.log('Check 8: Authentification sur serveur de fichiers');
try {
  const fileRoute = fs.readFileSync(
    path.join(__dirname, 'app/api/uploads/[type]/[id]/[file]/route.ts'),
    'utf-8'
  );
  
  if (fileRoute.includes('getServerSession') && fileRoute.includes('if (!session?.user)')) {
    checks.passed.push('✅ Authentification sur fichiers OK');
  } else {
    checks.warnings.push('⚠️ Vérifier authentification fichiers');
  }
} catch (e) {
  checks.warnings.push('⚠️ Impossible de vérifier authentification fichiers');
}

// Afficher les résultats
console.log('\n' + '='.repeat(50));
console.log('RÉSULTATS DE LA VÉRIFICATION DE SÉCURITÉ');
console.log('='.repeat(50) + '\n');

if (checks.passed.length > 0) {
  console.log('✅ RÉUSSITES:');
  checks.passed.forEach(msg => console.log('  ' + msg));
  console.log();
}

if (checks.warnings.length > 0) {
  console.log('⚠️ AVERTISSEMENTS:');
  checks.warnings.forEach(msg => console.log('  ' + msg));
  console.log();
}

if (checks.failed.length > 0) {
  console.log('❌ ÉCHECS (CRITIQUE):');
  checks.failed.forEach(msg => console.log('  ' + msg));
  console.log();
}

// Résumé
const total = checks.passed.length + checks.failed.length + checks.warnings.length;
const score = Math.round((checks.passed.length / total) * 100) || 0;

console.log('='.repeat(50));
console.log(`SCORE DE SÉCURITÉ: ${score}%`);
console.log('='.repeat(50));

if (checks.failed.length > 0) {
  console.log('\n🚨 Corrections nécessaires avant déploiement!');
  process.exit(1);
} else if (checks.warnings.length > 0) {
  console.log('\n⚠️ Vérifications manuelles recommandées');
  process.exit(0);
} else {
  console.log('\n✅ Sécurité OK - Prêt pour déploiement');
  process.exit(0);
}
