// scripts/testApiDirect.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiLogic() {
  console.log('🔍 Test de la logique de l\'API /api/me\n');

  try {
    // Récupérer un utilisateur EMPLOYE
    const user = await prisma.utilisateur.findFirst({
      where: { role: 'EMPLOYE' },
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
    });

    if (!user) {
      console.log('❌ Aucun utilisateur EMPLOYE trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:');
    console.log(`   ${user.prenom} ${user.nom} (${user.email})\n`);

    // Format the response (comme dans l'API)
    const equipeData = user.membresEquipes && user.membresEquipes.length > 0 ? user.membresEquipes[0].equipe : null;

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
        membres: equipeData.membres.map(m => ({
          id: m.utilisateur.id,
          nom: m.utilisateur.nom,
          prenom: m.utilisateur.prenom,
          email: m.utilisateur.email,
          role: m.role
        })),
        projets: equipeData.projets.map(p => ({
          id: p.id,
          titre: p.titre,
          description: p.description,
          statut: p.statut,
          tachesCount: p.taches?.length || 0,
          taches: p.taches?.map(t => ({
            id: t.id,
            titre: t.titre,
            statut: t.statut,
            priorite: t.priorite,
            dateEcheance: t.dateEcheance,
            assigneAId: t.assigneAId
          })) || []
        }))
      } : null
    };

    console.log('📋 Réponse formatée JSON:\n');
    console.log(JSON.stringify(formattedUser, null, 2));

    console.log('\n\n✨ Vérification des champs:');
    console.log(`   ✅ user.id: ${formattedUser.id}`);
    console.log(`   ✅ user.nom: ${formattedUser.nom}`);
    console.log(`   ✅ user.prenom: ${formattedUser.prenom}`);
    console.log(`   ✅ user.email: ${formattedUser.email}`);

    if (formattedUser.equipe) {
      console.log(`   ✅ equipe.id: ${formattedUser.equipe.id}`);
      console.log(`   ✅ equipe.nom: ${formattedUser.equipe.nom}`);
      console.log(`   ✅ equipe.membres.length: ${formattedUser.equipe.membres.length}`);
      console.log(`   ✅ equipe.projets.length: ${formattedUser.equipe.projets.length}`);

      if (formattedUser.equipe.projets.length > 0) {
        console.log(`   ✅ Premier projet: ${formattedUser.equipe.projets[0].titre}`);
        console.log(`   ✅ Nombre de taches: ${formattedUser.equipe.projets[0].tachesCount}`);
        
        if (formattedUser.equipe.projets[0].taches.length > 0) {
          console.log(`   ✅ Première tache: ${formattedUser.equipe.projets[0].taches[0].titre}`);
        }
      }
    } else {
      console.log(`   ❌ Pas d'equipe trouvee`);
    }

    console.log('\n✅ Test complété avec succès!');
    console.log('\n💡 Cette structure JSON doit être retournée par /api/me');
    console.log('   et sera utilisée par les composants React.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiLogic();
