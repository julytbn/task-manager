import { RoleUtilisateur } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      nom: string
      prenom: string
      role: RoleUtilisateur
    }
  }

  interface User {
    role: RoleUtilisateur
    nom: string
    prenom: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: RoleUtilisateur
    nom: string
    prenom: string
  }
}