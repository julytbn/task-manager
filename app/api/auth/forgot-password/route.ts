import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.utilisateur.findUnique({
      where: { email }
    })

    if (!user) {
      // Ne pas révéler si l'email existe ou non pour la sécurité
      return NextResponse.json(
        { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' },
        { status: 200 }
      )
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60) // 1 heure

    // Sauvegarder le token hashé
    await prisma.utilisateur.update({
      where: { email },
      data: {
        ...({
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: resetTokenExpires
        } as any)
      }
    })

    // Envoyer l'email de réinitialisation
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reinitialiser-mot-de-passe?token=${resetToken}`
    const emailContent = generatePasswordResetEmail(resetUrl, user.prenom)

    try {
      const emailResult = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      })

      if (emailResult.success) {
        console.log('✅ Email de réinitialisation envoyé à:', user.email)
        if ((emailResult as any).previewUrl) {
          console.log('📧 Aperçu de l\'email (Ethereal):', (emailResult as any).previewUrl)
        }
      } else {
        console.warn('⚠️ Impossible d\'envoyer l\'email:', (emailResult as any).error)
      }
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError)
      // Ne pas renvoyer d'erreur au client, juste logger
    }

    return NextResponse.json(
      { message: 'Un lien de réinitialisation a été envoyé à votre adresse email' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur forgot-password:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    )
  }
}
