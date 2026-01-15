import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Définir l'interface pour un objectif avec les informations de l'employé
interface ObjectifAvecEmploye {
  id: string;
  titre: string;
  employe: {
    email: string;
  } | null;
}

/**
 * Envoie un email d'encouragement à un employé
 * @param email - L'email de l'employé
 * @param titreObjectif - Le titre de l'objectif
 */
async function envoyerEmailEncouragement(email: string, titreObjectif: string): Promise<void> {
  // Vérification des variables d'environnement
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Les variables d\'environnement EMAIL_USER et/ou EMAIL_PASS ne sont pas définies');
    return;
  }

  const transporteur = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const optionsEmail = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Encouragement pour votre objectif: ${titreObjectif}`,
    text: `Bonjour,

Nous avons remarqué que vous n'avez pas progressé sur votre objectif "${titreObjectif}" récemment. 
Continuez vos efforts, vous pouvez y arriver !

Cordialement,
L'équipe de gestion des objectifs`,
  };

  try {
    await transporteur.sendMail(optionsEmail);
    console.log(`Email d'encouragement envoyé à ${email} pour l'objectif: ${titreObjectif}`);
  } catch (erreur) {
    console.error(`Erreur lors de l'envoi de l'email à ${email}:`, erreur);
  }
}

/**
 * Vérifie les objectifs qui n'ont pas été mis à jour depuis 7 jours
 * et envoie des emails d'encouragement aux employés concernés
 */
async function verifierProgressionObjectifs(): Promise<number> {
  try {
    console.log('Début de la vérification des objectifs...');
    
    // Récupérer les objectifs sans mise à jour depuis 7 jours
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - 7);
    
    // Récupérer les objectifs avec les emails des employés
    const objectifsStagnants = await prisma.$queryRaw<ObjectifAvecEmploye[]>`
      SELECT o.id, o.titre, u.email 
      FROM "objectifs_employes" o
      LEFT JOIN "utilisateurs" u ON o."employeId" = u.id
      WHERE o."derniereMiseAJour" < ${dateLimite}
    `;

    console.log(`${objectifsStagnants.length} objectifs stagnants trouvés.`);

    // Envoyer des emails d'encouragement
    for (const objectif of objectifsStagnants) {
      if (objectif.employe?.email) {
        await envoyerEmailEncouragement(objectif.employe.email, objectif.titre);
      } else {
        console.warn(`Aucun email trouvé pour l'objectif avec l'ID: ${objectif.id}`);
      }
    }
    
    return objectifsStagnants.length;
  } catch (erreur) {
    console.error('Erreur lors de la vérification des objectifs:', erreur);
    throw erreur;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
verifierProgressionObjectifs()
  .then((nombreObjectifsTraites) => {
    console.log(`Vérification terminée. ${nombreObjectifsTraites} objectifs ont été traités.`);
    process.exit(0);
  })
  .catch((erreur) => {
    console.error('Erreur critique lors de la vérification des objectifs:', erreur);
    process.exit(1);
  });