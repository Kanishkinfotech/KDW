import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Product
  { code: 'product.read', resource: 'PRODUCT', action: 'READ', riskLevel: 'LOW', description: 'View catalog products and asset metadata' },
  { code: 'product.create', resource: 'PRODUCT', action: 'CREATE', riskLevel: 'LOW', description: 'Create draft products' },
  { code: 'product.update', resource: 'PRODUCT', action: 'UPDATE', riskLevel: 'MEDIUM', description: 'Update product prices and descriptions' },
  { code: 'product.publish', resource: 'PRODUCT', action: 'PUBLISH', riskLevel: 'MEDIUM', description: 'Publish products to live storefront' },
  { code: 'product.archive', resource: 'PRODUCT', action: 'DELETE', riskLevel: 'HIGH', description: 'Archive or unpublish products' },
  { code: 'product.file.map', resource: 'PRODUCT', action: 'MANAGE', riskLevel: 'HIGH', description: 'Map Google Drive file IDs to product assets' },

  // Order & Payment
  { code: 'order.read', resource: 'ORDER', action: 'READ', riskLevel: 'LOW', description: 'View customer orders and fulfilment status' },
  { code: 'order.update', resource: 'ORDER', action: 'UPDATE', riskLevel: 'MEDIUM', description: 'Update order status and fulfilment notes' },
  { code: 'payment.read', resource: 'PAYMENT', action: 'READ', riskLevel: 'LOW', description: 'View Razorpay payment transactions' },
  { code: 'refund.create', resource: 'REFUND', action: 'CREATE', riskLevel: 'MEDIUM', description: 'Initiate customer refund requests' },
  { code: 'refund.approve', resource: 'REFUND', action: 'APPROVE', riskLevel: 'CRITICAL', description: 'Approve and execute Razorpay refunds' },

  // Customer & Entitlements
  { code: 'customer.read', resource: 'CUSTOMER', action: 'READ', riskLevel: 'LOW', description: 'View customer profiles and purchase history' },
  { code: 'customer.export', resource: 'CUSTOMER', action: 'EXPORT', riskLevel: 'CRITICAL', description: 'Export customer data to CSV' },
  { code: 'customer.block', resource: 'CUSTOMER', action: 'MANAGE', riskLevel: 'HIGH', description: 'Block or suspend fraudulent customer accounts' },
  { code: 'customer.merge', resource: 'CUSTOMER', action: 'MANAGE', riskLevel: 'HIGH', description: 'Merge duplicate customer accounts' },

  // Downloads & Licenses
  { code: 'download.read', resource: 'DOWNLOAD', action: 'READ', riskLevel: 'LOW', description: 'View download logs and IP telemetry' },
  { code: 'download.reset', resource: 'DOWNLOAD', action: 'MANAGE', riskLevel: 'MEDIUM', description: 'Reset customer download limit counts' },
  { code: 'download.extend', resource: 'DOWNLOAD', action: 'MANAGE', riskLevel: 'MEDIUM', description: 'Extend download token access expiry' },
  { code: 'download.revoke', resource: 'DOWNLOAD', action: 'MANAGE', riskLevel: 'CRITICAL', description: 'Revoke digital asset download access' },
  { code: 'license.read', resource: 'LICENCE', action: 'READ', riskLevel: 'LOW', description: 'View product software license keys' },
  { code: 'license.issue', resource: 'LICENCE', action: 'CREATE', riskLevel: 'MEDIUM', description: 'Manually issue license keys' },
  { code: 'license.revoke', resource: 'LICENCE', action: 'MANAGE', riskLevel: 'CRITICAL', description: 'Revoke or blacklist software license keys' },

  // Marketing & Content
  { code: 'campaign.create', resource: 'CAMPAIGN', action: 'CREATE', riskLevel: 'LOW', description: 'Draft promotional marketing emails' },
  { code: 'campaign.send', resource: 'CAMPAIGN', action: 'PUBLISH', riskLevel: 'HIGH', description: 'Send broadcast marketing campaigns' },
  { code: 'content.publish', resource: 'CONTENT', action: 'PUBLISH', riskLevel: 'MEDIUM', description: 'Publish CMS pages, blogs, and banners' },
  { code: 'review.moderate', resource: 'REVIEW', action: 'APPROVE', riskLevel: 'LOW', description: 'Approve or reject customer reviews' },

  // Settings & System
  { code: 'settings.read', resource: 'SETTINGS', action: 'READ', riskLevel: 'LOW', description: 'View store configuration settings' },
  { code: 'settings.update', resource: 'SETTINGS', action: 'UPDATE', riskLevel: 'CRITICAL', description: 'Modify global store and payment settings' },
  { code: 'cache.read', resource: 'CACHE', action: 'READ', riskLevel: 'LOW', description: 'Inspect cache statistics and key registry' },
  { code: 'cache.manage', resource: 'CACHE', action: 'MANAGE', riskLevel: 'HIGH', description: 'Purge cache namespaces, warm cache, and run cleanup' },
  { code: 'admin.manage', resource: 'ADMIN', action: 'MANAGE', riskLevel: 'CRITICAL', description: 'Create, suspend, and invite admin staff users' },
  { code: 'system.backup.restore', resource: 'SYSTEM', action: 'MANAGE', riskLevel: 'CRITICAL', description: 'Trigger sandbox restore tests' },
  { code: 'audit.read', resource: 'AUDIT', action: 'READ', riskLevel: 'LOW', description: 'Inspect immutable activity and mutation logs' }
];

