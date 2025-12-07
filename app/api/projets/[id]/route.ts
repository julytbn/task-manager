// app/api/projets/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Vérifier si le projet existe
    const project = await prisma.projet.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le projet
    await prisma.projet.delete({
      where: { id: projectId }
    })

    return NextResponse.json(
      { message: 'Projet supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du projet' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    const project = await prisma.projet.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        service: true,
        taches: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du projet' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const data = await request.json()

    // Vérifier si le projet existe
    const project = await prisma.projet.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le projet
    const updatedProject = await prisma.projet.update({
      where: { id: projectId },
      data: {
        titre: data.titre || project.titre,
        description: data.description !== undefined ? data.description : project.description,
        clientId: data.clientId || project.clientId,
        serviceId: data.serviceId || project.serviceId,
        statut: data.statut || project.statut,
        budget: data.budget !== undefined ? data.budget : project.budget,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : project.dateDebut,
        dateFin: data.dateFin ? new Date(data.dateFin) : project.dateFin,
        equipeId: data.equipeId || project.equipeId,
        frequencePaiement: data.frequencePaiement || project.frequencePaiement,
        dateModification: new Date()
      },
      include: {
        client: true,
        service: true
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du projet' },
      { status: 500 }
    )
  }
}
