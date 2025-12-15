#!/bin/bash

# Script de test du système de prévision des salaires
# Exécute des tests pour vérifier que tout fonctionne

echo "🧪 Tests du Système de Prévision des Salaires"
echo "=============================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-test-secret}"

test_count=0
passed=0
failed=0

# Fonction pour exécuter un test
run_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local body=$4
    local expected_status=$5
    
    test_count=$((test_count + 1))
    echo ""
    echo -e "${YELLOW}Test $test_count: $test_name${NC}"
    
    if [ -z "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $CRON_SECRET" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $CRON_SECRET" \
            -H "Content-Type: application/json" \
            -d "$body" \
            "$API_URL$endpoint")
    fi
    
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS (Status: $status)${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗ FAIL (Expected: $expected_status, Got: $status)${NC}"
        echo "Response: $body"
        failed=$((failed + 1))
    fi
}

echo ""
echo "🔧 Configuration:"
echo "  API_URL: $API_URL"
echo "  CRON_SECRET: $CRON_SECRET"

# Tests
echo ""
echo "📋 Exécution des tests..."

# Test 1: API Endpoints
run_test "Cron Job - Envoyer notifications" "GET" "/api/cron/salary-notifications" "" "200"

# Test 2: Récupérer les employés
run_test "Récupérer les employés" "GET" "/api/employees?includeHourlyRate=true" "" "200"

# Résultats
echo ""
echo "=============================================="
echo "📊 Résultats:"
echo "  Total: $test_count"
echo -e "  ${GREEN}Passés: $passed${NC}"
echo -e "  ${RED}Échoués: $failed${NC}"

if [ $failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Tous les tests sont passés!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Certains tests ont échoué${NC}"
    exit 1
fi
