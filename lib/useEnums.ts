'use client'

import { useEffect, useState } from 'react'

export interface EnumValue {
  id: string
  cle: string
  label: string
  ordre: number
  actif: boolean
}

export type EnumType =
  | 'statuts-taches'
  | 'priorites'
  | 'statuts-projets'
  | 'categories-services'
  | 'types-clients'
  | 'statuts-factures'
  | 'statuts-paiements'
  | 'moyens-paiement'
  | 'types-notifications'

export function useEnums(type: EnumType) {
  const [data, setData] = useState<EnumValue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/enums/${type}`)
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`)
        }
        const json = await response.json()
        // L'API retourne { [type]: [...] } donc on récupère le tableau
        const enumArray = json[type] || json || []
        setData(Array.isArray(enumArray) ? enumArray : [])
        setError(null)
      } catch (err) {
        console.error(`Erreur récupération énumérations [${type}]:`, err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchEnums()
  }, [type])

  return { data, loading, error }
}

// Fonction utilitaire pour obtenir le label d'une clé
export function getLabelFromCle(data: EnumValue[], cle: string): string {
  const value = data.find((v) => v.cle === cle)
  return value?.label || cle
}

// Cache global pour éviter les requêtes répétées
const enumCache: Record<EnumType, EnumValue[] | null> = {
  'statuts-taches': null,
  'priorites': null,
  'statuts-projets': null,
  'categories-services': null,
  'types-clients': null,
  'statuts-factures': null,
  'statuts-paiements': null,
  'moyens-paiement': null,
  'types-notifications': null
}

export async function fetchEnumsOnce(type: EnumType): Promise<EnumValue[]> {
  if (enumCache[type]) {
    return enumCache[type]!
  }

  try {
    const response = await fetch(`/api/enums/${type}`)
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`)
    }
    const json = await response.json()
    // L'API retourne { [type]: [...] } donc on récupère le tableau
    const enumArray = json[type] || json || []
    enumCache[type] = Array.isArray(enumArray) ? enumArray : []
    return enumCache[type]!
  } catch (err) {
    console.error(`Erreur récupération énumérations [${type}]:`, err)
    return []
  }
}
