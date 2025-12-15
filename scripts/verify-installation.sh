#!/bin/bash

# Vérification complète du système de Prévision des Salaires
# Usage: bash scripts/verify-installation.sh

echo "🔍 Vérification de l'installation du Système de Prévision des Salaires"
echo "======================================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compteurs
total=0
passed=0
failed=0

# Fonction pour vérifier un fichier
check_file() {
    local file=$1
    local description=$2
    total=$((total + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        echo -e "  📄 $file"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo -e "  📄 $file (MANQUANT)"
        failed=$((failed + 1))
    fi
    echo ""
}

# Fonction pour vérifier un répertoire
check_dir() {
    local dir=$1
    local description=$2
    total=$((total + 1))
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description"
        echo -e "  📁 $dir"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo -e "  📁 $dir (MANQUANT)"
        failed=$((failed + 1))
    fi
    echo ""
}

# Fonction pour vérifier un contenu dans un fichier
check_content() {
    local file=$1
    local content=$2
    local description=$3
    total=$((total + 1))
    
    if [ -f "$file" ] && grep -q "$content" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        echo -e "  Found in: $file"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo -e "  Not found in: $file"
        failed=$((failed + 1))
    fi
    echo ""
}

# === VÉRIFICATIONS ===

echo -e "${BLUE}📦 FICHIERS CRÉÉS${NC}"
echo ""

check_file "lib/services/salaryForecasting/salaryForecastService.ts" "Service de prévisions salariales"
check_file "app/api/salary-forecasts/route.ts" "API - CRUD Prévisions"
check_file "app/api/salary-forecasts/statistics/[employeeId]/route.ts" "API - Statistiques"
check_file "app/api/salary-forecasts/send-notifications/route.ts" "API - Envoyer notifications"
check_file "app/api/cron/salary-notifications/route.ts" "API - Cron job"
check_file "app/api/employees/route.ts" "API - Lister employés"
check_file "app/api/employees/update-tariff/route.ts" "API - Modifier tarif"
check_file "app/dashboard/salary-forecasts/page.tsx" "UI - Dashboard employé"
check_file "app/admin/salary-settings/page.tsx" "UI - Admin panel"

echo -e "${BLUE}📚 DOCUMENTATION${NC}"
echo ""

check_file "SALARY_FORECAST_SUMMARY.md" "Résumé des fonctionnalités"
check_file "DOCUMENTATION_SALARY_FORECAST.md" "Documentation technique"
check_file "INTEGRATION_GUIDE_SALARY_FORECAST.md" "Guide d'intégration"
check_file "IMPLEMENTATION_SALARY_FORECAST_COMPLETE.md" "Résumé complet"
check_file "CHANGELOG_SALARY_FORECAST.md" "Changelog"
check_file "INDEX_SALARY_FORECAST.md" "Index et navigation"
check_file "FINAL_SUMMARY_SALARY_FORECAST.md" "Résumé final"
check_file ".env.salary-forecast.example" "Variables d'environnement"

echo -e "${BLUE}🛠️  SCRIPTS${NC}"
echo ""

check_file "scripts/deploy-salary-forecast.sh" "Script de déploiement"
check_file "scripts/migrate-salary-forecast.sh" "Script de migration"
check_file "scripts/test-salary-forecast.sh" "Script de test"
check_file "scripts/examples-salary-forecast.sh" "Exemples cURL"

echo -e "${BLUE}📁 RÉPERTOIRES${NC}"
echo ""

check_dir "lib/services/salaryForecasting" "Répertoire service"
check_dir "app/api/salary-forecasts" "Répertoire API prévisions"
check_dir "app/api/cron" "Répertoire API cron"
check_dir "app/api/employees" "Répertoire API employés"
check_dir "app/dashboard/salary-forecasts" "Répertoire dashboard"
check_dir "app/admin/salary-settings" "Répertoire admin"

echo -e "${BLUE}⚙️  MODIFICATIONS DE FICHIERS${NC}"
echo ""

check_content "prisma/schema.prisma" "PrevisionSalaire" "Modèle PrevisionSalaire ajouté"
check_content "prisma/schema.prisma" "tarifHoraire" "Champ tarifHoraire ajouté"
check_content "lib/services/timesheets/timesheetService.ts" "salaryForecastService" "Service intégré dans TimesheetService"
check_content "vercel.json" "salary-notifications" "Cron job configuré dans vercel.json"

echo -e "${BLUE}🔐 CONFIGURATION${NC}"
echo ""

if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  CRON_SECRET${NC}"
    if grep -q "CRON_SECRET" .env 2>/dev/null || grep -q "CRON_SECRET" .env.local 2>/dev/null; then
        echo -e "${GREEN}✓${NC} CRON_SECRET configuré dans .env"
    else
        echo -e "${RED}✗${NC} CRON_SECRET non trouvé dans .env"
    fi
else
    echo -e "${RED}✗${NC} Fichier .env non trouvé"
fi
echo ""

# === RÉSULTATS ===

echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 RÉSULTATS${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo -e "Total vérifications: ${total}"
echo -e "${GREEN}Réussis: ${passed}${NC}"
echo -e "${RED}Échoués: ${failed}${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ INSTALLATION COMPLÈTE ET CORRECTE!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Vérifier que CRON_SECRET est dans .env"
    echo "2. Exécuter: npx prisma migrate dev"
    echo "3. Configurer les tarifs horaires: /admin/salary-settings"
    echo "4. Redémarrer l'application: npm run dev"
    echo ""
    echo "Documentation:"
    echo "- Résumé: SALARY_FORECAST_SUMMARY.md"
    echo "- Installation: INTEGRATION_GUIDE_SALARY_FORECAST.md"
    echo "- Technique: DOCUMENTATION_SALARY_FORECAST.md"
    echo ""
    exit 0
else
    echo -e "${RED}❌ INSTALLATION INCOMPLÈTE${NC}"
    echo ""
    echo "Fichiers manquants à créer:"
    echo "- Lancer: bash scripts/deploy-salary-forecast.sh"
    echo "- Ou consulter: INTEGRATION_GUIDE_SALARY_FORECAST.md"
    echo ""
    exit 1
fi
