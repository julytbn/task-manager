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
        projetServices: {
          include: { service: true },
          orderBy: { ordre: 'asc' }
        },
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

    // Gérer les services si fournis
    let montantTotal = project.montantTotal
    if (data.serviceIds && Array.isArray(data.serviceIds)) {
      // Vérifier que tous les services existent
      const services = await prisma.service.findMany({
        where: { id: { in: data.serviceIds } }
      })

      if (services.length !== data.serviceIds.length) {
        return NextResponse.json(
          { error: 'Certains services n\'existent pas' },
          { status: 400 }
        )
      }

      // Supprimer les anciennes relations
      await prisma.projetService.deleteMany({
        where: { projetId: projectId }
      })

      // Créer les nouvelles relations
      for (const [index, serviceId] of data.serviceIds.entries()) {
        const service = services.find(s => s.id === serviceId)
        await prisma.projetService.create({
          data: {
            projetId: projectId,
            serviceId: serviceId,
            montant: service?.prix || 0,
            ordre: index + 1
          }
        })
      }

      // Calculer le nouveau montantTotal
      montantTotal = services.reduce((sum, s) => sum + (s.prix || 0), 0)
    }

    // Mettre à jour le projet
    const updatedProject = await prisma.projet.update({
      where: { id: projectId },
      data: {
        titre: data.titre || project.titre,
        description: data.description !== undefined ? data.description : project.description,
        clientId: data.clientId || project.clientId,
        statut: data.statut || project.statut,
        budget: data.budget !== undefined ? data.budget : project.budget,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : project.dateDebut,
        dateFin: data.dateFin ? new Date(data.dateFin) : project.dateFin,
        equipeId: data.equipeId || project.equipeId,
        montantTotal: montantTotal,
        dateModification: new Date()
      },
      include: {
        client: true,
        projetServices: {
          include: { service: true },
          orderBy: { ordre: 'asc' }
        }
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
