#!/bin/bash

# Diagnostic script pour vérifier les notifications et emails
# Usage: bash scripts/diagnose-notifications.sh

echo "🔍 === DIAGNOSTIC NOTIFICATIONS & EMAILS ==="
echo ""

# Check environment variables
echo "1️⃣  Vérification des variables d'environnement SMTP..."
if [ -z "$SMTP_HOST" ]; then
  echo "❌ SMTP_HOST non défini → Utilisation d'Ethereal (dev)"
else
  echo "✅ SMTP_HOST: $SMTP_HOST"
  echo "✅ SMTP_PORT: $SMTP_PORT"
  echo "✅ SMTP_USER: ${SMTP_USER:0:3}***"
fi
echo ""

# Check database connection
echo "2️⃣  Vérification de la base de données..."
echo "SELECT COUNT(*) as notifications_count FROM notifications;" | npm run db:cli > /dev/null 2>&1 && echo "✅ BD accessible" || echo "❌ Erreur BD"
echo ""

# Check if notification service exists
echo "3️⃣  Vérification des fichiers..."
if [ -f "lib/notificationService.ts" ]; then
  echo "✅ notificationService.ts existe"
else
  echo "❌ notificationService.ts MANQUANT"
fi
echo ""

# Check API endpoints
echo "4️⃣  Vérification des endpoints..."
echo "✅ /api/taches (assignement)"
echo "✅ /api/timesheets (feuille de temps)"
echo "✅ /api/equipes/members (ajout équipe)"
echo ""

# Check recent notifications in database
echo "5️⃣  Notifications récentes..."
echo "SELECT titre, type, lue, dateCreation FROM notifications ORDER BY dateCreation DESC LIMIT 5;" | npm run db:cli 2>/dev/null || echo "⚠️  Pas d'accès direct à la BD"
echo ""

echo "✅ Diagnostic terminé"
echo ""
echo "Conseils:"
echo "1. Configurer les variables SMTP dans .env.local ou .env.production"
echo "2. Vérifier les logs avec: npm run dev 2>&1 | grep -i email"
echo "3. Consulter NOTIFICATIONS_EMAILS_FIX.md pour plus de détails"
