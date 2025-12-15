import { NextResponse } from 'next/server';
import { recurringBillingService } from '@/lib/services/billing/recurringBillingService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/billing/recurring/generate
 * Déclenche manuellement la génération des factures récurrentes
 * (À utiliser pour les tests ou pour un déclenchement manuel)
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  
  // Vérifier les autorisations (seul un administrateur peut déclencher manuellement)
  if (!session?.user?.role || !['ADMIN', 'COMPTABLE'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 403 }
    );
  }

  try {
    // Exécuter la génération des factures récurrentes
    const results = await recurringBillingService.generateRecurringInvoices();
    
    return NextResponse.json({
      success: true,
      message: 'Génération des factures récurrentes terminée',
      results
    });
  } catch (error) {
    console.error('Erreur lors de la génération des factures récurrentes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération des factures récurrentes',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/recurring/status
 * Récupère le statut des prochaines facturations récurrentes
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  
  // Vérifier les autorisations
  if (!session?.user?.role || !['ADMIN', 'COMPTABLE'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 403 }
    );
  }

  try {
    // Récupérer les abonnements actifs avec leur prochaine date de facturation
    const activeSubscriptions = await prisma.abonnement.findMany({
      where: {
        statut: 'ACTIF',
        dateFin: {
          gte: new Date() // Seulement les abonnements non expirés
        }
      },
      select: {
        id: true,
        nom: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            nom: true,
            description: true
          }
        },
        montant: true,
        frequence: true,
        dateDebut: true,
        dateFin: true,
        dateProchainFacture: true,
        dernierPaiement: true,
        nombrePaiementsEffectues: true
      },
      orderBy: {
        dateProchainFacture: 'asc'
      }
    });

    // Récupérer les factures en retard
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = await prisma.facture.findMany({
      where: {
        statut: 'EN_ATTENTE',
        dateEcheance: {
          lt: today
        },
        paiements: {
          none: {}
        }
      },
      select: {
        id: true,
        numero: true,
        montant: true,
        dateEmission: true,
        dateEcheance: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true
          }
        },
        abonnement: {
          select: {
            id: true,
            nom: true
          }
        }
      },
      orderBy: {
        dateEcheance: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        activeSubscriptions,
        overdueInvoices,
        stats: {
          totalActiveSubscriptions: activeSubscriptions.length,
          totalOverdueInvoices: overdueInvoices.length,
          nextBillingDate: activeSubscriptions[0]?.dateProchainFacture || null,
          totalMonthlyRecurringRevenue: activeSubscriptions
            .filter(sub => sub.frequence === 'MENSUEL')
            .reduce((sum, sub) => sum + Number(sub.montant), 0),
          totalAnnualRecurringRevenue: activeSubscriptions
            .filter(sub => sub.frequence === 'ANNUEL')
            .reduce((sum, sub) => sum + Number(sub.montant), 0)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut des facturations récurrentes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du statut des facturations récurrentes',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
