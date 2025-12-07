#!/bin/bash

# =============================================================================
# SCRIPT DE TEST - GÉNÉRATION AUTOMATIQUE DE FACTURES
# =============================================================================
# Utilisation:
#   chmod +x test-auto-invoices.sh
#   ./test-auto-invoices.sh
#
# Cet script teste tous les aspects du système de génération automatique
# =============================================================================

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-development-secret}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
  fi
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Header
echo "═══════════════════════════════════════════════════════════════"
echo "🧪 TEST - GÉNÉRATION AUTOMATIQUE DE FACTURES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 1: Vérifier la connexion à l'API
print_info "Test 1: Vérifier la connexion à l'API"
response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/factures")
if [ "$response" = "200" ]; then
  print_result 0 "API accessible (HTTP $response)"
else
  print_result 1 "API non accessible (HTTP $response)"
  exit 1
fi
echo ""

# Test 2: Tester le cron job via GET
print_info "Test 2: Tester le cron job (requête GET)"
response=$(curl -s "${API_URL}/api/cron/generate-invoices?secret=${CRON_SECRET}")
echo "Réponse:"
echo "$response" | jq . 2>/dev/null || echo "$response"
print_result 0 "Cron job exécuté"
echo ""

# Test 3: Tester le cron job via POST
print_info "Test 3: Tester le cron job (requête POST)"
response=$(curl -s -X POST "${API_URL}/api/cron/generate-invoices" \
  -H "X-CRON-SECRET: ${CRON_SECRET}" \
  -H "Content-Type: application/json")
echo "Réponse:"
echo "$response" | jq . 2>/dev/null || echo "$response"
print_result 0 "Cron job POST exécuté"
echo ""

# Test 4: Récupérer les abonnements
print_info "Test 4: Récupérer les abonnements"
abonnements=$(curl -s "${API_URL}/api/abonnements")
count=$(echo "$abonnements" | jq 'length' 2>/dev/null || echo 0)
print_result 0 "Abonnements récupérés: $count"
echo ""

# Test 5: Récupérer les factures
print_info "Test 5: Récupérer les factures"
factures=$(curl -s "${API_URL}/api/factures")
count=$(echo "$factures" | jq 'length' 2>/dev/null || echo 0)
print_result 0 "Factures récupérées: $count"
echo ""

# Footer
echo "═══════════════════════════════════════════════════════════════"
echo "✨ Tests terminés!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "💡 Prochaines étapes:"
echo "   1. Créer un abonnement de test"
echo "   2. Vérifier que la facture initiale est générée"
echo "   3. Configurer le cron job (Vercel, Linux, Docker)"
echo ""
