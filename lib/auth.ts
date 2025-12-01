import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Vérification des variables d'environnement
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET manquant dans les variables d\'environnement')
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        motDePasse: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.motDePasse) {
          return null
        }

        const utilisateur = await prisma.utilisateur.findUnique({
          where: { email: credentials.email }
        })

        if (!utilisateur || !utilisateur.motDePasse) {
          return null
        }

        const motDePasseValide = await bcrypt.compare(
          credentials.motDePasse,
          utilisateur.motDePasse
        )

        if (!motDePasseValide) {
          return null
        }

        return {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.nom = user.nom
        token.prenom = user.prenom
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.nom = token.nom
        session.user.prenom = token.prenom
      }
      return session
    }
  },
  pages: {
    signIn: '/connexion',
    error: '/connexion',
  },
  debug: process.env.NODE_ENV === 'development',
}