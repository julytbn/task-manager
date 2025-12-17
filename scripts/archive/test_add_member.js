const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find an equipe and a utilisateur who is not yet a member
  const equipe = await prisma.equipe.findFirst({ include: { membres: true } });
  if (!equipe) return console.error('No equipe found in DB')

  const membreIds = equipe.membres.map(m => m.utilisateurId)
  const utilisateur = await prisma.utilisateur.findFirst({ where: { id: { notIn: membreIds } } })
  if (!utilisateur) return console.error('No available utilisateur to add (all are members)')

  console.log('Using equipe:', equipe.id, equipe.nom)
  console.log('Adding utilisateur:', utilisateur.id, utilisateur.email)

  const res = await fetch(`http://localhost:3000/api/equipes/${equipe.id}/membres`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ utilisateurId: utilisateur.id, role: 'MEMBRE' })
  })

  const json = await res.json();
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(json, null, 2))

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1) })
