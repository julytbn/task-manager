import { NextRequest, NextResponse } from 'next/server';
import { sendBirthdayGreetings, sendHolidayGreetings } from '@/lib/greetingService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  // Vérification de l'authentification pour les appels manuels
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('❌ Tentative d\'accès non autorisée à l\'endpoint cron');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log('🔄 Démarrage du job cron pour les messages de vœux...');
    
    // Exécuter les vérifications d'anniversaires
    console.log('🎂 Vérification des anniversaires...');
    const birthdayResults = await sendBirthdayGreetings();
    
    // Vérifier les fêtes
    console.log('🎉 Vérification des fêtes...');
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    
    let holidayResults = null;
    
    // Vérifier Noël (25/12)
    if (day === 25 && month === 12) {
      console.log('🎄 Envoi des vœux de Noël...');
      holidayResults = await sendHolidayGreetings('CHRISTMAS');
    }
    // Vérifier Nouvel An (1/1)
    else if (day === 1 && month === 1) {
      console.log('🎆 Envoi des vœux de Nouvel An...');
      holidayResults = await sendHolidayGreetings('NEW_YEAR');
    }
    // Vérifier Pâques (date variable)
    else if (isEasterSunday(today)) {
      console.log('🐣 Envoi des vœux de Pâques...');
      holidayResults = await sendHolidayGreetings('EASTER');
    }

    console.log('✅ Job cron terminé avec succès');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      birthday: birthdayResults,
      holiday: holidayResults
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du cron:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour calculer le dimanche de Pâques (algorithme de Meeus/Jones/Butcher)
function isEasterSunday(date: Date): boolean {
  const year = date.getFullYear();
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;

  return date.getMonth() === easterMonth && date.getDate() === easterDay;
}
