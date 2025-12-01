import { useState, useEffect } from 'react'

interface ProjectData {
  id: string
  titre: string
  description: string | null
  client: {
    id: string
    nom: string
    prenom: string
    email: string | null
    telephone: string | null
  }
  service: {
    id: string
    nom: string
  }
  statut: {
    cle: string
    label: string
  }
  budget: number
  dateDebut: string | null
  dateFin: string | null
  dateEcheance: string | null
  taches: {
    total: number
    terminated: number
    inProgress: number
    pending: number
  }
}

interface ProjectsStatistics {
  totalProjets: number
  projetsEnCours: number
  projetsTermines: number
  budgetTotal: number
  budgetTotalFormatted: string
  projetsEnCoursList: ProjectData[]
  projetsTerminesList: ProjectData[]
  statutsDisponibles: Array<{
    cle: string
    label: string
    ordre: number
  }>
}

// Cache at module level to prevent unnecessary API calls
let projectStatsCache: ProjectsStatistics | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useProjectsStatistics() {
  const [data, setData] = useState<ProjectsStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Check cache
        if (projectStatsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
          setData(projectStatsCache)
          setLoading(false)
          return
        }

        const response = await fetch('/api/dashboard/projets-stats', {
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Erreur: ${response.statusText}`)
        }

        const jsonData: ProjectsStatistics = await response.json()
        
        // Update cache
        projectStatsCache = jsonData
        cacheTimestamp = Date.now()

        setData(jsonData)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnu'
        setError(message)
        console.error('Erreur récupération statistiques projets:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  const refreshStatistics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/dashboard/projets-stats', {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Erreur: ${response.statusText}`)
      }

      const jsonData: ProjectsStatistics = await response.json()
      
      // Update cache
      projectStatsCache = jsonData
      cacheTimestamp = Date.now()

      setData(jsonData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnu'
      setError(message)
      console.error('Erreur rafraîchissement statistiques projets:', err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refreshStatistics }
}
