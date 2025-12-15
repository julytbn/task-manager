import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includePaiements = searchParams.get('includePaiements') === 'true'
    const statusFilter = searchParams.get('status')

    const session = await getServerSession(authOptions)

    // Récupérer les factures avec les relations nécessaires
    const factures = await prisma.facture.findMany({
      where: statusFilter ? { 
        statut: { 
          in: statusFilter.split(',') as any[] // Conversion nécessaire pour le typage
        } 
      } : {},
      include: {
        client: { select: { id: true, nom: true } },
        projet: { 
          select: { 
            id: true, 
            titre: true,
            montantTotal: true,
            dateEcheance: true
          } 
        },
        abonnement: { select: { id: true, nom: true } },
        paiements: {
          select: {
            id: true,
            montant: true,
            datePaiement: true,
            statut: true
          },
          where: { statut: 'CONFIRME' } // Ne prendre que les paiements confirmés
        }
      },
      orderBy: { dateEmission: 'desc' }
    })

    console.log('Factures brutes de la base de données:', JSON.stringify(factures, null, 2));
    
    // Si on inclut les paiements, on calcule le montant restant pour chaque facture
    const facturesAvecMontantRestant = factures.map(facture => {
      if (!includePaiements) return facture
      
      // Calculer le total des paiements confirmés
      const totalPaiements = facture.paiements?.reduce(
        (sum: number, p: any) => sum + (p.montant || 0), 
        0
      ) || 0
      
      // Calculer le montant total (utiliser montant du projet si disponible, sinon montant de la facture)
      const montantTotal = facture.projet?.montantTotal || facture.montant || 0
      
      // Calculer le montant restant
      const montantRestant = montantTotal - totalPaiements
      
      // Formater la date d'échéance si elle existe
      const dateEcheance = facture.dateEcheance ? 
        new Date(facture.dateEcheance).toISOString().split('T')[0] : 
        (facture.projet?.dateEcheance ? 
          new Date(facture.projet.dateEcheance).toISOString().split('T')[0] : 
          null)
      
      const factureAvecMontants = {
        ...facture,
        montantPaye: totalPaiements,
        montantRestant: Math.max(0, montantRestant),
        dateEcheance: dateEcheance,
        montantTotal: montantTotal
      };
      
      console.log('Facture traitée:', {
        id: facture.id,
        numero: facture.numero,
        montantTotal: factureAvecMontants.montantTotal,
        montantPaye: factureAvecMontants.montantPaye,
        montantRestant: factureAvecMontants.montantRestant,
        dateEcheance: factureAvecMontants.dateEcheance,
        projet: facture.projet ? {
          id: facture.projet.id,
          titre: facture.projet.titre,
          montantTotal: facture.projet.montantTotal,
          dateEcheance: facture.projet.dateEcheance
        } : null
      });
      
      return factureAvecMontants;
    })

    console.log('Factures renvoyées par l\'API:', facturesAvecMontantRestant.length, 'factures');
    return NextResponse.json(facturesAvecMontantRestant)
  } catch (error) {
    console.error('Erreur récupération factures:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // ✅ Validation: au moins une source (abonnement ou projet)
    const hasSource = data.abonnementId || data.projetId
    if (!data.numero || !data.clientId || !data.montant || !hasSource) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (numero, clientId, montant, et une source: abonnement ou projet)' },
        { status: 400 }
      )
    }

    // ✅ Vérifier qu'une seule source est fournie
    const sourceCount = [data.abonnementId, data.projetId].filter(Boolean).length
    if (sourceCount > 1) {
      return NextResponse.json(
        { error: 'Une facture ne peut avoir qu\'UNE seule source (abonnement ou projet)' },
        { status: 400 }
      )
    }

    // Montant total sans TVA
    const montantTotal = data.montant

    // Prepare nested creates for lignes and documentsRequis when present
    const lignesCreate = Array.isArray(data.lignes) && data.lignes.length ? data.lignes.map((l: any) => ({
      designation: l.designation,
      intervenant: l.intervenant || null,
      montantAPayer: Number(l.montantAPayer) || 0,
      montantGlobal: Number(l.montantGlobal) || (Number(l.montantAPayer) || 0),
      ordre: typeof l.ordre === 'number' ? l.ordre : 0,
    })) : undefined

    const docsCreate = Array.isArray(data.documentsRequis) && data.documentsRequis.length ? data.documentsRequis.map((d: any) => ({
      nom: d.nom,
      obligatoire: !!d.obligatoire,
      notes: d.notes || null,
    })) : undefined

    const facture = await prisma.facture.create({
      data: {
        numero: data.numero,
        client: { connect: { id: data.clientId } },
        abonnement: data.abonnementId ? { connect: { id: data.abonnementId } } : undefined,
        projet: data.projetId ? { connect: { id: data.projetId } } : undefined,
        statut: data.statut || 'EN_ATTENTE',
        montant: data.montant,
        dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : undefined,
        notes: data.notes || null,
        description: data.description || null,
        conditionsPaiement: data.conditionsPaiement || null,
        reference: data.reference || null,
        montantEnLettres: data.montantEnLettres || null,
        lignes: lignesCreate ? { create: lignesCreate } : undefined,
        documentsRequis: docsCreate ? { create: docsCreate } : undefined,
      },
      include: {
        client: { select: { id: true, nom: true } },
        abonnement: { select: { id: true, nom: true } },
        projet: { select: { id: true, titre: true } }
      }
    })

    return NextResponse.json(facture, { status: 201 })
  } catch (error) {
    console.error('Erreur création facture:', error)
    const err = error as any
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Le numéro de facture existe déjà' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur lors de la création de la facture' },
      { status: 500 }
    )
  }
}
