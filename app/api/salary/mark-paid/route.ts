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
    const { montant, moyenPaiement, reference, clientId, factureId } = body;

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

    if (!clientId || !factureId) {
      return NextResponse.json(
        { error: 'Client ID et Facture ID requis' },
        { status: 400 }
      );
    }

    // ✅ Vérifier que la facture existe et calculer le montant restant
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        lignes: { select: { montant: true, type: true } },
        paiements: { select: { montant: true, statut: true } }
      }
    });

    if (!facture) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // ✅ Calculer le montant restant
    // Pour les abonnements: montantRestant = montantTotal - paiements
    // Pour les projets: montantRestant = montantMainDoeuvre - paiements
    const montantMainDoeuvre = facture.lignes
      .filter(ligne => ligne.type === 'MAIN_D_OEUVRE')
      .reduce((sum, ligne) => sum + (ligne.montant || 0), 0);

    const totalPaiementsExistants = facture.paiements
      .filter(p => p.statut === 'CONFIRME' || p.statut === 'EN_ATTENTE')
      .reduce((sum, p) => sum + (p.montant || 0), 0);

    let montantAFacturer = 0;
    if (facture.abonnementId) {
      montantAFacturer = facture.montant || 0;
    } else {
      montantAFacturer = montantMainDoeuvre;
    }

    const montantRestant = Math.max(0, montantAFacturer - totalPaiementsExistants);

    // ✅ Vérifier que le paiement ne dépasse pas le montant restant
    if (montant > montantRestant) {
      return NextResponse.json(
        {
          error: `Le montant ne peut pas dépasser ${montantRestant.toLocaleString('fr-FR')} FCFA (montant restant de la facture)`,
          montantRestant,
          montantDemande: montant
        },
        { status: 400 }
      );
    }

    // Créer le paiement
    const payment = await prisma.paiement.create({
      data: {
        montant,
        moyenPaiement,
        reference,
        clientId,
        factureId,
        statut: 'CONFIRME',
        datePaiement: new Date(),
        notes: 'Paiement des salaires',
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
