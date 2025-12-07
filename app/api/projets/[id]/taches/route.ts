// app/api/projets/[id]/taches/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Récupérer toutes les tâches du projet
    const taches = await prisma.tache.findMany({
      where: {
        projetId: projectId
      },
      include: {
        assigneA: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            titre: true
          }
        },
        service: {
          select: {
            id: true,
            nom: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    // Formater les données pour le frontend
    const formattedTaches = taches.map((tache) => ({
      id: tache.id,
      titre: tache.titre,
      description: tache.description,
      statut: tache.statut,
      priorite: tache.priorite,
      dateEcheance: tache.dateEcheance,
      heuresEstimees: tache.heuresEstimees,
      heuresReelles: tache.heuresReelles,
      montant: tache.montant,
      facturable: tache.facturable,
      estPayee: tache.estPayee,
      assigneA: tache.assigneA ? {
        id: tache.assigneA.id,
        prenom: tache.assigneA.prenom,
        nom: tache.assigneA.nom,
        email: tache.assigneA.email
      } : null,
      service: tache.service ? {
        id: tache.service.id,
        nom: tache.service.nom
      } : null,
      dateCreation: tache.dateCreation,
      dateModification: tache.dateModification
    }))

    return NextResponse.json(formattedTaches)
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tâches' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    // Valider les données requises
    if (!body.titre || !body.titre.trim()) {
      return NextResponse.json(
        { error: 'Le titre de la tâche est requis' },
        { status: 400 }
      )
    }

    // Vérifier que le projet existe
    const project = await prisma.projet.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    // Créer la nouvelle tâche
    const newTache = await prisma.tache.create({
      data: {
        titre: body.titre,
        description: body.description || null,
        projetId: projectId,
        assigneAId: body.assigneAId || null,
        serviceId: body.serviceId || null,
        statut: body.statut || 'A_FAIRE',
        priorite: body.priorite || 'MOYENNE',
        dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
        montant: body.montant ? parseFloat(body.montant) : null,
        heuresEstimees: body.heuresEstimees ? parseFloat(body.heuresEstimees) : null,
        facturable: body.facturable ?? true
      },
      include: {
        assigneA: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    })

    // Formater la réponse
    const formattedTache = {
      id: newTache.id,
      titre: newTache.titre,
      description: newTache.description,
      statut: newTache.statut,
      priorite: newTache.priorite,
      dateEcheance: newTache.dateEcheance,
      heuresEstimees: newTache.heuresEstimees,
      montant: newTache.montant,
      facturable: newTache.facturable,
      assigneA: newTache.assigneA ? {
        id: newTache.assigneA.id,
        prenom: newTache.assigneA.prenom,
        nom: newTache.assigneA.nom,
        email: newTache.assigneA.email
      } : null,
      service: newTache.service ? {
        id: newTache.service.id,
        nom: newTache.service.nom
      } : null
    }

    return NextResponse.json(formattedTache, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la tâche' },
      { status: 500 }
    )
  }
}
