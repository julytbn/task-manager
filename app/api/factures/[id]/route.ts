import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        projet: true,
        abonnement: true,
        taches: {
          include: { assigneA: { select: { nom: true, prenom: true } } }
        },
        paiements: true,
        lignes: true,
        documentsRequis: true,
      }
    })

    if (!facture) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    // Calculer le montant payé (confirmés et en attente)
    const totalPaiements = facture.paiements
      .filter(p => p.statut === 'CONFIRME' || p.statut === 'EN_ATTENTE')
      .reduce((sum, p) => sum + (p.montant || 0), 0)

    // Calculer le montant de main d'œuvre (bénéfice) seulement
    const montantMainDoeuvre = facture.lignes
      .filter((ligne) => ligne.type === 'MAIN_D_OEUVRE')
      .reduce((sum, ligne) => sum + ligne.montant, 0)

    // Le montantTotal est ce qui doit être payé
    const montantTotal = facture.montant || 0

    // Le montantRestant = montantTotal - montantPayé
    const montantRestant = Math.max(0, montantTotal - totalPaiements)

    return NextResponse.json({
      ...facture,
      montantPaye: totalPaiements,
      montantMainDoeuvre,
      montantTotal,
      montantRestant
    })
  } catch (error) {
    console.error('Erreur récupération facture:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la facture' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    const session = await getServerSession(authOptions)

    const existing = await prisma.facture.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const updateData: any = {}
    if (data.statut !== undefined) updateData.statut = data.statut
    if (data.montant !== undefined) updateData.montant = data.montant
    if (data.tauxTVA !== undefined) updateData.tauxTVA = data.tauxTVA
    if (data.dateEcheance !== undefined) updateData.dateEcheance = data.dateEcheance ? new Date(data.dateEcheance) : null
    if (data.datePaiement !== undefined) updateData.datePaiement = data.datePaiement ? new Date(data.datePaiement) : null
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.description !== undefined) updateData.description = data.description
    if (data.conditionsPaiement !== undefined) updateData.conditionsPaiement = data.conditionsPaiement
    if (data.reference !== undefined) updateData.reference = data.reference
    if (data.montantEnLettres !== undefined) updateData.montantEnLettres = data.montantEnLettres
    if (data.signatureUrl !== undefined) updateData.signatureUrl = data.signatureUrl

    // Autorisation: Seuls ADMIN ou MANAGER peuvent valider une facture
    if ((data.dateValidation !== undefined || data.valideeParId !== undefined || data.statut === 'VALIDEE')) {
      if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
        return NextResponse.json({ error: 'Accès refusé: droits insuffisants' }, { status: 403 })
      }
      if (data.dateValidation !== undefined) updateData.dateValidation = data.dateValidation ? new Date(data.dateValidation) : null
      if (data.valideeParId !== undefined) updateData.valideeParId = data.valideeParId
    }

    // Mise à jour du montant
    if (data.montant !== undefined) {
      const montant = Number(data.montant) || 0
      updateData.montant = Number(montant.toFixed(2))
    }

    // Si lignes sont fournies, les remplacer (supprimer anciennes, créer nouvelles)
    if (Array.isArray(data.lignes) && data.lignes.length) {
      await prisma.factureLigne.deleteMany({ where: { factureId: params.id } })
      updateData.lignes = {
        create: data.lignes.map((l: any) => ({
          designation: l.designation,
          intervenant: l.intervenant || null,
          montantAPayer: Number(l.montantAPayer) || 0,
          montantGlobal: Number(l.montantGlobal) || (Number(l.montantAPayer) || 0),
          ordre: typeof l.ordre === 'number' ? l.ordre : 0,
        }))
      }
    }

    // Si documentsRequis sont fournis, les remplacer
    if (Array.isArray(data.documentsRequis) && data.documentsRequis.length) {
      await prisma.factureDocument.deleteMany({ where: { factureId: params.id } })
      updateData.documentsRequis = {
        create: data.documentsRequis.map((d: any) => ({
          nom: d.nom,
          obligatoire: !!d.obligatoire,
          notes: d.notes || null,
        }))
      }
    }

    const updated = await prisma.facture.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        projet: true,
        taches: true,
        paiements: true,
        lignes: true,
        documentsRequis: true,
      }
    })

    // Calculer la somme des paiements réels associés et déterminer le restant (>= 0)
    const sumResult = await prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { factureId: params.id }
    })
    const totalPaid = Number((sumResult._sum.montant ?? 0))
    const restantRaw = Number(updated.montant || 0) - totalPaid
    const restant = restantRaw > 0 ? Number(restantRaw.toFixed(2)) : 0

    // Retourner la facture mise à jour avec le champ calculé `restant`
    const responsePayload = { ...updated, restant }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('Erreur update facture:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la facture' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.facture.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    await prisma.facture.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur suppression facture:', error)
    const err = error as any
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Impossible de supprimer la facture : dépendances existantes' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la facture' },
      { status: 500 }
    )
  }
}
