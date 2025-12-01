import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.utilisateur.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
      },
      orderBy: { nom: 'asc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('GET /api/utilisateurs error', error)
    return NextResponse.json({ error: 'Failed to fetch utilisateurs' }, { status: 500 })
  }
}
