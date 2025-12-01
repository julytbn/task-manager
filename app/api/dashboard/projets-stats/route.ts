import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer tous les enums de statuts de projets
    const statutsEnum = await prisma.enumStatutProjet.findMany({
      where: { actif: true }
    })

    // Récupérer les projets avec toutes les informations nécessaires
    const projets = await prisma.projet.findMany({
      include: {
        client: true,
        service: true,
        taches: {
          include: {
            paiements: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    // Construire les données enrichies
    const statistics: {
      totalProjets: number
      projetsEnCours: number
      projetsTermines: number
      budgetTotal: number
      projetsEnCoursList: any[]
      projetsTerminesList: any[]
    } = {
      totalProjets: projets.length,
      projetsEnCours: 0,
      projetsTermines: 0,
      budgetTotal: 0,
      projetsEnCoursList: [],
      projetsTerminesList: []
    }

    projets.forEach(projet => {
      const budget = projet.budget || 0
      statistics.budgetTotal += budget

      // Récupérer le label du statut depuis l'enum
      const statutEnum = statutsEnum.find(s => s.cle === projet.statut)
      const statutLabel = statutEnum?.label || projet.statut

      const projectData = {
        id: projet.id,
        titre: projet.titre,
        description: projet.description,
        client: {
          id: projet.client.id,
          nom: projet.client.nom,
          prenom: projet.client.prenom,
          email: projet.client.email,
          telephone: projet.client.telephone
        },
        service: {
          id: projet.service.id,
          nom: projet.service.nom
        },
        statut: {
          cle: projet.statut,
          label: statutLabel
        },
        budget,
        dateDebut: projet.dateDebut,
        dateFin: projet.dateFin,
        dateEcheance: projet.dateEcheance,
        taches: {
          total: projet.taches.length,
          terminated: projet.taches.filter(t => t.statut === 'TERMINE').length,
          inProgress: projet.taches.filter(t => t.statut === 'EN_COURS').length,
          pending: projet.taches.filter(t => t.statut === 'A_FAIRE').length
        }
      }

      // Classifier par statut
      if (projet.statut === 'EN_COURS') {
        statistics.projetsEnCours++
        statistics.projetsEnCoursList.push(projectData)
      } else if (projet.statut === 'TERMINE') {
        statistics.projetsTermines++
        statistics.projetsTerminesList.push(projectData)
      }
    })

    // Formater le budget en FCFA
    const budgetFormatted = statistics.budgetTotal.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })

    return NextResponse.json({
      ...statistics,
      budgetTotalFormatted: budgetFormatted,
      statutsDisponibles: statutsEnum.map(s => ({
        cle: s.cle,
        label: s.label,
        ordre: s.ordre
      }))
    })
  } catch (error) {
    console.error('Erreur récupération statistiques projets:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
