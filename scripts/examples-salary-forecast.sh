#!/bin/bash

# Exemples de requêtes pour tester le système de Prévision des Salaires
# Utilisation: bash scripts/examples-salary-forecast.sh

# Configuration
API_URL="${1:-http://localhost:3000}"
EMPLOYEE_ID="${2:-your-employee-id}"
CRON_SECRET="${3:-your-cron-secret}"

echo "🧪 Exemples d'utilisation - Système de Prévision des Salaires"
echo "============================================================"
echo ""
echo "Configuration:"
echo "  API_URL: $API_URL"
echo "  EMPLOYEE_ID: $EMPLOYEE_ID"
echo "  CRON_SECRET: $CRON_SECRET"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction pour afficher une requête
show_request() {
    local num=$1
    local title=$2
    local method=$3
    local endpoint=$4
    local body=$5
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Exemple $num: $title${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Requête:${NC}"
    echo "$method $endpoint"
    
    if [ -n "$body" ]; then
        echo "Body:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    
    echo ""
    echo -e "${YELLOW}Commande curl:${NC}"
    if [ "$method" = "GET" ]; then
        echo "curl -X GET $API_URL$endpoint \\"
        echo "  -H 'Authorization: Bearer $CRON_SECRET' \\"
        echo "  -H 'Content-Type: application/json'"
    else
        echo "curl -X $method $API_URL$endpoint \\"
        echo "  -H 'Authorization: Bearer $CRON_SECRET' \\"
        echo "  -H 'Content-Type: application/json' \\"
        echo "  -d '$body'"
    fi
    
    echo ""
    echo -e "${YELLOW}Réponse attendue:${NC}"
    echo ""
}

# Exemple 1: Récupérer les employés
show_request "1" "Récupérer la liste des employés" \
    "GET" \
    "/api/employees?includeHourlyRate=true" \
    ""

cat <<'EOF'
{
  "success": true,
  "data": [
    {
      "id": "emp_123",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean@example.com",
      "role": "EMPLOYE",
      "tarifHoraire": 25.50
    },
    {
      "id": "emp_124",
      "nom": "Martin",
      "prenom": "Sophie",
      "email": "sophie@example.com",
      "role": "EMPLOYE",
      "tarifHoraire": 30.00
    }
  ],
  "count": 2
}
EOF

echo ""
echo ""

# Exemple 2: Mettre à jour le tarif horaire
show_request "2" "Mettre à jour le tarif horaire d'un employé" \
    "POST" \
    "/api/employees/update-tariff" \
    '{"employeeId": "emp_123", "tarifHoraire": 28.75}'

cat <<'EOF'
{
  "success": true,
  "data": {
    "id": "emp_123",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@example.com",
    "tarifHoraire": 28.75
  },
  "message": "Tarif horaire mis à jour avec succès"
}
EOF

echo ""
echo ""

# Exemple 3: Recalculer une prévision
show_request "3" "Recalculer une prévision salariale" \
    "POST" \
    "/api/salary-forecasts" \
    '{"employeeId": "emp_123", "date": "2025-01-15"}'

cat <<'EOF'
{
  "success": true,
  "data": {
    "employeId": "emp_123",
    "mois": 1,
    "annee": 2025,
    "montantPrevu": 2050.00,
    "heuresValidees": 80
  },
  "message": "Prévision salariale recalculée"
}
EOF

echo ""
echo ""

# Exemple 4: Récupérer les prévisions
show_request "4" "Récupérer les prévisions d'un employé" \
    "GET" \
    "/api/salary-forecasts?employeeId=emp_123&month=1&year=2025" \
    ""

cat <<'EOF'
{
  "success": true,
  "data": [
    {
      "id": "prev_1",
      "employeId": "emp_123",
      "mois": 1,
      "annee": 2025,
      "montantPrevu": 2050.00,
      "dateNotification": "2025-01-27T09:00:00Z",
      "employe": {
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean@example.com",
        "tarifHoraire": 25.50
      }
    }
  ],
  "count": 1
}
EOF

echo ""
echo ""

# Exemple 5: Récupérer les statistiques
show_request "5" "Récupérer les statistiques salariales" \
    "GET" \
    "/api/salary-forecasts/statistics/emp_123?months=12" \
    ""

cat <<'EOF'
{
  "success": true,
  "data": {
    "total": 24500.00,
    "moyenne": 2041.67,
    "nombreMois": 12,
    "previsions": [
      {
        "id": "prev_1",
        "mois": 1,
        "annee": 2025,
        "montantPrevu": 2050.00,
        "dateNotification": "2025-01-27T09:00:00Z"
      },
      {
        "id": "prev_2",
        "mois": 2,
        "annee": 2025,
        "montantPrevu": 1975.00,
        "dateNotification": "2025-02-24T09:00:00Z"
      }
    ]
  }
}
EOF

echo ""
echo ""

# Exemple 6: Envoyer les notifications
show_request "6" "Déclencher l'envoi des notifications" \
    "POST" \
    "/api/salary-forecasts/send-notifications" \
    ""

cat <<'EOF'
{
  "success": true,
  "data": {
    "sent": 5,
    "failed": 0
  },
  "message": "5 notifications envoyées, 0 erreurs"
}
EOF

echo ""
echo ""

# Exemple 7: Cron job
show_request "7" "Exécuter le cron job" \
    "GET" \
    "/api/cron/salary-notifications" \
    ""

cat <<'EOF'
{
  "success": true,
  "timestamp": "2025-01-27T09:00:00Z",
  "result": {
    "sent": 5,
    "failed": 0
  },
  "message": "5 notifications envoyées, 0 erreurs"
}
EOF

echo ""
echo ""

# Notes
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📌 Notes importants:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Remplacer les IDs d'exemple par des vrais IDs"
echo "2. Utiliser le CRON_SECRET correct pour sécuriser les requêtes"
echo "3. Les timestamps doivent être au format ISO 8601"
echo "4. Pour les requêtes authentifiées, ajouter le header:"
echo "   Authorization: Bearer \$CRON_SECRET"
echo ""

# Exemples de tests
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}✨ Exemples de commandes complètes:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "# 1. Récupérer les employés (DEV)"
echo "curl $API_URL/api/employees?includeHourlyRate=true"
echo ""

echo "# 2. Mettre à jour un tarif (DEV)"
echo "curl -X POST $API_URL/api/employees/update-tariff \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"employeeId\": \"emp_123\", \"tarifHoraire\": 28}'"
echo ""

echo "# 3. Exécuter le cron job (PROD)"
echo "curl $API_URL/api/cron/salary-notifications \\"
echo "  -H 'x-vercel-cron-secret: your-cron-secret'"
echo ""

echo "# 4. Envoyer les notifications (PROD)"
echo "curl -X POST $API_URL/api/salary-forecasts/send-notifications \\"
echo "  -H 'Authorization: Bearer your-cron-secret'"
echo ""