const ROLES = [
  { name: 'Super Admin', description: 'Full unrestricted platform access and emergency controls', riskLevel: 'CRITICAL' },
  { name: 'Store Manager', description: 'Operational store control, refunds, and order fulfilment', riskLevel: 'HIGH' },
  { name: 'Catalog Manager', description: 'Product listings, categories, bundles, and Drive mappings', riskLevel: 'MEDIUM' },
  { name: 'Finance Manager', description: 'Payment auditing, tax compliance, and refund approvals', riskLevel: 'HIGH' },
  { name: 'Support Agent', description: 'Customer tickets, download resets, and contact inquiries', riskLevel: 'LOW' },
  { name: 'Marketing Manager', description: 'Campaigns, discount coupons, and banner announcements', riskLevel: 'MEDIUM' },
  { name: 'Content Editor', description: 'CMS pages, blog articles, FAQs, and testimonials', riskLevel: 'LOW' },
  { name: 'Review Moderator', description: 'Customer rating and review moderation', riskLevel: 'LOW' },
  { name: 'Auditor', description: 'Read-only compliance and security activity review', riskLevel: 'LOW' },
  { name: 'Developer/Ops', description: 'Infrastructure health, Redis cache, backups, and logs', riskLevel: 'HIGH' }
];

const NAMESPACES = [
  {
    namespace: 'kdw:prod:product',
    environment: 'PRODUCTION',
    defaultTtlSeconds: 900,
    maxStalenessSeconds: 900,
    rebuildSource: 'PostgreSQL:Product',
    invalidationTriggers: JSON.stringify(['PRODUCT_UPDATED', 'PRODUCT_ARCHIVED', 'PRICE_CHANGED', 'VERSION_PUBLISHED'])
  },
  {
    namespace: 'kdw:prod:category',
    environment: 'PRODUCTION',
    defaultTtlSeconds: 1800,
    maxStalenessSeconds: 1800,
    rebuildSource: 'PostgreSQL:Category',
    invalidationTriggers: JSON.stringify(['CATEGORY_UPDATED', 'CATEGORY_REORDERED', 'PRODUCT_ASSIGNED'])
  },
  {
    namespace: 'kdw:prod:search',
    environment: 'PRODUCTION',
    defaultTtlSeconds: 300,
    maxStalenessSeconds: 300,
    rebuildSource: 'PostgreSQL:SearchIndex',
    invalidationTriggers: JSON.stringify(['PRODUCT_PUBLISHED', 'PRODUCT_ARCHIVED'])
  },
  {
    namespace: 'kdw:prod:rate',
    environment: 'PRODUCTION',
    defaultTtlSeconds: 60,
    maxStalenessSeconds: 60,
    rebuildSource: 'InMemory:SlidingWindow',
    invalidationTriggers: JSON.stringify(['WINDOW_EXPIRED'])
  },
  {
    namespace: 'kdw:prod:coupon',
    environment: 'PRODUCTION',
    defaultTtlSeconds: 600,
    maxStalenessSeconds: 600,
    rebuildSource: 'PostgreSQL:Coupon',
    invalidationTriggers: JSON.stringify(['COUPON_RESERVED', 'COUPON_EXPIRED'])
  },
  {
    namespace: 'kdw:prod:report',
    environment: 'PRODUCTION',
    defaultTtlSeconds: 86400,
    maxStalenessSeconds: 86400,
    rebuildSource: 'PostgreSQL:Aggregates',
    invalidationTriggers: JSON.stringify(['DAILY_AGGREGATE_GENERATED'])
  }
];

