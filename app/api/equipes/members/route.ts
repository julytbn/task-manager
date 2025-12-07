import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * ⚠️ DEPRECATED - Cette route est basique et ne crée pas de notifications ni n'envoie d'emails
 * 
 * UTILISER À LA PLACE: POST /api/equipes/[id]/membres
 * 
 * Cette route sera supprimée dans la prochaine version.
 * Redirection automatique pour nouvelle syntaxe en place.
 */

// POST /api/equipes/members - ajouter un membre { equipeId, utilisateurId, role }
// ⚠️ DEPRECATED: Utiliser POST /api/equipes/[id]/membres à la place
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { equipeId, utilisateurId, role } = body
    if (!equipeId || !utilisateurId) return NextResponse.json({ error: 'equipeId et utilisateurId requis' }, { status: 400 })

    // Vérifier existence
    const equipe = await prisma.equipe.findUnique({ where: { id: equipeId } })
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } })
    if (!equipe || !utilisateur) return NextResponse.json({ error: 'Equipe ou utilisateur introuvable' }, { status: 404 })

    const created = await prisma.membreEquipe.create({ data: { equipeId, utilisateurId, role: role || null } })
    
    return NextResponse.json({ 
      ok: true, 
      memberId: created.id,
      warning: '⚠️ DEPRECATED: Cette route ne crée pas de notification ni n\'envoie d\'email. Utiliser POST /api/equipes/[id]/membres'
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
