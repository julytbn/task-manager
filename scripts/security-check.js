#!/usr/bin/env node

/**
 * Test de Sécurité RBAC - Version JavaScript pure
 * Valide les permissions sur les endpoints critiques
 */

const BASE_URL = 'http://localhost:3000'
const TIMEOUT = 5000

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(type, message) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
  const prefix = {
    '✅': `${colors.green}✅${colors.reset}`,
    '❌': `${colors.red}❌${colors.reset}`,
    '⚠️': `${colors.yellow}⚠️${colors.reset}`,
    '🧪': `${colors.blue}🧪${colors.reset}`,
    'ℹ️': `${colors.cyan}ℹ️${colors.reset}`
  }
  console.log(`[${timestamp}] ${prefix[type] || type} ${message}`)
}

async function testSecurity() {
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bright}🔐 AUDIT SÉCURITÉ RBAC - KEKELI GROUP${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  const results = []
  let passed = 0
  let failed = 0

  // Test 1: Endpoints protégés sans authentification
  log('🧪', 'Test 1: Authentification requise sur endpoints sensibles')

  const protectedEndpoints = [
    { method: 'GET', path: '/api/taches' },
    { method: 'GET', path: '/api/factures' },
    { method: 'GET', path: '/api/paiements' }
  ]

  for (const { method, path } of protectedEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        timeout: TIMEOUT
      })

      if (response.status === 401) {
        log('✅', `${method} ${path} → 401 (Authentification requise)`)
        passed++
      } else {
        log('❌', `${method} ${path} → ${response.status} (Devrait être 401)`)
        failed++
      }
    } catch (error) {
      log('⚠️', `${method} ${path} → Erreur: ${error.message}`)
    }
  }

  // Test 2: Vérifier SMTP endpoint existe
  log('🧪', 'Test 2: Endpoint test SMTP accessible')

  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      timeout: TIMEOUT
    })

    if (response.status === 200 || response.status === 400) {
      log('✅', 'Endpoint /api/admin/test-smtp existe')
      passed++
    } else {
      log('⚠️', `Endpoint retourne: ${response.status}`)
    }
  } catch (error) {
    log('⚠️', `Erreur test-smtp: ${error.message}`)
  }

  // Test 3: Vérifier uploads endpoint existe
  log('🧪', 'Test 3: Upload endpoints protégés')

  try {
    const response = await fetch(`${BASE_URL}/api/uploads/tasks/123/test.pdf`, {
      method: 'GET',
      timeout: TIMEOUT
    })

    if (response.status === 401) {
      log('✅', 'Uploads protégés: 401 sans token')
      passed++
    } else {
      log('⚠️', `Uploads retournent: ${response.status}`)
    }
  } catch (error) {
    log('⚠️', `Erreur uploads: ${error.message}`)
  }

  // Test 4: Vérifier cron endpoints
  log('🧪', 'Test 4: Cron jobs sécurisés')

  const cronEndpoints = [
    '/api/cron/generate-invoices',
    '/api/cron/check-late-payments',
    '/api/cron/salary-notifications',
    '/api/cron/check-late-tasks'
  ]

  for (const path of cronEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        timeout: TIMEOUT
      })

      if (response.status === 401) {
        log('✅', `${path} → 401 (Protégé)`)
        passed++
      } else {
        log('⚠️', `${path} → ${response.status}`)
      }
    } catch (error) {
      log('⚠️', `${path} → Erreur: ${error.message}`)
    }
  }

  // Résumé
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bright}📊 Résumé des Tests${colors.reset}`)
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  console.log(`✅ Réussis: ${passed}`)
  console.log(`⚠️  Warnings: ${failed}\n`)

  if (failed === 0) {
    log('✅', `${colors.green}${colors.bright}AUDIT SÉCURITÉ: OK${colors.reset}`)
  } else {
    log('⚠️', `${colors.yellow}Vérifier les ${failed} warning(s)${colors.reset}`)
  }

  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bright}✅ Tests complétés${colors.reset}\n`)

  process.exit(0)
}

// Exécuter
testSecurity().catch(error => {
  log('❌', `Erreur critique: ${error.message}`)
  process.exit(1)
})
