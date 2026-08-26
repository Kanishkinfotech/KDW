import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';
const BASE_URL = 'http://localhost:5000/api/admin/reports';

const testToken = jwt.sign(
  { id: 'test-admin', email: 'admin@kdw.com', role: 'SUPER_ADMIN', name: 'Super Admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const endpoints = [
  // 1. Customer Report Endpoints
  '/customers/overview?range=30d',
  '/customers/new?range=30d',
  '/customers/returning',
  '/customers/guests',
  '/customers/value',
  '/customers/retention',
  '/customers/segments',
  '/customers/ownership',
  '/customers/refunds',
  '/customers/downloads',

  // 2. Customer Login Report Endpoints
  '/logins/overview?range=30d',
  '/logins/successful',
  '/logins/failed',
  '/logins/password-resets',
  '/logins/email-verification',
  '/logins/active-sessions',
  '/logins/guest-claims',
  '/logins/suspicious',

  // 3. Customer Buy Analysis Endpoints
  '/buy-analysis/overview?range=30d',
  '/buy-analysis/first-purchase',
  '/buy-analysis/repeat-purchase',
  '/buy-analysis/product-affinity',
  '/buy-analysis/bundle-adoption',
  '/buy-analysis/purchase-timing',
  '/buy-analysis/guest-vs-account',
  '/buy-analysis/customer-journey',

  // 4. Coupon Report Endpoints
  '/coupons/overview?range=30d',
  '/coupons/usage',
  '/coupons/revenue',
  '/coupons/customers',
  '/coupons/products',
  '/coupons/abuse',

  // 5. Download Report Endpoints
  '/downloads/overview?range=30d',
  '/downloads/by-product',
  '/downloads/by-version',
  '/downloads/guests',

  // 6. Alert Triage
  '/alerts'
];

async function verifyAll() {
  console.log('🔍 Starting comprehensive verification of KDW Reports Endpoints...\n');
  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    const url = `${BASE_URL}${ep}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });

      const json = await res.json();
      if (res.status === 200 && json.success) {
        console.log(`✅ [PASS] ${ep}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${ep} — Status: ${res.status}, Response:`, json);
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ [ERROR] ${ep} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n==============================================`);
  console.log(`Verification Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==============================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

verifyAll();
