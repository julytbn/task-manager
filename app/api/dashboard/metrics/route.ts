import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const total = await prisma.tache.count()

    const [aFaire, enCours, enRevision, terminee, annule] = await Promise.all([
      prisma.tache.count({ where: { statut: 'A_FAIRE' } }),
      prisma.tache.count({ where: { statut: 'EN_COURS' } }),
      prisma.tache.count({ where: { statut: 'EN_REVISION' } }),
      prisma.tache.count({ where: { statut: 'TERMINE' } }),
      prisma.tache.count({ where: { statut: 'ANNULE' } }),
    ])

    const paid = await prisma.tache.count({ where: { estPayee: true } })

    const montantAgg = await prisma.tache.aggregate({ _sum: { montant: true } })
    const totalMontant = montantAgg._sum?.montant ?? 0

    const paidMontantAgg = await prisma.tache.aggregate({ where: { estPayee: true }, _sum: { montant: true } })
    const paidMontant = paidMontantAgg._sum?.montant ?? 0

    const recent = await prisma.tache.findMany({
      orderBy: { dateCreation: 'desc' },
      take: 5,
      include: {
        projet: { select: { titre: true } },
        assigneA: { select: { prenom: true, nom: true } }
      }
    })

    return NextResponse.json({
      total,
      counts: { aFaire, enCours, enRevision, terminee, annule },
      paid,
      totalMontant,
      paidMontant,
      recent
    })
  } catch (error) {
    console.error('GET /api/dashboard/metrics error', error)
    return NextResponse.json({ error: 'Failed to compute metrics' }, { status: 500 })
  }
}
