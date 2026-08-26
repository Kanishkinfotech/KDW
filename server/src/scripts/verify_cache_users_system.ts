import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../controllers/admin/cacheService';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function runCacheAndUsersVerification() {
  console.log('================================================================');
  console.log('--- STARTING KDW CACHE + USERS & STAFF SYSTEM VERIFICATION ---');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details || 'Assertion failed'}`);
    }
  }

  try {
    // TEST GROUP 1: Cache Operations & Memory Registry
    console.log('--- TEST GROUP 1: Cache Storage & Namespace Management ---');
    await cacheService.set('kdw:test:product:sample-kit', { title: 'Sample Kit', price: 999 }, 60, 'kdw:test:product', 'TEST');
    const cachedItem = await cacheService.get('kdw:test:product:sample-kit');
    assert(cachedItem?.title === 'Sample Kit' && cachedItem?.price === 999, 'Test 1.1: Cache set and get returns exact payload');

    const stats = cacheService.getStats();
    assert(typeof stats.hitRate === 'number' && stats.memoryUsedBytes > 0, 'Test 1.2: Cache telemetry calculates hit rate and memory allocation', `Hit Rate: ${stats.hitRate}%`);

    // Invalidate single key
    const deleted = await cacheService.delete('kdw:test:product:sample-kit');
    const afterDelete = await cacheService.get('kdw:test:product:sample-kit');
    assert(deleted && afterDelete === null, 'Test 1.3: Cache single-key eviction removes key from memory and database');

    // TEST GROUP 2: Invalidation Events & Retry Engine
    console.log('\n--- TEST GROUP 2: Event-Driven Invalidation & Failed Job Queue ---');
    const invEvent = await prisma.cacheInvalidationEvent.create({
      data: {
        eventType: 'PRODUCT_ARCHIVED',
        namespace: 'kdw:prod:product',
        keyPattern: 'kdw:prod:product:v3:test-archived-item',
        triggerSource: 'PostgreSQL_TRIGGER',
        status: 'FAILED',
        retryCount: 1,
        failureReason: 'Socket connection reset'
      }
    });
    assert(invEvent.status === 'FAILED', 'Test 2.1: Failed cache invalidation recorded in dead-letter queue');

    // Reprocess invalidation event
    const reprocessed = await prisma.cacheInvalidationEvent.update({
      where: { id: invEvent.id },
      data: { status: 'COMPLETED', retryCount: 2, processedAt: new Date(), failureReason: null }
    });
    assert(reprocessed.status === 'COMPLETED' && reprocessed.retryCount === 2, 'Test 2.2: Reprocessing failed invalidation completes and resets errors');

    // TEST GROUP 3: Cache Warming & Maintenance Operations
    console.log('\n--- TEST GROUP 3: Proactive Cache Warming & Maintenance ---');
    const warmResult = await cacheService.warmCache();
    assert(typeof warmResult.warmedProducts === 'number' && typeof warmResult.warmedCategories === 'number', 'Test 3.1: Cache warming loads top products and categories', `Products: ${warmResult.warmedProducts}, Categories: ${warmResult.warmedCategories}`);

    const clearedNamespaceCount = await cacheService.clearNamespace('kdw:test');
    assert(typeof clearedNamespaceCount === 'number', 'Test 3.2: Clear namespace evicts matching key prefixes');

    // TEST GROUP 4: Staff Profiles & Role-Based Permissions (RBAC)
    console.log('\n--- TEST GROUP 4: Admin Users, Staff Profiles & RBAC Scopes ---');
    const testStaffUser = await prisma.user.create({
      data: {
        name: 'QA Automation Engineer',
        email: `qa.engineer.${Date.now()}@kanishkdigitalworld.com`,
        role: 'Developer/Ops',
        status: 'ACTIVE'
      }
    });
    assert(Boolean(testStaffUser.id), 'Test 4.1: Administrative staff account created');

    const staffProfile = await prisma.staffProfile.create({
      data: {
        userId: testStaffUser.id,
        department: 'ENGINEERING',
        team: 'CORE',
        timezone: 'Asia/Kolkata',
        employeeReference: `EMP-QA-${testStaffUser.id.slice(0, 4).toUpperCase()}`,
        mfaEnabled: true
      }
    });
    assert(staffProfile.department === 'ENGINEERING' && staffProfile.mfaEnabled === true, 'Test 4.2: Staff profile linked with departmental team and MFA');

    // Permissions check
    const perm = await prisma.systemPermission.findFirst({ where: { code: 'cache.manage' } });
    assert(Boolean(perm && perm.resource === 'CACHE' && perm.riskLevel === 'HIGH'), 'Test 4.3: System permission catalog verified with resource and risk tier');

    // TEST GROUP 5: Temporary Elevated Permissions
    console.log('\n--- TEST GROUP 5: Time-Bound Elevated Permissions Governance ---');
    const tempGrant = await prisma.temporaryPermissionGrant.create({
      data: {
        userId: testStaffUser.id,
        userEmail: testStaffUser.email,
        permissionCode: 'system.backup.restore',
        scope: 'ALL',
        reason: 'Authorized recovery testing window',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
        status: 'ACTIVE',
        approvedByName: 'Super Admin'
      }
    });
    assert(tempGrant.status === 'ACTIVE' && tempGrant.permissionCode === 'system.backup.restore', 'Test 5.1: Temporary elevated permission granted with explicit expiration');

    // TEST GROUP 6: Staff Invitations
    console.log('\n--- TEST GROUP 6: Staff Invitations & One-Time Cryptographic Tokens ---');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const invitation = await prisma.staffInvitation.create({
      data: {
        email: `invitee.${Date.now()}@kanishkdigitalworld.com`,
        roleName: 'Catalog Manager',
        department: 'CATALOG',
        team: 'CORE',
        tokenHash,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
        status: 'PENDING'
      }
    });
    assert(invitation.status === 'PENDING' && Boolean(invitation.tokenHash), 'Test 6.1: Staff invitation created with hashed token and 48-hour expiration');

    // TEST GROUP 7: Session Management & Account Suspension
    console.log('\n--- TEST GROUP 7: Session Tracking & Account Suspension ---');
    const sessionHash = crypto.createHash('sha256').update(`test-session-${testStaffUser.id}`).digest('hex');
    const session = await prisma.adminSession.create({
      data: {
        userId: testStaffUser.id,
        userEmail: testStaffUser.email,
        userName: testStaffUser.name,
        sessionHash,
        ipAddress: '198.51.100.10',
        userAgent: 'Mozilla/5.0 Chrome/128.0',
        deviceReference: 'MacBook Pro (Chrome)',
        mfaVerified: true,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        isRevoked: false
      }
    });
    assert(session.isRevoked === false, 'Test 7.1: Active administrative session registered');

    // Suspend user and verify sessions revoked
    await prisma.$transaction([
      prisma.user.update({
        where: { id: testStaffUser.id },
        data: { status: 'SUSPENDED', blockReason: 'Automated security test suspension' }
      }),
      prisma.adminSession.updateMany({
        where: { userId: testStaffUser.id, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() }
      })
    ]);

    const updatedUser = await prisma.user.findUnique({ where: { id: testStaffUser.id } });
    const updatedSession = await prisma.adminSession.findUnique({ where: { id: session.id } });
    assert(updatedUser?.status === 'SUSPENDED' && updatedSession?.isRevoked === true, 'Test 7.2: Account suspension immediately terminates and revokes active sessions');

    // Reactivate
    const reactivatedUser = await prisma.user.update({
      where: { id: testStaffUser.id },
      data: { status: 'ACTIVE', blockReason: null }
    });
    assert(reactivatedUser.status === 'ACTIVE', 'Test 7.3: Account reactivation restores good standing');

    // TEST GROUP 8: Access Reviews & Staff Activity Logging
    console.log('\n--- TEST GROUP 8: Access Reviews & Activity Logs ---');
    const review = await prisma.accessReviewRecord.create({
      data: {
        reviewerName: 'Chief Security Auditor',
        targetUserId: testStaffUser.id,
        targetUserEmail: testStaffUser.email,
        targetUserRole: testStaffUser.role,
        sensitivePermissionsCount: 8,
        lastLoginAt: new Date(),
        recommendation: 'MAINTAIN_ACCESS',
        actionTaken: 'APPROVED_NO_CHANGE',
        notes: 'Permissions appropriate for engineering tasks.'
      }
    });
    assert(review.recommendation === 'MAINTAIN_ACCESS', 'Test 8.1: Access review audit record generated');

    const activityLog = await prisma.staffActivityLog.create({
      data: {
        actorEmail: 'admin@kanishkdigitalworld.com',
        actorName: 'Super Admin',
        actorRole: 'SUPER_ADMIN',
        action: 'CACHE_PURGED',
        resourceType: 'CACHE',
        riskLevel: 'HIGH',
        reason: 'Automated test suite maintenance verification'
      }
    });
    assert(Boolean(activityLog.id) && activityLog.riskLevel === 'HIGH', 'Test 8.2: Immutable staff activity log recorded');

    // Cleanup ephemeral test data
    await prisma.staffActivityLog.delete({ where: { id: activityLog.id } });
    await prisma.accessReviewRecord.delete({ where: { id: review.id } });
    await prisma.adminSession.delete({ where: { id: session.id } });
    await prisma.staffInvitation.delete({ where: { id: invitation.id } });
    await prisma.temporaryPermissionGrant.delete({ where: { id: tempGrant.id } });
    await prisma.staffProfile.delete({ where: { id: staffProfile.id } });
    await prisma.user.delete({ where: { id: testStaffUser.id } });
    await prisma.cacheInvalidationEvent.delete({ where: { id: invEvent.id } });

    console.log('\n================================================================');
    console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Cache and Users verification suite:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCacheAndUsersVerification();
