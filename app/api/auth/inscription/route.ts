import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Début de l'inscription...")
    type Body = {
      nom: string
      prenom: string
      email: string
      telephone?: string
      departement?: string
      motDePasse: string
      dateNaissance?: string
    }

    const body = (await request.json()) as Body
    const { nom, prenom, email, telephone, departement, motDePasse, dateNaissance } = body

    console.log('📋 Données reçues:', { nom, prenom, email })

    // Validation des données
    if (!nom || !prenom || !email || !motDePasse) {
      console.log('❌ Champs manquants')
      return NextResponse.json({ message: 'Tous les champs obligatoires doivent être remplis' }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const utilisateurExistant = await prisma.utilisateur.findUnique({ where: { email } })

    if (utilisateurExistant) {
      console.log('❌ Utilisateur existe déjà:', email)
      return NextResponse.json({ message: 'Un utilisateur avec cet email existe déjà' }, { status: 400 })
    }

    // Hasher le mot de passe
    console.log('🔐 Hachage du mot de passe...')
    const motDePasseHash = await bcrypt.hash(motDePasse, 12)

    // Créer l'utilisateur en utilisant l'enum RoleUtilisateur
    console.log("👤 Création de l'utilisateur...")
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        telephone: telephone || null,
        departement: departement || null,
        motDePasse: motDePasseHash,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        emailVerifie: new Date(),
      },
    })

    console.log('✅ Utilisateur créé avec ID:', utilisateur.id)

    // Retourner la réponse sans le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse: _pwd, ...utilisateurSansMotDePasse } = utilisateur

    return NextResponse.json({ message: 'Inscription réussie', utilisateur: utilisateurSansMotDePasse }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Erreur inscription:', message)
    return NextResponse.json({ message: `Erreur lors de l'inscription: ${message}` }, { status: 500 })
  }
}