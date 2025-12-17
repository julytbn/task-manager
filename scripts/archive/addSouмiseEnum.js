#!/usr/bin/env node

/**
 * Script pour ajouter SOUMISE à la table enumStatutTache
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSouмiseEnum() {
  try {
    console.log('🔧 Ajout de SOUMISE à enumStatutTache...');
    
    // Vérifier si SOUMISE existe déjà
    const existing = await prisma.enumStatutTache.findUnique({
      where: { cle: 'SOUMISE' }
    });
    
    if (existing) {
      console.log('✅ SOUMISE existe déjà dans la BDD');
      console.log(existing);
    } else {
      // Trouver le plus grand ordre
      const maxOrdre = await prisma.enumStatutTache.findFirst({
        orderBy: { ordre: 'desc' }
      });
      
      const newOrdre = (maxOrdre?.ordre || 0) + 1;
      
      // Créer SOUMISE
      const result = await prisma.enumStatutTache.create({
        data: {
          cle: 'SOUMISE',
          label: 'Soumise',
          ordre: newOrdre,
          actif: true
        }
      });
      
      console.log('✅ SOUMISE ajouté avec succès!');
      console.log(result);
    }
    
    // Afficher tous les statuts
    console.log('\n📋 Tous les statuts:');
    const all = await prisma.enumStatutTache.findMany({
      orderBy: { ordre: 'asc' }
    });
    console.log(all);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addSouмiseEnum();
