import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // ✅ Validation: factureId OBLIGATOIRE (changement clé de la refactorisation)
    if (!data.factureId || !data.montant) {
      return NextResponse.json({ error: 'Champs obligatoires manquants: factureId et montant sont requis' }, { status: 400 });
    }

    // ✅ Vérifier que la facture existe
    const facture = await prisma.facture.findUnique({
      where: { id: data.factureId },
      include: { 
        lignes: { select: { montant: true, type: true } },
        paiements: { select: { montant: true, statut: true } }
      }
    })
    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // ✅ Calculer le montant restant
    // montantRestant = montantTotal - montantPayé
    const montantMainDoeuvre = facture.lignes
      .filter(ligne => ligne.type === 'MAIN_D_OEUVRE')
      .reduce((sum, ligne) => sum + (ligne.montant || 0), 0);

    const totalPaiementsExistants = facture.paiements
      .filter(p => p.statut === 'CONFIRME' || p.statut === 'EN_ATTENTE')
      .reduce((sum, p) => sum + (p.montant || 0), 0);

    const montantTotal = facture.montant || 0;
    const montantRestant = Math.max(0, montantTotal - totalPaiementsExistants);

    // ✅ Vérifier que le nouveau paiement ne dépasse pas le montant restant
    if (data.montant > montantRestant) {
      return NextResponse.json({
        error: `Le montant ne peut pas dépasser ${montantRestant.toLocaleString('fr-FR')} FCFA (montant restant de la facture)`,
        montantRestant,
        montantDemande: data.montant
      }, { status: 400 });
    }

    // Créer le paiement avec statut initial EN_ATTENTE
    let paiement = await prisma.paiement.create({
      data: {
        montant: data.montant,
        moyenPaiement: data.moyenPaiement || 'VIREMENT_BANCAIRE',
        datePaiement: data.datePaiement ? new Date(data.datePaiement) : new Date(),
        statut: 'EN_ATTENTE',
        factureId: data.factureId,  // ✅ OBLIGATOIRE
        clientId: facture.clientId, // ✅ Hérité de la facture
        notes: data.notes || null,
        reference: data.reference || null,
      },
      include: { facture: true, client: true }
    });

    // ✅ Mettre à jour le statut de la facture et du paiement
    const paiementsFacture = await prisma.paiement.findMany({
      where: { factureId: data.factureId },
    });
    const totalPayé = paiementsFacture.reduce((sum, p) => sum + (p.montant || 0), 0);

    // Déterminer le statut en fonction du montant total de la facture
    let nouveauStatutFacture: 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' = 'EN_ATTENTE';
    let nouveauStatutPaiement: 'EN_ATTENTE' | 'CONFIRME' = 'EN_ATTENTE';
    
    if (totalPayé >= montantTotal) {
      // Facture entièrement payée (montant total atteint)
      nouveauStatutFacture = 'PAYEE';
      nouveauStatutPaiement = 'CONFIRME';
    } else if (totalPayé >= montantMainDoeuvre) {
      // La main-d'œuvre est couverte, mais pas la totalité de la facture
      nouveauStatutFacture = 'PARTIELLEMENT_PAYEE';
      nouveauStatutPaiement = 'CONFIRME';
    } else if (totalPayé > 0) {
      // Paiement partiel ne couvrant pas la main-d'œuvre
      nouveauStatutFacture = 'EN_ATTENTE';
      nouveauStatutPaiement = 'EN_ATTENTE';
    }

    // Mettre à jour la facture
    await prisma.facture.update({
      where: { id: data.factureId },
      data: { statut: nouveauStatutFacture }
    });

    // Mettre à jour le paiement créé
    paiement = await prisma.paiement.update({
      where: { id: paiement.id },
      data: { statut: nouveauStatutPaiement },
      include: { facture: true, client: true }
    });

    return NextResponse.json({ paiement });
  } catch (error) {
    console.error('Erreur création paiement:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du paiement', details: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const allParam = url.searchParams.get('all')

    // Build base where clause
    const where: any = {}
    
    // Try to get session, but don't fail if it errors
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.role === 'EMPLOYE' && session.user.id) {
        where.tache = { assigneAId: session.user.id }
      }
    } catch (e) {
      console.log('Session fetch failed, continuing without session filter')
    }

    if (allParam === 'true') {
      try {
        const allPayments = await prisma.paiement.findMany({
          where,
          include: { 
            client: true, 
            tache: {
              include: {
                projet: true
              }
            },
            projet: {
              include: {
                projetServices: {
                  include: {
                    service: true
                  },
                  orderBy: { ordre: 'asc' }
                }
              }
            }, 
            facture: {
              include: {
                paiements: true,
                projet: {
                  include: {
                    projetServices: {
                      include: {
                        service: true
                      },
                      orderBy: { ordre: 'asc' }
                    }
                  }
                },
                client: true
              }
            }
          },
          orderBy: {
            datePaiement: 'desc'
          }
        })

        // compute totals for this set
        const totals = allPayments.reduce(
          (acc, p) => {
            acc.total += p.montant || 0
            if (p.statut === 'CONFIRME') acc.paid += p.montant || 0
            else if (p.statut === 'EN_ATTENTE') acc.pending += p.montant || 0
            else acc.other += p.montant || 0
            return acc
          },
          { total: 0, paid: 0, pending: 0, other: 0 }
        )

        return NextResponse.json({ totals, payments: allPayments })
      } catch (err) {
        console.error('Error fetching all payments:', err)
        return NextResponse.json({ totals: { total: 0, paid: 0, pending: 0, other: 0 }, payments: [] })
      }
    }

    // Default behavior: recent + totals (for dashboard summary)
    try {
      const recent = await prisma.paiement.findMany({
        where,
        take: 10,
        include: { 
          client: true, 
          tache: {
            include: {
              projet: true
            }
          },
          projet: {
            include: {
              projetServices: {
                include: {
                  service: true
                },
                orderBy: { ordre: 'asc' }
              }
            }
          },
          facture: {
            include: {
              projet: {
                include: {
                  projetServices: {
                    include: {
                      service: true
                    },
                    orderBy: { ordre: 'asc' }
                  }
                }
              },
              client: true,
              paiements: true
            }
          }
        }
      })

      const some = await prisma.paiement.findMany({ where, select: { montant: true, statut: true } })
      const totals = some.reduce(
        (acc, p) => {
          acc.total += p.montant || 0
          if (p.statut === 'CONFIRME') acc.paid += p.montant || 0
          else if (p.statut === 'EN_ATTENTE') acc.pending += p.montant || 0
          else acc.other += p.montant || 0
          return acc
        },
        { total: 0, paid: 0, pending: 0, other: 0 }
      )

      return NextResponse.json({ totals, recent })
    } catch (err) {
      console.error('Error fetching recent payments:', err)
      return NextResponse.json({ totals: { total: 0, paid: 0, pending: 0, other: 0 }, recent: [] })
    }
  } catch (error) {
    console.error('GET /api/paiements error', error)
    return NextResponse.json({ error: 'Erreur récupération paiements', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    // 1. Récupérer le paiement avec les infos de la facture avant suppression
    const paiementASupprimer = await prisma.paiement.findUnique({
      where: { id },
      include: {
        facture: {
          include: {
            paiements: true,
            lignes: true
          }
        }
      }
    });

    if (!paiementASupprimer) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
    }

    const facture = paiementASupprimer.facture;
    if (!facture) {
      // Si la facture n'existe pas, on supprime simplement le paiement
      const paiement = await prisma.paiement.delete({
        where: { id }
      });
      return NextResponse.json({ success: true, paiement });
    }

    // 2. Calculer le montant total de la facture à partir des lignes
    const montantTotalFacture = facture.lignes.reduce(
      (total, ligne) => total + (ligne.montant || 0), 0
    );

    // 3. Supprimer le paiement
    const paiement = await prisma.paiement.delete({
      where: { id }
    });
    
    // 4. Récupérer les paiements restants pour cette facture
    const paiementsRestants = await prisma.paiement.findMany({
      where: { factureId: facture.id }
    });
    
    // 5. Calculer le nouveau montant payé
    const totalPaye = paiementsRestants.reduce((sum, p) => sum + (p.montant || 0), 0);
    
    // 6. Calculer le montant de la main-d'œuvre
    const montantMainDoeuvre = facture.lignes
      .filter(ligne => ligne.type === 'MAIN_D_OEUVRE')
      .reduce((sum, ligne) => sum + (ligne.montant || 0), 0);
    
    // 7. Déterminer le nouveau statut
    let nouveauStatut: 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' = 'EN_ATTENTE';
    
    if (totalPaye >= montantTotalFacture) {
      nouveauStatut = 'PAYEE';
    } else if (totalPaye > 0) {
      if (totalPaye >= montantMainDoeuvre) {
        nouveauStatut = 'PARTIELLEMENT_PAYEE';
      } else {
        nouveauStatut = 'EN_ATTENTE';
      }
    }
    
    // 8. Mettre à jour la facture avec le nouveau statut
    await prisma.facture.update({
      where: { id: facture.id },
      data: { 
        statut: nouveauStatut
      }
    });
    
    // Mettre à jour les montants via une requête brute si nécessaire
    await prisma.$executeRaw`
      UPDATE "Facture" 
      SET 
        "montantPaye" = ${totalPaye},
        "montantRestant" = ${Math.max(0, montantTotalFacture - totalPaye)}
      WHERE id = ${facture.id}
    `;

    return NextResponse.json({ 
      success: true, 
      paiement,
      message: 'Paiement supprimé et statut de la facture mis à jour',
      facture: {
        id: facture.id,
        statut: nouveauStatut,
        montantPaye: totalPaye,
        montantRestant: Math.max(0, montantTotalFacture - totalPaye)
      }
    });
  } catch (error) {
    console.error('DELETE /api/paiements error', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du paiement',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
