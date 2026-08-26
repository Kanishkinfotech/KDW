import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KDW Master Reports & Security data...');

  // 1. Fetch products, categories, coupons, and users
  const [products, categories, coupons, users] = await Promise.all([
    prisma.product.findMany({ take: 10 }),
    prisma.category.findMany({ take: 5 }),
    prisma.coupon.findMany({ take: 5 }),
    prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 10 })
  ]);

  if (products.length === 0 || users.length === 0) {
    console.log('Requires existing products and users.');
    return;
  }

  // 2. Seed Customer Sessions
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const tokenHash = crypto.createHash('sha256').update(`session-${u.id}-${Date.now()}`).digest('hex');
    await prisma.customerSession.upsert({
      where: { sessionTokenHash: tokenHash },
      update: {},
      create: {
        userId: u.id,
        sessionTokenHash: tokenHash,
        device: i % 2 === 0 ? 'Chrome 122 on Windows 11' : 'Safari 17 on iPhone 15',
        ipAddress: `103.212.144.${20 + i}`,
        location: 'Mumbai, IN',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastSeenAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000)
      }
    });
  }

  // 3. Seed Login Logs (Successes, Failures, Password Resets, Verification)
  const loginEvents = [
    { type: 'login_success', res: 'SUCCESS', reason: null, risk: 'LOW', susp: false },
    { type: 'login_success', res: 'SUCCESS', reason: null, risk: 'LOW', susp: false },
    { type: 'login_failure', res: 'FAILED', reason: 'Invalid password', risk: 'MEDIUM', susp: false },
    { type: 'login_failure', res: 'FAILED', reason: 'Unknown email', risk: 'LOW', susp: false },
    { type: 'login_failure', res: 'FAILED', reason: 'Account blocked', risk: 'BLOCKED', susp: true },
    { type: 'login_failure', res: 'FAILED', reason: 'Too many attempts', risk: 'HIGH', susp: true },
    { type: 'password_reset_request', res: 'SUCCESS', reason: null, risk: 'LOW', susp: false },
    { type: 'password_reset_completed', res: 'SUCCESS', reason: null, risk: 'LOW', susp: false },
    { type: 'email_verification_sent', res: 'SUCCESS', reason: null, risk: 'LOW', susp: false },
    { type: 'email_verified', res: 'SUCCESS', reason: null, risk: 'LOW', susp: false }
  ];

  for (let j = 0; j < 30; j++) {
    const u = users[j % users.length];
    const ev = loginEvents[j % loginEvents.length];
    await prisma.customerLoginLog.create({
      data: {
        userId: u.id,
        email: u.email,
        eventType: ev.type,
        result: ev.res,
        failureReason: ev.reason,
        ipAddress: `49.36.120.${10 + (j % 50)}`,
        device: j % 2 === 0 ? 'Chrome 122 (Desktop)' : 'Safari (Mobile)',
        location: j % 3 === 0 ? 'Delhi, IN' : (j % 3 === 1 ? 'Bengaluru, IN' : 'Mumbai, IN'),
        isSuspicious: ev.susp,
        riskLevel: ev.risk,
        createdAt: new Date(Date.now() - j * 4 * 60 * 60 * 1000)
      }
    });
  }

  // 4. Seed Guest Order Claims
  const guestOrders = await prisma.order.findMany({
    where: { customerId: null, guestEmail: { not: null } },
    take: 5
  });

  for (const go of guestOrders) {
    const targetUser = users[0];
    await prisma.guestOrderClaim.create({
      data: {
        guestEmail: go.guestEmail!,
        orderId: go.id,
        userId: targetUser.id,
        status: 'CLAIMED',
        ipAddress: '103.212.144.15',
        claimedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    });
  }

  // 5. Seed Customer Security Events
  const securityIssues = [
    { type: 'brute_force', sev: 'HIGH', desc: '5 consecutive failed login attempts detected within 2 minutes.' },
    { type: 'multi_account_ip', sev: 'MEDIUM', desc: 'Single IP address attempted authentication on 4 different accounts.' },
    { type: 'country_anomaly', sev: 'HIGH', desc: 'Account accessed from UK IP after previous session in India within 30 minutes.' },
    { type: 'high_risk_reset', sev: 'LOW', desc: 'Password reset completed and immediate order checkout initiated.' }
  ];

  for (let k = 0; k < securityIssues.length; k++) {
    const sec = securityIssues[k];
    const u = users[k % users.length];
    await prisma.customerSecurityEvent.create({
      data: {
        userId: u.id,
        email: u.email,
        eventType: sec.type,
        severity: sec.sev,
        status: k === 0 ? 'OPEN' : (k === 1 ? 'ACKNOWLEDGED' : 'RESOLVED'),
        description: sec.desc,
        ipAddress: `194.26.29.${50 + k}`,
        createdAt: new Date(Date.now() - k * 12 * 60 * 60 * 1000),
        resolvedAt: k > 1 ? new Date() : null,
        resolvedBy: k > 1 ? 'security@kdw.com' : null,
        resolutionNotes: k > 1 ? 'Customer verified identity via 2FA.' : null
      }
    });
  }

  // 6. Seed Report Alerts (Cross-Report Triage)
  const reportAlerts = [
    { cat: 'CUSTOMER', type: 'unresolved_download_failure', sev: 'CRITICAL', title: 'High-Value VIP Download Failure', desc: 'VIP customer spent ₹4,500 but experienced 3 consecutive file stream timeouts.' },
    { cat: 'CUSTOMER', type: 'access_after_refund', sev: 'HIGH', title: 'Active Access After Refund', desc: 'Order #ORD-REF-892 was refunded but digital entitlement is still in ACTIVE state.' },
    { cat: 'LOGIN', type: 'repeated_login_failures', sev: 'HIGH', title: 'Credential Stuffing Warning', desc: 'Elevated rate of invalid password rejections from subnet 185.220.101.0/24.' },
    { cat: 'COUPON', type: 'coupon_abuse_pattern', sev: 'MEDIUM', title: 'Coupon "MEGA50" High Reuse', desc: 'Single user created 3 guest orders using coupon intended for new buyers.' },
    { cat: 'DOWNLOAD', type: 'drive_permission_error', sev: 'CRITICAL', title: 'Drive Service Account 403 Forbidden', desc: 'Google Drive API reported permission denied on target folder ID 1A2B3C...' }
  ];

  for (let a = 0; a < reportAlerts.length; a++) {
    const ra = reportAlerts[a];
    await prisma.reportAlert.create({
      data: {
        category: ra.cat,
        alertType: ra.type,
        severity: ra.sev,
        status: a === 0 ? 'OPEN' : (a === 1 ? 'ACKNOWLEDGED' : 'RESOLVED'),
        title: ra.title,
        description: ra.desc,
        createdAt: new Date(Date.now() - a * 6 * 60 * 60 * 1000)
      }
    });
  }

  console.log('✅ Master Reports & Security database seeded successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding master reports data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
