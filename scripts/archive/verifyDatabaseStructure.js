// scripts/verifyDatabaseStructure.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyStructure() {
  console.log('🔍 Vérification de la structure de la base de données\n');

  try {
    // 1. Vérifier les utilisateurs
    console.log('1️⃣  Utilisateurs:');
    const users = await prisma.utilisateur.findMany({
      select: { id: true, nom: true, prenom: true, email: true, role: true }
    });
    console.log(`   Trouvés: ${users.length}`);
    if (users.length > 0) {
      console.log('   Exemples:');
      users.slice(0, 3).forEach(u => {
        console.log(`   - ${u.prenom} ${u.nom} (${u.email}) - Rôle: ${u.role}`);
      });
    }
    console.log('');

    // 2. Vérifier les équipes
    console.log('2️⃣  Équipes:');
    const equipes = await prisma.equipe.findMany({
      select: { id: true, nom: true, description: true }
    });
    console.log(`   Trouvées: ${equipes.length}`);
    if (equipes.length > 0) {
      console.log('   Exemples:');
      equipes.slice(0, 3).forEach(e => {
        console.log(`   - ${e.nom}: ${e.description || '(pas de description)'}`);
      });
    }
    console.log('');

    // 3. Vérifier les associations membre-équipe
    console.log('3️⃣  Associations Utilisateur-Équipe:');
    const membres = await prisma.membreEquipe.findMany({
      include: {
        utilisateur: { select: { nom: true, prenom: true } },
        equipe: { select: { nom: true } }
      }
    });
    console.log(`   Trouvées: ${membres.length}`);
    if (membres.length > 0) {
      console.log('   Exemples:');
      membres.slice(0, 3).forEach(m => {
        console.log(`   - ${m.utilisateur.prenom} ${m.utilisateur.nom} → ${m.equipe.nom}`);
      });
    }
    console.log('');

    // 4. Vérifier les projets
    console.log('4️⃣  Projets:');
    const projets = await prisma.projet.findMany({
      select: { id: true, titre: true, statut: true, equipeId: true }
    });
    console.log(`   Trouvés: ${projets.length}`);
    if (projets.length > 0) {
      console.log('   Exemples:');
      projets.slice(0, 3).forEach(p => {
        const status = p.equipeId ? 'Assigne a equipe' : 'Pas d\'equipe';
        console.log(`   - ${p.titre} (${p.statut}) ${status}`);
      });
    }
    console.log('');

    // 5. Vérifier les tâches
    console.log('5️⃣  Tâches:');
    const taches = await prisma.tache.findMany({
      select: { id: true, titre: true, statut: true, priorite: true, projetId: true }
    });
    console.log(`   Trouvées: ${taches.length}`);
    if (taches.length > 0) {
      console.log('   Exemples:');
      taches.slice(0, 3).forEach(t => {
        console.log(`   - ${t.titre} (${t.statut} - ${t.priorite})`);
      });
    }
    console.log('');

    // 6. Vérification complète pour un utilisateur EMPLOYE
    console.log('6️⃣  Vérification complète pour un utilisateur EMPLOYE:');
    const employe = await prisma.utilisateur.findFirst({
      where: { role: 'EMPLOYE' },
      include: {
        membresEquipes: {
          include: {
            equipe: {
              include: {
                projets: {
                  include: { taches: true }
                },
                membres: { include: { utilisateur: true } }
              }
            }
          }
        }
      }
    });

    if (employe) {
      console.log(`   ✅ Trouvé: ${employe.prenom} ${employe.nom}`);
      if (employe.membresEquipes.length > 0) {
        const equipe = employe.membresEquipes[0].equipe;
        console.log(`   ✅ Équipe: ${equipe.nom}`);
        console.log(`   ✅ Membres dans l'equipe: ${equipe.membres.length}`);
        console.log(`   ✅ Projets: ${equipe.projets.length}`);
        
        let totalTaches = 0;
        equipe.projets.forEach(p => {
          console.log(`      📁 ${p.titre}: ${p.taches.length} tâche(s)`);
          totalTaches += p.taches.length;
        });
        console.log(`   ✅ Total tâches: ${totalTaches}`);
      } else {
        console.log(`   ❌ Pas d'equipe assignee`);
      }
    } else {
      console.log(`   ❌ Aucun utilisateur EMPLOYE trouve`);
    }
    console.log('');

    // 7. Résumé
    console.log('📊 RÉSUMÉ:');
    console.log(`   • Utilisateurs: ${users.length}`);
    console.log(`   • Équipes: ${equipes.length}`);
    console.log(`   • Membres d'équipe: ${membres.length}`);
    console.log(`   • Projets: ${projets.length}`);
    console.log(`   • Tâches: ${taches.length}`);

    // 8. Recommandations
    console.log('\n✨ RECOMMANDATIONS:');
    if (users.length === 0) {
      console.log('   ❌ Créez au moins un utilisateur avec rôle EMPLOYE');
    }
    if (equipes.length === 0) {
      console.log('   ❌ Créez au moins une équipe');
    }
    if (membres.length === 0) {
      console.log('   ❌ Assignez des utilisateurs à une équipe');
    }
    if (projets.length === 0) {
      console.log('   ❌ Créez au moins un projet et assignez-le à une équipe');
    }
    if (taches.length === 0) {
      console.log('   ❌ Créez au moins une tâche dans un projet');
    }

    if (users.length > 0 && equipes.length > 0 && membres.length > 0 && projets.length > 0 && taches.length > 0) {
      console.log('   ✅ Toutes les données de base sont présentes!');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStructure();
