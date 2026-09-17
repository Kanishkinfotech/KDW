import assert from 'assert';
import { prisma } from '../database/db';
import { PaymentService } from '../services/paymentService';
import { RefundService } from '../services/refundService';
import { emitAutomationEvent } from '../controllers/automation/automationEventService';

async function runDashboardRealtimeE2ETest() {
  console.log('===============================================================');
  console.log('  KDW ADMIN DASHBOARD & REAL-TIME PURCHASE E2E VERIFICATION  ');
  console.log('===============================================================');

  const testSuffix = Date.now().toString().slice(-5);
  const testCustomerEmail = `e2e_customer_${testSuffix}@kdwtest.com`;

  // 1. SETUP: Create Test Category & Product
  console.log('\n[Phase 1] Setting up Test Product & Customer...');
  let testCategory = await prisma.category.findFirst({ where: { status: 'ACTIVE' } });
  if (!testCategory) {
    testCategory = await prisma.category.create({
      data: {
        name: `Test Category ${testSuffix}`,
        slug: `test-cat-${testSuffix}`,
        status: 'ACTIVE'
      }
    });
  }

  const testProduct = await prisma.product.create({
    data: {
      name: `Premium UI Masterkit ${testSuffix}`,
      slug: `premium-ui-masterkit-${testSuffix}`,
      description: 'Production E2E test digital asset',
      price: 1000,
      status: 'ACTIVE',
      categoryId: testCategory.id,
      licenceType: 'COMMERCIAL',
      licenceKeyRequired: true,
      downloadLimit: 5,
      version: '1.0.0'
    }
  });

  const testCustomer = await prisma.user.create({
    data: {
      name: `Test User ${testSuffix}`,
      email: testCustomerEmail,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true
    }
  });

  console.log(`  ✓ Product Created: "${testProduct.name}" (₹${testProduct.price})`);
  console.log(`  ✓ Customer Created: "${testCustomer.name}" (${testCustomer.email})`);

  // 2. BASELINE: Query Initial Order & Revenue Counts
  console.log('\n[Phase 2] Measuring Baseline Metrics Before Purchase...');
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const initialTodayOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfToday, lte: endOfToday },
      OR: [{ paymentStatus: 'PAID' }, { paymentStatus: 'COMPLETED' }, { orderStatus: 'COMPLETED' }]
    }
  });

  const initialRevenue = initialTodayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const initialOrderCount = initialTodayOrders.length;
  console.log(`  ✓ Baseline Today's Revenue: ₹${initialRevenue}`);
  console.log(`  ✓ Baseline Today's Paid Orders: ${initialOrderCount}`);

  // 3. EXECUTE CUSTOMER PURCHASE FLOW
  console.log('\n[Phase 3] Simulating Customer Checkout & Payment Capture...');
  const orderNumber = `KDW-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-E2E${testSuffix}`;
  const razorpayOrderId = `order_e2e_${Date.now()}`;
  const razorpayPaymentId = `pay_e2e_${Date.now()}`;

  const createdOrder = await prisma.order.create({
    data: {
      orderNumber,
      totalAmount: 1000,
      subtotal: 1000,
      discountTotal: 0,
      currency: 'INR',
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      accessStatus: 'NOT_GRANTED',
      fulfilmentStatus: 'UNFULFILLED',
      customerId: testCustomer.id,
      guestEmail: testCustomer.email,
      guestName: testCustomer.name,
      razorpayOrderId,
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            productNameSnapshot: testProduct.name,
            quantity: 1,
            unitPrice: 1000,
            totalAmount: 1000
          }
        ]
      }
    },
    include: { items: true }
  });

  console.log(`  ✓ Order created in database: ${createdOrder.orderNumber} (Status: PENDING)`);

  // Verify payment capture
  const capturedPayment = await PaymentService.recordSuccessfulCapture({
    orderId: createdOrder.id,
    razorpayOrderId,
    razorpayPaymentId,
    amount: 1000,
    currency: 'INR',
    verificationType: 'SIGNATURE'
  });

  assert(capturedPayment.status === 'CAPTURED', 'Payment status must be CAPTURED');
  console.log(`  ✓ Payment capture committed atomically (Payment ID: ${capturedPayment.razorpayPaymentId})`);

  // Wait 1.5 seconds for background fulfilment & events
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 4. VERIFY DATABASE RECORDS & ENTITLEMENTS
  console.log('\n[Phase 4] Verifying Post-Purchase Database Records...');
  const updatedOrder = await prisma.order.findUnique({
    where: { id: createdOrder.id },
    include: { items: true, purchases: true, licenceKeys: true }
  });

  assert(updatedOrder?.paymentStatus === 'PAID', 'Order paymentStatus must be PAID');
  console.log(`  ✓ Order Status: ${updatedOrder?.orderStatus} (Payment: ${updatedOrder?.paymentStatus})`);

  // 5. VERIFY DASHBOARD METRICS INCREASE
  console.log('\n[Phase 5] Verifying Dashboard Metric Calculations...');
  const postPurchaseOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfToday, lte: endOfToday },
      OR: [{ paymentStatus: 'PAID' }, { paymentStatus: 'COMPLETED' }, { orderStatus: 'COMPLETED' }]
    }
  });

  const postPurchaseRevenue = postPurchaseOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const postPurchaseOrderCount = postPurchaseOrders.length;

  console.log(`  ✓ Post-Purchase Today's Revenue: ₹${postPurchaseRevenue} (Expected: ₹${initialRevenue + 1000})`);
  console.log(`  ✓ Post-Purchase Today's Orders: ${postPurchaseOrderCount} (Expected: ${initialOrderCount + 1})`);

  assert.strictEqual(postPurchaseRevenue, initialRevenue + 1000, "Today's revenue must increment exactly by ₹1,000");
  assert.strictEqual(postPurchaseOrderCount, initialOrderCount + 1, "Today's paid orders must increment by 1");

  // 6. FAILED PAYMENT TEST: Ensure revenue does NOT increment
  console.log('\n[Phase 6] Testing Failed Payment Safeguards...');
  const failedOrderId = `KDW-FAILED-${testSuffix}`;
  const failedOrder = await prisma.order.create({
    data: {
      orderNumber: failedOrderId,
      totalAmount: 2500,
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      customerId: testCustomer.id,
      guestEmail: testCustomer.email,
      guestName: testCustomer.name
    }
  });

  await PaymentService.recordFailedAttempt({
    orderId: failedOrder.id,
    razorpayPaymentId: `pay_failed_${Date.now()}`,
    amount: 2500,
    failureCode: 'BANK_DECLINED',
    failureDescription: 'Insufficient funds'
  });

  const postFailedOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfToday, lte: endOfToday },
      OR: [{ paymentStatus: 'PAID' }, { paymentStatus: 'COMPLETED' }, { orderStatus: 'COMPLETED' }]
    }
  });
  const revenueAfterFail = postFailedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  assert.strictEqual(revenueAfterFail, postPurchaseRevenue, 'Revenue must NOT increase when payment fails');
  console.log(`  ✓ Failed payment did NOT increment revenue (Revenue remained ₹${revenueAfterFail})`);

  // 7. DUPLICATE WEBHOOK IDEMPOTENCY TEST
  console.log('\n[Phase 7] Testing Webhook Idempotency (Duplicate Capture)...');
  await PaymentService.recordSuccessfulCapture({
    orderId: createdOrder.id,
    razorpayOrderId,
    razorpayPaymentId,
    amount: 1000,
    currency: 'INR',
    verificationType: 'WEBHOOK'
  });

  const postDuplicateOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfToday, lte: endOfToday },
      OR: [{ paymentStatus: 'PAID' }, { paymentStatus: 'COMPLETED' }, { orderStatus: 'COMPLETED' }]
    }
  });
  const revenueAfterDuplicate = postDuplicateOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  assert.strictEqual(revenueAfterDuplicate, postPurchaseRevenue, 'Duplicate capture must NOT double-count revenue');
  console.log(`  ✓ Duplicate payment webhook handled idempotently (Revenue remained ₹${revenueAfterDuplicate})`);

  // 8. REFUND TEST
  console.log('\n[Phase 8] Testing Refund Workflow...');
  const refundResult = await RefundService.processRefund({
    paymentId: capturedPayment.id,
    amount: 1000,
    reason: 'Customer requested refund within policy',
    accessRevoked: true,
    licenceRevoked: true,
    actor: { name: 'Super Admin', email: 'admin@kdw.com', role: 'SUPER_ADMIN' }
  });

  assert(refundResult.success, 'Refund must succeed');
  console.log(`  ✓ Refund processed: ₹${refundResult.refund.amount} (Access Revoked: YES)`);

  const refundedOrder = await prisma.order.findUnique({ where: { id: createdOrder.id } });
  assert(refundedOrder?.paymentStatus === 'REFUNDED', 'Order status must be updated to REFUNDED');
  console.log(`  ✓ Order payment status updated to ${refundedOrder?.paymentStatus}`);

  // CLEANUP TEST DATA
  console.log('\n[Phase 9] Cleaning Up Test Records...');
  await prisma.refund.deleteMany({ where: { orderId: createdOrder.id } }).catch(() => {});
  await prisma.licenceKey.deleteMany({ where: { orderId: createdOrder.id } }).catch(() => {});
  await prisma.purchase.deleteMany({ where: { orderId: createdOrder.id } }).catch(() => {});
  await prisma.orderTimelineEvent.deleteMany({ where: { orderId: { in: [createdOrder.id, failedOrder.id] } } }).catch(() => {});
  await prisma.orderAuditLog.deleteMany({ where: { orderId: createdOrder.id } }).catch(() => {});
  await prisma.reconciliationRecord.deleteMany({ where: { internalRecordId: capturedPayment.id } }).catch(() => {});
  await prisma.payment.deleteMany({ where: { orderId: { in: [createdOrder.id, failedOrder.id] } } }).catch(() => {});
  await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } }).catch(() => {});
  await prisma.order.deleteMany({ where: { id: { in: [createdOrder.id, failedOrder.id] } } }).catch(() => {});
  await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => {});
  await prisma.user.delete({ where: { id: testCustomer.id } }).catch(() => {});
  console.log('  ✓ Cleaned up temporary test artifacts.');

  console.log('\n===============================================================');
  console.log('  ALL E2E DASHBOARD & PURCHASE TESTS PASSED SUCCESSFULLY!    ');
  console.log('===============================================================\n');
}

runDashboardRealtimeE2ETest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exit(1);
  });
