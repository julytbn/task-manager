#!/usr/bin/env bash

# ============================================
# KEKELI - PRODUCTION COMPLETION SCRIPT
# ============================================
# Script prêt à copier-coller pour compléter les 5% restants
# 
# Usage: 
#   ./complete-production.sh
#
# Ou manuellement, copier-coller les commandes ci-dessous
# ============================================

set -e  # Arrêter si erreur

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🚀 KEKELI - COMPLETION 5% → 100% GO LIVE              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────────────────────────
# ÉTAPE 1: Configuration de base
# ─────────────────────────────────────────────────────────────────

echo "📋 ÉTAPE 1: Vérification configuration..."
echo ""

if [ ! -f ".env" ]; then
    echo "❌ ERREUR: .env manquant!"
    echo "   → Copier .env.example → .env"
    exit 1
fi

echo "✅ .env trouvé"

# Vérifier variables SMTP
if grep -q "SMTP_HOST" .env && grep -q "SMTP_USER" .env; then
    echo "✅ SMTP configuré"
else
    echo "⚠️  SMTP partiellement configuré - À faire avant test"
fi

echo ""

# ─────────────────────────────────────────────────────────────────
# ÉTAPE 2: Installer dépendances (si nécessaire)
# ─────────────────────────────────────────────────────────────────

echo "📦 ÉTAPE 2: Vérifier dépendances..."
echo ""

if [ ! -d "node_modules" ]; then
    echo "📥 Installation npm..."
    npm install
else
    echo "✅ node_modules existe"
fi

echo ""

# ─────────────────────────────────────────────────────────────────
# ÉTAPE 3: Tester SMTP
# ─────────────────────────────────────────────────────────────────

echo "📧 ÉTAPE 3: Test SMTP..."
echo ""
echo "🔗 Endpoint: POST http://localhost:3000/api/admin/test-smtp"
echo ""
echo "Optionnel: Pour tester maintenant (dev server en cours):"
echo ""
echo "curl -X POST http://localhost:3000/api/admin/test-smtp \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"julietetebenissan@gmail.com\"}'"
echo ""
echo "Ou: npm run test:smtp"
echo ""

# ─────────────────────────────────────────────────────────────────
# ÉTAPE 4: Tester Permissions
# ─────────────────────────────────────────────────────────────────

echo "🔐 ÉTAPE 4: Audit Permissions..."
echo ""

if [ -f "scripts/test-security.js" ]; then
    echo "✅ Script audit sécurité créé"
    echo ""
    echo "Exécuter: npm run test:security"
    echo ""
else
    echo "⚠️  Script sécurité non trouvé"
fi

# ─────────────────────────────────────────────────────────────────
# ÉTAPE 5: Crons Vercel
# ─────────────────────────────────────────────────────────────────

echo "⏰ ÉTAPE 5: Configuration Crons Vercel..."
echo ""

if grep -q "generate-invoices" vercel.json; then
    echo "✅ Crons configurés dans vercel.json"
    echo ""
    echo "Crons prêts:"
    grep '"path"' vercel.json | head -4
    echo ""
else
    echo "❌ Crons manquants dans vercel.json"
fi

echo ""

# ─────────────────────────────────────────────────────────────────
# ÉTAPE 6: Vérifier fichiers critiques
# ─────────────────────────────────────────────────────────────────

echo "📂 ÉTAPE 6: Vérification fichiers..."
echo ""

FILES_CREATED=(
    "app/api/admin/test-smtp/route.ts"
    "scripts/test-smtp.js"
    "scripts/test-security.js"
    "lib/security-audit.ts"
    "lib/pdf.ts"
    "GUIDE_VALIDATION_UPLOADS.md"
    "GUIDE_PDF_GENERATION.md"
    "COMPLETION_5_PERCENT.md"
)

for file in "${FILES_CREATED[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MANQUANT"
    fi
done

echo ""

# ─────────────────────────────────────────────────────────────────
# ÉTAPE 7: Résumé et Next Steps
# ─────────────────────────────────────────────────────────────────

echo "════════════════════════════════════════════════════════════════"
echo "✅ CONFIGURATION COMPLÈTE - NEXT STEPS"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "🔴 URGENT (à faire maintenant):"
echo "  1️⃣  npm run dev"
echo "  2️⃣  node scripts/test-smtp.js  (valider SMTP)"
echo "  3️⃣  npm run test:security      (valider permissions)"
echo ""

echo "🟠 IMPORTANT (avant déploiement):"
echo "  4️⃣  Tester upload: curl -X POST -F 'file=@test.pdf' ..."
echo "  5️⃣  Valider crons: curl -H 'x-cron-secret:...' /api/cron/..."
echo ""

echo "🟡 OPTIONAL (après launch):"
echo "  6️⃣  npm install puppeteer  (si PDF PDF requis)"
echo "  7️⃣  Tester PDF download"
echo ""

echo "📚 GUIDES DISPONIBLES:"
echo "  • COMPLETION_5_PERCENT.md       (Ce que vous lisez)"
echo "  • GUIDE_VALIDATION_UPLOADS.md   (Uploads)"
echo "  • GUIDE_PDF_GENERATION.md       (PDFs)"
echo "  • lib/security-audit.ts         (RBAC)"
echo ""

echo "🚀 DÉPLOIEMENT:"
echo "  • git add ."
echo "  • git commit -m 'Complete 5% production setup'"
echo "  • git push origin main"
echo "  • vercel deploy --prod"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ Vous êtes prêt! À vous la production 🎉"
echo "════════════════════════════════════════════════════════════════"
echo ""
