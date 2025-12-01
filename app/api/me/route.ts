import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.utilisateur.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        departement: true,
        membresEquipes: {
          select: {
            equipe: {
              select: {
                id: true,
                nom: true,
                description: true,
                leadId: true,
                lead: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    email: true
                  }
                },
                membres: {
                  select: {
                    utilisateur: {
                      select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true
                      }
                    },
                    role: true
                  }
                },
                projets: {
                  select: {
                    id: true,
                    titre: true,
                    description: true,
                    statut: true,
                    taches: {
                      select: {
                        id: true,
                        titre: true,
                        statut: true,
                        priorite: true,
                        dateEcheance: true,
                        assigneAId: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })

    // Format the response
    const equipeData = user.membresEquipes && user.membresEquipes.length > 0 ? user.membresEquipes[0].equipe : null
    
    const formattedUser = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      departement: user.departement,
      equipe: equipeData ? {
        id: equipeData.id,
        nom: equipeData.nom,
        description: equipeData.description,
        lead: equipeData.lead ? {
          id: equipeData.lead.id,
          nom: equipeData.lead.nom,
          prenom: equipeData.lead.prenom,
          email: equipeData.lead.email
        } : null,
        membres: equipeData.membres.map((m: any) => ({
          id: m.utilisateur.id,
          nom: m.utilisateur.nom,
          prenom: m.utilisateur.prenom,
          email: m.utilisateur.email,
          role: m.role
        })),
        projets: equipeData.projets.map((p: any) => ({
          id: p.id,
          titre: p.titre,
          description: p.description,
          statut: p.statut,
          tachesCount: p.taches?.length || 0,
          taches: p.taches?.map((t: any) => ({
            id: t.id,
            titre: t.titre,
            statut: t.statut,
            priorite: t.priorite,
            dateEcheance: t.dateEcheance,
            assigneAId: t.assigneAId
          })) || []
        }))
      } : null
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error('GET /api/me error', error)
    return NextResponse.json({ error: 'Erreur récupération utilisateur' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const data = await request.json()
    const updates: any = {}
    if (data.nom !== undefined) updates.nom = data.nom
    if (data.prenom !== undefined) updates.prenom = data.prenom
    if (data.telephone !== undefined) updates.telephone = data.telephone
    if (data.departement !== undefined) updates.departement = data.departement

    // handle password change
    if (data.oldPassword || data.newPassword) {
      if (!data.oldPassword || !data.newPassword) return NextResponse.json({ error: 'Ancien et nouveau mot de passe requis' }, { status: 400 })
      const existing = await prisma.utilisateur.findUnique({ where: { id: session.user.id }, select: { motDePasse: true } })
      if (!existing || !existing.motDePasse) return NextResponse.json({ error: 'Mot de passe introuvable' }, { status: 400 })
      const ok = await bcrypt.compare(data.oldPassword, existing.motDePasse)
      if (!ok) return NextResponse.json({ error: 'Ancien mot de passe invalide' }, { status: 403 })
      const hashed = await bcrypt.hash(data.newPassword, 10)
      updates.motDePasse = hashed
    }

    const updated = await prisma.utilisateur.update({ where: { id: session.user.id }, data: updates, select: { id: true, nom: true, prenom: true, email: true, telephone: true, role: true, departement: true } })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/me error', error)
    return NextResponse.json({ error: 'Erreur mise à jour utilisateur' }, { status: 500 })
  }
}