async function seedCacheAndUsersSystem() {
  console.log('--- SEEDING CACHE AND USERS & STAFF SYSTEM ---');

  // 1. Seed System Permissions
  console.log('1. Seeding System Permissions...');
  for (const p of PERMISSIONS) {
    await prisma.systemPermission.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
  }

  // 2. Seed Default Roles
  console.log('2. Seeding Default Roles & Scopes...');
  const allPermissions = await prisma.systemPermission.findMany();
  for (const r of ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, permissions: 'ALL' },
      create: { name: r.name, description: r.description, permissions: 'ALL', isSystem: true }
    });

    // Map appropriate permissions
    for (const perm of allPermissions) {
      let shouldMap = false;
      if (r.name === 'Super Admin') shouldMap = true;
      else if (r.name === 'Developer/Ops' && (perm.resource === 'CACHE' || perm.resource === 'SYSTEM' || perm.resource === 'AUDIT')) shouldMap = true;
      else if (r.name === 'Catalog Manager' && perm.resource === 'PRODUCT') shouldMap = true;
      else if (r.name === 'Finance Manager' && (perm.resource === 'PAYMENT' || perm.resource === 'REFUND' || perm.resource === 'ORDER')) shouldMap = true;
      else if (r.name === 'Support Agent' && (perm.resource === 'DOWNLOAD' || perm.resource === 'ORDER' || perm.resource === 'CUSTOMER')) shouldMap = true;
      else if (r.name === 'Auditor' && (perm.action === 'READ' || perm.resource === 'AUDIT')) shouldMap = true;
      else if (r.name === 'Store Manager' && (perm.resource !== 'SYSTEM' && perm.resource !== 'CACHE')) shouldMap = true;

      if (shouldMap) {
        await prisma.rolePermissionMapping.upsert({
          where: {
            roleId_permissionId_scopeType: {
              roleId: roleRecord.id,
              permissionId: perm.id,
              scopeType: 'ALL'
            }
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: perm.id,
            scopeType: 'ALL'
          }
        });
      }
    }
  }

  // 3. Link Existing Admin Users to Staff Profiles
  console.log('3. Seeding Staff Profiles for Admin Accounts...');
  const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'Super Admin'] } } });
  for (const admin of admins) {
    await prisma.staffProfile.upsert({
      where: { userId: admin.id },
      update: {
        department: 'MANAGEMENT',
        team: 'CORE',
        mfaEnabled: true,
        timezone: 'Asia/Kolkata'
      },
      create: {
        userId: admin.id,
        department: 'MANAGEMENT',
        team: 'CORE',
        mfaEnabled: true,
        employeeReference: `EMP-ADM-${admin.id.slice(0, 4).toUpperCase()}`,
        timezone: 'Asia/Kolkata'
      }
    });

    // Seed Active Admin Session
    const sessionHash = crypto.createHash('sha256').update(`session-${admin.id}-active`).digest('hex');
    await prisma.adminSession.upsert({
      where: { sessionHash },
      update: { lastActiveAt: new Date(), isRevoked: false },
      create: {
        userId: admin.id,
        userEmail: admin.email,
        userName: admin.name,
        sessionHash,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
        deviceReference: 'Chrome on Windows (Primary)',
        mfaVerified: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      }
    });
  }

  // 4. Seed Cache Namespace Configurations
  console.log('4. Seeding Cache Namespace Configurations...');
  for (const ns of NAMESPACES) {
    await prisma.cacheNamespaceConfig.upsert({
      where: { namespace: ns.namespace },
      update: ns,
      create: ns
    });
  }

  // 5. Seed Sample Cache Entries
  console.log('5. Seeding Active Cache Entries...');
  const sampleEntries = [
    { key: 'kdw:prod:product:starter-agency-pack', namespace: 'kdw:prod:product', sizeBytes: 2450, ttlSeconds: 900, isRebuildable: true },
    { key: 'kdw:prod:product:ecommerce-growth-kit', namespace: 'kdw:prod:product', sizeBytes: 3120, ttlSeconds: 900, isRebuildable: true },
    { key: 'kdw:prod:category:digital-marketing', namespace: 'kdw:prod:category', sizeBytes: 1280, ttlSeconds: 1800, isRebuildable: true },
    { key: 'kdw:prod:search:seo-templates', namespace: 'kdw:prod:search', sizeBytes: 840, ttlSeconds: 300, isRebuildable: true },
    { key: 'kdw:prod:coupon:FREEDIGITAL50', namespace: 'kdw:prod:coupon', sizeBytes: 420, ttlSeconds: 600, isRebuildable: true }
  ];

  for (const e of sampleEntries) {
    const expiresAt = new Date(Date.now() + e.ttlSeconds * 1000);
    await prisma.cacheEntry.upsert({
      where: { key: e.key },
      update: { ...e, expiresAt },
      create: { ...e, expiresAt, environment: 'PRODUCTION', sourceOfTruth: 'PostgreSQL' }
    });
  }

  // 6. Seed Invalidation Events & Maintenance Logs
  console.log('6. Seeding Cache Invalidation Events & Maintenance Logs...');
  await prisma.cacheInvalidationEvent.create({
    data: {
      eventType: 'PRODUCT_UPDATED',
      namespace: 'kdw:prod:product',
      keyPattern: 'kdw:prod:product:starter-agency-pack',
      triggerSource: 'PostgreSQL_TRIGGER',
      status: 'COMPLETED',
      retryCount: 0,
      processedAt: new Date()
    }
  });

  await prisma.cacheMaintenanceLog.create({
    data: {
      action: 'WARM',
      actorName: 'Super Admin',
      actorRole: 'SUPER_ADMIN',
      keysAffected: 15,
      reason: 'Scheduled automated pre-warming for featured products and categories',
      result: 'SUCCESS'
    }
  });

  // 7. Seed Staff Invitation & Access Review Record
  console.log('7. Seeding Staff Invitations and Access Review Governance...');
  const invToken = crypto.createHash('sha256').update('invitation-token-sarah').digest('hex');
  await prisma.staffInvitation.upsert({
    where: { email: 'sarah.ops@kanishkdigitalworld.com' },
    update: {},
    create: {
      email: 'sarah.ops@kanishkdigitalworld.com',
      roleName: 'Developer/Ops',
      department: 'ENGINEERING',
      team: 'CORE',
      tokenHash: invToken,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      status: 'PENDING'
    }
  });

  if (admins.length > 0) {
    await prisma.accessReviewRecord.create({
      data: {
        reviewerName: 'Chief Security Auditor',
        targetUserId: admins[0].id,
        targetUserEmail: admins[0].email,
        targetUserRole: admins[0].role,
        sensitivePermissionsCount: 14,
        lastLoginAt: admins[0].lastLoginAt || new Date(),
        recommendation: 'MAINTAIN_ACCESS',
        actionTaken: 'APPROVED_NO_CHANGE',
        notes: 'MFA active, session logs nominal, quarterly recertification complete.'
      }
    });
  }

  console.log('✅ Master Cache & Users/Staff System Seeding Complete!\n');
}

seedCacheAndUsersSystem()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
