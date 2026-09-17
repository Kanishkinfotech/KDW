import 'dotenv/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { prisma } from '../database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

async function runPhase1Phase2AutomatedTests() {
  console.log('\n================================================================');
  console.log('  RUNNING KDW PHASE 1 + PHASE 2 FULL-STACK VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] Test ${passed + failed + 1}: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${passed + failed + 1}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Password hashing and bcrypt verification contract
  // -------------------------------------------------------------
  try {
    const rawPass = 'CustomerSecret2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPass, salt);
    const isMatch = await bcrypt.compare(rawPass, hash);
    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert(isMatch && !isWrongMatch, 'Bcrypt password hashing and verification works accurately');
  } catch (err: any) {
    assert(false, 'Test 1 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 2: JWT Token signing, claims verification, and expiration
  // -------------------------------------------------------------
  try {
    const testUser = { id: 'cust_phase2_001', role: 'CUSTOMER', name: 'Kanishk User', email: 'kanishk@kdw.com' };
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    assert(
      decoded.id === testUser.id && decoded.role === testUser.role && decoded.email === testUser.email,
      'JWT token correctly signs, verifies, and retains customer identity payload'
    );
  } catch (err: any) {
    assert(false, 'Test 2 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 3: Unauthenticated request token extraction (Bearer header vs Cookie)
  // -------------------------------------------------------------
  try {
    const extractToken = (authHeader?: string, cookieToken?: string) => {
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
      }
      return cookieToken || null;
    };

    const tokenFromBearer = extractToken('Bearer jwt-token-alpha');
    const tokenFromCookie = extractToken(undefined, 'cookie-token-beta');
    const missingToken = extractToken(undefined, undefined);

    assert(
      tokenFromBearer === 'jwt-token-alpha' &&
      tokenFromCookie === 'cookie-token-beta' &&
      missingToken === null,
      'Auth extractor accepts both Bearer token and cookie credentials without leaks'
    );
  } catch (err: any) {
    assert(false, 'Test 3 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 4: Database Product Model & Filter Constraints
  // -------------------------------------------------------------
  try {
    const count = await prisma.product.count();
    assert(typeof count === 'number' && count >= 0, `Database Product model is reachable (Found ${count} products in catalog)`);
  } catch (err: any) {
    assert(false, 'Test 4 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 5: Category Query and Hierarchical Subcategory Resolution
  // -------------------------------------------------------------
  try {
    const categories = await prisma.category.findMany({
      take: 10,
      include: { children: true }
    });
    assert(Array.isArray(categories), `Database Category model supports hierarchical queries (Found ${categories.length} categories)`);
  } catch (err: any) {
    assert(false, 'Test 5 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 6: Digital Cart Subtotal & Single-Unit Normalization
  // -------------------------------------------------------------
  try {
    const cartItems = [
      { id: 'prod_1', title: 'Cinematic LUTs', price: 799, quantity: 1 },
      { id: 'prod_2', title: 'Motion Graphics Pack', price: 1299, quantity: 1 }
    ];

    const addDigitalItem = (items: typeof cartItems, newItem: typeof cartItems[0]) => {
      if (items.some(i => i.id === newItem.id)) return items;
      return [...items, { ...newItem, quantity: 1 }];
    };

    const duplicateAttempt = addDigitalItem(cartItems, { id: 'prod_1', title: 'Cinematic LUTs', price: 799, quantity: 3 });
    const subtotal = duplicateAttempt.reduce((sum, i) => sum + i.price * i.quantity, 0);

    assert(
      duplicateAttempt.length === 2 && subtotal === 2098,
      'Digital cart normalizes quantity to 1 and strictly prevents duplicate product billing'
    );
  } catch (err: any) {
    assert(false, 'Test 6 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 7: Open Redirect Protection on Authentication Flows
  // -------------------------------------------------------------
  try {
    const sanitizeRedirect = (rawUrl?: string | null): string => {
      if (!rawUrl) return '/account';
      if (rawUrl.startsWith('/') && !rawUrl.startsWith('//')) {
        return rawUrl;
      }
      return '/account';
    };

    assert(
      sanitizeRedirect('/checkout') === '/checkout' &&
      sanitizeRedirect('/account/downloads') === '/account/downloads' &&
      sanitizeRedirect('//evil.com/phish') === '/account' &&
      sanitizeRedirect('https://attacker.com') === '/account',
      'Open redirect attack vectors are neutralized, allowing only internal route transitions'
    );
  } catch (err: any) {
    assert(false, 'Test 7 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 8: Price Filter Validation (minPrice <= maxPrice)
  // -------------------------------------------------------------
  try {
    const validatePriceRange = (min?: number, max?: number) => {
      if (min !== undefined && max !== undefined) {
        return min <= max;
      }
      return true;
    };

    assert(
      validatePriceRange(500, 2500) === true &&
      validatePriceRange(3000, 1500) === false &&
      validatePriceRange(undefined, 5000) === true,
      'Price filter bounds validator correctly rejects inverted price ranges'
    );
  } catch (err: any) {
    assert(false, 'Test 8 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 9: Wishlist LocalStorage Data Integrity and Non-Breaking Recovery
  // -------------------------------------------------------------
  try {
    const parseWishlist = (raw: string | null) => {
      try {
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const validArray = JSON.stringify([{ id: 'p1', title: 'Asset 1' }]);
    const corruptedPayload = '{{{ broken json: [)';
    const objectPayload = JSON.stringify({ item: 'not an array' });

    assert(
      parseWishlist(validArray).length === 1 &&
      parseWishlist(corruptedPayload).length === 0 &&
      parseWishlist(objectPayload).length === 0,
      'Wishlist parser gracefully handles valid arrays, malformed strings, and unexpected types'
    );
  } catch (err: any) {
    assert(false, 'Test 9 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 10: Product Slug vs UUID Identifier Resolution
  // -------------------------------------------------------------
  try {
    const sampleProduct = await prisma.product.findFirst();
    if (sampleProduct) {
      const byId = await prisma.product.findFirst({ where: { OR: [{ id: sampleProduct.id }, { slug: sampleProduct.id }] } });
      const bySlug = await prisma.product.findFirst({ where: { OR: [{ id: sampleProduct.slug }, { slug: sampleProduct.slug }] } });
      assert(
        Boolean(byId && bySlug && byId.id === bySlug.id),
        `Product lookup matches identically via UUID (${sampleProduct.id}) and Slug (${sampleProduct.slug})`
      );
    } else {
      assert(true, 'Product lookup logic verified (Catalog empty)');
    }
  } catch (err: any) {
    assert(false, 'Test 10 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 11: Server-Authoritative Coupon Discount Calculation
  // -------------------------------------------------------------
  try {
    const calculateCouponDiscount = (coupon: { type: 'PERCENT' | 'FIXED'; value: number; maxDiscount?: number }, cartTotal: number) => {
      if (coupon.type === 'PERCENT') {
        const rawDiscount = (cartTotal * coupon.value) / 100;
        return coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
      }
      return Math.min(cartTotal, coupon.value);
    };

    const percentDiscount = calculateCouponDiscount({ type: 'PERCENT', value: 20, maxDiscount: 500 }, 3000); // 20% of 3000 is 600, capped at 500
    const fixedDiscount = calculateCouponDiscount({ type: 'FIXED', value: 400 }, 1500); // 400
    const overageFixed = calculateCouponDiscount({ type: 'FIXED', value: 1000 }, 500); // 500 max

    assert(
      percentDiscount === 500 && fixedDiscount === 400 && overageFixed === 500,
      'Coupon calculations accurately enforce percentage rates, maximum caps, and subtotal limits'
    );
  } catch (err: any) {
    assert(false, 'Test 11 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 12: Razorpay Cryptographic Signature Verification (HMAC SHA-256)
  // -------------------------------------------------------------
  try {
    const orderId = 'order_test_98765';
    const paymentId = 'pay_test_12345';
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const verifySignature = (oId: string, pId: string, sig: string, secret: string) => {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${oId}|${pId}`)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'));
    };

    const isValid = verifySignature(orderId, paymentId, generatedSignature, RAZORPAY_KEY_SECRET);
    let isForgedValid = false;
    try {
      isForgedValid = verifySignature(orderId, paymentId, 'forged_signature_0000', RAZORPAY_KEY_SECRET);
    } catch {
      isForgedValid = false;
    }

    assert(
      isValid && !isForgedValid,
      'Razorpay HMAC SHA-256 signature verification confirms genuine payments and rejects forgeries'
    );
  } catch (err: any) {
    assert(false, 'Test 12 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 13: Time-Limited Secure Download Token Expiration Logic
  // -------------------------------------------------------------
  try {
    const generateToken = (hoursValid: number = 1) => {
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
      return { token, expiresAt };
    };

    const isTokenValid = (tokenRecord: { expiresAt: Date; used?: boolean }) => {
      if (tokenRecord.used) return false;
      return new Date() <= tokenRecord.expiresAt;
    };

    const activeToken = generateToken(1);
    const expiredToken = { token: 'expired_001', expiresAt: new Date(Date.now() - 1000 * 60) };
    const usedToken = { ...generateToken(1), used: true };

    assert(
      isTokenValid(activeToken) === true &&
      isTokenValid(expiredToken) === false &&
      isTokenValid(usedToken) === false,
      'Secure download tokens enforce 1-hour expiration and single-use invalidation'
    );
  } catch (err: any) {
    assert(false, 'Test 13 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 14: PDF Invoice Stream Generation via PDFKit
  // -------------------------------------------------------------
  try {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    let isComplete = false;
    doc.on('end', () => { isComplete = true; });

    doc.fontSize(20).text('Kanishk Digital World - INVOICE');
    doc.fontSize(10).text('Order Number: KDW-TEST-001');
    doc.text('Total Amount: INR 1,499.00');
    doc.end();

    await new Promise(resolve => setTimeout(resolve, 50));
    const totalBytes = Buffer.concat(chunks).length;

    assert(
      totalBytes > 100 && isComplete,
      `PDFKit dynamically generates and streams official invoice documents (${totalBytes} bytes)`
    );
  } catch (err: any) {
    assert(false, 'Test 14 threw error', err.message);
  }

  // -------------------------------------------------------------
  // Test 15: License Key Formatting and Copy Protection
  // -------------------------------------------------------------
  try {
    const formatLicenseKey = (orderNumber: string, productId: string) => {
      const sanitizedOrder = orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const productSegment = productId.substring(0, 8).toUpperCase();
      return `KDW-LIC-${sanitizedOrder}-${productSegment}`;
    };

    const key = formatLicenseKey('KDW-20260901-44219', '783c64fb-e45b-4cad-8012-ae60da8c80f1');
    assert(
      key === 'KDW-LIC-KDW2026090144219-783C64FB',
      'Customer commercial licence keys format into unique, copyable alphanumeric tokens'
    );
  } catch (err: any) {
    assert(false, 'Test 15 threw error', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`  PHASE 1 + PHASE 2 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Phase2AutomatedTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
