import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const role = searchParams.get('role')

    // Construire le filtre where
    const where: any = {}
    if (role) {
      where.role = role
    }

    const users = await prisma.utilisateur.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
      },
      orderBy: { nom: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    })
  } catch (error) {
    console.error('GET /api/utilisateurs error', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch utilisateurs' 
    }, { status: 500 })
  }
}
