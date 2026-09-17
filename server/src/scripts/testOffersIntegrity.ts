import { prisma } from '../database/db';
import { OfferService } from '../services/offerService';

async function runOffersTestSuite() {
  console.log('====================================================');
  console.log('      KWD OFFERS & PROMOTIONS INTEGRITY TEST SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Fetch Real Database Product & Category
  const testProduct = await prisma.product.findFirst({
    where: { status: 'PUBLISHED' }
  });
  const testCategory = await prisma.category.findFirst();

  if (!testProduct) {
    console.warn('⚠️ No published products found in database to attach offers to.');
  }

  const productId = testProduct ? testProduct.id : 'test-prod-123';
  const categoryId = testCategory ? testCategory.id : 'test-cat-123';
  const basePrice = testProduct ? testProduct.price : 1000;

  // 2. Test Conflict Detection Engine
  console.log('\n--- 1. Testing Conflict Detection Engine ---');
  const highDiscountConflict = await OfferService.detectConflicts({
    discountType: 'PERCENTAGE',
    discountValue: 85,
    productIds: [productId]
  });
  assert(
    highDiscountConflict.some(c => c.message.includes('margin threshold')),
    'Conflict Scanner detects excessive discounts (> 70%)'
  );

  // 3. Test Product Direct Promotion Evaluation
  console.log('\n--- 2. Testing Single Product Evaluation ---');
  const evaluatedProductOffer = await OfferService.evaluateProductOffer({
    id: productId,
    categoryId,
    price: basePrice
  });
  console.log('Evaluated Product Offer Result:', evaluatedProductOffer);
  assert(
    evaluatedProductOffer === null || evaluatedProductOffer.discountedPrice <= basePrice,
    'Product direct evaluation computes valid price discount'
  );

  // 4. Test Cart Evaluation Engine (Multi-item & First-order checks)
  console.log('\n--- 3. Testing Cart Evaluation Engine ---');
  const cartResult = await OfferService.evaluateCartOffers({
    items: [
      {
        productId,
        categoryId,
        quantity: 2,
        unitPrice: basePrice
      }
    ],
    guestEmail: 'freshbuyer@example.com'
  });

  console.log('Cart Evaluation Result:', {
    appliedOffersCount: cartResult.appliedOffers.length,
    totalPromotionDiscount: cartResult.totalPromotionDiscount,
    isExclusive: cartResult.isExclusive
  });
  assert(
    cartResult.totalPromotionDiscount >= 0,
    'Cart evaluation returns non-negative promotional discount'
  );

  // 5. Test Creation & Lifecycle of a Test Offer
  console.log('\n--- 4. Testing Offer Creation, Status Toggle & Application ---');
  const testOfferName = `Automated Verification Flash Deal ${Date.now()}`;
  const createdOffer = await prisma.offer.create({
    data: {
      name: testOfferName,
      slug: `auto-test-${Date.now()}`,
      offerType: 'FLASH_SALE',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      productIds: JSON.stringify([productId]),
      priority: 1,
      stackingPolicy: 'EXCLUSIVE',
      status: 'ACTIVE',
      displayPlacement: 'STOREFRONT_BANNER'
    }
  });

  assert(createdOffer.id !== undefined, `Offer "${createdOffer.name}" created in PostgreSQL`);

  // 6. Test Real Telemetry: Impression View & Click
  await OfferService.recordInteraction(createdOffer.id, 'VIEW');
  await OfferService.recordInteraction(createdOffer.id, 'VIEW');
  await OfferService.recordInteraction(createdOffer.id, 'CLICK');

  const reloadedOffer = await prisma.offer.findUnique({ where: { id: createdOffer.id } });
  assert(reloadedOffer?.viewsCount === 2, `Views telemetry incremented correctly (2 views)`);
  assert(reloadedOffer?.clicksCount === 1, `Clicks telemetry incremented correctly (1 click)`);

  // 7. Test Simulated Order Placement with Offer Application
  console.log('\n--- 5. Testing Offer Application on Order ---');
  const simulatedOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-ORDER-${Date.now()}`,
      totalAmount: 1500,
      subtotal: 2000,
      discountTotal: 500,
      customerType: 'GUEST',
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'CAPTURED',
      guestEmail: 'testoffers@example.com'
    }
  });

  await OfferService.applyOffersToOrder(
    prisma,
    simulatedOrder.id,
    [
      {
        offerId: createdOffer.id,
        offerName: createdOffer.name,
        offerType: createdOffer.offerType,
        discountAmount: 500,
        eligibleAmount: 2000,
        priority: 1,
        stackingPolicy: 'EXCLUSIVE'
      }
    ],
    null
  );

  const appliedRecord = await prisma.offerApplication.findFirst({
    where: { offerId: createdOffer.id, orderId: simulatedOrder.id }
  });
  assert(appliedRecord !== null, 'OfferApplication record created and linked to order');
  assert(appliedRecord?.discountAmount === 500, 'OfferApplication record stores exact discountAmount (500)');

  const offerAfterOrder = await prisma.offer.findUnique({ where: { id: createdOffer.id } });
  assert(offerAfterOrder?.ordersCount === 1, 'Offer ordersCount incremented to 1');
  assert(offerAfterOrder?.revenueGenerated === 2000, 'Offer revenueGenerated incremented to 2000');
  assert(offerAfterOrder?.discountGiven === 500, 'Offer discountGiven incremented to 500');

  // 8. Test Status Update (Pause & Disable)
  await prisma.offer.update({
    where: { id: createdOffer.id },
    data: { status: 'PAUSED' }
  });
  const pausedOffer = await prisma.offer.findUnique({ where: { id: createdOffer.id } });
  assert(pausedOffer?.status === 'PAUSED', 'Offer status toggled to PAUSED');

  // Clean up test order & offer
  await prisma.offerApplication.deleteMany({ where: { offerId: createdOffer.id } });
  await prisma.order.delete({ where: { id: simulatedOrder.id } });
  await prisma.offer.delete({ where: { id: createdOffer.id } });
  console.log('\nCleaned up ephemeral verification data.');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runOffersTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
