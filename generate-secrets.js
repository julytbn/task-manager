#!/usr/bin/env node

/**
 * Script pour générer les secrets de sécurité pour le déploiement
 * Utilise la cryptographie Node.js intégrée (pas besoin d'OpenSSL)
 */

const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('\n🔐 === SECRETS DE DÉPLOIEMENT PRODUCTION ===\n');

const nexAuthSecret = generateSecret();
const cronSecret = generateSecret();

console.log('📌 NEXTAUTH_SECRET:');
console.log(nexAuthSecret);
console.log('\n📌 CRON_SECRET:');
console.log(cronSecret);

console.log('\n' + '='.repeat(60));
console.log('✅ Copiez ces secrets et sauvegardez-les dans un endroit sûr!');
console.log('='.repeat(60) + '\n');

console.log('📋 Variables à ajouter dans Vercel:\n');
console.log(`NEXTAUTH_SECRET=${nexAuthSecret}`);
console.log(`CRON_SECRET=${cronSecret}`);
console.log('\n');
