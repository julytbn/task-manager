import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Token et mot de passe requis' },
        { status: 400 }
      )
    }

    // Hasher le token pour le comparer
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Vérifier si l'utilisateur existe avec ce token et que le token n'est pas expiré
    const user = await prisma.utilisateur.findFirst({
      where: {
        ...({
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: {
            gt: new Date()
          }
        } as any)
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe et effacer le token
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        ...({
          motDePasse: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        } as any)
      }
    })

    return NextResponse.json(
      { message: 'Mot de passe réinitialisé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur reset-password:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    )
  }
}
