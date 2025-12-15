#!/bin/bash

echo "🔄 Migration Prévisions Salariales - Étape 1"
echo "==========================================="

# Créer la migration
echo ""
echo "📝 Création de la migration..."
npx prisma migrate dev --name add_salary_forecast_system

if [ $? -eq 0 ]; then
    echo "✅ Migration créée avec succès"
    echo ""
    echo "🎉 Prochaines étapes:"
    echo "1. Configurer CRON_SECRET dans .env"
    echo "2. Ajouter les endpoints dans les pages appropriées"
    echo "3. Configurer Vercel Cron (si sur Vercel)"
    echo "4. Redémarrer l'application"
else
    echo "❌ Erreur lors de la migration"
    exit 1
fi
