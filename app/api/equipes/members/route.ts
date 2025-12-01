import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/equipes/members - ajouter un membre { equipeId, utilisateurId, role }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { equipeId, utilisateurId, role } = body
    if (!equipeId || !utilisateurId) return NextResponse.json({ error: 'equipeId et utilisateurId requis' }, { status: 400 })

    // Vérifier existence
    const equipe = await prisma.equipe.findUnique({ where: { id: equipeId } })
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } })
    if (!equipe || !utilisateur) return NextResponse.json({ error: 'Equipe ou utilisateur introuvable' }, { status: 404 })

    const created = await prisma.membreEquipe.create({ data: { equipeId, utilisateurId, role: role || null } })
    return NextResponse.json({ ok: true, memberId: created.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur ajout membre' }, { status: 500 })
  }
}

// DELETE /api/equipes/members?equipeId=...&utilisateurId=... - retirer membre
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const equipeId = url.searchParams.get('equipeId')
    const utilisateurId = url.searchParams.get('utilisateurId')
    if (!equipeId || !utilisateurId) return NextResponse.json({ error: 'params manquants' }, { status: 400 })

    await prisma.membreEquipe.deleteMany({ where: { equipeId, utilisateurId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur suppression membre' }, { status: 500 })
  }
}
