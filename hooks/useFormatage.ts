import { formatMontant } from '@/lib/paiementUtils'

/**
 * Hook personnalisé pour le formatage des données
 */
export function useFormatage() {
  /**
   * Formate un montant avec la devise FCFA
   * @param montant Le montant à formater (nombre ou chaîne)
   * @returns Le montant formaté avec la devise (ex: "1 234 FCFA")
   */
  const formaterMontant = (montant: number | string): string => {
    return formatMontant(montant)
  }

  return {
    formaterMontant,
  }
}

export default useFormatage
