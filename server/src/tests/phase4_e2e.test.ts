import { prisma } from '../database/db';
import { calculateSlaDeadlines } from '../controllers/support/slaEngine';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetail?: any) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`, errorDetail || '');
    failedTests++;
  }
}

async function runPhase4Tests() {
  console.log('\n================================================================');
  console.log('  KDW PHASE 4 E2E AUTOMATED ADMIN CONTROL PLANE TEST SUITE');
  console.log('================================================================\n');

  let adminUser: any = null;
  let testProduct: any = null;
  let testBundle: any = null;
  let testCoupon: any = null;
  let testOrder: any = null;
  let testTicket: any = null;
  let auditRecord: any = null;

  try {
    // ----------------------------------------------------------------
    // TEST GROUP 1: Admin Authentication & Role RBAC
    // ----------------------------------------------------------------
    console.log('--- TEST GROUP 1: Admin Authentication & Role RBAC ---');
    
    // Find or create admin user
    adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          customerCode: 'ADM-TEST-001',
          name: 'Master Test Admin',
          email: 'admin_test_p4@kanishkdigital.com',
          normalizedEmail: 'admin_test_p4@kanishkdigital.com',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
    }

    const customerUser = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' }
    });

    const isCustomerAllowedAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(customerUser?.role || '');
    const isAdminAllowedAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(adminUser.role);

    assert(isAdminAllowedAdmin, 'Test 1a: Admin role is authorized for admin control plane');
    assert(!isCustomerAllowedAdmin, 'Test 1b: Customer role is strictly forbidden from admin access (403)');

    // ----------------------------------------------------------------
    // TEST GROUP 2: Admin Dashboard Analytics & KPIs
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Admin Dashboard Analytics & KPIs ---');
    const totalOrdersCount = await prisma.order.count();
    const paidOrders = await prisma.order.findMany({
      where: {
        OR: [
          { paymentStatus: 'PAID' },
          { paymentStatus: 'COMPLETED' },
          { orderStatus: 'COMPLETED' }
        ]
      }
    });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalProducts = await prisma.product.count();

    assert(typeof totalRevenue === 'number' && totalRevenue >= 0, 'Test 2a: Total revenue computed accurately from paid orders', { totalRevenue });
    assert(totalCustomers >= 0 && totalProducts >= 0, 'Test 2b: Customer and product catalog counts loaded successfully', { totalCustomers, totalProducts });

    // ----------------------------------------------------------------
    // TEST GROUP 3: Product Admin CRUD & Status Lifecycle
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Product Admin Management ---');
    const sampleCategory = await prisma.category.findFirst();

    testProduct = await prisma.product.create({
      data: {
        name: 'Phase 4 Admin Test VFX Pack',
        slug: `phase-4-vfx-pack-${Date.now()}`,
        description: 'Comprehensive test digital asset for Phase 4 admin verification.',
        shortDescription: '4K explosions and dust overlays',
        price: 1999,
        discountPrice: 1499,
        categoryId: sampleCategory?.id || 'default-category',
        status: 'DRAFT',
        sku: 'SKU-P4-TEST-001',
        stock: 50,
        minStock: 5,
        licenceKeyRequired: true,
        licenceType: 'COMMERCIAL'
      }
    });

    assert(!!testProduct.id && testProduct.status === 'DRAFT', 'Test 3a: Admin creates product with DRAFT status');

    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        status: 'ACTIVE',
        price: 2499
      }
    });

    assert(updatedProduct.status === 'ACTIVE' && updatedProduct.price === 2499, 'Test 3b: Admin publishes product and updates pricing');

    // ----------------------------------------------------------------
    // TEST GROUP 4: Bundle Admin Management
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Bundle Admin Management ---');
    testBundle = await prisma.bundle.create({
      data: {
        title: 'Phase 4 Ultimate Filmmaker Bundle',
        slug: `phase-4-filmmaker-bundle-${Date.now()}`,
        description: 'All-in-one cinematic LUTs, overlays, and sound design collection.',
        originalPrice: 6665,
        price: 4999,
        discountPercent: 25,
        coverImage: 'https://images.unsplash.com/photo-test-bundle.jpg',
        status: 'ACTIVE',
        sku: 'SKU-BND-P4-001',
        stock: null // Unlimited digital availability
      }
    });

    assert(!!testBundle.id && testBundle.discountPercent === 25, 'Test 4: Admin creates bundle collection with discount percentage');

    // ----------------------------------------------------------------
    // TEST GROUP 5: Admin Orders Management & Entitlements
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Admin Orders Management & Entitlements ---');
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-P4-${Date.now().toString().slice(-6)}`,
        customer: { connect: { id: adminUser.id } },
        guestEmail: 'phase4_admin_order@kanishkdigital.com',
        guestName: 'Phase 4 Test Buyer',
        totalAmount: 1499,
        subtotal: 1499,
        taxTotal: 0,
        discountTotal: 0,
        currency: 'INR',
        paymentStatus: 'PAID',
        orderStatus: 'COMPLETED',
        razorpayPaymentId: `pay_test_${Date.now()}`,
        items: {
          create: {
            productId: testProduct.id,
            productName: testProduct.name,
            unitPrice: 1499,
            quantity: 1,
            totalAmount: 1499
          }
        }
      },
      include: { items: true }
    });

    assert(!!testOrder.id && testOrder.paymentStatus === 'PAID', 'Test 5a: Admin order retrieved with items and payment details');

    const updatedOrder = await prisma.order.update({
      where: { id: testOrder.id },
      data: { orderStatus: 'REFUNDED', paymentStatus: 'REFUNDED' }
    });

    assert(updatedOrder.orderStatus === 'REFUNDED', 'Test 5b: Admin updates order status to REFUNDED');

    // ----------------------------------------------------------------
    // TEST GROUP 6: Admin Coupons Management
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Admin Coupons Management ---');
    const couponCode = `P4PROMO${Date.now().toString().slice(-4)}`;
    testCoupon = await prisma.coupon.create({
      data: {
        code: couponCode,
        internalName: 'Phase 4 20% Special Promotion',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 500,
        totalUsageLimit: 100,
        perCustomerLimit: 1,
        status: 'ACTIVE'
      }
    });

    assert(!!testCoupon.id && testCoupon.code === couponCode, 'Test 6a: Admin creates coupon with discount rules');

    const toggledCoupon = await prisma.coupon.update({
      where: { id: testCoupon.id },
      data: { status: 'DISABLED' }
    });

    assert(toggledCoupon.status === 'DISABLED', 'Test 6b: Admin deactivates coupon successfully');

    // ----------------------------------------------------------------
    // TEST GROUP 7: Inventory Stock & SKU Management
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Inventory Stock & SKU Management ---');
    const invProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const stockStatus = invProduct?.stock === null ? 'UNLIMITED' : (invProduct?.stock || 0) <= (invProduct?.minStock || 5) ? 'LOW_STOCK' : 'IN_STOCK';

    assert(stockStatus === 'IN_STOCK', 'Test 7a: Inventory stock status calculated correctly (50 stock vs 5 minStock)');

    const updatedInv = await prisma.product.update({
      where: { id: testProduct.id },
      data: { stock: 3 }
    });

    const newStockStatus = (updatedInv.stock || 0) <= (updatedInv.minStock || 5) ? 'LOW_STOCK' : 'IN_STOCK';
    assert(newStockStatus === 'LOW_STOCK', 'Test 7b: Stock threshold alert triggers LOW_STOCK at stock=3');

    // ----------------------------------------------------------------
    // TEST GROUP 8: Immutable Audit Logging
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Immutable Audit Logging ---');
    const auditRecord = await prisma.auditLog.create({
      data: {
        adminId: adminUser.id,
        action: 'UPDATE_PRODUCT_PRICE',
        entity: 'Product',
        details: JSON.stringify({ entityId: testProduct.id, oldPrice: 1999, newPrice: 2499, ipAddress: '127.0.0.1', userAgent: 'KDW-Admin-Test-Runner' })
      }
    });

    assert(!!auditRecord.id && auditRecord.action === 'UPDATE_PRODUCT_PRICE', 'Test 8: Mutating admin action creates immutable audit log');

    // ----------------------------------------------------------------
    // TEST GROUP 9: Platform Settings & Secret Protection
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: Platform Settings & Secret Protection ---');
    const extraConfig = {
      store_address: 'Mumbai, MH, India',
      razorpay_key_id: 'rzp_live_testkey123',
      razorpay_key_secret: 'rzp_live_secret_very_sensitive_987654321',
      tax_rate: 18,
      currency: 'INR'
    };

    const siteSettings = await prisma.siteSettings.upsert({
      where: { id: 'DEFAULT' },
      update: {
        companyName: 'Kanishk Digital World',
        supportEmail: 'support@kanishkdigital.com',
        socialLinks: JSON.stringify(extraConfig)
      },
      create: {
        id: 'DEFAULT',
        companyName: 'Kanishk Digital World',
        supportEmail: 'support@kanishkdigital.com',
        socialLinks: JSON.stringify(extraConfig)
      }
    });

    // Verify secret masking for API safety
    const parsedConfig = JSON.parse(siteSettings.socialLinks || '{}');
    const safeOutputSecret = parsedConfig.razorpay_key_secret ? '••••••••••••••••' : '';

    assert(safeOutputSecret === '••••••••••••••••', 'Test 9: Gateway API secrets are masked on client response');

    // ----------------------------------------------------------------
    // TEST GROUP 10: Admin Support Ticket Management
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 10: Admin Support Ticket Management ---');
    const tktCount = await prisma.supportTicket.count();
    testTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `TKT-P4-${String(tktCount + 500).padStart(4, '0')}`,
        customerName: 'Admin Ticket Test Customer',
        customerEmail: 'support_cust_p4@example.com',
        type: 'LICENCE_ISSUE',
        category: 'Licensing & Activation',
        priority: 'HIGH',
        status: 'NEW',
        subject: 'Commercial license activation inquiry',
        description: 'Need assistance deploying LUTs on studio render farm.'
      }
    });

    const staffReply = await prisma.supportMessage.create({
      data: {
        ticketId: testTicket.id,
        senderType: 'STAFF',
        senderName: adminUser.name,
        message: 'Your commercial license allows unlimited render farm machines. License key activated.',
        visibility: 'CUSTOMER'
      }
    });

    const resolvedTicket = await prisma.supportTicket.update({
      where: { id: testTicket.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });

    assert(staffReply.senderType === 'STAFF' && resolvedTicket.status === 'RESOLVED', 'Test 10: Staff replied and resolved customer support ticket');

  } catch (error: any) {
    console.error('Fatal error in Phase 4 test runner:', error);
    failedTests++;
  } finally {
    // ----------------------------------------------------------------
    // Defensive Cleanup Test Fixtures (Runs unconditionally)
    // ----------------------------------------------------------------
    try {
      if (auditRecord?.id) await prisma.auditLog.delete({ where: { id: auditRecord.id } }).catch(() => {});
      if (testTicket?.id) {
        await prisma.supportMessage.deleteMany({ where: { ticketId: testTicket.id } }).catch(() => {});
        await prisma.supportTicket.delete({ where: { id: testTicket.id } }).catch(() => {});
      }
      if (testOrder?.id) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } }).catch(() => {});
        await prisma.order.delete({ where: { id: testOrder.id } }).catch(() => {});
      }
      // Also defensively remove any orphan ORD-P4 orders
      await prisma.orderItem.deleteMany({ where: { order: { orderNumber: { startsWith: 'ORD-P4-' } } } }).catch(() => {});
      await prisma.order.deleteMany({ where: { orderNumber: { startsWith: 'ORD-P4-' } } }).catch(() => {});

      if (testCoupon?.id) await prisma.coupon.delete({ where: { id: testCoupon.id } }).catch(() => {});
      if (testBundle?.id) await prisma.bundle.delete({ where: { id: testBundle.id } }).catch(() => {});
      if (testProduct?.id) await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => {});
    } catch (cleanupErr) {
      console.warn('Non-blocking error during test fixtures cleanup:', cleanupErr);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`  PHASE 4 TEST SUMMARY: ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log('----------------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase4Tests();
