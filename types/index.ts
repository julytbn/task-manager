// Réexportation de tous les types Prisma
export * from '@prisma/client'

// Types personnalisés pour l'application
export interface InscriptionData {
  nom: string
  prenom: string
  email: string
  telephone?: string
  departement?: string
  motDePasse: string
  confirmationMotDePasse: string
  dateNaissance?: string
}

export interface ConnexionData {
  email: string
  motDePasse: string
}

export interface StatistiquesDashboard {
  totalProjets: number
  projetsEnCours: number
  tachesEnRetard: number
  chiffreAffaires: number
  clientsActifs: number
}

export type Equipe = {
  id: string
  nom: string
  description?: string
  leadId?: string
  membres?: Array<{ id: string; utilisateur: { id: string; nom: string; prenom: string; email?: string } }>
}