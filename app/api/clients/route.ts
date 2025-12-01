import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { nom: 'asc' } })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('GET /api/clients error', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    if (!data.nom || !data.prenom) {
      return NextResponse.json({ error: 'nom et prenom requis' }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || null,
        telephone: data.telephone || null,
        entreprise: data.entreprise || null,
        adresse: data.adresse || null,
        type: data.type || 'PARTICULIER',
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('POST /api/clients error', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const updated = await prisma.client.update({
      where: { id: data.id },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || null,
        telephone: data.telephone || null,
        entreprise: data.entreprise || null,
        adresse: data.adresse || null,
        type: data.type,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/clients error', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    await prisma.client.delete({ where: { id: data.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/clients error', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
