import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Find tasks related to the equipe: tasks directly assigned to equipe OR tasks whose projet is assigned to equipe
    const tasks = await prisma.tache.findMany({
      where: {
        OR: [
          { equipeId: id },
          { projet: { equipeId: id } }
        ]
      },
      select: { id: true, statut: true, heuresEstimees: true, heuresReelles: true, assigneAId: true }
    })

    const total = tasks.length
    const done = tasks.filter(t => t.statut === 'TERMINE').length
    const percentComplete = total === 0 ? 0 : Math.round((done / total) * 100)

    // per-member stats
    const byMember: Record<string, { total: number; done: number }> = {}
    for (const t of tasks) {
      const key = t.assigneAId || 'unassigned'
      byMember[key] = byMember[key] || { total: 0, done: 0 }
      byMember[key].total += 1
      if (t.statut === 'TERMINE') byMember[key].done += 1
    }

    return NextResponse.json({ total, done, percentComplete, byMember })
  } catch (error) {
    console.error('GET /api/equipes/[id]/metrics error', error)
    return NextResponse.json({ error: 'Failed to compute metrics' }, { status: 500 })
  }
}
