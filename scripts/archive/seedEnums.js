const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Initialisation des énumérations...');

  try {
    // Statuts des tâches
    const statutsTache = [
      { cle: 'A_FAIRE', label: 'À faire', ordre: 1 },
      { cle: 'EN_COURS', label: 'En cours', ordre: 2 },
      { cle: 'EN_REVISION', label: 'En révision', ordre: 3 },
      { cle: 'TERMINE', label: 'Terminée', ordre: 4 },
      { cle: 'ANNULE', label: 'Annulée', ordre: 5 }
    ];

    for (const s of statutsTache) {
      await prisma.enumStatutTache.upsert({
        where: { cle: s.cle },
        update: { label: s.label, ordre: s.ordre },
        create: { cle: s.cle, label: s.label, ordre: s.ordre }
      });
    }
    console.log('✓ Statuts des tâches initialisés');

    // Priorités
    const priorites = [
      { cle: 'BASSE', label: 'Basse', ordre: 1 },
      { cle: 'MOYENNE', label: 'Moyenne', ordre: 2 },
      { cle: 'HAUTE', label: 'Haute', ordre: 3 },
      { cle: 'URGENTE', label: 'Urgente', ordre: 4 }
    ];

    for (const p of priorites) {
      await prisma.enumPriorite.upsert({
        where: { cle: p.cle },
        update: { label: p.label, ordre: p.ordre },
        create: { cle: p.cle, label: p.label, ordre: p.ordre }
      });
    }
    console.log('✓ Priorités initialisées');

    // Statuts des projets
    const statutsProjets = [
      { cle: 'PROPOSITION', label: 'Proposition', ordre: 1 },
      { cle: 'EN_ATTENTE', label: 'En attente', ordre: 2 },
      { cle: 'EN_COURS', label: 'En cours', ordre: 3 },
      { cle: 'TERMINE', label: 'Terminé', ordre: 4 },
      { cle: 'EN_RETARD', label: 'En retard', ordre: 5 },
      { cle: 'ANNULE', label: 'Annulé', ordre: 6 }
    ];

    for (const s of statutsProjets) {
      await prisma.enumStatutProjet.upsert({
        where: { cle: s.cle },
        update: { label: s.label, ordre: s.ordre },
        create: { cle: s.cle, label: s.label, ordre: s.ordre }
      });
    }
    console.log('✓ Statuts des projets initialisés');

    // Catégories de services
    const categories = [
      { cle: 'COMPTABILITE', label: 'Comptabilité', ordre: 1 },
      { cle: 'AUDIT_FISCALITE', label: 'Audit & Fiscalité', ordre: 2 },
      { cle: 'MARKETING', label: 'Marketing', ordre: 3 },
      { cle: 'COMMUNICATION', label: 'Communication', ordre: 4 },
      { cle: 'REDACTION_GESTION_PROJET', label: 'Rédaction & Gestion de projet', ordre: 5 },
      { cle: 'DEMARRAGE_ADMINISTRATIF', label: 'Démarrage administratif', ordre: 6 },
      { cle: 'FORMATION', label: 'Formation', ordre: 7 },
      { cle: 'COACHING', label: 'Coaching', ordre: 8 },
      { cle: 'ETUDE_MARCHE', label: 'Étude de marché', ordre: 9 },
      { cle: 'CONCEPTION_IMPRESSION', label: 'Conception & Impression', ordre: 10 },
      { cle: 'IMMOBILIER', label: 'Immobilier', ordre: 11 }
    ];

    for (const c of categories) {
      await prisma.enumCategorieService.upsert({
        where: { cle: c.cle },
        update: { label: c.label, ordre: c.ordre },
        create: { cle: c.cle, label: c.label, ordre: c.ordre }
      });
    }
    console.log('✓ Catégories de services initialisées');

    // Types de clients
    const typesClients = [
      { cle: 'PARTICULIER', label: 'Particulier', ordre: 1 },
      { cle: 'ENTREPRISE', label: 'Entreprise', ordre: 2 },
      { cle: 'ORGANISATION', label: 'Organisation', ordre: 3 }
    ];

    for (const t of typesClients) {
      await prisma.enumTypeClient.upsert({
        where: { cle: t.cle },
        update: { label: t.label, ordre: t.ordre },
        create: { cle: t.cle, label: t.label, ordre: t.ordre }
      });
    }
    console.log('✓ Types de clients initialisés');

    // Statuts des factures
    const statutsFactures = [
      { cle: 'BROUILLON', label: 'Brouillon', ordre: 1 },
      { cle: 'EN_ATTENTE', label: 'En attente', ordre: 2 },
      { cle: 'PARTIELLEMENT_PAYEE', label: 'Partiellement payée', ordre: 3 },
      { cle: 'PAYEE', label: 'Payée', ordre: 4 },
      { cle: 'RETARD', label: 'En retard', ordre: 5 },
      { cle: 'ANNULEE', label: 'Annulée', ordre: 6 }
    ];

    for (const s of statutsFactures) {
      await prisma.enumStatutFacture.upsert({
        where: { cle: s.cle },
        update: { label: s.label, ordre: s.ordre },
        create: { cle: s.cle, label: s.label, ordre: s.ordre }
      });
    }
    console.log('✓ Statuts des factures initialisés');

    // Statuts des paiements
    const statutsPaiements = [
      { cle: 'EN_ATTENTE', label: 'En attente', ordre: 1 },
      { cle: 'CONFIRME', label: 'Confirmé', ordre: 2 },
      { cle: 'REFUSE', label: 'Refusé', ordre: 3 },
      { cle: 'REMBOURSE', label: 'Remboursé', ordre: 4 }
    ];

    for (const s of statutsPaiements) {
      await prisma.enumStatutPaiement.upsert({
        where: { cle: s.cle },
        update: { label: s.label, ordre: s.ordre },
        create: { cle: s.cle, label: s.label, ordre: s.ordre }
      });
    }
    console.log('✓ Statuts des paiements initialisés');

    // Moyens de paiement
    const moyensPaiement = [
      { cle: 'ESPECES', label: 'Espèces', ordre: 1 },
      { cle: 'CHEQUE', label: 'Chèque', ordre: 2 },
      { cle: 'VIREMENT_BANCAIRE', label: 'Virement bancaire', ordre: 3 },
      { cle: 'CARTE_BANCAIRE', label: 'Carte bancaire', ordre: 4 },
      { cle: 'MOBILE_MONEY', label: 'Mobile Money', ordre: 5 },
      { cle: 'PAYPAL', label: 'PayPal', ordre: 6 },
      { cle: 'AUTRE', label: 'Autre', ordre: 7 }
    ];

    for (const m of moyensPaiement) {
      await prisma.enumMoyenPaiement.upsert({
        where: { cle: m.cle },
        update: { label: m.label, ordre: m.ordre },
        create: { cle: m.cle, label: m.label, ordre: m.ordre }
      });
    }
    console.log('✓ Moyens de paiement initialisés');

    // Types de notifications
    const typesNotifications = [
      { cle: 'INFO', label: 'Information', ordre: 1 },
      { cle: 'EQUIPE', label: 'Équipe', ordre: 2 },
      { cle: 'TACHE', label: 'Tâche', ordre: 3 },
      { cle: 'ALERTE', label: 'Alerte', ordre: 4 },
      { cle: 'SUCCES', label: 'Succès', ordre: 5 }
    ];

    for (const t of typesNotifications) {
      await prisma.enumTypeNotification.upsert({
        where: { cle: t.cle },
        update: { label: t.label, ordre: t.ordre },
        create: { cle: t.cle, label: t.label, ordre: t.ordre }
      });
    }
    console.log('✓ Types de notifications initialisés');

    console.log('\n✓ Toutes les énumérations ont été initialisées avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des énumérations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
