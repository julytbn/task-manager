import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/equipes/members - ajouter un membre { equipeId, utilisateurId, role }
 * Crée une notification et envoie un email de bienvenue
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { equipeId, utilisateurId, role } = body
    if (!equipeId || !utilisateurId) return NextResponse.json({ error: 'equipeId et utilisateurId requis' }, { status: 400 })

    // Vérifier existence
    const equipe = await prisma.equipe.findUnique({ 
      where: { id: equipeId },
      include: { lead: true, projets: true }
    })
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } })
    if (!equipe || !utilisateur) return NextResponse.json({ error: 'Equipe ou utilisateur introuvable' }, { status: 404 })

    // Vérifier si déjà membre
    const alreadyMember = await prisma.membreEquipe.findUnique({
      where: {
        equipeId_utilisateurId: {
          equipeId,
          utilisateurId
        }
      }
    })
    if (alreadyMember) return NextResponse.json({ error: 'Utilisateur est déjà membre' }, { status: 400 })

    const created = await prisma.membreEquipe.create({ 
      data: { equipeId, utilisateurId, role: role || 'MEMBRE' },
      include: { utilisateur: true, equipe: true }
    })
    
    // Créer notification interne
    const projet = equipe.projets?.[0]
    const notification = await (prisma as any).notification.create({
      data: {
        utilisateurId,
        titre: `Bienvenue dans l'équipe ${equipe.nom}`,
        message: `Vous avez été ajouté(e) à l'équipe **${equipe.nom}**${projet ? ` pour le projet **${projet.titre}**` : ''}.`,
        type: 'EQUIPE',
        lien: `/dashboard/manager/equipes?team=${equipeId}`
      }
    })

    // Préparer et envoyer l'email
    const leadName = equipe.lead ? `${equipe.lead.prenom} ${equipe.lead.nom}` : 'Le responsable'
    const projetText = projet ? `pour le projet ${projet.titre}` : ''
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/employe`

    const emailContent = `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e40af; margin: 0;">KEKELI GROUP</h1>
      </div>
      <h2 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">Bienvenue dans l'équipe ${equipe.nom}!</h2>
      
      <p>Bonjour <strong>${utilisateur.prenom} ${utilisateur.nom}</strong>,</p>
      
      <p>Vous avez été ajouté(e) à l'équipe <strong>${equipe.nom}</strong> ${projetText}.</p>
      
      <div style="background-color: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0; border-radius: 4px;">
        <p style="margin-top: 0;"><strong>📌 Détails de votre accès :</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Équipe :</strong> ${equipe.nom}</li>
          <li><strong>Description :</strong> ${equipe.description || 'N/A'}</li>
          <li><strong>Responsable :</strong> ${leadName}</li>
          <li><strong>Rôle attribué :</strong> Membre</li>
          <li><strong>Date d'accès :</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
        </ul>
      </div>

      <p><strong>📋 Prochaines étapes :</strong></p>
      <ol style="margin: 10px 0;">
        <li>Connectez-vous à votre <a href="${dashboardLink}" style="color: #1e40af; text-decoration: none;">tableau de bord</a></li>
        <li>Consultez les projets et tâches de votre équipe</li>
        <li>Collaborez avec vos collègues</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardLink}" style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Accéder au tableau de bord
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #666; margin-bottom: 5px;">
        <strong>Besoin d'aide ?</strong><br>
        Contactez votre responsable d'équipe ou l'équipe support.
      </p>
      <p style="font-size: 11px; color: #999; margin: 10px 0 0 0; text-align: center;">
        © 2025 KEKELI GROUP. Tous droits réservés.<br>
        Cet email a été généré automatiquement. Merci de ne pas répondre directement.
      </p>
    </div>
  </body>
</html>
    `

    // Envoyer l'email (async, ne pas bloquer la réponse)
    let emailPreviewUrl: string | undefined = undefined
    let emailError: string | undefined = undefined
    try {
      console.log(`[MEMBRES] Envoi email à: ${utilisateur.email}`)
      const result = await sendEmail({
        from: process.env.SMTP_FROM || 'noreply@kekeligroup.com',
        to: utilisateur.email!,
        subject: `Bienvenue dans l'équipe ${equipe.nom} 🚀`,
        html: emailContent
      })
      if ((result as any).provider === 'ethereal') {
        emailPreviewUrl = (result as any).previewUrl
        console.log('✉️ Email envoyé (ethereal preview):', emailPreviewUrl)
      } else {
        console.log(`✉️ Email SMTP envoyé à ${utilisateur.email}`)
      }
    } catch (err) {
      emailError = String(err)
      console.error('⚠️ Erreur envoi email:', err)
      // Ne pas bloquer l'ajout du membre si l'email échoue
    }
    
    return NextResponse.json({ 
      ok: true, 
      memberId: created.id,
      notification,
      emailPreviewUrl,
      emailError,
      message: emailError ? 'Collaborateur ajouté mais email non envoyé' : 'Collaborateur ajouté avec succès et email envoyé'
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur ajout membre' }, { status: 500 })
  }
}

// DELETE /api/equipes/members?equipeId=...&utilisateurId=... - retirer membre
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const equipeId = url.searchParams.get('equipeId')
    const utilisateurId = url.searchParams.get('utilisateurId')
    if (!equipeId || !utilisateurId) return NextResponse.json({ error: 'params manquants' }, { status: 400 })

    await prisma.membreEquipe.deleteMany({ where: { equipeId, utilisateurId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur suppression membre' }, { status: 500 })
  }
}
