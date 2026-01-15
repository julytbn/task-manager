"use client"
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layouts/MainLayout'
import EquipesList from '@/components/EquipesList'
import TeamDetailModal from '@/components/TeamDetailModal'
import CreateTeamModal from '@/components/CreateTeamModal'
import EditTeamModal from '@/components/EditTeamModal'
import AddMemberModal from '@/components/AddMemberModal'
import { Plus, AlertCircle } from 'lucide-react'

export default function EquipesPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
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

  const handleCreateTeam = async (name: string, description?: string) => {
    try {
      const res = await fetch('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
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

  const handleAddMember = async (id: string) => {
    try {
      setSelectedTeamId(id)
      const res = await fetch('/api/utilisateurs/available')
      if (!res.ok) throw new Error('Failed to load users')
      const users = await res.json()
      setAvailableUsers(users)
      setIsAddMemberOpen(true)
    } catch (err) {
      console.error(err)
      alert('❌ Erreur chargement utilisateurs')
    }
  }

  const handleAddMemberSubmit = async (email: string) => {
    if (!selectedTeamId) {
      throw new Error('Aucune équipe sélectionnée')
    }
    
    const prev = teams
    setTeams(teams.map(t => t.id === selectedTeamId ? { ...t, membersCount: t.membersCount + 1 } : t))
    
    try {
      const res = await fetch('/api/equipes/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipeId: selectedTeamId, email })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        setTeams(prev)
        throw new Error(errorData.error || 'Impossible d\'ajouter le membre')
      }
      
      // Rafraîchir la liste
      const r = await fetch('/api/equipes')
      const d = await r.json()
      setTeams(d.map((t: any) => ({ ...t, status: t.status || 'Active' })))
      setSelectedTeamId(null)
      setAvailableUsers([])
      alert('✅ Membre ajouté avec succès')
    } catch (err) {
      setTeams(prev)
      throw err
    }
  }

  const handleAssignProject = (id: string) => {
    const project = window.prompt('Nom du projet à assigner :')
    if (!project) return
    setTeams(teams.map(t => t.id === id ? { ...t, projects: Array.from(new Set([...(t.projects||[]), project])) } : t))
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
    <MainLayout>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gold-gradient-text">👥 Gestion des équipes</h1>
          <p className="text-[var(--color-anthracite)] mt-2">Créez, assignez et suivez les performances de vos équipes</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] rounded-md hover:bg-[var(--color-gold-accent)]"><Plus size={18}/> Créer une équipe</button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-[var(--color-offwhite)] rounded-xl shadow-sm border border-[var(--color-border)] p-6">
        {isLoading ? (
          <div className="text-center py-8">Chargement des équipes...</div>
        ) : (
          <EquipesList teams={teams} onView={handleView} onEdit={handleEditTeam} onDelete={handleDelete} onAddMember={handleAddMember} onAssignProject={handleAssignProject} />
        )}
      </div>

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

      <CreateTeamModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateTeam} />

      <EditTeamModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleSaveEdit} initialName={editTeamData?.name} initialDescription={editTeamData?.description} />

      <AddMemberModal 
        isOpen={isAddMemberOpen} 
        onClose={() => setIsAddMemberOpen(false)} 
        users={availableUsers}
        onAdd={handleAddMemberSubmit}
      />
    </div>
    </MainLayout>
  )
}
