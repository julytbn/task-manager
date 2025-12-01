import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { utilisateurId, role } = await request.json()

    if (!utilisateurId) {
      return NextResponse.json({ error: 'utilisateurId requis' }, { status: 400 })
    }

    // Récupérer l'équipe, l'utilisateur et le lead
    const [equipe, utilisateur] = await Promise.all([
      prisma.equipe.findUnique({
        where: { id },
        include: { lead: true, projets: true }
      }),
      prisma.utilisateur.findUnique({
        where: { id: utilisateurId }
      })
    ])

    if (!equipe) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 })
    }

    if (!utilisateur) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier si l'utilisateur est déjà membre
    const alreadyMember = await prisma.membreEquipe.findUnique({
      where: {
        equipeId_utilisateurId: {
          equipeId: id,
          utilisateurId
        }
      }
    })

    if (alreadyMember) {
      return NextResponse.json({ error: 'Utilisateur est déjà membre de l\'équipe' }, { status: 400 })
    }

    // Ajouter le membre à l'équipe
    const membre = await prisma.membreEquipe.create({
      data: {
        equipeId: id,
        utilisateurId,
        role: role || 'MEMBRE'
      },
      include: { utilisateur: true, equipe: true }
    })

    // Créer une notification interne
    const projet = equipe.projets?.[0]
    // cast prisma to any to avoid TypeScript compile error if generated client types
    // are not picked up by the TypeScript server yet.
    const notification = await (prisma as any).notification.create({
      data: {
        utilisateurId,
        titre: `Bienvenue dans l'équipe ${equipe.nom}`,
        message: `Vous avez été ajouté(e) à l'équipe **${equipe.nom}**${projet ? ` pour le projet **${projet.titre}**` : ''}.`,
        type: 'EQUIPE',
        lien: `/dashboard/manager/equipes?team=${id}`
      }
    })

    // Préparer l'email
    const leadName = equipe.lead ? `${equipe.lead.prenom} ${equipe.lead.nom}` : 'Le responsable'
    const projetText = projet ? `pour le projet **${projet.titre}**` : ''
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/employe`

    const emailContent = `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
      <h2 style="color: #1e40af;">Bienvenue dans l'équipe ${equipe.nom}!</h2>
      
      <p>Bonjour <strong>${utilisateur.prenom} ${utilisateur.nom}</strong>,</p>
      
      <p>Vous avez été ajouté(e) à l'équipe <strong>${equipe.nom}</strong> ${projetText}.</p>
      
      <div style="background-color: #fff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0;">
        <p><strong>📌 Détails :</strong></p>
        <ul>
          <li><strong>Équipe :</strong> ${equipe.nom}</li>
          <li><strong>Description :</strong> ${equipe.description || 'N/A'}</li>
          <li><strong>Responsable :</strong> ${leadName}</li>
          <li><strong>Rôle attribué :</strong> ${role || 'Membre'}</li>
          <li><strong>Date d'ajout :</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
        </ul>
      </div>

      <p>📅 <strong>Prochaines étapes :</strong></p>
      <ul>
        <li>Connectez-vous à votre tableau de bord</li>
        <li>Consultez les tâches qui vous ont été assignées</li>
        <li>Collaborez avec votre équipe</li>
      </ul>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${dashboardLink}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Accéder à mon tableau de bord
        </a>
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 12px; color: #666;">
        © 2025 Kekeli Group. Tous droits réservés.<br>
        Si vous avez des questions, contactez votre responsable d'équipe.
      </p>
    </div>
  </body>
</html>
    `

    // Envoyer l'email (async, ne pas bloquer la réponse)
    let emailPreviewUrl: string | undefined = undefined
    try {
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
        console.log(`✉️ Email envoyé via SMTP à ${utilisateur.email}`)
      }
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email:', emailError)
      // Ne pas bloquer l'ajout du membre si l'email échoue
    }

    return NextResponse.json({
      success: true,
      membre,
      notification,
      emailPreviewUrl,
      message: 'Collaborateur ajouté avec succès'
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/equipes/[id]/membres error', error)
    return NextResponse.json({ error: 'Erreur lors de l\'ajout du collaborateur' }, { status: 500 })
  }
}
