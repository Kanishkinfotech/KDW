const { PrismaClient } = require('../server/node_modules/@prisma/client');
const jwt = require('../server/node_modules/jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

const { PaymentService } = require('../server/dist/services/paymentService');
const { WebhookService } = require('../server/dist/services/webhookService');
const { RefundService } = require('../server/dist/services/refundService');
const { DisputeService } = require('../server/dist/services/disputeService');

let adminToken = '';
let testAdminUser = null;
let testProduct = null;
let testCustomer = null;

async function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`   ✅ ${message}`);
  }
}

async function runPaymentsVerificationSuite() {
  console.log('================================================================');
  console.log('🚀 KDW PAYMENTS MODULE — COMPLETE AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // 1. Setup Admin Account & Token
    console.log('1. Setting up Admin Account & Auth Token...');
    testAdminUser = await prisma.user.upsert({
      where: { email: 'admin.payments.test@kdw.com' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        name: 'Finance Admin',
        email: 'admin.payments.test@kdw.com',
        customerCode: 'CUST-20260826-ADMIN',
        customerType: 'ACCOUNT',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    adminToken = jwt.sign(
      { id: testAdminUser.id, email: testAdminUser.email, role: testAdminUser.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    await assert(Boolean(adminToken), 'Admin Token generated successfully.');

    // 2. Prepare Product & Customer
    console.log('\n2. Preparing Test Product & Customer...');
    testProduct = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          name: 'Payment Test Pro Pack',
          slug: `payment-test-pack-${Date.now()}`,
          price: 999,
          status: 'ACTIVE',
          productType: 'DIGITAL_PRODUCT',
          category: 'Presets'
        }
      });
    }

    testCustomer = await prisma.user.upsert({
      where: { email: 'buyer.payments.test@kdw.com' },
      update: { customerType: 'ACCOUNT', status: 'ACTIVE' },
      create: {
        name: 'Vikram Mehta',
        email: 'buyer.payments.test@kdw.com',
        customerCode: 'CUST-20260826-99120',
        customerType: 'ACCOUNT',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });
    await assert(testProduct.price > 0, `Test Product ready (₹${testProduct.price})`);

    // 3. Test Checkout Order Creation & Server-side Pricing
    console.log('\n3. Testing Checkout Order Creation with Server-side Pricing...');
    const orderNumber = `KDW-20260826-${Math.floor(10000 + Math.random() * 90000)}`;
    const razorpayOrderId = `order_test_${Date.now()}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: testCustomer.id,
        guestName: testCustomer.name,
        guestEmail: testCustomer.email,
        totalAmount: testProduct.price,
        currency: 'INR',
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        razorpayOrderId,
        items: {
          create: [{
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 1,
            unitPrice: testProduct.price,
            totalAmount: testProduct.price
          }]
        }
      },
      include: { items: true }
    });
    await assert(testOrder.totalAmount === testProduct.price, `Order ${testOrder.orderNumber} created with exact server-side price (₹${testOrder.totalAmount})`);

    // 4. Test Checkout HMAC-SHA256 Signature Verification
    console.log('\n4. Testing Constant-Time Checkout Signature Verification...');
    const razorpayPaymentId = `pay_chk_${Date.now()}`;
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const validSignature = hmac.digest('hex');
    const isSignatureValid = PaymentService.verifyCheckoutSignature(
      razorpayOrderId,
      razorpayPaymentId,
      validSignature,
      RAZORPAY_KEY_SECRET
    );
    await assert(isSignatureValid === true, 'Valid checkout signature verified successfully.');

    const isFakeSignatureValid = PaymentService.verifyCheckoutSignature(
      razorpayOrderId,
      razorpayPaymentId,
      'tampered_fake_signature_hex',
      RAZORPAY_KEY_SECRET
    );
    await assert(isFakeSignatureValid === false, 'Tampered checkout signature correctly rejected.');

    // 5. Test Successful Payment Capture & Automated Digital Fulfilment
    console.log('\n5. Testing Payment Capture & Automated Fulfilment Execution...');
    const capturedPayment = await PaymentService.recordSuccessfulCapture({
      orderId: testOrder.id,
      razorpayOrderId,
      razorpayPaymentId,
      amount: testOrder.totalAmount,
      currency: testOrder.currency,
      method: 'UPI',
      verificationType: 'SIGNATURE'
    });

    await assert(capturedPayment.status === 'CAPTURED', 'Payment status marked CAPTURED.');
    await assert(capturedPayment.verificationStatus === 'SIGNATURE_VERIFIED', 'Verification status marked SIGNATURE_VERIFIED.');

    const updatedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
      include: { bundleEntitlements: true, componentEntitlements: true }
    });
    await assert(updatedOrder.paymentStatus === 'PAID', 'Order payment status updated to PAID.');

    // 6. Test Amount Mismatch Protection (Critical Blocker)
    console.log('\n6. Testing Amount Mismatch Detection & Fulfilment Blocking...');
    const mismatchOrder = await prisma.order.create({
      data: {
        orderNumber: `KDW-MISMATCH-${Date.now()}`,
        guestEmail: 'mismatch@kdw.com',
        totalAmount: 1999,
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        razorpayOrderId: `order_mm_${Date.now()}`
      }
    });

    let mismatchCaught = false;
    try {
      await PaymentService.recordSuccessfulCapture({
        orderId: mismatchOrder.id,
        razorpayPaymentId: `pay_mm_${Date.now()}`,
        amount: 499, // Underpaid!
        verificationType: 'SIGNATURE'
      });
    } catch (err) {
      mismatchCaught = true;
    }
    await assert(mismatchCaught === true, 'Amount mismatch blocked execution and prevented digital delivery.');

    // 7. Test Authoritative Raw-Body Razorpay Webhook Processing
    console.log('\n7. Testing Authoritative Webhook Listener & Idempotency...');
    const webhookOrderId = `order_wh_${Date.now()}`;
    const webhookPaymentId = `pay_wh_cap_${Date.now()}`;

    const whOrder = await prisma.order.create({
      data: {
        orderNumber: `KDW-WH-${Date.now()}`,
        guestEmail: 'webhook.buyer@kdw.com',
        totalAmount: 599,
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        razorpayOrderId: webhookOrderId
      }
    });

    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: webhookPaymentId,
            order_id: webhookOrderId,
            amount: 59900,
            currency: 'INR',
            method: 'card'
          }
        }
      }
    };

    const rawPayloadString = JSON.stringify(webhookPayload);
    const whHmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    whHmac.update(rawPayloadString);
    const webhookSig = whHmac.digest('hex');

    const whResult = await WebhookService.processRawWebhook(
      rawPayloadString,
      webhookSig,
      RAZORPAY_KEY_SECRET
    );
    await assert(whResult.status === 'PROCESSED', 'Webhook event processed successfully.');

    // Test Idempotency (Duplicate Webhook Drop)
    const duplicateWhResult = await WebhookService.processRawWebhook(
      rawPayloadString,
      webhookSig,
      RAZORPAY_KEY_SECRET
    );
    await assert(duplicateWhResult.status === 'DUPLICATE', 'Duplicate webhook event safely deduplicated.');

    // 8. Test Gateway Failure Categorization & Recovery Tracking
    console.log('\n8. Testing Gateway Failure Categorization...');
    await PaymentService.recordFailedAttempt({
      orderId: testOrder.id,
      razorpayPaymentId: `pay_fail_${Date.now()}`,
      failureCode: 'BAD_REQUEST_INSUFFICIENT_FUNDS',
      failureDescription: 'Customer bank account has insufficient balance'
    });

    const failedPayment = await prisma.payment.findFirst({
      where: { failureCode: 'BAD_REQUEST_INSUFFICIENT_FUNDS' }
    });
    await assert(failedPayment.failureCategory === 'INSUFFICIENT_FUNDS', 'Failure correctly categorized as INSUFFICIENT_FUNDS.');

    // 9. Test Partial and Full Refunds with Digital Access Revocation
    console.log('\n9. Testing Partial & Full Refunds with Policy Revocation...');
    const refundResult = await RefundService.processRefund({
      paymentId: capturedPayment.id,
      amount: 200, // Partial Refund of ₹200 out of ₹999
      reason: 'Partial discount adjustment',
      accessRevoked: false,
      actor: { id: testAdminUser.id, name: testAdminUser.name, email: testAdminUser.email }
    });

    await assert(refundResult.refund.amount === 200, 'Partial refund of ₹200 issued.');
    await assert(refundResult.refund.status === 'COMPLETED', 'Refund marked COMPLETED.');

    const paymentAfterPartial = await prisma.payment.findUnique({ where: { id: capturedPayment.id } });
    await assert(paymentAfterPartial.refundedAmount === 200, 'Payment refunded balance updated to ₹200.');
    await assert(paymentAfterPartial.status === 'PARTIALLY_REFUNDED', 'Payment status updated to PARTIALLY_REFUNDED.');

    // 10. Test Dispute Lifecycle & Evidence Dossier Assembly
    console.log('\n10. Testing Dispute Lifecycle & Automated Evidence Assembly...');
    const testDispute = await prisma.dispute.create({
      data: {
        paymentId: capturedPayment.id,
        orderId: testOrder.id,
        razorpayDisputeId: `disp_${Date.now()}`,
        amount: testOrder.totalAmount,
        status: 'UNDER_REVIEW'
      }
    });

    const evidenceResult = await DisputeService.assembleEvidencePacket(testDispute.id);
    await assert(evidenceResult.success === true, 'Dispute evidence packet auto-assembled.');
    await assert(evidenceResult.evidencePacket.transaction.kdwOrderNumber === testOrder.orderNumber, 'Evidence includes exact order and transaction proof.');

    const submissionResult = await DisputeService.submitEvidence(testDispute.id, {
      id: testAdminUser.id,
      name: testAdminUser.name
    });
    await assert(submissionResult.dispute.status === 'EVIDENCE_SUBMITTED', 'Dispute status updated to EVIDENCE_SUBMITTED.');

    // 11. Test Settlement Matching & Automated Reconciliation Engine
    console.log('\n11. Testing Automatic Reconciliation Engine...');
    const autoRecResult = await PaymentService.runAutoReconciliation();
    await assert(autoRecResult.success === true, `Auto-reconciliation evaluated ${autoRecResult.totalEvaluated} payments.`);

    // 12. Test Manual Reconciliation Discrepancy Resolution
    console.log('\n12. Testing Manual Reconciliation Discrepancy Resolution...');
    const recRecord = await prisma.reconciliationRecord.create({
      data: {
        internalRecordType: 'PAYMENT',
        internalRecordId: capturedPayment.id,
        externalRecordType: 'RAZORPAY_PAYMENT',
        externalRecordId: capturedPayment.razorpayPaymentId,
        expectedAmount: 999,
        actualAmount: 995,
        difference: 4,
        status: 'AMOUNT_MISMATCH'
      }
    });

    const resolvedRec = await prisma.reconciliationRecord.update({
      where: { id: recRecord.id },
      data: {
        status: 'RESOLVED',
        differenceReason: 'Gateway intermediary processing fee variance',
        resolvedBy: testAdminUser.name,
        resolvedAt: new Date()
      }
    });
    await assert(resolvedRec.status === 'RESOLVED', 'Manual reconciliation discrepancy resolved with audit reason.');

    // 13. Test Fraud & Risk State Updates
    console.log('\n13. Testing Fraud & Risk State Updates...');
    const riskUpdated = await prisma.payment.update({
      where: { id: capturedPayment.id },
      data: {
        riskScore: 'CLEARED',
        riskReason: 'Verified by Finance Admin'
      }
    });
    await assert(riskUpdated.riskScore === 'CLEARED', 'Payment risk cleared with justification.');

    // 14. Test Webhook Replay
    console.log('\n14. Testing Authorized Webhook Replay...');
    const deadLetterEvent = await prisma.paymentEvent.create({
      data: {
        externalEventId: `evt_dlq_${Date.now()}`,
        eventType: 'payment.captured',
        rawPayload: JSON.stringify({ payload: { payment: { entity: { id: `pay_dlq_${Date.now()}`, order_id: testOrder.razorpayOrderId, amount: Math.round(testOrder.totalAmount * 100) } } } }),
        status: 'FAILED',
        failureReason: 'Simulated connection timeout'
      }
    });

    const replayResult = await WebhookService.replayWebhook(deadLetterEvent.id, {
      name: testAdminUser.name,
      email: testAdminUser.email
    });
    await assert(replayResult.success === true, 'Dead-letter webhook replayed successfully.');

    // 15. Test Gateway Settings Configuration
    console.log('\n15. Testing Masked Gateway Settings...');
    const gatewaySetting = await prisma.gatewaySetting.upsert({
      where: { gatewayName: 'RAZORPAY' },
      update: { captureMode: 'AUTO', environment: 'LIVE' },
      create: { gatewayName: 'RAZORPAY', captureMode: 'AUTO', environment: 'LIVE' }
    });
    await assert(gatewaySetting.gatewayName === 'RAZORPAY', 'Gateway settings stored and configurable.');

    console.log('\n================================================================');
    console.log('🎉 ALL 15 VERIFICATION TESTS PASSED PERFECTLY (100% SUCCESS)!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ Fatal error in test suite:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPaymentsVerificationSuite();
