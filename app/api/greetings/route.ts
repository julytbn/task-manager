import { NextResponse } from 'next/server'
import { sendBirthdayGreetings, sendHolidayGreetings } from '@/lib/greetingService'

// Types pour les événements de vœux
type GreetingEvent = 'BIRTHDAY' | 'CHRISTMAS' | 'NEW_YEAR' | 'EASTER'

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const event = searchParams.get('event') as GreetingEvent | null

    // Vérifier si l'utilisateur est autorisé (admin)
    // Vous devrez implémenter votre propre logique d'authentification ici
    // const session = await getServerSession(authOptions)
    // if (!session?.user.roles?.includes('ADMIN')) {
    //   return NextResponse.json(
    //     { success: false, error: 'Non autorisé' },
    //     { status: 403 }
    //   )
    // }

    let result

    if (event) {
      // Envoyer des vœux pour un événement spécifique
      console.log(`🔔 Déclenchement manuel des vœux pour l'événement: ${event}`)
      
      if (event === 'BIRTHDAY') {
        result = await sendBirthdayGreetings()
      } else {
        result = await sendHolidayGreetings(event)
      }
      
      return NextResponse.json({
        success: true,
        event,
        result
      })
    } else {
      // Aucun événement spécifié, renvoyer la liste des événements disponibles
      return NextResponse.json({
        success: true,
        availableEvents: ['BIRTHDAY', 'CHRISTMAS', 'NEW_YEAR', 'EASTER'],
        message: 'Spécifiez un paramètre event pour déclencher l\'envoi des vœux'
      })
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi des vœux:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'envoi des vœux' },
      { status: 500 }
    )
  }
}
