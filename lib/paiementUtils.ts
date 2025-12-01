/**
 * Utilitaires pour la gestion des paiements
 */

/**
 * Génère une référence de transaction unique
 * Format: PAI-YYYYMMDD-SEQUENCE-RANDOM
 * Exemple: PAI-20251201-0001-A7F2
 */
export function generateTransactionReference(): string {
  // Date au format YYYYMMDD
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')

  // Séquence: timestamp en millisecondes (derniers 4 chiffres)
  const sequence = String(now.getMilliseconds() % 10000).padStart(4, '0')

  // Random: 4 caractères aléatoires (hex)
  const random = Math.random().toString(16).substring(2, 6).toUpperCase().padEnd(4, '0')

  return `PAI-${dateStr}-${sequence}-${random}`
}

/**
 * Génère une référence basée sur la méthode de paiement
 * Format personnalisé par type de paiement
 */
export function generateTransactionReferenceByMethod(
  moyenPaiement: string,
  additionalData?: {
    numeroCompte?: string
    numeroCheque?: string
    numeroTelephone?: string
  }
): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
  const timestamp = String(now.getMilliseconds()).padStart(4, '0')

  const method = moyenPaiement.toUpperCase().substring(0, 3)

  switch (method) {
    case 'VIR': // Virement bancaire
      return `${method}-${additionalData?.numeroCompte?.slice(-4) || 'XXXX'}-${dateStr}-${timestamp}`

    case 'MOB': // Mobile Money
      return `${method}-${additionalData?.numeroTelephone?.slice(-4) || 'XXXX'}-${dateStr}-${timestamp}`

    case 'CHE': // Chèque
      return `${method}-${additionalData?.numeroCheque || 'XXXX'}-${dateStr}`

    case 'ESP': // Espèces
      return `${method}-${dateStr}-${timestamp}`

    default: // Par défaut
      return generateTransactionReference()
  }
}

/**
 * Valide une référence de transaction
 */
export function validateTransactionReference(reference: string): boolean {
  if (!reference || reference.trim().length === 0) return false

  // Format de base: 3-4 caractères minimum
  return reference.trim().length >= 3 && reference.trim().length <= 50
}

/**
 * Formate un montant pour l'affichage
 */
export function formatMontant(montant: number, devise: string = 'CFA'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR', // Utiliser EUR pour la mise en forme
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant).replace('€', devise)
}

/**
 * Calcule le statut du paiement en fonction des montants
 */
export function calculatePaymentStatus(
  montantTotal: number,
  montantPayé: number
): 'payé' | 'partiel' | 'impayé' {
  if (montantPayé <= 0) return 'impayé'
  if (montantPayé >= montantTotal) return 'payé'
  return 'partiel'
}

/**
 * Calcule le solde restant
 */
export function calculateSoldeRestant(montantTotal: number, montantPayé: number): number {
  const solde = montantTotal - montantPayé
  return solde < 0 ? 0 : solde
}

/**
 * Génère un numéro de facture unique
 * Format: FAC-YYYYMMDD-SEQUENCE
 * Exemple: FAC-20251201-001
 */
export function generateFactureNumber(): string {
  // Date au format YYYYMMDD
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')

  // Séquence: nombre aléatoire entre 001 et 999
  const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')

  return `FAC-${dateStr}-${sequence}`
}
