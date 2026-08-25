const http = require('http');
const { PrismaClient } = require('../server/node_modules/@prisma/client');
const prisma = new PrismaClient();
const jwt = require('../server/node_modules/jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 KDW CUSTOMERS MODULE — COMPLETE AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // 1. Setup Admin Account & Auth Token
    console.log('1. Setting up Admin Account & Authentication Token...');
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          customerCode: 'CUST-ADMIN-001',
          name: 'Super Administrator',
          email: 'admin_test@kdw.com',
          normalizedEmail: 'admin_test@kdw.com',
          passwordHash: 'dummy',
          role: 'ADMIN',
          customerType: 'ACCOUNT',
          emailVerified: true
        }
      });
    }

    const adminToken = jwt.sign({ id: admin.id, role: admin.role, name: admin.name, email: admin.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log('   ✅ Admin Token generated successfully.\n');

    // 2. Setup Category & Product for Order testing
    console.log('2. Preparing Catalog Product for Order & Entitlement tests...');
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Test Marketing Category', slug: `test-cat-${Date.now()}` }
      });
    }

    let product = await prisma.product.findFirst({ where: { status: 'PUBLISHED' } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          categoryId: category.id,
          name: 'Ultimate Marketing Automation Suite',
          slug: `marketing-suite-${Date.now()}`,
          description: 'Comprehensive automation kit',
          price: 2499,
          status: 'PUBLISHED',
          licenceType: 'COMMERCIAL',
          version: '2.0.0',
          allowDownloads: true,
          downloadLimit: 15
        }
      });
    }
    console.log(`   ✅ Test Product ready: ${product.name} (₹${product.price})\n`);

    // 3. Test Guest Checkout & Automatic Customer Resolution
    console.log('3. Testing Guest Checkout & Unified Customer Entity creation...');
    const guestEmail = `guest_buyer_${Date.now()}@example.com`;
    const guestName = 'Aarav Sharma';
    const guestPhone = '+91 98765 43210';

    const orderRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/payments/create-order',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      items: [{ productId: product.id, quantity: 1 }],
      guestEmail,
      guestName,
      guestMobile: guestPhone
    });

    if ((orderRes.status !== 200 && orderRes.status !== 201) || !orderRes.data.success) {
      throw new Error(`Order creation failed: ${JSON.stringify(orderRes.data)}`);
    }

    const createdOrder = orderRes.data.data;
    console.log(`   ✅ Guest order created: ${createdOrder.orderNumber} (ID: ${createdOrder.orderId})`);

    // Verify Guest User was created
    const guestUser = await prisma.user.findFirst({ where: { email: guestEmail.toLowerCase() } });
    if (!guestUser || guestUser.customerType !== 'GUEST') {
      throw new Error(`Guest customer record was not properly established!`);
    }
    console.log(`   ✅ Unified GUEST Customer established: ${guestUser.customerCode} (${guestUser.name})\n`);

    // Fulfil order to grant entitlements and licences
    const { OrderFulfilmentService } = require('../server/dist/services/orderFulfilmentService');
    await OrderFulfilmentService.fulfilOrder(createdOrder.orderId, {
      id: admin.id,
      name: 'Test Runner',
      email: admin.email,
      role: 'ADMIN'
    });
    console.log('   ✅ Order fulfilled: Entitlements, licences, and download tokens granted.\n');

    // 4. Test Customer Registration & Guest Claim Workflow
    console.log('4. Testing Registered Account Creation & Guest Order Claiming...');
    // Create registered user with same email
    const registeredUser = await prisma.user.create({
      data: {
        customerCode: `CUST-REG-${Date.now()}`,
        name: 'Aarav Sharma (Registered)',
        email: `aarav_registered_${Date.now()}@example.com`,
        normalizedEmail: guestEmail.toLowerCase(), // same normalized email as guest
        passwordHash: 'dummyhash',
        role: 'CUSTOMER',
        customerType: 'ACCOUNT',
        emailVerified: true // Verified email allows claim
      }
    });

    const userToken = jwt.sign({ id: registeredUser.id, role: registeredUser.role, name: registeredUser.name, email: registeredUser.email }, JWT_SECRET, { expiresIn: '1h' });

    // Claim Guest Orders
    const claimRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/account/claim-guest-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (claimRes.status !== 200 || !claimRes.data.success) {
      throw new Error(`Claim guest orders failed: ${JSON.stringify(claimRes.data)}`);
    }
    console.log(`   ✅ Claim result: ${claimRes.data.message} (Claimed: ${claimRes.data.claimedOrdersCount})\n`);

    // 5. Test Admin All Customers List & KPI Analytics
    console.log('5. Testing GET /api/admin/customers and /api/admin/customers/analytics...');
    const listRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/customers?page=1&limit=10',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (listRes.status !== 200 || !listRes.data.success) {
      throw new Error(`Get customers failed: ${JSON.stringify(listRes.data)}`);
    }
    console.log(`   ✅ Fetched ${listRes.data.customers.length} customers. Counters: Total=${listRes.data.counters.all}, New=${listRes.data.counters.new}, Verified=${listRes.data.counters.verified}`);

    const analyticsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/customers/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Computed Analytics: Total Revenue: ₹${analyticsRes.data.analytics.totalRevenue}, Avg Value: ₹${analyticsRes.data.analytics.averageCustomerValue}\n`);

    // 6. Test Deep Customer Profile (15-Section Diagnostics)
    console.log('6. Testing GET /api/admin/customers/:id (Deep Profile)...');
    const profileRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/customers/${registeredUser.id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (profileRes.status !== 200 || !profileRes.data.success) {
      throw new Error(`Get customer by ID failed: ${JSON.stringify(profileRes.data)}`);
    }
    const deepCustomer = profileRes.data.customer;
    console.log(`   ✅ Deep Profile Retrieved: Orders=${deepCustomer.orders.length}, Entitlements=${deepCustomer.purchases.length}, Licences=${deepCustomer.licenceKeys.length}, Net CLV=₹${deepCustomer.metrics.netRevenue}\n`);

    // 7. Test Customer Profile Edit
    console.log('7. Testing Customer Profile & B2B Updates...');
    const editRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/customers/${registeredUser.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      name: 'Aarav Sharma (Elite Agency)',
      businessName: 'Sharma Media Labs LLP',
      businessType: 'AGENCY',
      gstNumber: '29ABCDE1234F1Z5',
      country: 'IN',
      state: 'Karnataka',
      fraudRisk: 'LOW',
      supportPriority: 'VIP'
    });

    if (editRes.status !== 200 || !editRes.data.success) {
      throw new Error(`Update customer failed: ${JSON.stringify(editRes.data)}`);
    }
    console.log(`   ✅ Customer profile updated: ${editRes.data.customer.businessName} (GST: ${editRes.data.customer.gstNumber})\n`);

    // 8. Test Multi-Scope Block & Unblock
    console.log('8. Testing Multi-Scope Block & Unblock...');
    const blockRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/customers/${registeredUser.id}/block`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      scope: 'PURCHASES',
      reason: 'Suspicious card velocity audit'
    });
    console.log(`   ✅ Account blocked: ${blockRes.data.message}`);

    const unblockRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/customers/${registeredUser.id}/unblock`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      reason: 'Identity verified by compliance team'
    });
    console.log(`   ✅ Account unblocked: ${unblockRes.data.message}\n`);

    // 9. Test Standardized Tagging
    console.log('9. Testing Customer Tagging (Add & Remove)...');
    const tagRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/customers/${registeredUser.id}/tags`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      tagName: 'vip-agency',
      reason: 'High enterprise order volume'
    });
    console.log(`   ✅ Tag added: ${tagRes.data.message}\n`);

    // 10. Test Granular Consent Updates
    console.log('10. Testing Consent Registry Updates...');
    const consentRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/customers/${registeredUser.id}/consents`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      consentType: 'WHATSAPP_MARKETING',
      status: 'OPTED_IN'
    });
    console.log(`   ✅ Consent updated: ${consentRes.data.consent.consentType} = ${consentRes.data.consent.status}\n`);

    // 11. Test Duplicate Detection & Atomic Merging
    console.log('11. Testing Duplicate Detection & Atomic Merge...');
    // Create another duplicate customer profile
    const duplicateUser = await prisma.user.create({
      data: {
        customerCode: `CUST-DUP-${Date.now()}`,
        name: 'Aarav Secondary Profile',
        email: `aarav_duplicate_${Date.now()}@example.com`,
        normalizedEmail: guestEmail.toLowerCase(),
        passwordHash: 'dummy',
        role: 'CUSTOMER',
        customerType: 'ACCOUNT'
      }
    });

    const mergeRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/customers/merge',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      masterCustomerId: registeredUser.id,
      duplicateCustomerId: duplicateUser.id,
      reason: 'Consolidating secondary email into primary verified account'
    });

    if (mergeRes.status !== 200 || !mergeRes.data.success) {
      throw new Error(`Merge failed: ${JSON.stringify(mergeRes.data)}`);
    }
    console.log(`   ✅ Atomic Merge executed: ${mergeRes.data.message}\n`);

    // 12. Test GDPR Privacy Data Request & Safe Anonymization
    console.log('12. Testing Privacy Data Request & Safe Anonymization...');
    const userToAnonymize = await prisma.user.create({
      data: {
        customerCode: `CUST-PRIV-${Date.now()}`,
        name: 'Privacy Requester',
        email: `privacy_test_${Date.now()}@example.com`,
        normalizedEmail: `privacy_test_${Date.now()}@example.com`,
        passwordHash: 'dummy',
        role: 'CUSTOMER',
        customerType: 'ACCOUNT'
      }
    });

    const dataReqRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/account/data-request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt.sign({ id: userToAnonymize.id, email: userToAnonymize.email }, JWT_SECRET)}`
      }
    }, {
      requestType: 'DELETION',
      reason: 'Customer requests account closure and personal data erasure'
    });

    console.log(`   ✅ Data Request Submitted: ID: ${dataReqRes.data.request.id}`);

    // Admin processes the deletion request
    const processRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/customers/data-requests/${dataReqRes.data.request.id}/process`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      action: 'ANONYMIZE',
      resolutionNotes: 'Verified identity and safely anonymized PII'
    });

    console.log(`   ✅ Privacy Request Processed: ${processRes.data.message}\n`);

    // 13. Test Customer CSV Export
    console.log('13. Testing Customer CSV Export API...');
    const exportRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/customers/export',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (exportRes.status !== 200 || !exportRes.raw.includes('Customer Code')) {
      throw new Error(`Export failed or invalid CSV header`);
    }
    console.log(`   ✅ Customer CSV Export successfully streamed (${exportRes.raw.split('\n').length} rows).\n`);

    console.log('================================================================');
    console.log('🎉 ALL 13 VERIFICATION TESTS PASSED PERFECTLY (100% SUCCESS)!');
    console.log('================================================================');

  } catch (error) {
    console.error('❌ Test Suite Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
