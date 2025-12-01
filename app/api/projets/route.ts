// app/api/projets/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StatutProjet } from '@prisma/client'

type StatutProjetAffiche = 'en_cours' | 'termine' | 'en_retard';

export async function GET() {
  try {
    const projets = await prisma.projet.findMany({
      include: {
        client: true,
        taches: true,
        service: true
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    const projetsAvecStatut = projets.map(projet => {
      const totalTasks = projet.taches?.length || 0;
      const completed = totalTasks > 0 ? 
        projet.taches.filter(t => t.statut === 'TERMINE').length : 0;
      const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      // Gestion des statuts
      let status: StatutProjetAffiche = 'en_cours';
      const statutProjet = projet.statut as string;
      
      if (statutProjet === 'TERMINE' || statutProjet === 'ANNULE') {
        status = 'termine';
      } else if (statutProjet === 'EN_RETARD') {
        status = 'en_retard';
      }

      return {
        id: projet.id,
        title: projet.titre,
        client: projet.client ? {
          id: projet.client.id,
          nom: projet.client.nom,
          email: projet.client.email || undefined,
          telephone: projet.client.telephone || undefined
        } : null,
        service: projet.service ? {
          id: projet.service.id,
          nom: projet.service.nom
        } : null,
        status: status,
        progress,
        budget: projet.budget || null,
        frequencePaiement: projet.frequencePaiement,
        tasks: projet.taches ? projet.taches.map(t => ({
          id: t.id,
          title: t.titre,
          status: t.statut,
          createdAt: t.dateCreation?.toISOString() || '',
          updatedAt: t.dateModification?.toISOString() || ''
        })) : [],
        team: [],
        dateDebut: projet.dateDebut?.toISOString() || null,
        dateFin: projet.dateFin?.toISOString() || null,
        dateEcheance: projet.dateEcheance?.toISOString() || null,
        createdAt: projet.dateCreation?.toISOString() || '',
        updatedAt: projet.dateModification?.toISOString() || ''
      };
    });

    return NextResponse.json(projetsAvecStatut);
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. Validation des champs obligatoires
    if (!data.titre || !data.clientId || !data.serviceId) {
      return NextResponse.json(
        { error: 'Les champs titre, clientId et serviceId sont obligatoires' },
        { status: 400 }
      );
    }

    // 2. Validation du statut
    const statutsValides = ['PROPOSITION', 'EN_ATTENTE', 'EN_COURS', 'TERMINE', 'EN_RETARD', 'ANNULE'];
    if (data.statut && !statutsValides.includes(data.statut)) {
      return NextResponse.json(
        { error: `Statut invalide. Les statuts valides sont : ${statutsValides.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Création du projet
    const nouveauProjet = await prisma.projet.create({
      data: {
        titre: data.titre,
        description: data.description || null,
        client: { connect: { id: data.clientId } },
        service: { connect: { id: data.serviceId } },
        statut: data.statut || 'EN_COURS',
        frequencePaiement: data.frequencePaiement || 'PONCTUEL',
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        budget: data.budget ? parseFloat(data.budget) : null,
      },
      include: {
        client: true,
        service: true
      }
    });

    return NextResponse.json(nouveauProjet, { status: 201 });

  } catch (error) {
  console.error('Erreur création projet:', error);
  
  // Vérification du type d'erreur
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message?: string };
    
    // Gestion des erreurs Prisma
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un projet avec ce nom existe déjà' },
        { status: 400 }
      );
    }
    
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Client ou service introuvable' },
        { status: 404 }
      );
    }
  }

  // Gestion des autres types d'erreurs
  const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
  return NextResponse.json(
    { error: 'Erreur lors de la création du projet', details: errorMessage },
    { status: 500 }
  );
}
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}