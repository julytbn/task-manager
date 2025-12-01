import { prisma } from '@/lib/prisma'
import { EnumType } from '@/lib/useEnums'

export async function getEnumsByType(type: EnumType) {
  try {
    let model: any

    switch (type) {
      case 'statuts-taches':
        model = await prisma.enumStatutTache.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'priorites':
        model = await prisma.enumPriorite.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'statuts-projets':
        model = await prisma.enumStatutProjet.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'categories-services':
        model = await prisma.enumCategorieService.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'types-clients':
        model = await prisma.enumTypeClient.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'statuts-factures':
        model = await prisma.enumStatutFacture.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'statuts-paiements':
        model = await prisma.enumStatutPaiement.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'moyens-paiement':
        model = await prisma.enumMoyenPaiement.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      case 'types-notifications':
        model = await prisma.enumTypeNotification.findMany({
          where: { actif: true },
          orderBy: { ordre: 'asc' }
        })
        break

      default:
        return []
    }

    return model || []
  } catch (error) {
    console.error(`Erreur getEnumsByType [${type}]:`, error)
    return []
  }
}

// Récupérer un enum spécifique par clé
export async function getEnumByCle(type: EnumType, cle: string) {
  try {
    switch (type) {
      case 'statuts-taches':
        return await prisma.enumStatutTache.findFirst({
          where: { cle, actif: true }
        })

      case 'priorites':
        return await prisma.enumPriorite.findFirst({
          where: { cle, actif: true }
        })

      case 'statuts-projets':
        return await prisma.enumStatutProjet.findFirst({
          where: { cle, actif: true }
        })

      case 'categories-services':
        return await prisma.enumCategorieService.findFirst({
          where: { cle, actif: true }
        })

      case 'types-clients':
        return await prisma.enumTypeClient.findFirst({
          where: { cle, actif: true }
        })

      case 'statuts-factures':
        return await prisma.enumStatutFacture.findFirst({
          where: { cle, actif: true }
        })

      case 'statuts-paiements':
        return await prisma.enumStatutPaiement.findFirst({
          where: { cle, actif: true }
        })

      case 'moyens-paiement':
        return await prisma.enumMoyenPaiement.findFirst({
          where: { cle, actif: true }
        })

      case 'types-notifications':
        return await prisma.enumTypeNotification.findFirst({
          where: { cle, actif: true }
        })

      default:
        return null
    }
  } catch (error) {
    console.error(`Erreur getEnumByCle [${type}]:`, error)
    return null
  }
}

// Récupérer le label d'un enum par sa clé
export async function getEnumLabel(type: EnumType, cle: string): Promise<string> {
  const enum_ = await getEnumByCle(type, cle)
  return enum_?.label || cle
}
