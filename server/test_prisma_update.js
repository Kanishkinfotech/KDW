const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const id = '95e16705-9967-426a-8ee7-85c9b7adb6c2';
    const existing = await prisma.bundle.findUnique({ where: { id } });
    console.log('Existing:', existing.title);

    const updated = await prisma.bundle.update({
      where: { id },
      data: {
        title: 'qwerty (Copy) (Copy) - Updated',
        price: 250,
        auditLogs: {
          create: {
            action: 'UPDATED',
            actorEmail: 'admin@kdw.com',
            reason: 'Bundle updated by admin',
            previousState: { price: existing.price, title: existing.title },
            newState: { price: 250, title: 'qwerty (Copy) (Copy) - Updated' }
          }
        }
      },
      include: {
        category: true,
        bundleItems: {
          include: { product: true }
        },
        versions: true
      }
    });
    console.log('Update Success!', updated.title);
  } catch (err) {
    console.error('Update Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
