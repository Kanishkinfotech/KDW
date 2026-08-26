import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KDW Download Management and Reports data...');

  // 1. Fetch existing users, products, and orders
  const [users, products, orders] = await Promise.all([
    prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 10 }),
    prisma.product.findMany({ take: 10 }),
    prisma.order.findMany({ where: { paymentStatus: 'PAID' }, take: 10 })
  ]);

  if (products.length === 0 || orders.length === 0) {
    console.log('No products or orders found to attach entitlements.');
    return;
  }

  // 2. Seed Product File Health records
  for (const product of products) {
    const driveFileId = product.googleDriveFileId || `1A2B3C4D5E6F7G8H9I0_${product.slug || product.id.slice(0, 8)}`;
    await prisma.productFileHealth.upsert({
      where: { id: `health-${product.id}` },
      update: {},
      create: {
        id: `health-${product.id}`,
        productId: product.id,
        productVersion: product.version || '1.0.0',
        driveFileId,
        fileName: `${product.slug || 'product-archive'}-v1.0.0.zip`,
        fileSize: product.fileSize || '18.4 MB',
        mimeType: 'application/zip',
        isAccessible: true,
        isRestricted: true,
        permissionStatus: 'VALID',
        testStatus: 'HEALTHY',
        latencyMs: Math.round(90 + Math.random() * 50)
      }
    });
  }

  // 3. Seed Entitlements, Tokens, and Download Logs
  const statuses = ['ACTIVE', 'PARTIALLY_DOWNLOADED', 'DOWNLOADED', 'EXPIRED', 'REVOKED'];

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const product = products[i % products.length];
    const customer = users[i % users.length] || null;
    const customerEmail = order.guestEmail || customer?.email || 'customer@example.com';
    const status = statuses[i % statuses.length];

    const expiryDate = status === 'EXPIRED'
      ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 360 * 24 * 60 * 60 * 1000);

    const downloadCount = status === 'DOWNLOADED' ? 5 : (status === 'PARTIALLY_DOWNLOADED' ? 2 : (status === 'REVOKED' ? 1 : 0));

    const entitlement = await prisma.digitalEntitlement.upsert({
      where: { id: `ent-${order.id}` },
      update: {},
      create: {
        id: `ent-${order.id}`,
        orderId: order.id,
        customerId: customer?.id || null,
        customerEmail,
        productId: product.id,
        productVersion: '1.0.0',
        status,
        downloadLimit: 5,
        downloadCount,
        accessExpiresAt: expiryDate,
        lastDownloadedAt: downloadCount > 0 ? new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000) : null,
        revokedAt: status === 'REVOKED' ? new Date() : null,
        revocationReason: status === 'REVOKED' ? 'Order refunded & access cancelled upon customer request.' : null,
        revokedBy: status === 'REVOKED' ? 'admin@kdw.com' : null
      }
    });

    // Create Download Tokens
    const secureToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(secureToken).digest('hex');

    const token = await prisma.downloadToken.create({
      data: {
        entitlementId: entitlement.id,
        tokenHash,
        secureToken,
        status: status === 'REVOKED' ? 'REVOKED' : (status === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        lastUsedAt: downloadCount > 0 ? new Date() : null
      }
    });

    // Create Download Logs (Success events)
    for (let k = 0; k < downloadCount; k++) {
      await prisma.downloadLog.create({
        data: {
          entitlementId: entitlement.id,
          customerId: customer?.id || null,
          customerEmail,
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productVersion: '1.0.0',
          tokenId: token.id,
          eventType: 'download_completed',
          result: 'SUCCESS',
          bytesStreamed: BigInt(1048576 * 15), // 15MB
          durationMs: Math.round(1200 + Math.random() * 800),
          ipAddress: `192.168.1.${10 + i}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
          createdAt: new Date(Date.now() - (k * 24 + i) * 60 * 60 * 1000)
        }
      });
    }

    // Create a failed download log for realism
    if (i % 3 === 0) {
      await prisma.downloadLog.create({
        data: {
          entitlementId: entitlement.id,
          customerId: customer?.id || null,
          customerEmail,
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productVersion: '1.0.0',
          tokenId: token.id,
          eventType: 'download_failed',
          result: 'FAILED',
          failureCategory: 'Expired token',
          failureReason: 'Token expired before download could initiate.',
          durationMs: 340,
          ipAddress: `192.168.1.${10 + i}`,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          createdAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000)
        }
      });
    }

    // Create Download Overrides
    if (status === 'REVOKED' || status === 'EXPIRED') {
      await prisma.downloadOverride.create({
        data: {
          entitlementId: entitlement.id,
          adminId: 'system-admin',
          adminEmail: 'admin@kdw.com',
          overrideType: status === 'REVOKED' ? 'REVOKE_ACCESS' : 'EXTEND_ACCESS',
          previousValue: { status: 'ACTIVE' },
          newValue: { status },
          reason: 'Administrative policy override'
        }
      });
    }
  }

  // 4. Seed Operational Failure Queue
  const failureCategories = [
    { cat: 'Drive permission denied', prio: 'CRITICAL', msg: 'Service account lost read access to target Drive folder.' },
    { cat: 'Drive file missing', prio: 'HIGH', msg: 'Google Drive file ID returned 404 File Not Found.' },
    { cat: 'Expired token', prio: 'LOW', msg: 'Customer opened 24-hour expired download token link.' },
    { cat: 'Limit reached', prio: 'MEDIUM', msg: 'Customer attempted 6th download exceeding 5-download limit.' }
  ];

  for (let j = 0; j < failureCategories.length; j++) {
    const fc = failureCategories[j];
    const prod = products[j % products.length];
    await prisma.downloadFailure.create({
      data: {
        productId: prod.id,
        productName: prod.name,
        productVersion: '1.0.0',
        driveFileId: prod.googleDriveFileId || 'sample_drive_id_123',
        customerEmail: 'customer@example.com',
        failureCategory: fc.cat,
        priority: fc.prio,
        errorMessage: fc.msg,
        errorCode: `ERR_${fc.cat.toUpperCase().replace(/\s+/g, '_')}`,
        attemptCount: j + 2,
        firstFailedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastFailedAt: new Date(Date.now() - j * 6 * 60 * 60 * 1000),
        isResolved: false
      }
    });
  }

  // 5. Seed Export Jobs
  const exportReports = ['sales', 'revenue', 'product_performance', 'download_failures', 'reviews', 'refunds'];
  for (const rep of exportReports) {
    await prisma.exportJob.create({
      data: {
        reportType: rep,
        format: 'CSV',
        filters: { range: '30d' },
        status: 'COMPLETED',
        fileName: `KDW-${rep.toUpperCase()}-REPORT.csv`,
        fileSize: '184 KB',
        fileUrl: `/api/admin/reports/exports/download/${rep}?format=CSV`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: 'admin@kdw.com'
      }
    });
  }

  console.log('✅ Seeded Download Management and Reports data successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding download data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
