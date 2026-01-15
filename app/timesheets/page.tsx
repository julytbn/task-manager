'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layouts/MainLayout'
import TimesheetKPIs from '@/components/TimesheetKPIs'
import TimesheetFilters from '@/components/TimesheetFilters'
import TimesheetTable, { TimesheetRowData } from '@/components/TimesheetTable'
import TimesheetAnalytics from '@/components/TimesheetAnalytics'
import TimesheetDetailModal from '@/components/TimesheetDetailModal'
import NouvelleTimesheetModal from '@/components/NouvelleTimesheetModal'
import { Button } from '@/components/ui'
import { Plus, Download } from 'lucide-react'
import { useUserSession } from '@/hooks/useSession'

type Timesheet = {
  id: string
  date: string
  heures: number
  description: string
  projet?: { titre?: string }
  tache?: { titre?: string }
  statut?: string
}

export default function TimesheetPage() {
  const router = useRouter()
  const { user, isLoading: isSessionLoading } = useUserSession()
  const [timesheets, setTimesheets] = useState<TimesheetRowData[]>([])
  const [filteredTimesheets, setFilteredTimesheets] = useState<TimesheetRowData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetRowData | undefined>()
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Données pour les filtres
  const [employees, setEmployees] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; titre: string }[]>([])

  // État des filtres
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    employeeId: '',
    projectId: '',
    status: 'EN_ATTENTE'
  })

  // Rediriger les employés vers leur page
  useEffect(() => {
    if (!isSessionLoading && user) {
      if (user.role === 'EMPLOYE') {
        router.push('/timesheets/my-timesheets')
      }
    }
  }, [user, isSessionLoading, router])

  // Charger les employés et projets une seule fois
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        // Charger tous les employés
        const empRes = await fetch('/api/utilisateurs?role=EMPLOYE')
        if (empRes.ok) {
          const empData = await empRes.json()
          if (empData.data && Array.isArray(empData.data)) {
            setEmployees(empData.data)
          }
        }

        // Charger tous les projets
        const projRes = await fetch('/api/projets')
        if (projRes.ok) {
          try {
            const projData = await projRes.json()
            if (projData.data && Array.isArray(projData.data)) {
              setProjects(projData.data)
            }
          } catch (e) {
            console.error('Error parsing projects JSON:', e)
          }
        }
      } catch (err) {
        console.error('Error loading filters data:', err)
      }
    }

    loadFiltersData()
  }, [])

  useEffect(() => {
    const loadTimesheets = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        // Construire l'URL avec les filtres actuels
        const params = new URLSearchParams()
        params.append('statut', filters.status || 'EN_ATTENTE')
        if (filters.employeeId) params.append('employeeId', filters.employeeId)
        if (filters.projectId) params.append('projectId', filters.projectId)
        
        const res = await fetch(`/api/timesheets?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to load timesheets')
        const data = await res.json()
        
        // Transformer les données pour correspondre au format TimesheetRowData
        const transformed = data.data && Array.isArray(data.data) ? data.data.map((t: any) => ({
          id: t.id,
          date: t.date,
          dateSubmission: t.createdAt || t.date,
          period: new Date(t.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          employee: t.employee || { id: '', prenom: '', nom: '' },
          project: t.project,
          task: t.task,
          hours: (t.regularHrs || 0) + (t.overtimeHrs || 0) + (t.sickHrs || 0) + (t.vacationHrs || 0),
          type: 'normal',
          description: t.description,
          status: t.statut || 'EN_ATTENTE'
        })) : []
        
        setTimesheets(transformed)
        setFilteredTimesheets(transformed)
      } catch (err) {
        console.error('Error loading timesheets:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTimesheets()
  }, [user, filters.status, filters.employeeId, filters.projectId])

  // Appliquer les filtres
  useEffect(() => {
    let result = timesheets

    if (filters.employeeId) {
      result = result.filter(t => t.employee.id === filters.employeeId)
    }

    if (filters.projectId) {
      result = result.filter(t => t.project?.id === filters.projectId)
    }

    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status)
    }

    if (filters.dateStart || filters.dateEnd) {
      result = result.filter(t => {
        const tDate = new Date(t.date)
        if (filters.dateStart && tDate < new Date(filters.dateStart)) return false
        if (filters.dateEnd && tDate > new Date(filters.dateEnd)) return false
        return true
      })
    }

    setFilteredTimesheets(result)
  }, [filters, timesheets])

  // Calculer les KPIs
  const calculateKPIs = () => {
    const totalHours = filteredTimesheets.reduce((sum, t) => sum + t.hours, 0)
    const activeEmployees = new Set(filteredTimesheets.map(t => t.employee.id)).size
    const unvalidatedHours = filteredTimesheets
      .filter(t => t.status !== 'VALIDATED')
      .reduce((sum, t) => sum + t.hours, 0)

    // Coût estimé: 0 (le tarif horaire n'est plus utilisé)
    const estimatedCost = 0

    // Heures par projet
    const projectHours: { [key: string]: number } = {}
    filteredTimesheets.forEach(t => {
      const projectName = t.project?.titre || 'Sans projet'
      projectHours[projectName] = (projectHours[projectName] || 0) + t.hours
    })

    return { totalHours, activeEmployees, projectHours, unvalidatedHours, estimatedCost }
  }

  // Données pour analytics
  const getAnalyticsData = () => {
    // Heures par employé
    const hoursByEmp: { [key: string]: number } = {}
    filteredTimesheets.forEach(t => {
      const empName = `${t.employee.prenom} ${t.employee.nom}`
      hoursByEmp[empName] = (hoursByEmp[empName] || 0) + t.hours
    })

    // Heures par projet
    const hoursByProj: { [key: string]: number } = {}
    filteredTimesheets.forEach(t => {
      const projName = t.project?.titre || 'Sans projet'
      hoursByProj[projName] = (hoursByProj[projName] || 0) + t.hours
    })

    return {
      hoursByEmployee: Object.entries(hoursByEmp).map(([name, hours]) => ({ name, hours })),
      hoursByProject: Object.entries(hoursByProj).map(([name, hours]) => ({ name, hours }))
    }
  }

  const kpis = calculateKPIs()
  const analytics = getAnalyticsData()

  const handleValidate = async (id: string) => {
    try {
      const res = await fetch(`/api/timesheets/${id}/validate`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate'
          // validePar est récupéré côté backend via getServerSession
        })
      })
      const result = await res.json()
      
      if (!res.ok) {
        alert('Erreur: ' + (result.message || 'Validation échouée'))
        return
      }
      
      setTimesheets(prev => prev.filter(t => t.id !== id))
      setFilteredTimesheets(prev => prev.filter(t => t.id !== id))
      setShowDetailModal(false)
      alert('✅ Timesheet validé avec succès!')
    } catch (err) {
      console.error('Erreur:', err)
      alert('❌ Erreur lors de la validation')
    }
  }

  const handleReject = async (id: string, reason: string) => {
    if (!reason || !reason.trim()) {
      alert('⚠️ Le commentaire de rejet est obligatoire')
      return
    }

    try {
      const res = await fetch(`/api/timesheets/${id}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject',
          comment: reason
          // validePar est récupéré côté backend via getServerSession
        })
      })
      const result = await res.json()

      if (!res.ok) {
        alert('Erreur: ' + (result.message || 'Rejet échoué'))
        return
      }
      
      setTimesheets(prev => prev.filter(t => t.id !== id))
      setFilteredTimesheets(prev => prev.filter(t => t.id !== id))
      setShowDetailModal(false)
      alert('❌ Timesheet rejeté avec succès!')
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors du rejet')
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feuilles de Temps</h1>
            <p className="text-sm text-gray-600 mt-1">Gérez et validez les feuilles de temps de vos employés</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Download size={16} />
              Exporter
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              Nouvelle feuille
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <TimesheetKPIs {...kpis} />

        {/* Filtres */}
        <TimesheetFilters
          employees={employees}
          projects={projects}
          onDateChange={(start, end) => setFilters({ ...filters, dateStart: start, dateEnd: end })}
          onEmployeeChange={(id) => setFilters({ ...filters, employeeId: id })}
          onProjectChange={(id) => setFilters({ ...filters, projectId: id })}
          onStatusChange={(status) => setFilters({ ...filters, status })}
          onReset={() => setFilters({ dateStart: '', dateEnd: '', employeeId: '', projectId: '', status: 'EN_ATTENTE' })}
        />

        {/* Tableau */}
        <TimesheetTable
          data={filteredTimesheets}
          loading={loading}
          onView={(item) => {
            setSelectedTimesheet(item)
            setShowDetailModal(true)
          }}
          onValidate={(item) => handleValidate(item.id)}
          onReject={(item) => {
            setSelectedTimesheet(item)
            setShowDetailModal(true)
          }}
          onDelete={(item) => {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette feuille ?')) {
              setTimesheets(prev => prev.filter(t => t.id !== item.id))
            }
          }}
        />

        {/* Analytics */}
        {!loading && <TimesheetAnalytics {...analytics} />}

        {/* Modals */}
        <NouvelleTimesheetModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          onSubmit={(newSheet: Timesheet) => {
            const transformed: TimesheetRowData = {
              id: newSheet.id || '',
              date: newSheet.date,
              employee: { id: '', prenom: 'Nouvel', nom: 'Employé' },
              project: newSheet.projet ? { id: '', titre: newSheet.projet.titre || '' } : undefined,
              task: newSheet.tache ? { id: '', titre: newSheet.tache.titre || '' } : undefined,
              hours: newSheet.heures,
              type: 'normal',
              description: newSheet.description,
              status: 'DRAFT'
            }
            setTimesheets([...timesheets, transformed])
          }}
        />

        <TimesheetDetailModal
          isOpen={showDetailModal}
          data={selectedTimesheet}
          onClose={() => setShowDetailModal(false)}
          onValidate={handleValidate}
          onReject={handleReject}
        />
      </div>
    </MainLayout>
  )
}
