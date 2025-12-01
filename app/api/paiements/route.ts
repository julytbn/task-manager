import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const allParam = url.searchParams.get('all')

    const session = await getServerSession(authOptions)

    // Build base where clause: if employee, limit to payments for tasks assigned to them
    const where: any = {}
    if (session?.user?.role === 'EMPLOYE' && session.user.id) {
      // payments are linked to tasks; filter where tache.assigneAId == user id
      where.tache = { assigneAId: session.user.id }
    }

    if (allParam === 'true') {
      const allPayments = await prisma.paiement.findMany({
        where,
        orderBy: { datePaiement: 'desc' },
        include: { client: true, tache: true, projet: true }
      })

      // compute totals for this set
      const totals = allPayments.reduce(
        (acc, p) => {
          acc.total += p.montant || 0
          if (p.statut === 'CONFIRME') acc.paid += p.montant || 0
          else if (p.statut === 'EN_ATTENTE') acc.pending += p.montant || 0
          else acc.other += p.montant || 0
          return acc
        },
        { total: 0, paid: 0, pending: 0, other: 0 }
      )

      return NextResponse.json({ totals, payments: allPayments })
    }

    // Default behavior: recent + totals (for dashboard summary)
    const recent = await prisma.paiement.findMany({
      where,
      orderBy: { datePaiement: 'desc' },
      take: 10,
      include: { client: true, tache: true, projet: true }
    })

    const some = await prisma.paiement.findMany({ where, select: { montant: true, statut: true } })
    const totals = some.reduce(
      (acc, p) => {
        acc.total += p.montant || 0
        if (p.statut === 'CONFIRME') acc.paid += p.montant || 0
        else if (p.statut === 'EN_ATTENTE') acc.pending += p.montant || 0
        else acc.other += p.montant || 0
        return acc
      },
      { total: 0, paid: 0, pending: 0, other: 0 }
    )

    return NextResponse.json({ totals, recent })
  } catch (error) {
    console.error('GET /api/paiements error', error)
    return NextResponse.json({ error: 'Erreur récupération paiements' }, { status: 500 })
  }
}
