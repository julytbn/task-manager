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

interface UserProjectsStats {
  total: number
  enCours: number
  termines: number
  budgetTotal: number
  budgetTotalFormatted: string
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
  // Statistiques spécifiques à l'utilisateur connecté
  userProjects?: UserProjectsStats
}

// Cache at module level to prevent unnecessary API calls
let projectStatsCache: ProjectsStatistics | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useProjectsStatistics(userId?: string) {
  const [data, setData] = useState<ProjectsStatistics | null>(projectStatsCache)
  const [loading, setLoading] = useState(!projectStatsCache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Check cache
        if (projectStatsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
          setData(projectStatsCache)
          setLoading(false)
          return
        }

        // Ajout du paramètre userId à l'URL si fourni
        const url = userId 
          ? `/api/projets/statistiques?userId=${userId}`
          : '/api/projets/statistiques'
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des statistiques')
        }
        const stats = await response.json()
        
        // Update cache
        projectStatsCache = stats
        cacheTimestamp = Date.now()

        setData(stats)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue')
        setError(error)
        console.error('Erreur récupération statistiques projets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [userId]) // Re-run when userId changes

  const refreshStatistics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Ajout du paramètre userId à l'URL si fourni
      const url = userId 
        ? `/api/projets/statistiques?userId=${userId}`
        : '/api/projets/statistiques'
        
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques')
      }
      const stats = await response.json()
      
      // Update cache
      projectStatsCache = stats
      cacheTimestamp = Date.now()

      setData(stats)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue')
      setError(error)
      console.error('Erreur rafraîchissement statistiques projets:', error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refreshStatistics }
}
