import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/utilisateurs/available - liste des utilisateurs disponibles (non dans une équipe ou actifs)
export async function GET() {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      where: { actif: true },
      select: { id: true, nom: true, prenom: true, email: true, role: true }
    })

    return NextResponse.json(utilisateurs)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur chargement utilisateurs' }, { status: 500 })
  }
}
