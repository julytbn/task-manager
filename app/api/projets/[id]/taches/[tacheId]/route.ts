// app/api/projets/[id]/taches/[tacheId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tacheId: string } }
) {
  try {
    const { id: projectId, tacheId } = params

    // Vérifier que la tâche existe et appartient au projet
    const tache = await prisma.tache.findUnique({
      where: { id: tacheId }
    })

    if (!tache || tache.projetId !== projectId) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer la tâche
    await prisma.tache.delete({
      where: { id: tacheId }
    })

    return NextResponse.json(
      { message: 'Tâche supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la tâche' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; tacheId: string } }
) {
  try {
    const { id: projectId, tacheId } = params

    const tache = await prisma.tache.findUnique({
      where: { id: tacheId },
      include: {
        assigneA: true,
        service: true
      }
    })

    if (!tache || tache.projetId !== projectId) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(tache)
  } catch (error) {
    console.error('Erreur lors de la récupération de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la tâche' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; tacheId: string } }
) {
  try {
    const { id: projectId, tacheId } = params
    const data = await request.json()

    const tache = await prisma.tache.findUnique({
      where: { id: tacheId }
    })

    if (!tache || tache.projetId !== projectId) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    const updatedTache = await prisma.tache.update({
      where: { id: tacheId },
      data: {
        titre: data.titre || tache.titre,
        description: data.description !== undefined ? data.description : tache.description,
        statut: data.statut || tache.statut,
        priorite: data.priorite || tache.priorite,
        dateModification: new Date()
      },
      include: {
        assigneA: true,
        service: true
      }
    })

    return NextResponse.json(updatedTache)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la tâche' },
      { status: 500 }
    )
  }
}
