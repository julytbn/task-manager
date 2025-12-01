import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/equipes/projects - assigner un projet à une équipe
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { equipeId, projetId } = body
    if (!equipeId || !projetId) return NextResponse.json({ error: 'equipeId et projetId requis' }, { status: 400 })

    const updated = await prisma.projet.update({
      where: { id: projetId },
      data: { equipeId }
    })

    return NextResponse.json({ ok: true, projet: { id: updated.id, titre: updated.titre, equipeId: updated.equipeId } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur assignation projet' }, { status: 500 })
  }
}

// DELETE /api/equipes/projects?equipeId=...&projetId=... - retirer assignation
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const equipeId = url.searchParams.get('equipeId')
    const projetId = url.searchParams.get('projetId')
    if (!equipeId || !projetId) return NextResponse.json({ error: 'params manquants' }, { status: 400 })

    await prisma.projet.update({
      where: { id: projetId },
      data: { equipeId: null }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur retrait projet' }, { status: 500 })
  }
}
