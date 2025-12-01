import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/equipes - liste des équipes avec membresCount et projets
export async function GET() {
  try {
    const equipes = await prisma.equipe.findMany({
      include: {
        membres: { include: { utilisateur: true } },
        projets: true,
        lead: true
      },
      orderBy: { dateCreation: 'desc' }
    })

    const result = equipes.map((e) => ({
      id: e.id,
      name: e.nom,
      description: e.description,
      lead: e.lead ? `${e.lead.prenom} ${e.lead.nom}` : null,
      leadId: e.leadId || null,
      membersCount: e.membres ? e.membres.length : 0,
      members: e.membres ? e.membres.map((m) => ({ id: m.utilisateurId, name: `${m.utilisateur.prenom} ${m.utilisateur.nom}`, role: m.role, email: m.utilisateur.email })) : [],
      projects: e.projets ? e.projets.map((p) => p.titre) : [],
      createdAt: e.dateCreation,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/equipes - créer une équipe
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, leadId } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: "Le nom de l'équipe est requis" }, { status: 400 })
    }

    const equipe = await prisma.equipe.create({
      data: {
        nom: name,
        description: description || null,
        leadId: leadId || null,
      },
      include: { lead: true }
    })

    const leadName = equipe.lead ? `${equipe.lead.prenom} ${equipe.lead.nom}` : null

    return NextResponse.json({ id: equipe.id, name: equipe.nom, description: equipe.description, lead: leadName, leadId: equipe.leadId, membersCount: 0, members: [], projects: [], createdAt: equipe.dateCreation })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur création équipe' }, { status: 500 })
  }
}

// PUT /api/equipes - modifier (attend body { id, name?, leadId? })
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, leadId } = body
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const data: any = {}
    if (name) data.nom = name
    if (leadId) data.leadId = leadId

    const updated = await prisma.equipe.update({ where: { id }, data })

    return NextResponse.json({ id: updated.id, name: updated.nom, description: updated.description, lead: updated.leadId, createdAt: updated.dateCreation })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
  }
}

// DELETE /api/equipes?id=... - supprimer une équipe
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

    // Supprimer les membres d'équipe d'abord
    await prisma.membreEquipe.deleteMany({ where: { equipeId: id } })
    // Optionnel: détacher projets
    await prisma.projet.updateMany({ where: { equipeId: id }, data: { equipeId: null } })
    await prisma.equipe.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
  }
}
