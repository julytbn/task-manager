import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/salary/mark-paid
 * Crée un paiement pour marquer les salaires comme payés
 * Accessible par ADMIN et MANAGER
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier l'authentification
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier les droits (ADMIN ou MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { montant, moyenPaiement, reference } = body;

    // Valider les données
    if (!montant || montant <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    if (!moyenPaiement) {
      return NextResponse.json(
        { error: 'Moyen de paiement requis' },
        { status: 400 }
      );
    }

    if (!reference) {
      return NextResponse.json(
        { error: 'Référence requise' },
        { status: 400 }
      );
    }

    // Créer le paiement
    const payment = await prisma.paiement.create({
      data: {
        montant,
        moyenPaiement,
        reference,
        statut: 'EFFECTUE',
        datePaiement: new Date(),
        notes: 'Paiement des salaires',
        // Note: À adapter selon votre schema - peut nécessiter un factureId ou autre
        // Vous pouvez ajouter une facture fictive ou modifier le schema
      },
    });

    // Créer une notification pour confirmer
    const currentMonthDate = new Date();
    currentMonthDate.setDate(1);

    await prisma.notification.create({
      data: {
        utilisateurId: session.user.id || '',
        titre: '✅ Paiement des salaires enregistré',
        message: `Un paiement de ${montant.toLocaleString('fr-FR')} FCFA a été enregistré (Ref: ${reference})`,
        type: 'SUCCES',
        sourceType: 'SALARY_PAYMENT',
      },
    });

    return NextResponse.json(
      {
        success: true,
        payment,
        message: 'Paiement enregistré avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error marking salary as paid:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
