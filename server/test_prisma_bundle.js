const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const bundle = await prisma.bundle.findFirst({
      where: { id: '95e16705-9967-426a-8ee7-85c9b7adb6c2' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        bundleItems: {
          orderBy: { displayOrder: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
                slug: true,
                price: true,
                thumbnail: true,
                coverImage: true,
                status: true,
                googleDriveFileId: true,
                googleDriveLinks: true,
                licenceType: true,
                version: true,
                category: { select: { id: true, name: true } }
              }
            }
          }
        },
        versions: {
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            orderItems: true,
            entitlements: true
          }
        }
      }
    });
    console.log('Success! Bundle:', bundle.title);
  } catch (err) {
    console.error('Prisma Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
