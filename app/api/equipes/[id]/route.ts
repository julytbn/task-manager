import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const equipe = await prisma.equipe.findUnique({
      where: { id },
      include: { membres: { include: { utilisateur: true } }, lead: true, projets: true }
    })
    if (!equipe) return NextResponse.json({ error: 'Equipe non trouvée' }, { status: 404 })
    return NextResponse.json(equipe)
  } catch (error) {
    console.error('GET /api/equipes/[id] error', error)
    return NextResponse.json({ error: 'Failed to fetch equipe' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await request.json()

    // Update basic fields
    const updated = await prisma.equipe.update({
      where: { id },
      data: {
        nom: data.nom,
        description: data.description || null,
        leadId: data.leadId || null,
        objectifs: data.objectifs || null,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null
      }
    })

    // Replace members if provided
    if (Array.isArray(data.membres)) {
      await prisma.membreEquipe.deleteMany({ where: { equipeId: id } })
      const toCreate = data.membres.map((u:any) => ({ equipeId: id, utilisateurId: u, roleEquipe: 'MEMBRE' }))
      if (toCreate.length) await prisma.membreEquipe.createMany({ data: toCreate, skipDuplicates: true })
    }

    const equipe = await prisma.equipe.findUnique({ where: { id }, include: { membres: { include: { utilisateur: true } }, lead: true, projets: true } })
    return NextResponse.json(equipe)
  } catch (error) {
    console.error('PUT /api/equipes/[id] error', error)
    return NextResponse.json({ error: 'Failed to update equipe' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    await prisma.membreEquipe.deleteMany({ where: { equipeId: id } })
    await prisma.equipe.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/equipes/[id] error', error)
    return NextResponse.json({ error: 'Failed to delete equipe' }, { status: 500 })
  }
}
