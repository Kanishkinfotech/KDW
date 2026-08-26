import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function seedSystemManagement() {
  console.log('=====================================================');
  console.log('--- SEEDING MASTER KDW SYSTEM MANAGEMENT SYSTEM ---');
  console.log('=====================================================\n');

  // 1. Seed Threshold Rules
  console.log('1. Seeding System Health Threshold Rules...');
  const thresholdRules = [
    {
      metricKey: 'api_5xx_rate',
      metricName: 'API 5xx Error Rate',
      category: 'API',
      warningThreshold: 1.0,
      criticalThreshold: 5.0,
      unit: '%',
      comparisonOperator: 'GREATER_THAN',
      isEnabled: true
    },
    {
      metricKey: 'api_p95_latency',
      metricName: 'API P95 Response Latency',
      category: 'API',
      warningThreshold: 1000.0,
      criticalThreshold: 3000.0,
      unit: 'ms',
      comparisonOperator: 'GREATER_THAN',
      isEnabled: true
    },
    {
      metricKey: 'webhook_delay_mins',
      metricName: 'Webhook Processing Ingestion Delay',
      category: 'PAYMENT',
      warningThreshold: 2.0,
      criticalThreshold: 10.0,
      unit: 'min',
      comparisonOperator: 'GREATER_THAN',
      isEnabled: true
    },
    {
      metricKey: 'queue_oldest_job_mins',
      metricName: 'Background Queue Oldest Job Age',
      category: 'QUEUE',
      warningThreshold: 5.0,
      criticalThreshold: 30.0,
      unit: 'min',
      comparisonOperator: 'GREATER_THAN',
      isEnabled: true
    },
    {
      metricKey: 'download_failure_rate',
      metricName: 'Digital Delivery Token Failure Rate',
      category: 'DOWNLOAD',
      warningThreshold: 3.0,
      criticalThreshold: 8.0,
      unit: '%',
      comparisonOperator: 'GREATER_THAN',
      isEnabled: true
    },
    {
      metricKey: 'db_conn_pool_percent',
      metricName: 'PostgreSQL Connection Pool Utilization',
      category: 'DATABASE',
      warningThreshold: 70.0,
      criticalThreshold: 90.0,
      unit: '%',
      comparisonOperator: 'GREATER_THAN',
      isEnabled: true
    },
    {
      metricKey: 'backup_age_hours',
      metricName: 'Database Backup Stale Age',
      category: 'BACKUP',
      warningThreshold: 24.0,
      criticalThreshold: 48.0,
      unit: 'hours',
      comparisonOperator: 'GREATER_THAN',
      isEnabled: true
    }
  ];

  for (const rule of thresholdRules) {
    await prisma.systemThresholdRule.upsert({
      where: { metricKey: rule.metricKey },
      update: rule,
      create: rule
    });
  }
  console.log(`✓ Seeded ${thresholdRules.length} system threshold rules.`);

  // 2. Seed System Error Logs
  console.log('\n2. Seeding System Error Logs...');
  const errorLogs = [
    {
      errorCode: 'DRIVE_PERMISSION_DENIED',
      severity: 'ERROR',
      service: 'DOWNLOAD',
      environment: 'PRODUCTION',
      message: 'Google Drive API returned 403 Forbidden for file stream on bundle asset 992',
      stackTrace: 'Error: Google Drive API 403\n    at GoogleDriveClient.streamFile (/server/src/utils/googleDrive.ts:45)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
      endpoint: '/api/digital-delivery/stream/:token',
      status: 'INVESTIGATING',
      assignedOwner: 'DevOps OnCall',
      occurrenceCount: 8,
      firstSeenAt: new Date(Date.now() - 3600 * 1000 * 4),
      lastSeenAt: new Date(Date.now() - 600 * 1000)
    },
    {
      errorCode: 'RAZORPAY_SIGNATURE_MISMATCH',
      severity: 'WARNING',
      service: 'PAYMENT',
      environment: 'PRODUCTION',
      message: 'Invalid signature received on payment verification callback for order ORD-KDW-8821',
      stackTrace: 'Error: Razorpay HMAC mismatch\n    at verifyRazorpaySignature (/server/src/controllers/paymentController.ts:112)',
      endpoint: '/api/payments/verify',
      status: 'UNRESOLVED',
      assignedOwner: 'Finance Team',
      occurrenceCount: 3,
      firstSeenAt: new Date(Date.now() - 3600 * 1000 * 12),
      lastSeenAt: new Date(Date.now() - 3600 * 1000 * 2)
    },
    {
      errorCode: 'EMAIL_SMTP_TIMEOUT',
      severity: 'WARNING',
      service: 'EMAIL',
      environment: 'PRODUCTION',
      message: 'SMTP gateway timeout delivering order receipt to customer rahul.sharma@example.com',
      endpoint: '/api/orders/:id/resend-email',
      status: 'RESOLVED',
      resolvedAt: new Date(Date.now() - 3600 * 1000),
      resolutionNote: 'Resend SMTP pool reconnected automatically; email redelivered successfully.',
      occurrenceCount: 1,
      firstSeenAt: new Date(Date.now() - 3600 * 1000 * 5),
      lastSeenAt: new Date(Date.now() - 3600 * 1000 * 5)
    },
    {
      errorCode: 'DB_CONNECTION_SPIKE',
      severity: 'CRITICAL',
      service: 'DATABASE',
      environment: 'PRODUCTION',
      message: 'PostgreSQL connection pool exceeded 85% capacity during marketing campaign blast',
      endpoint: '/api/products/search',
      status: 'RESOLVED',
      resolvedAt: new Date(Date.now() - 3600 * 1000 * 8),
      resolutionNote: 'Increased Prisma connection pool max from 10 to 25 and added query index.',
      occurrenceCount: 14,
      firstSeenAt: new Date(Date.now() - 3600 * 1000 * 10),
      lastSeenAt: new Date(Date.now() - 3600 * 1000 * 8)
    },
    {
      errorCode: 'WORKER_JOB_FAILED_MAX_RETRIES',
      severity: 'ERROR',
      service: 'WORKER',
      environment: 'PRODUCTION',
      message: 'Customer export job failed 3 attempts due to memory budget constraint',
      endpoint: 'WorkerQueue:CUSTOMER_EXPORT',
      status: 'UNRESOLVED',
      assignedOwner: 'Backend Lead',
      occurrenceCount: 2,
      firstSeenAt: new Date(Date.now() - 3600 * 1000 * 6),
      lastSeenAt: new Date(Date.now() - 3600 * 1000 * 1)
    }
  ];

  for (const err of errorLogs) {
    await prisma.systemErrorLog.create({ data: err });
  }
  console.log(`✓ Seeded ${errorLogs.length} system error records.`);

  // 3. Seed System Login Logs
  console.log('\n3. Seeding System Login Logs...');
  const loginLogs = [
    {
      userType: 'ADMIN',
      email: 'admin@kanishkdigitalworld.com',
      userName: 'Vishwa SuperAdmin',
      eventType: 'LOGIN_SUCCESS',
      result: 'SUCCESS',
      ipAddress: '49.37.152.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
      isSuspicious: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2)
    },
    {
      userType: 'ADMIN',
      email: 'finance@kanishkdigitalworld.com',
      userName: 'Finance Staff',
      eventType: 'MFA_CHALLENGE',
      result: 'SUCCESS',
      ipAddress: '106.51.240.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      isSuspicious: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4)
    },
    {
      userType: 'ADMIN',
      email: 'admin@kanishkdigitalworld.com',
      userName: 'Unknown Attacker',
      eventType: 'LOGIN_FAILURE',
      result: 'BLOCKED',
      failureReason: 'Invalid password & IP blocked after 5 attempts',
      ipAddress: '185.220.101.5',
      userAgent: 'Python-urllib/3.9',
      isSuspicious: true,
      suspiciousReason: 'Brute-force credential stuffing attack detected from Tor exit node',
      createdAt: new Date(Date.now() - 3600 * 1000 * 7)
    },
    {
      userType: 'CUSTOMER',
      email: 'priya.patel@gmail.com',
      userName: 'Priya Patel',
      eventType: 'LOGIN_SUCCESS',
      result: 'SUCCESS',
      ipAddress: '157.34.120.91',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
      isSuspicious: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 1)
    },
    {
      userType: 'CUSTOMER',
      email: 'anand.k@hotmail.com',
      userName: 'Anand Kumar',
      eventType: 'LOGIN_FAILURE',
      result: 'FAILED',
      failureReason: 'Incorrect password',
      ipAddress: '117.198.88.42',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      isSuspicious: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 3)
    }
  ];

  for (const log of loginLogs) {
    await prisma.systemLoginLog.create({ data: log });
  }
  console.log(`✓ Seeded ${loginLogs.length} authentication & security logs.`);

  // 4. Seed API & Webhook Logs
  console.log('\n4. Seeding API and Webhook Logs...');
  const apiLogs = [
    {
      requestId: 'req_kdw_api_001',
      method: 'GET',
      endpoint: '/api/admin/dashboard',
      statusCode: 200,
      latencyMs: 38,
      actorRole: 'ADMIN',
      ipAddress: '49.37.152.88',
      responseSizeBytes: 4280
    },
    {
      requestId: 'req_kdw_api_002',
      method: 'POST',
      endpoint: '/api/payments/verify',
      statusCode: 200,
      latencyMs: 142,
      actorRole: 'CUSTOMER',
      ipAddress: '157.34.120.91',
      responseSizeBytes: 1040
    },
    {
      requestId: 'req_kdw_api_003',
      method: 'GET',
      endpoint: '/api/digital-delivery/stream/tok_9912',
      statusCode: 200,
      latencyMs: 65,
      actorRole: 'CUSTOMER',
      ipAddress: '157.34.120.91',
      responseSizeBytes: 52428800
    }
  ];

  for (const api of apiLogs) {
    await prisma.systemApiLog.create({ data: api });
  }

  const webhookLogs = [
    {
      provider: 'RAZORPAY',
      externalEventId: 'evt_rzp_pay_capture_9921',
      eventType: 'payment.captured',
      signatureValid: true,
      status: 'PROCESSED',
      relatedOrderId: 'ORD-KDW-1002',
      relatedPaymentId: 'pay_rzp_992144',
      processedAt: new Date(Date.now() - 3600 * 1000),
      createdAt: new Date(Date.now() - 3600 * 1000)
    },
    {
      provider: 'RAZORPAY',
      externalEventId: 'evt_rzp_refund_proc_4412',
      eventType: 'refund.processed',
      signatureValid: true,
      status: 'PROCESSED',
      relatedOrderId: 'ORD-KDW-1001',
      processedAt: new Date(Date.now() - 3600 * 1000 * 5),
      createdAt: new Date(Date.now() - 3600 * 1000 * 5)
    }
  ];

  for (const wh of webhookLogs) {
    await prisma.systemWebhookLog.create({ data: wh });
  }
  console.log(`✓ Seeded API telemetry and webhook delivery logs.`);

  // 5. Seed Background Jobs
  console.log('\n5. Seeding Background Worker Jobs...');
  const backgroundJobs = [
    {
      jobType: 'FULFILMENT',
      queue: 'HIGH_PRIORITY',
      status: 'COMPLETED',
      attempts: 1,
      maxAttempts: 3,
      relatedResourceId: 'ORD-KDW-1002',
      startedAt: new Date(Date.now() - 3600 * 1000),
      completedAt: new Date(Date.now() - 3600 * 1000 + 450)
    },
    {
      jobType: 'EMAIL_DELIVERY',
      queue: 'DEFAULT',
      status: 'COMPLETED',
      attempts: 1,
      maxAttempts: 3,
      relatedResourceId: 'ORD-KDW-1002',
      startedAt: new Date(Date.now() - 3600 * 1000),
      completedAt: new Date(Date.now() - 3600 * 1000 + 820)
    },
    {
      jobType: 'DRIVE_HEALTH_CHECK',
      queue: 'MAINTENANCE',
      status: 'RUNNING',
      attempts: 1,
      maxAttempts: 2,
      startedAt: new Date(Date.now() - 60 * 1000)
    },
    {
      jobType: 'REPORT_GENERATION',
      queue: 'BULK',
      status: 'QUEUED',
      attempts: 0,
      maxAttempts: 3
    },
    {
      jobType: 'CUSTOMER_EXPORT',
      queue: 'BULK',
      status: 'DEAD_LETTER',
      attempts: 3,
      maxAttempts: 3,
      errorMessage: 'Process memory allocation exceeded 512MB limit during 100k row JSON serialization.',
      failedAt: new Date(Date.now() - 3600 * 1000 * 6)
    }
  ];

  for (const job of backgroundJobs) {
    await prisma.systemBackgroundJob.create({ data: job });
  }
  console.log(`✓ Seeded ${backgroundJobs.length} background jobs.`);

  // 6. Seed Backups and Restore Tests
  console.log('\n6. Seeding System Backups and Restore Tests...');
  const sampleBackup = await prisma.systemBackup.create({
    data: {
      backupType: 'FULL_DATABASE',
      storagePath: 's3://kwd-encrypted-backups/production/kwd_backup_full_2026-08-26.sql.enc',
      filename: 'kwd_backup_full_2026-08-26.sql.enc',
      sizeBytes: BigInt(48234496), // ~46MB
      checksumSha256: crypto.createHash('sha256').update('sample_backup_payload_seed_2026').digest('hex'),
      encryptionStatus: 'ENCRYPTED',
      status: 'COMPLETED',
      verificationStatus: 'PASSED',
      verificationNotes: 'Automated table checksum and foreign key validation passed (36 tables).',
      recordsCount: 4280,
      isAutomatic: true,
      completedAt: new Date(Date.now() - 3600 * 1000 * 24)
    }
  });

  await prisma.systemRestoreTest.create({
    data: {
      backupId: sampleBackup.id,
      environment: 'SANDBOX_TEST',
      status: 'PASSED',
      restoreDurationSeconds: 1.15,
      tablesValidated: 36,
      recordsCountValidated: 4280,
      sampleOrderVerified: true,
      sampleProductVerified: true,
      rpoResultMinutes: 15.0,
      rtoResultSeconds: 1.15,
      issuesReport: 'Clean non-destructive dry-run: 0 data loss, all relationships validated.',
      performedByName: 'Automated Disaster Recovery Engine',
      completedAt: new Date(Date.now() - 3600 * 1000 * 23)
    }
  });
  console.log(`✓ Seeded production backup and sandbox restore test report.`);

  // 7. Seed Incidents
  console.log('\n7. Seeding Incidents & Postmortems...');
  await prisma.systemIncident.create({
    data: {
      incidentNumber: 'INC-2026-001',
      title: 'Elevated Latency on Digital Download File Streaming',
      severity: 'MEDIUM',
      service: 'GOOGLE_DRIVE',
      status: 'RESOLVED',
      affectedCustomersCount: 14,
      summary: 'Customers experienced 20-second buffering delays when streaming large 2GB ZIP bundles.',
      rootCause: 'Google Drive API OAuth token caching refresh loop bottlenecked under concurrent requests.',
      actionsTaken: 'Implemented in-memory OAuth bearer token caching with 55-minute TTL buffer.',
      postmortemReport: '# INCIDENT POSTMORTEM INC-2026-001\n\n**Impact:** 14 customers experienced download lag for 18 minutes.\n**Resolution:** Deployed optimized token cache.\n**Status:** Fully resolved with zero data loss.',
      mitigatedAt: new Date(Date.now() - 3600 * 1000 * 18),
      resolvedAt: new Date(Date.now() - 3600 * 1000 * 17)
    }
  });
  console.log(`✓ Seeded incident records and postmortem.`);

  // 8. Seed Monitoring Alerts
  console.log('\n8. Seeding Monitoring Alerts...');
  const alerts = [
    {
      alertType: 'DOWNLOAD_FAILURE_SPIKE',
      severity: 'HIGH',
      source: 'DRIVE',
      status: 'OPEN',
      title: 'Google Drive 403 Forbidden Rate Elevated',
      message: '8 file permission failures observed in the last 60 minutes for digital asset bundles.',
      metricValue: '4.2%',
      thresholdValue: '3.0%'
    },
    {
      alertType: 'QUEUE_BACKLOG',
      severity: 'MEDIUM',
      source: 'WORKER',
      status: 'ACKNOWLEDGED',
      title: 'Dead-Letter Queue Contains 1 Failed Job',
      message: 'Job CUSTOMER_EXPORT failed 3 retry attempts and requires administrative review.',
      metricValue: '1 Job',
      thresholdValue: '0 Jobs'
    }
  ];

  for (const a of alerts) {
    await prisma.systemMonitoringAlert.create({ data: a });
  }
  console.log(`✓ Seeded ${alerts.length} monitoring alerts.`);

  console.log('\n=====================================================');
  console.log('--- SYSTEM MANAGEMENT MASTER SEEDING COMPLETE ---');
  console.log('=====================================================');
}

seedSystemManagement()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
