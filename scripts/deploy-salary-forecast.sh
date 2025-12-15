#!/bin/bash

# Script de déploiement du système de Prévision des Salaires
# Usage: bash scripts/deploy-salary-forecast.sh

set -e

echo "🚀 Déploiement du Système de Prévision des Salaires"
echo "==================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Étape 1: Vérifications
echo -e "${BLUE}📋 Étape 1: Vérifications${NC}"
echo "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installé${NC}"

echo "Vérification de Prisma..."
if ! npx prisma version &> /dev/null; then
    echo -e "${RED}❌ Prisma n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma installé${NC}"
echo ""

# Étape 2: Générer la clé secrète
echo -e "${BLUE}🔑 Étape 2: Générer la clé secrète CRON${NC}"
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Clé générée: ${CRON_SECRET:0:20}..."
echo ""

# Étape 3: Migration
echo -e "${BLUE}🗄️  Étape 3: Migration de la base de données${NC}"
echo "Exécution: npx prisma migrate dev --name add_salary_forecast_system"
npx prisma migrate dev --name add_salary_forecast_system

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration échouée${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migration réussie${NC}"
echo ""

# Étape 4: Configuration
echo -e "${BLUE}⚙️  Étape 4: Configuration${NC}"
echo ""
echo "Voici les variables d'environnement à ajouter à .env:"
echo ""
echo -e "${YELLOW}CRON_SECRET=$CRON_SECRET${NC}"
echo ""
echo "Ajouter aussi (optionnel pour tests, obligatoire pour production):"
echo -e "${YELLOW}SMTP_HOST=smtp.gmail.com"
echo "SMTP_PORT=587"
echo "SMTP_SECURE=false"
echo "SMTP_USER=your-email@gmail.com"
echo "SMTP_PASS=your-app-password"
echo "SMTP_FROM=noreply@kekeligroup.com${NC}"
echo ""

# Étape 5: Vérification des fichiers
echo -e "${BLUE}📁 Étape 5: Vérification des fichiers créés${NC}"

files_to_check=(
    "lib/services/salaryForecasting/salaryForecastService.ts"
    "app/api/salary-forecasts/route.ts"
    "app/api/cron/salary-notifications/route.ts"
    "app/dashboard/salary-forecasts/page.tsx"
    "app/admin/salary-settings/page.tsx"
    "DOCUMENTATION_SALARY_FORECAST.md"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file${NC}"
    fi
done
echo ""

# Étape 6: Résumé
echo -e "${BLUE}📊 Étape 6: Résumé des prochaines étapes${NC}"
echo ""
echo "1. Ajouter les variables d'environnement au .env:"
echo "   CRON_SECRET=$CRON_SECRET"
echo ""
echo "2. Si vous utilisez Vercel: crons est déjà configuré dans vercel.json"
echo "   (cron job à 9h chaque jour)"
echo ""
echo "3. Sinon, configurer un service de cron externe:"
echo "   URL: https://your-domain.com/api/cron/salary-notifications"
echo "   Fréquence: Quotidien à 9h"
echo "   Header: Authorization: Bearer $CRON_SECRET"
echo ""
echo "4. Configurer les tarifs horaires:"
echo "   Accéder à /admin/salary-settings en tant qu'Admin"
echo ""
echo "5. Tester le workflow:"
echo "   - Créer un timesheet"
echo "   - Manager le valide"
echo "   - Vérifier que la prévision s'affiche"
echo ""
echo "6. Consulter la documentation:"
echo "   - DOCUMENTATION_SALARY_FORECAST.md"
echo "   - INTEGRATION_GUIDE_SALARY_FORECAST.md"
echo "   - SALARY_FORECAST_SUMMARY.md"
echo ""

echo -e "${GREEN}✅ Déploiement préparé avec succès!${NC}"
echo ""
echo "Pour démarrer l'application:"
echo "  npm run dev"
echo ""
echo "Pour exécuter les tests:"
echo "  bash scripts/test-salary-forecast.sh"
