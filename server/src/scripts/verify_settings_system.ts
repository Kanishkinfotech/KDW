import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { 
  getSettingValue, 
  getSettingsByGroup, 
  saveSetting, 
  SECRET_MASK 
} from '../controllers/settings/settingsService';

const prisma = new PrismaClient();

async function runVerification() {
  console.log('=====================================================');
  console.log('--- STARTING COMPREHENSIVE KDW SETTINGS VERIFICATION ---');
  console.log('=====================================================\n');

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
    // TEST 1: System Settings Key-Value Retrieval & Fallbacks
    console.log('--- TEST GROUP 1: Core System Settings Read/Write ---');
    const storeName = await getSettingValue('general.store_name');
    assert(storeName === 'Kanishk Digital World', 'Test 1.1: Retrieve general store name setting', `Received: ${storeName}`);

    const gstRate = await getSettingValue('tax.gst_rate');
    assert(gstRate === 18, 'Test 1.2: Retrieve numeric tax GST rate setting with type coercion', `Received: ${gstRate}`);

    const showRatings = await getSettingValue('store.show_product_ratings');
    assert(showRatings === true, 'Test 1.3: Retrieve boolean storefront toggle setting', `Received: ${showRatings}`);

    // TEST 2: Secret Masking & Leak Prevention
    console.log('\n--- TEST GROUP 2: Secret Masking & Security Isolation ---');
    const maskedSecret = await getSettingValue('checkout.razorpay_key_secret');
    assert(maskedSecret === SECRET_MASK, 'Test 2.1: Secret data types return masked string by default', `Received: ${maskedSecret}`);

    const unmaskedSecret = await getSettingValue<string>('checkout.razorpay_key_secret', '', true);
    assert(unmaskedSecret !== SECRET_MASK && typeof unmaskedSecret === 'string', 'Test 2.2: Internal unmasking flag accesses raw secret safely', `Length: ${String(unmaskedSecret).length}`);

    // TEST 3: Grouped Settings Fetching
    console.log('\n--- TEST GROUP 3: Grouped Settings Aggregation ---');
    const generalSettings = await getSettingsByGroup('GENERAL');
    assert(Boolean(generalSettings['general.business_address']), 'Test 3.1: Fetch GENERAL settings group map');
    assert(generalSettings.default_timezone === 'Asia/Kolkata', 'Test 3.2: Verify default timezone in general group', `Received: ${generalSettings.default_timezone}`);

    // TEST 4: Setting Versioning & Immutable History
    console.log('\n--- TEST GROUP 4: Versioning & Audit Trail ---');
    const testKey = 'test.ephemeral_setting_key';
    await saveSetting(
      { key: testKey, value: 'InitialValue_100', group: 'TEST' },
      { name: 'Automated Tester', role: 'SUPER_ADMIN' },
      'TEST'
    );
    await saveSetting(
      { key: testKey, value: 'UpdatedValue_200', group: 'TEST', changeReason: 'QA verification test update' },
      { name: 'Automated Tester', role: 'SUPER_ADMIN' },
      'TEST'
    );

    const versionRecords = await prisma.settingVersion.findMany({
      where: { settingKey: testKey },
      orderBy: { versionNumber: 'asc' }
    });
    assert(versionRecords.length >= 2, 'Test 4.1: SettingVersion records created automatically on mutation', `Count: ${versionRecords.length}`);
    assert(versionRecords[1].oldValue === 'InitialValue_100' && versionRecords[1].newValue === 'UpdatedValue_200', 'Test 4.2: Historical old and new values accurately captured in version log');

    const auditRecords = await prisma.settingAuditLog.findMany({
      where: { settingKey: testKey }
    });
    assert(auditRecords.length >= 2, 'Test 4.3: SettingAuditLog entries recorded with actor attribution', `Count: ${auditRecords.length}`);

    // TEST 5: Settings Rollback Engine
    console.log('\n--- TEST GROUP 5: One-Click Rollback Engine ---');
    await saveSetting(
      { key: testKey, value: versionRecords[0].newValue, group: 'TEST', changeReason: 'Rollback to v1' },
      { name: 'Rollback Tester', role: 'SUPER_ADMIN' },
      'TEST'
    );
    const rolledBackVal = await getSettingValue(testKey);
    assert(rolledBackVal === 'InitialValue_100', 'Test 5.1: Rollback successfully restores target historical value', `Received: ${rolledBackVal}`);

    // TEST 6: Legal Documents & Multi-Version Lifecycle
    console.log('\n--- TEST GROUP 6: Legal Documents & Publishing ---');
    const termsDoc = await prisma.legalDocument.findUnique({
      where: { slug: 'terms-of-service' },
      include: { versions: true }
    });
    assert(Boolean(termsDoc && termsDoc.status === 'PUBLISHED'), 'Test 6.1: Terms of Service exists in PUBLISHED status');
    assert(Boolean(termsDoc?.versions?.length && termsDoc.versions.length >= 1), 'Test 6.2: Terms of Service has published version attached');

    const refundDoc = await prisma.legalDocument.findUnique({
      where: { slug: 'refund-policy' }
    });
    assert(Boolean(refundDoc && refundDoc.slug === 'refund-policy'), 'Test 6.3: Refund & Cancellation Policy exists with verified slug');

    // TEST 7: Policy Acceptance Tracking
    console.log('\n--- TEST GROUP 7: Policy Acceptance Tracking ---');
    const acceptance = await prisma.policyAcceptanceRecord.create({
      data: {
        documentSlug: 'terms-of-service',
        versionNumber: 1,
        customerEmail: 'compliance.test@kdw-store.com',
        orderId: 'ORD-TEST-9921',
        ipAddress: '127.0.0.1',
        userAgent: 'KDW-Automated-QA-Engine/2026'
      }
    });
    assert(Boolean(acceptance.id), 'Test 7.1: Checkout policy acceptance recorded with IP and User-Agent telemetry', `Record ID: ${acceptance.id}`);

    // TEST 8: Data Retention Compliance Rules
    console.log('\n--- TEST GROUP 8: Data Retention & Compliance ---');
    const retentionRules = await prisma.dataRetentionRule.findMany();
    assert(retentionRules.length >= 6, 'Test 8.1: Six statutory data retention compliance rules configured in database', `Count: ${retentionRules.length}`);

    // Cleanup test key
    await prisma.systemSetting.deleteMany({ where: { key: testKey } });
    await prisma.settingVersion.deleteMany({ where: { settingKey: testKey } });
    await prisma.settingAuditLog.deleteMany({ where: { settingKey: testKey } });
    await prisma.policyAcceptanceRecord.deleteMany({ where: { id: acceptance.id } });

    console.log('\n=====================================================');
    console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('=====================================================');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during settings verification suite:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
