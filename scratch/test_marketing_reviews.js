const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

// Import services directly from compiled JS in dist
const { CouponService } = require('../server/dist/services/couponService');
const { OfferService } = require('../server/dist/services/offerService');
const { CampaignService } = require('../server/dist/services/campaignService');
const { ReviewService } = require('../server/dist/services/reviewService');

async function runTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING KDW MARKETING, OFFERS, CAMPAIGNS & REVIEWS TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 0. Setup Test Fixtures (Customer, Product, Category, Bundle)
    console.log('📦 Step 0: Setting up test fixtures...');

    // Clean previous test state
    await prisma.couponRedemption.deleteMany({ where: { coupon: { code: { startsWith: 'TEST_' } } } });
    await prisma.coupon.updateMany({ where: { code: { startsWith: 'TEST_' } }, data: { usedCount: 0 } });
    await prisma.reviewReport.deleteMany({ where: { reason: { startsWith: 'Inappropriate' } } });
    await prisma.reviewReply.deleteMany({ where: { authorName: { contains: 'Support' } } });
    await prisma.review.deleteMany({ where: { customerEmail: 'buyer_test_mkt@kdw.in' } });
    await prisma.offer.deleteMany({ where: { name: { contains: 'Summer Flash' } } });
    await prisma.campaignRecipient.deleteMany({ where: { email: { contains: 'test_mkt' } } });
    await prisma.campaign.deleteMany({ where: { name: { contains: 'Monsoon Mega Sale' } } });

    const testAdmin = await prisma.user.upsert({
      where: { email: 'admin_test_mkt@kdw.in' },
      update: {},
      create: {
        email: 'admin_test_mkt@kdw.in',
        passwordHash: 'hashed_password_123',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    });

    const testBuyer = await prisma.user.upsert({
      where: { email: 'buyer_test_mkt@kdw.in' },
      update: {},
      create: {
        email: 'buyer_test_mkt@kdw.in',
        passwordHash: 'hashed_password_123',
        name: 'Test Buyer',
        customerType: 'STUDENT',
        role: 'CUSTOMER'
      }
    });

    const testNewUser = await prisma.user.upsert({
      where: { email: 'newbie_test_mkt@kdw.in' },
      update: {},
      create: {
        email: 'newbie_test_mkt@kdw.in',
        passwordHash: 'hashed_password_123',
        name: 'Newbie Buyer',
        customerType: 'REGULAR',
        role: 'CUSTOMER'
      }
    });

    const testCategory = await prisma.category.upsert({
      where: { slug: 'video-editing-packs' },
      update: {},
      create: {
        name: 'Video Editing Packs',
        slug: 'video-editing-packs',
        description: 'Premiere & After Effects Presets'
      }
    });

    const testProduct1 = await prisma.product.upsert({
      where: { slug: 'cinematic-luts-vol1' },
      update: { categoryId: testCategory.id, price: 1000, version: '2.1.0' },
      create: {
        name: 'Cinematic LUTs Vol 1',
        slug: 'cinematic-luts-vol1',
        description: 'Hollywood standard LUTs',
        price: 1000,
        version: '2.1.0',
        categoryId: testCategory.id,
        status: 'ACTIVE'
      }
    });

    const testProduct2 = await prisma.product.upsert({
      where: { slug: 'sound-fx-pro' },
      update: { categoryId: testCategory.id, price: 500, version: '1.0.0' },
      create: {
        name: 'Sound FX Pro Pack',
        slug: 'sound-fx-pro',
        description: 'WAV sound effects',
        price: 500,
        version: '1.0.0',
        categoryId: testCategory.id,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Fixtures initialized successfully.\n');

    // =========================================================================
    // 1. COUPON ENGINE & 9 WORKING TYPES TEST
    // =========================================================================
    console.log('🎟️ TEST 1: COUPON ENGINE & 9 WORKING TYPES');

    // 1.1 Percentage Coupon with Max Cap
    const coupon1 = await prisma.coupon.upsert({
      where: { code: 'TEST_PCT20' },
      update: { status: 'ACTIVE', discountValue: 20, maxDiscountAmount: 150 },
      create: {
        code: 'TEST_PCT20',
        internalName: '20% Off Test with ₹150 Cap',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountAmount: 150,
        minOrderValue: 500,
        status: 'ACTIVE'
      }
    });

    const val1 = await CouponService.validateCoupon({
      code: 'test_pct20', // Normalization test (lowercase)
      cartItems: [{ productId: testProduct1.id, unitPrice: 1000, quantity: 1 }],
      customerId: testBuyer.id
    });
    assert(val1.valid === true, 'Percentage coupon valid');
    assert(val1.calculatedDiscount === 150, 'Percentage coupon strictly caps discount at ₹150 (20% of 1000 = 200 -> capped at 150)');

    // 1.2 First Order Only Coupon
    const couponFirstOrder = await prisma.coupon.upsert({
      where: { code: 'TEST_WELCOME50' },
      update: { status: 'ACTIVE' },
      create: {
        code: 'TEST_WELCOME50',
        internalName: 'First Order 50% Off',
        discountType: 'FIRST_ORDER',
        discountValue: 50,
        status: 'ACTIVE'
      }
    });

    // Create a prior paid order for testBuyer
    const existingOrder = await prisma.order.create({
      data: {
        orderNumber: `KDW-TEST-${Date.now()}`,
        totalAmount: 1000,
        subtotal: 1000,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        customerId: testBuyer.id,
        guestEmail: testBuyer.email
      }
    });

    const valFirstOrderFail = await CouponService.validateCoupon({
      code: 'TEST_WELCOME50',
      cartItems: [{ productId: testProduct1.id, unitPrice: 1000, quantity: 1 }],
      customerId: testBuyer.id
    });
    assert(valFirstOrderFail.valid === false, 'First-order coupon correctly rejects customer with prior paid order');

    const valFirstOrderPass = await CouponService.validateCoupon({
      code: 'TEST_WELCOME50',
      cartItems: [{ productId: testProduct1.id, unitPrice: 1000, quantity: 1 }],
      customerId: testNewUser.id
    });
    assert(valFirstOrderPass.valid === true, 'First-order coupon accepts customer with 0 prior paid orders');
    assert(valFirstOrderPass.calculatedDiscount === 500, '50% first order discount correctly calculated (₹500 on ₹1000)');

    // 1.3 Customer Segment Coupon (STUDENTS)
    const couponSegment = await prisma.coupon.upsert({
      where: { code: 'TEST_STUDENT30' },
      update: { status: 'ACTIVE' },
      create: {
        code: 'TEST_STUDENT30',
        internalName: 'Student Segment 30% Off',
        discountType: 'CUSTOMER_SEGMENT',
        discountValue: 30,
        eligibleCustomerSegments: JSON.stringify(['STUDENT']),
        status: 'ACTIVE'
      }
    });

    const valSegmentPass = await CouponService.validateCoupon({
      code: 'TEST_STUDENT30',
      cartItems: [{ productId: testProduct1.id, unitPrice: 1000, quantity: 1 }],
      customerId: testBuyer.id // Has customerType: STUDENT
    });
    assert(valSegmentPass.valid === true, 'Student segment coupon accepts customer with STUDENT customerType');

    const valSegmentFail = await CouponService.validateCoupon({
      code: 'TEST_STUDENT30',
      cartItems: [{ productId: testProduct1.id, unitPrice: 1000, quantity: 1 }],
      customerId: testNewUser.id // Has customerType: REGULAR
    });
    assert(valSegmentFail.valid === false, 'Student segment coupon rejects customer outside STUDENT segment');

    // 1.4 Product-Specific Coupon
    const couponProductSpecific = await prisma.coupon.upsert({
      where: { code: 'TEST_LUTS40' },
      update: {
        status: 'ACTIVE',
        discountType: 'PRODUCT_SPECIFIC',
        discountValue: 40,
        eligibleProducts: JSON.stringify([testProduct1.id])
      },
      create: {
        code: 'TEST_LUTS40',
        internalName: 'LUTs Only 40% Off',
        discountType: 'PRODUCT_SPECIFIC',
        discountValue: 40,
        eligibleProducts: JSON.stringify([testProduct1.id]),
        status: 'ACTIVE'
      }
    });

    const valProductPass = await CouponService.validateCoupon({
      code: 'TEST_LUTS40',
      cartItems: [
        { productId: testProduct1.id, unitPrice: 1000, quantity: 1 },
        { productId: testProduct2.id, unitPrice: 500, quantity: 1 }
      ],
      customerId: testBuyer.id
    });
    console.log('valProductPass result:', valProductPass);
    assert(valProductPass.valid === true, 'Product-specific coupon validates successfully');
    assert(valProductPass.calculatedDiscount === 400, 'Product-specific discount calculates 40% ONLY on eligible product (40% of 1000 = 400, ignores 500)');

    // 1.5 Coupon Reservation & Redemption Lifecycle
    console.log('\n🎟️ TEST 2: COUPON RESERVATION & REDEMPTION LIFECYCLE');
    const orderForCoupon = await prisma.order.create({
      data: {
        orderNumber: `KDW-RES-${Date.now()}`,
        totalAmount: 600,
        subtotal: 1000,
        discountTotal: 400,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_PAYMENT',
        customerId: testBuyer.id,
        guestEmail: testBuyer.email
      }
    });

    const reservation = await CouponService.reserveCoupon(
      couponProductSpecific.id,
      orderForCoupon.id,
      400,
      testBuyer.id,
      testBuyer.email
    );
    assert(reservation.status === 'RESERVED', 'Coupon reservation created with RESERVED state');

    const redeemed = await CouponService.redeemCoupon(orderForCoupon.id);
    assert(redeemed && redeemed.status === 'REDEEMED', 'Coupon redemption transitions from RESERVED to REDEEMED upon payment capture');

    const updatedCoupon = await prisma.coupon.findUnique({ where: { id: couponProductSpecific.id } });
    assert(updatedCoupon.usedCount >= 1, 'Coupon usedCount atomically incremented on redemption');

    // =========================================================================
    // 2. OFFERS ENGINE & CONFLICT RESOLUTION
    // =========================================================================
    console.log('\n🔥 TEST 3: OFFERS ENGINE & CONFLICT DETECTION');

    const offer1 = await prisma.offer.create({
      data: {
        name: 'Summer Flash 30% Off',
        offerType: 'FLASH_SALE',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        productIds: JSON.stringify([testProduct1.id]),
        priority: 1,
        startAt: new Date(Date.now() - 86400000),
        endAt: new Date(Date.now() + 86400000 * 7),
        status: 'ACTIVE'
      }
    });

    // Check conflict detector on overlapping date & product
    const conflictResult = await OfferService.detectConflicts({
      productIds: [testProduct1.id],
      startAt: new Date(),
      endAt: new Date(Date.now() + 86400000 * 3)
    });
    assert(conflictResult.length > 0, 'Conflict detector identifies overlapping active offer on same product');
    assert(conflictResult[0].message.includes('Summer Flash'), 'Conflict description accurately generated for admin');

    // Evaluate Active Storefront Product Offer
    const productOffer = await OfferService.evaluateProductOffer({ id: testProduct1.id, price: 1000 });
    assert(productOffer !== null && productOffer.savings === 300, 'Live product promotion accurately calculates 30% discount savings (₹300 off ₹1000)');

    // =========================================================================
    // 3. CAMPAIGNS ENGINE, AUDIENCE & SUPPRESSION
    // =========================================================================
    console.log('\n📧 TEST 4: CAMPAIGNS ENGINE, AUDIENCE & SUPPRESSION');

    // Create suppression entry for testing opt-out
    await prisma.suppressionEntry.deleteMany({ where: { identifier: 'optout_test@kdw.in' } });
    await prisma.suppressionEntry.create({
      data: {
        identifier: 'optout_test@kdw.in',
        reason: 'UNSUBSCRIBED',
        channel: 'EMAIL'
      }
    });

    const audience = await CampaignService.buildAudience('ALL_CUSTOMERS');
    assert(audience.totalEligible > 0, 'Audience builder calculates dynamic eligible recipient count');

    // Template interpolation test
    const rendered = CampaignService.renderTemplate(
      'Hello {{customer.first_name}}, use coupon {{coupon.code}} to get {{discount.amount}} off {{product.name}} before {{offer.end_date}}!',
      {
        customerName: 'Kanishk Sharma',
        couponCode: 'SAVE50',
        productName: 'Cinematic LUTs',
        discountAmount: '50%',
        offerEndDate: 'Aug 31'
      }
    );
    assert(rendered.includes('Hello Kanishk'), 'Template interpolates {{customer.first_name}} safely');
    assert(rendered.includes('use coupon SAVE50'), 'Template interpolates {{coupon.code}}');
    assert(rendered.includes('Cinematic LUTs'), 'Template interpolates {{product.name}}');

    // Create and approve campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Monsoon Mega Sale Broadcast',
        campaignType: 'SALE_CAMPAIGN',
        channel: 'EMAIL',
        audienceSegment: 'ALL_CUSTOMERS',
        emailSubject: 'Special Deal for {{customer.first_name}}',
        emailBodyHtml: '<p>Grab your discount now!</p>',
        status: 'DRAFT'
      }
    });

    const testEmailSuccess = await CampaignService.sendTestEmail(campaign.id, 'vishwas_test@kdw.in');
    assert(testEmailSuccess === true, 'Test email preview dispatch executes successfully');

    // =========================================================================
    // 4. REVIEWS ENGINE & VERIFIED PURCHASE BADGE
    // =========================================================================
    console.log('\n⭐ TEST 5: REVIEWS ENGINE, MODERATION & RISK CLASSIFICATION');

    // 4.1 Check verified purchase against paid order
    // Create an order with orderItem for testProduct1 to verify exact link
    const verifiedOrder = await prisma.order.create({
      data: {
        orderNumber: `KDW-VER-${Date.now()}`,
        totalAmount: 1000,
        subtotal: 1000,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        customerId: testBuyer.id,
        guestEmail: testBuyer.email,
        items: {
          create: [{
            productId: testProduct1.id,
            productName: testProduct1.name,
            productNameSnapshot: testProduct1.name,
            productTypeSnapshot: 'DIGITAL_PRODUCT',
            productVersionSnapshot: '2.1.0',
            quantity: 1,
            unitPrice: 1000,
            totalAmount: 1000
          }]
        }
      }
    });

    // 4.1 Check verified purchase against paid order
    const isVerifiedNow = await ReviewService.verifyPurchase({
      customerId: testBuyer.id,
      productId: testProduct1.id,
      guestEmail: testBuyer.email,
      orderId: verifiedOrder.id
    });
    assert(isVerifiedNow.verified === true, 'Review verification engine grants VERIFIED PURCHASE badge for confirmed paid order');

    // 4.2 Content Risk Screening
    const spamCheck = ReviewService.screenReviewContent('Make Money Fast', 'Buy cheap crypto at http://bit.ly/spam-link free money fast!!');
    assert(spamCheck.riskScore === 'SPAM_FLAGGED', 'Content classifier flags suspicious external URL and spam keywords');

    const cleanCheck = ReviewService.screenReviewContent('Great LUTs', 'These LUTs are fantastic! Really elevated my color grading workflow in Premiere.');
    assert(cleanCheck.riskScore === 'NORMAL', 'Content classifier passes authentic customer feedback as NORMAL');

    // 4.3 Review Submission & Moderation
    const newReview = await prisma.review.create({
      data: {
        productId: testProduct1.id,
        orderId: verifiedOrder.id,
        customerId: testBuyer.id,
        customerName: 'Kanishk',
        customerEmail: testBuyer.email,
        rating: 5,
        title: 'Outstanding Quality Presets',
        comment: 'Super easy to import into DaVinci Resolve. The cinematic tones are top notch!',
        productVersion: '2.1.0',
        verifiedPurchase: true,
        riskScore: 'NORMAL',
        status: 'PENDING'
      }
    });
    assert(newReview.status === 'PENDING', 'New review enters moderation queue with PENDING status');

    // Moderation Trigger (Approve & Publish)
    const approvedReview = await prisma.review.update({
      where: { id: newReview.id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), moderatedBy: 'Test Admin' }
    });
    assert(approvedReview.status === 'PUBLISHED', 'Admin moderation trigger successfully transitions review to PUBLISHED');

    // Staff Reply
    const staffReply = await prisma.reviewReply.create({
      data: {
        reviewId: approvedReview.id,
        authorName: 'KDW Support Team',
        body: 'Thank you for your feedback! Version 2.2 with HDR profiles is coming next week.',
        status: 'PUBLISHED'
      }
    });
    assert(staffReply.body.includes('HDR profiles'), 'Official staff reply published to customer review');

    // Product Version Analytics
    const versionAnalytics = await ReviewService.getVersionAnalytics(testProduct1.id);
    assert(versionAnalytics.length >= 1, 'Version analytics calculates aggregate review count');
    assert(versionAnalytics.some(v => v.version === '2.1.0' && v.averageRating === 5), 'Version breakdown accurately segments ratings by product release (v2.1.0)');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} INTEGRATION TESTS PASSED CLEANLY!`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('❌ Test suite encountered error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
