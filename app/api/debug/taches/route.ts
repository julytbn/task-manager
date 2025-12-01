import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const t = await prisma.tache.findUnique({ where: { id } })
    if (!t) return NextResponse.json({ ok: false, found: false })
    return NextResponse.json({ ok: true, found: true, t })
  } catch (err) {
    console.error('Debug check error:', err)
    return NextResponse.json({ error: 'Erreur debug' }, { status: 500 })
  }
}
