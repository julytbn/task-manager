const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  // List prototype properties (models appear as getters on prototype)
  const protoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(prisma));
  const filtered = protoProps.filter(p => !p.startsWith('$') && p !== 'constructor');
  console.log('Prototype properties (filtered):', filtered);

  console.log('\nHas notification property on instance?', typeof prisma.notification !== 'undefined');
  console.log('Type of prisma.notification:', typeof prisma.notification);

  // Try to call a harmless method if exists
  if (typeof prisma.notification !== 'undefined') {
    console.log('\nTrying to call prisma.notification.count() (may fail if DB not reachable)...');
    try {
      const c = await prisma.notification.count();
      console.log('Count result:', c);
    } catch (err) {
      console.log('Count failed (likely DB connection issue) — error:', err.message || err);
    }
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
