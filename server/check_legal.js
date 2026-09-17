const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const docs = await p.legalDocument.findMany({
    include: { versions: true }
  });
  console.log('Legal docs count:', docs.length);
  docs.forEach(d => {
    console.log(d.slug, d.name, 'versions:', d.versions.length, 'status:', d.status, 'pubVer:', d.publishedVersion);
  });
}

run().catch(console.error).finally(() => p.$disconnect());
