import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const where: any = {}
    // If the user is an employee, return only tasks assigned to them
    if (session?.user?.role === 'EMPLOYE' && session.user.id) {
      where.assigneAId = session.user.id
    }

    const taches = await prisma.tache.findMany({
      where,
      include: {
        projet: { select: { id: true, titre: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } }
      },
      orderBy: { dateCreation: 'desc' }
    })
    return NextResponse.json(taches)
  } catch (error) {
    console.error('Erreur récupération tâches:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tâches' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const session = await getServerSession(authOptions)

    // Basic validation: require title, statut, priorite and projet (assignee is optional)
    if (!data.titre || !data.statut || !data.priorite || !data.projet) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    const createData: any = {
      titre: data.titre,
      description: data.description || null,
      statut: data.statut,
      priorite: data.priorite,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      montant: data.montant !== undefined && data.montant !== null ? parseFloat(String(data.montant)) : null,
      heuresEstimees:
        data.heuresEstimees !== undefined && data.heuresEstimees !== null
          ? parseFloat(String(data.heuresEstimees))
          : null,
      facturable: data.facturable ?? true,
      projet: { connect: { id: data.projet } }
    }

    // If an assignee is provided, validate permissions and membership
    if (data.assigneA) {
      // Determine team (équipe) context: prefer explicit équipe, else derive from projet
      let equipeId: string | null = data.equipe || null
      if (!equipeId) {
        const projet = await prisma.projet.findUnique({ where: { id: data.projet }, select: { equipeId: true } })
        equipeId = projet?.equipeId || null
      }

      // If there's a team, ensure assignee is member of that team
      if (equipeId) {
        const membre = await prisma.membreEquipe.findUnique({
          where: {
            equipeId_utilisateurId: { equipeId, utilisateurId: data.assigneA }
          }
        })
        if (!membre) {
          return NextResponse.json({ error: 'L\'utilisateur n\'est pas membre de l\'équipe' }, { status: 400 })
        }

        // Only allow assignment if requester is admin or the équipe lead
        if (session?.user?.role !== 'ADMIN') {
          const equipe = await prisma.equipe.findUnique({ where: { id: equipeId }, select: { leadId: true } })
          if (!equipe || equipe.leadId !== session?.user?.id) {
            return NextResponse.json({ error: 'Permission refusée : seulement le chef d\'équipe peut assigner' }, { status: 403 })
          }
        }
      } else {
        // No team context: only admins may assign tasks outside of a team
        if (session?.user?.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Permission refusée : assignment hors équipe réservé aux administrateurs' }, { status: 403 })
        }
      }

      createData.assigneA = { connect: { id: data.assigneA } }
    }
    if (data.service) {
      createData.service = { connect: { id: data.service } }
    }

    const nouvelleTache = await prisma.tache.create({
      data: createData,
      include: {
        projet: { select: { titre: true } },
        assigneA: { select: { nom: true, prenom: true } }
      }
    })

    return NextResponse.json(nouvelleTache, { status: 201 })

  } catch (error) {
    console.error('Erreur création tâche:', error)

    const err = error as any
    
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une tâche similaire existe déjà' },
        { status: 400 }
      )
    }
    
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Projet ou employé introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la tâche' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    console.log('[PUT] received id:', data.id, 'type:', typeof data.id)

    const existing = await prisma.tache.findUnique({ where: { id: data.id } })
    if (!existing) {
      console.warn('[PUT] tâche introuvable (lookup) id:', data.id)
      return NextResponse.json({ error: `Tâche introuvable (id: ${data.id})` }, { status: 404 })
    }

    const updateData: any = {}
    if (data.titre !== undefined) updateData.titre = data.titre
    if (data.description !== undefined) updateData.description = data.description
    if (data.statut !== undefined) updateData.statut = data.statut
    if (data.priorite !== undefined) updateData.priorite = data.priorite
    if (data.dateEcheance !== undefined) updateData.dateEcheance = data.dateEcheance ? new Date(data.dateEcheance) : null
    if (data.montant !== undefined) updateData.montant = data.montant !== null ? parseFloat(String(data.montant)) : null
    if (data.heuresEstimees !== undefined) updateData.heuresEstimees = data.heuresEstimees !== null ? parseFloat(String(data.heuresEstimees)) : null
    if (data.facturable !== undefined) updateData.facturable = data.facturable

    // Relations
    const connect: any = {}
    if (data.projet) connect.projet = { connect: { id: data.projet } }
    if (data.service) connect.service = { connect: { id: data.service } }

    // If changing assignee, enforce permissions and membership
    if (data.assigneA) {
      // Determine team context from existing task or its project
      const task = await prisma.tache.findUnique({ where: { id: data.id }, select: { equipeId: true, projetId: true } })
      let equipeId = task?.equipeId || null
      if (!equipeId && task?.projetId) {
        const projet = await prisma.projet.findUnique({ where: { id: task.projetId }, select: { equipeId: true } })
        equipeId = projet?.equipeId || null
      }

      if (equipeId) {
        const membre = await prisma.membreEquipe.findUnique({
          where: { equipeId_utilisateurId: { equipeId, utilisateurId: data.assigneA } }
        })
        if (!membre) return NextResponse.json({ error: 'L\'utilisateur n\'est pas membre de l\'équipe' }, { status: 400 })

        if (session?.user?.role !== 'ADMIN') {
          const equipe = await prisma.equipe.findUnique({ where: { id: equipeId }, select: { leadId: true } })
          if (!equipe || equipe.leadId !== session?.user?.id) {
            return NextResponse.json({ error: 'Permission refusée : seulement le chef d\'équipe peut assigner' }, { status: 403 })
          }
        }
      } else {
        if (session?.user?.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Permission refusée : assignment hors équipe réservé aux administrateurs' }, { status: 403 })
        }
      }

      connect.assigneA = { connect: { id: data.assigneA } }
    }

    const updated = await prisma.tache.update({
      where: { id: data.id },
      data: { ...updateData, ...connect },
      include: {
        projet: { select: { titre: true } },
        assigneA: { select: { nom: true, prenom: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur update tâche:', error)
    const err: any = error
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la tâche' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    console.log('[DELETE] received id:', data.id, 'type:', typeof data.id)

    const existing = await prisma.tache.findUnique({ where: { id: data.id } })
    if (!existing) {
      console.warn('[DELETE] tâche introuvable (lookup) id:', data.id)
      return NextResponse.json({ error: `Tâche introuvable (id: ${data.id})` }, { status: 404 })
    }

    await prisma.tache.delete({ where: { id: data.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur suppression tâche:', error)
    const err: any = error
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }
    if (err.code === 'P2003') {
      return NextResponse.json({ error: "Impossible de supprimer la tâche : dépendances existantes (paiements/factures)." }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur lors de la suppression de la tâche' }, { status: 500 })
  }
}
