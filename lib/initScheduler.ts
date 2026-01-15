import { startScheduler } from './scheduler';

// Cette fonction sera appelée au démarrage de l'application
export function initializeScheduler() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
    console.log('🚀 Initialisation du planificateur de messages de vœux...');
    startScheduler();
  } else {
    console.log('🔇 Mode développement - Planificateur désactivé (pour l\'activer, définissez ENABLE_SCHEDULER=true)');
  }
}
