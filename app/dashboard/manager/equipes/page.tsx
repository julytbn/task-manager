"use client"
import { useEffect, useState } from 'react'
import EquipesList from '@/components/EquipesList'
import TeamDetailModal from '@/components/TeamDetailModal'
import CreateTeamModal from '@/components/CreateTeamModal'
import EditTeamModal from '@/components/EditTeamModal'
import { Plus, AlertCircle } from 'lucide-react'
import AssignProjectModal from '@/components/AssignProjectModal'
import AddMemberModal from '@/components/AddMemberModal'

export default function EquipesPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTeamData, setEditTeamData] = useState<{ name: string; description?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/equipes')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (mounted) {
          setTeams(data.map((d: any) => ({ ...d, status: d.status || 'Active' })))
          setError(null)
        }
      } catch (err) {
        console.error('Erreur chargement équipes', err)
        if (mounted) setError('Erreur lors du chargement des équipes')
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleView = (id: string) => {
    setSelectedTeamId(id)
    setIsDetailOpen(true)
  }

  const handleCreateTeam = async (name: string, description?: string, leadId?: string) => {
    try {
      const res = await fetch('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, leadId })
      })
      if (!res.ok) throw new Error('Creation failed')
      const created = await res.json()
      setTeams([{ id: created.id, name: created.name, lead: created.lead || '—', membersCount: 0, members: [], projects: [], status: 'En attente', createdAt: created.createdAt, description }, ...teams])
      setIsCreateOpen(false)
      alert('✅ Équipe créée avec succès')
    } catch (err) {
      console.error(err)
      alert('❌ Erreur création équipe')
    }
  }

  const handleEditTeam = (id: string) => {
    const team = teams.find(t => t.id === id)
    if (!team) return
    setEditTeamData({ name: team.name, description: team.description })
    setSelectedTeamId(id)
    setIsEditOpen(true)
  }

  const handleSaveEdit = async (name: string, description?: string) => {
    if (!selectedTeamId) return
    try {
      const res = await fetch('/api/equipes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTeamId, name })
      })
      if (!res.ok) throw new Error('Update failed')
      setTeams(teams.map(t => t.id === selectedTeamId ? { ...t, name, description } : t))
      setIsEditOpen(false)
      alert('✅ Équipe modifiée avec succès')
    } catch (err) {
      console.error(err)
      alert('❌ Erreur mise à jour équipe')
    }
  }

  const handleDelete = (id: string) => {
    const team = teams.find(t => t.id === id)
    if (!team) return
    const confirmMsg = `⚠️ Supprimer l'équipe "${team.name}" ? Cette action est irréversible.`
    if (!window.confirm(confirmMsg)) return
    const prev = teams
    setTeams(teams.filter(t => t.id !== id))
    fetch(`/api/equipes?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          alert('❌ Erreur suppression')
          setTeams(prev)
        } else {
          alert('✅ Équipe supprimée')
        }
      })
      .catch((err) => { console.error(err); setTeams(prev) })
  }

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addTeamId, setAddTeamId] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; prenom?: string; nom?: string; email?: string }>>([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)

  const handleAddMember = async (id: string) => {
    try {
      setAddTeamId(id)
      setIsAddOpen(true)
      setIsUsersLoading(true)
      const res = await fetch('/api/utilisateurs/available')
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.map((u: any) => ({ id: u.id, prenom: u.prenom, nom: u.nom, email: u.email })))
    } catch (err) {
      console.error('Erreur chargement utilisateurs', err)
      alert('Erreur lors du chargement des utilisateurs')
      setIsAddOpen(false)
    } finally {
      setIsUsersLoading(false)
    }
  }

  const handleConfirmAdd = async (utilisateurId: string) => {
    if (!addTeamId) return
    try {
      const res = await fetch('/api/equipes/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipeId: addTeamId, utilisateurId })
      })
      if (!res.ok) throw new Error('Add member failed')
      const user = users.find(u => u.id === utilisateurId)
      setTeams(prev => prev.map(t => t.id === addTeamId ? { ...t, membersCount: (t.membersCount||0) + 1, members: [...(t.members||[]), { id: utilisateurId, name: user ? `${user.prenom || ''}${user.nom ? ' ' + user.nom : ''}` : utilisateurId, role: 'Membre', email: user?.email }] } : t))
      alert('✅ Membre ajouté')
      setIsAddOpen(false)
      setAddTeamId(null)
    } catch (err) {
      console.error(err)
      alert('❌ Erreur ajout membre')
    }
  }

  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [assignTeamId, setAssignTeamId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([])
  const [isProjectsLoading, setIsProjectsLoading] = useState(false)

  const handleAssignProject = async (id: string) => {
    try {
      setAssignTeamId(id)
      setIsAssignOpen(true)
      setIsProjectsLoading(true)
      const res = await fetch('/api/projets')
      if (!res.ok) throw new Error('Failed to load projets')
      const data = await res.json()
      // API returns objects with `id` and `title`
      setProjects(data.map((p: any) => ({ id: p.id, title: p.title || p.titre || p.title })))
    } catch (err) {
      console.error('Erreur chargement projets', err)
      alert('Erreur lors du chargement des projets')
      setIsAssignOpen(false)
    } finally {
      setIsProjectsLoading(false)
    }
  }

  const handleConfirmAssign = async (projetId: string) => {
    if (!assignTeamId) return
    try {
      const res = await fetch('/api/equipes/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipeId: assignTeamId, projetId })
      })
      if (!res.ok) throw new Error('Assignation failed')
      const result = await res.json()
      // find project title
      const proj = projects.find(p => p.id === projetId)
      const projTitle = proj ? proj.title : projetId
      setTeams((prev) => prev.map(t => t.id === assignTeamId ? { ...t, projects: Array.from(new Set([...(t.projects||[]), projTitle])) } : t))
      alert('✅ Projet assigné')
      setIsAssignOpen(false)
      setAssignTeamId(null)
    } catch (err) {
      console.error(err)
      alert('❌ Erreur assignation projet')
    }
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || null

  const removeMember = (teamId: string, memberId: string) => {
    const prev = teams
    setTeams((prevTeams) => prevTeams.map(t => t.id === teamId ? { ...t, members: (t.members||[]).filter((m: any) => m.id !== memberId), membersCount: Math.max(0, t.membersCount - 1) } : t))
    fetch(`/api/equipes/members?equipeId=${encodeURIComponent(teamId)}&utilisateurId=${encodeURIComponent(memberId)}`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          alert('❌ Erreur retrait membre')
          const r = await fetch('/api/equipes')
          const d = await r.json()
          setTeams(d)
        }
      })
      .catch(async (err) => { console.error(err); const r = await fetch('/api/equipes'); const d = await r.json(); setTeams(d) })
  }

  const promoteLead = (teamId: string, memberId: string) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return
    const member = (team.members||[]).find((m: any) => m.id === memberId)
    if (!member) return
    setTeams(teams.map(t => t.id === teamId ? { ...t, lead: member.name } : t))
    fetch('/api/equipes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: teamId, leadId: memberId }) })
      .then((res) => { if (!res.ok) console.error('Failed to promote lead') })
      .catch((err) => console.error(err))
  }

  return (
    <div className="space-y-8 p-6 bg-[var(--color-offwhite)] min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-black-deep)]">👥 Gestion des équipes</h1>
          <p className="text-[var(--color-anthracite)]/70 mt-2">Créez, assignez et suivez les performances de vos équipes</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)} 
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-gold)] hover:brightness-95 text-[var(--color-black-deep)] rounded-lg font-semibold transition-all"
        >
          <Plus size={20}/> 
          Créer une équipe
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 hover:shadow-md transition-shadow">
          <p className="text-[var(--color-anthracite)]/70 text-sm font-medium mb-2">Total d'équipes</p>
          <p className="text-3xl font-bold text-[var(--color-black-deep)]">{teams.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 hover:shadow-md transition-shadow">
          <p className="text-[var(--color-anthracite)]/70 text-sm font-medium mb-2">Membres totaux</p>
          <p className="text-3xl font-bold text-[var(--color-gold)]">{teams.reduce((sum, t) => sum + (t.membersCount || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 hover:shadow-md transition-shadow">
          <p className="text-[var(--color-anthracite)]/70 text-sm font-medium mb-2">Projets assignés</p>
          <p className="text-3xl font-bold text-[var(--color-black-deep)]">{teams.reduce((sum, t) => sum + (t.projects?.length || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-6 hover:shadow-md transition-shadow">
          <p className="text-[var(--color-anthracite)]/70 text-sm font-medium mb-2">Équipes actives</p>
          <p className="text-3xl font-bold text-[var(--color-black-deep)]">{teams.filter(t => t.status === 'Active').length}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50/80 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-gold)]"></div>
          <p className="mt-4 text-[var(--color-anthracite)]">Chargement des équipes...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[var(--color-border)]">
          <p className="text-[var(--color-anthracite)]/70 mb-4">Aucune équipe créée</p>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-lg font-semibold hover:brightness-95"
          >
            Créer une équipe
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden">
          <EquipesList teams={teams} onView={handleView} onEdit={handleEditTeam} onDelete={handleDelete} onAddMember={handleAddMember} onAssignProject={handleAssignProject} />
        </div>
      )}

      <TeamDetailModal team={selectedTeam ? {
        id: selectedTeam.id,
        name: selectedTeam.name,
        lead: selectedTeam.lead,
        membersCount: selectedTeam.membersCount,
        members: selectedTeam.members,
        projects: (selectedTeam.projects||[]).map((p: string) => ({ name: p, state: 'En cours', deadline: '-', progress: 0, payment: '-' })),
        status: selectedTeam.status,
        createdAt: selectedTeam.createdAt
      } : null} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} onRemoveMember={removeMember} onPromoteLead={promoteLead} />
      <AssignProjectModal isOpen={isAssignOpen} onClose={() => { setIsAssignOpen(false); setAssignTeamId(null) }} projects={projects} onAssign={async (projetId: string) => { await handleConfirmAssign(projetId) }} />

      <AddMemberModal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setAddTeamId(null) }} users={users} onAdd={async (utilisateurId: string) => { await handleConfirmAdd(utilisateurId) }} />

      <CreateTeamModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateTeam} />

      <EditTeamModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleSaveEdit} initialName={editTeamData?.name} initialDescription={editTeamData?.description} />
    </div>
  )
  }
