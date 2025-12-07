# ═══════════════════════════════════════════════════════════════════════════
# EXEMPLES cURL - GÉNÉRATION AUTOMATIQUE DE FACTURES
# ═══════════════════════════════════════════════════════════════════════════

# ============================================================================
# 1. DÉCLENCHER LE CRON JOB MANUELLEMENT
# ============================================================================

# Méthode GET (Plus simple pour tester rapidement)
curl "http://localhost:3000/api/cron/generate-invoices?secret=development-secret"

# Méthode POST (Plus sécurisée)
curl -X POST "http://localhost:3000/api/cron/generate-invoices" \
  -H "X-CRON-SECRET: development-secret" \
  -H "Content-Type: application/json"

# En production, remplacer le secret:
curl -X POST "https://votre-domaine.com/api/cron/generate-invoices" \
  -H "X-CRON-SECRET: kA9lm+BvX2jK8nP/q3Rs7tU9vW0xYz4aB+cD=" \
  -H "Content-Type: application/json"


# ============================================================================
# 2. CRÉER UN CLIENT
# ============================================================================

curl -X POST "http://localhost:3000/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "ACME Inc",
    "prenom": "Entreprise",
    "email": "contact@acme.com",
    "telephone": "+225 01 23 45 67 89",
    "entreprise": "ACME Inc",
    "adresse": "123 Rue de la Paix, Abidjan",
    "type": "ENTREPRISE"
  }'


# ============================================================================
# 3. CRÉER UN SERVICE
# ============================================================================

curl -X POST "http://localhost:3000/api/services" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Forfait Web Premium",
    "description": "Service de développement web mensuel",
    "categorie": "DEVELOPPEMENT",
    "prix": 100000,
    "dureeEstimee": 30
  }'


# ============================================================================
# 4. CRÉER UN ABONNEMENT (GÉNÈRE AUTOMATIQUEMENT UNE FACTURE)
# ============================================================================

curl -X POST "http://localhost:3000/api/abonnements" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Forfait Web Mensuel",
    "description": "Abonnement mensuel pour développement web",
    "clientId": "CLIENT_ID_HERE",
    "serviceId": "SERVICE_ID_HERE",
    "montant": 100000,
    "frequence": "MENSUEL",
    "dateDebut": "2025-12-03"
  }'

# Exemple avec réponse pour récupérer les IDs:
# Après création d'un client, récupérer son ID:
curl "http://localhost:3000/api/clients" | jq '.[] | {id, nom}'

# Après création d'un service, récupérer son ID:
curl "http://localhost:3000/api/services" | jq '.[] | {id, nom}'


# ============================================================================
# 5. VÉRIFIER LES FACTURES CRÉÉES
# ============================================================================

# Récupérer toutes les factures
curl "http://localhost:3000/api/factures" | jq '.'

# Formater les résultats
curl "http://localhost:3000/api/factures" | jq '.[] | {numero, montantTotal, statut, dateEmission}'

# Filtrer les factures auto-générées (avec abonnementId)
curl "http://localhost:3000/api/factures" | jq '.[] | select(.abonnementId != null)'


# ============================================================================
# 6. VÉRIFIER LES ABONNEMENTS
# ============================================================================

# Récupérer tous les abonnements
curl "http://localhost:3000/api/abonnements" | jq '.'

# Afficher les détails d'un client spécifique
curl "http://localhost:3000/api/abonnements?clientId=CLIENT_ID_HERE" | jq '.'


# ============================================================================
# 7. OBTENIR LE DÉTAIL DES RÉSULTATS DU CRON JOB
# ============================================================================

# Déclencher et voir en détail quelles factures ont été générées
curl -X POST "http://localhost:3000/api/cron/generate-invoices" \
  -H "X-CRON-SECRET: development-secret" \
  -H "Content-Type: application/json" | jq '{
    success,
    invoicesGenerated,
    details: .details[] | {
      clientName,
      invoiceNumber,
      amount: (.amount | tostring),
      status
    }
  }'


# ============================================================================
# 8. METTRE À JOUR UN ABONNEMENT
# ============================================================================

# Changer la fréquence d'un abonnement
curl -X PUT "http://localhost:3000/api/abonnements/SUBSCRIPTION_ID_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "frequence": "TRIMESTRIEL"
  }'

# Suspendre un abonnement (arrête la génération de factures)
curl -X PUT "http://localhost:3000/api/abonnements/SUBSCRIPTION_ID_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "SUSPENDU"
  }'

# Annuler un abonnement
curl -X DELETE "http://localhost:3000/api/abonnements/SUBSCRIPTION_ID_HERE" \
  -H "Content-Type: application/json"


# ============================================================================
# 9. VÉRIFIER LES ERREURS
# ============================================================================

# Tester sans le secret (doit retourner 401 en production)
curl "http://localhost:3000/api/cron/generate-invoices"
# Réponse: {"error":"Non autorisé"} (sauf en développement)

# Tester avec un secret invalide
curl -X POST "http://localhost:3000/api/cron/generate-invoices" \
  -H "X-CRON-SECRET: wrong-secret" \
  -H "Content-Type: application/json"


# ============================================================================
# 10. INTÉGRATION AVEC JQ POUR TRAITEMENT
# ============================================================================

# Obtenir le nombre total de factures générées
curl -s "http://localhost:3000/api/cron/generate-invoices?secret=development-secret" | \
  jq '.invoicesGenerated'

# Lister tous les clients avec leurs factures auto-générées
curl -s "http://localhost:3000/api/factures" | \
  jq '[.[] | select(.abonnementId != null)] | group_by(.clientId) | 
      map({
        clientId: .[0].clientId,
        count: length,
        totalAmount: map(.montantTotal) | add
      })'

# Exporter en CSV (si vous avez besoin)
curl -s "http://localhost:3000/api/factures" | \
  jq -r '.[] | [.numero, .clientId, .montant, .montantTotal, .statut] | @csv' \
  > factures_export.csv


# ============================================================================
# 11. MONITORING - REQUÊTE AUTOMATISÉE
# ============================================================================

# Script pour vérifier chaque heure que le cron job s'est exécuté
# À mettre dans une autre crontab

# while true; do
#   RESULT=$(curl -s "http://localhost:3000/api/cron/generate-invoices?secret=development-secret")
#   COUNT=$(echo "$RESULT" | jq '.invoicesGenerated')
#   TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
#   echo "[$TIMESTAMP] Factures générées: $COUNT" >> /var/log/invoices-monitor.log
#   sleep 3600  # Chaque heure
# done


# ============================================================================
# NOTES D'UTILISATION
# ============================================================================

# - Remplacer "http://localhost:3000" par votre URL en production
# - Remplacer "development-secret" par votre secret réel
# - Installer jq pour un meilleur formatage: apt-get install jq
# - Les IDs doivent être remplacés par de vrais IDs de votre base

# Exemple complet de workflow:
# 1. Créer un client
#    CLIENT_ID=$(curl ... créer client ... | jq -r '.id')
# 2. Créer un service  
#    SERVICE_ID=$(curl ... créer service ... | jq -r '.id')
# 3. Créer un abonnement
#    curl ... créer abonnement avec CLIENT_ID et SERVICE_ID ...
# 4. Vérifier les factures
#    curl http://localhost:3000/api/factures | jq '.[] | select(.abonnementId != null)'
