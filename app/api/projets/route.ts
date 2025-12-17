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
        projetServices: {
          include: { service: true },
          orderBy: { ordre: 'asc' }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    const projetsAvecStatut = projets.map(projet => {
      const totalTasks = projet.taches?.length || 0;

      // Calculer la progression en pondérant le statut des tâches
      // TERMINE -> 100, EN_COURS -> 50, autre -> 0
      const taskScores: number[] = (projet.taches || []).map(t => {
        const s = (t.statut || '').toString().toUpperCase();
        if (s.includes('TERMINE')) return 100;
        if (s.includes('EN_COURS') || s.includes('ENCOURS') || s.includes('PROGRESS')) return 50;
        return 0;
      });

      const progress = totalTasks > 0 ? Math.round(taskScores.reduce((a, b) => a + b, 0) / totalTasks) : 0;

      return {
        id: projet.id,
        titre: projet.titre,
        // exposer l'enum brut tel qu'en base (ex: 'EN_COURS', 'TERMINE')
        statut: projet.statut || null,
        client: projet.client ? {
          id: projet.client.id,
          nom: projet.client.nom,
          email: projet.client.email || undefined,
          telephone: projet.client.telephone || undefined
        } : null,
        // ✅ Inclure les services du projet
        projetServices: projet.projetServices ? projet.projetServices.map(ps => ({
          id: ps.id,
          serviceId: ps.serviceId,
          montant: ps.montant,
          ordre: ps.ordre,
          service: ps.service ? {
            id: ps.service.id,
            nom: ps.service.nom
          } : null
        })) : [],
        montantTotal: projet.montantTotal || null,
        progress,
        budget: projet.budget || null,
        taches: projet.taches ? projet.taches.map(t => ({
          id: t.id,
          titre: t.titre,
          statut: t.statut,
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

    return NextResponse.json({
      success: true,
      data: projetsAvecStatut,
      count: projetsAvecStatut.length
    });
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
    const serviceIds = Array.isArray(data.serviceIds) ? data.serviceIds : (data.serviceId ? [data.serviceId] : []);
    
    if (!data.titre || !data.clientId || serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Les champs titre, clientId et au moins un serviceId sont obligatoires' },
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

    // 3. Vérifier que les services existent
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: 'Un ou plusieurs services n\'existent pas' },
        { status: 404 }
      );
    }

    // 4. Créer le projet
    const nouveauProjet = await prisma.projet.create({
      data: {
        titre: data.titre,
        description: data.description || null,
        client: { connect: { id: data.clientId } },
        statut: data.statut || 'EN_COURS',
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        budget: data.budget ? parseFloat(data.budget) : null,
      }
    });

    // 5. Créer les associations ProjetService
    let montantTotal = 0;
    for (const [idx, serviceId] of serviceIds.entries()) {
      const service = services.find(s => s.id === serviceId)!;
      const montant = service.prix || 0;
      montantTotal += montant;

      await prisma.projetService.create({
        data: {
          projetId: nouveauProjet.id,
          serviceId,
          montant,
          ordre: idx + 1,
        },
      });
    }

    // 6. Mettre à jour montantTotal du projet
    const projetFinal = await prisma.projet.update({
      where: { id: nouveauProjet.id },
      data: { montantTotal },
      include: {
        projetServices: {
          include: { service: true },
          orderBy: { ordre: 'asc' }
        },
        client: true,
      }
    });

    return NextResponse.json(projetFinal, { status: 201 });

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
  // Configuration CORS sécurisée - ne pas utiliser '*' en production
  const origin = process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || '') 
    : 'http://localhost:3001';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}