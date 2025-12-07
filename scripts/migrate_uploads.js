// Script Node.js pour migrer les fichiers uploads et mettre à jour les URLs en base
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function moveFilesAndUpdateUrls() {
  // 1. Déplacer les fichiers de public/uploads vers storage/uploads
  const types = ['tasks', 'clients', 'projects'];
  for (const type of types) {
    const srcDir = path.join(process.cwd(), 'public', 'uploads', type);
    const destDir = path.join(process.cwd(), 'storage', 'uploads', type);
    if (!fs.existsSync(srcDir)) continue;
    fs.mkdirSync(destDir, { recursive: true });
    const ids = fs.readdirSync(srcDir);
    for (const id of ids) {
      const srcIdDir = path.join(srcDir, id);
      const destIdDir = path.join(destDir, id);
      fs.mkdirSync(destIdDir, { recursive: true });
      const files = fs.readdirSync(srcIdDir);
      for (const file of files) {
        const srcFile = path.join(srcIdDir, file);
        const destFile = path.join(destIdDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
    }
  }

  // 2. Mettre à jour les URLs dans la base
  // DocumentTache
  const docsTache = await prisma.documentTache.findMany();
  for (const doc of docsTache) {
    if (doc.url && doc.url.startsWith('/uploads/tasks/')) {
      const parts = doc.url.split('/');
      const tacheId = parts[3];
      const fileName = parts[4];
      const newUrl = `/api/uploads/tasks/${tacheId}/${fileName}`;
      await prisma.documentTache.update({ where: { id: doc.id }, data: { url: newUrl } });
    }
  }
  // DocumentClient
  const docsClient = await prisma.documentClient.findMany();
  for (const doc of docsClient) {
    if (doc.url && doc.url.startsWith('/uploads/clients/')) {
      const parts = doc.url.split('/');
      const clientId = parts[3];
      const fileName = parts[4];
      const newUrl = `/api/uploads/clients/${clientId}/${fileName}`;
      await prisma.documentClient.update({ where: { id: doc.id }, data: { url: newUrl } });
    }
  }
  console.log('Migration terminée. Fichiers déplacés et URLs mises à jour.');
  await prisma.$disconnect();
}

moveFilesAndUpdateUrls();
