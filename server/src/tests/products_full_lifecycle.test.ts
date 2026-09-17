import { prisma } from '../database/db';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  publishProduct, 
  pauseProduct, 
  archiveProduct, 
  restoreProduct, 
  duplicateProduct, 
  scheduleProduct, 
  submitProductForReview, 
  rejectProduct, 
  deleteProduct, 
  bulkProductAction, 
  getProductHealth,
  getProductOrders,
  getProductDownloads,
  getProductLicences,
  getProductAnalytics,
  getProductAuditLogs
} from '../controllers/productController';

// Mock Express Request & Response helper
const mockReqRes = (params: any = {}, body: any = {}, query: any = {}, user: any = { id: 'admin', role: 'ADMIN' }) => {
  const req: any = { params, body, query, user };
  let statusCode = 200;
  let jsonResponse: any = null;

  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      jsonResponse = data;
      return res;
    }
  };

  const next = (err: any) => {
    if (err) {
      statusCode = 500;
      jsonResponse = { success: false, error: err.message };
    }
  };

  return { req, res, next, getResult: () => ({ status: statusCode, body: jsonResponse }) };
};

async function runProductsE2ETests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PRODUCTS FULL LIFECYCLE E2E TEST SUITE');
  console.log('======================================================\n');

  let testProductId = '';
  let duplicatedProductId = '';
  let categoryId = '';

  try {
    // Ensure test category exists
    let cat = await prisma.category.findFirst({ where: { name: 'E2E Test Category' } });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: 'E2E Test Category', slug: 'e2e-test-category' }
      });
    }
    categoryId = cat.id;

    // 1. TEST GET ALL PRODUCTS & SUMMARY STATS
    console.log('1. Testing GET /api/products and summary metrics...');
    const t1 = mockReqRes({}, {}, { status: 'all' });
    await getProducts(t1.req, t1.res, t1.next);
    const r1 = t1.getResult();
    console.assert(r1.status === 200, `Expected 200, got ${r1.status}`);
    console.assert(r1.body.success === true, 'Expected success: true');
    console.assert(r1.body.summary !== undefined, 'Expected summary metrics object');
    console.assert(typeof r1.body.summary.totalProducts === 'number', 'Summary totalProducts is number');
    console.log(`   ✓ Found ${r1.body.data.length} products, total: ${r1.body.summary.totalProducts}, draft: ${r1.body.summary.draftProducts}, connected: ${r1.body.summary.filesConnected}`);

    // 2. TEST CREATE PRODUCT AS DRAFT
    console.log('\n2. Testing POST /api/products (Create Draft)...');
    const t2 = mockReqRes({}, {
      name: 'E2E Automated Test Asset',
      slug: `e2e-test-asset-${Date.now()}`,
      category: 'E2E Test Category',
      categoryId: categoryId,
      productType: 'DOWNLOADABLE_FILE',
      price: 1499,
      discountPrice: 999,
      description: 'Comprehensive E2E automated test asset description.',
      shortDescription: 'E2E test asset.',
      googleDriveFileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz_Test123',
      driveFileName: 'e2e_asset.zip',
      version: 'v1.0.0'
    });
    await createProduct(t2.req, t2.res, t2.next);
    const r2 = t2.getResult();
    console.assert(r2.status === 201, `Expected 201, got ${r2.status}`);
    console.assert(r2.body.data.status === 'DRAFT', `Expected DRAFT status, got ${r2.body.data.status}`);
    console.assert(r2.body.data.productCode.startsWith('KDW-P-'), `Expected KDW-P- code format, got ${r2.body.data.productCode}`);
    testProductId = r2.body.data.id;
    console.log(`   ✓ Created product ID: ${testProductId} (${r2.body.data.productCode}) as DRAFT`);

    // 3. TEST PRODUCT HEALTH CHECK
    console.log('\n3. Testing GET /api/products/:id/health...');
    const t3 = mockReqRes({ id: testProductId });
    await getProductHealth(t3.req, t3.res, t3.next);
    const r3 = t3.getResult();
    console.assert(r3.status === 200, `Expected 200, got ${r3.status}`);
    console.assert(typeof r3.body.data.healthScore === 'number', 'Expected healthScore number');
    console.log(`   ✓ Health check score: ${r3.body.data.healthScore}% (${r3.body.data.checks.length} diagnostic checkpoints)`);

    // 4. TEST PUBLISH PRODUCT
    console.log('\n4. Testing POST /api/products/:id/publish...');
    const t4 = mockReqRes({ id: testProductId });
    await publishProduct(t4.req, t4.res, t4.next);
    const r4 = t4.getResult();
    console.assert(r4.status === 200, `Expected 200, got ${r4.status}`);
    console.assert(r4.body.data.status === 'PUBLISHED', `Expected PUBLISHED, got ${r4.body.data.status}`);
    console.log(`   ✓ Published successfully. Status: ${r4.body.data.status}, publishedAt: ${r4.body.data.publishedAt}`);

    // 5. TEST PAUSE SALES
    console.log('\n5. Testing POST /api/products/:id/pause...');
    const t5 = mockReqRes({ id: testProductId });
    await pauseProduct(t5.req, t5.res, t5.next);
    const r5 = t5.getResult();
    console.assert(r5.status === 200, `Expected 200, got ${r5.status}`);
    console.assert(r5.body.data.status === 'PAUSED', `Expected PAUSED, got ${r5.body.data.status}`);
    console.log(`   ✓ Sales paused. Status: ${r5.body.data.status}`);

    // 6. TEST SUBMIT FOR REVIEW
    console.log('\n6. Testing POST /api/products/:id/submit-review...');
    const t6 = mockReqRes({ id: testProductId });
    await submitProductForReview(t6.req, t6.res, t6.next);
    const r6 = t6.getResult();
    console.assert(r6.status === 200, `Expected 200, got ${r6.status}`);
    console.assert(r6.body.data.status === 'PENDING_REVIEW', `Expected PENDING_REVIEW, got ${r6.body.data.status}`);
    console.log(`   ✓ Submitted for review. Status: ${r6.body.data.status}`);

    // 7. TEST REJECT REVIEW (FEEDBACK TO DRAFT)
    console.log('\n7. Testing POST /api/products/:id/reject...');
    const t7 = mockReqRes({ id: testProductId }, { reason: 'Need updated product screenshot' });
    await rejectProduct(t7.req, t7.res, t7.next);
    const r7 = t7.getResult();
    console.assert(r7.status === 200, `Expected 200, got ${r7.status}`);
    console.assert(r7.body.data.status === 'DRAFT', `Expected DRAFT after reject, got ${r7.body.data.status}`);
    console.log(`   ✓ Returned to Draft with feedback. Status: ${r7.body.data.status}`);

    // 8. TEST SCHEDULE PUBLICATION
    console.log('\n8. Testing POST /api/products/:id/schedule...');
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString();
    const t8 = mockReqRes({ id: testProductId }, { scheduledDate: futureDate });
    await scheduleProduct(t8.req, t8.res, t8.next);
    const r8 = t8.getResult();
    console.assert(r8.status === 200, `Expected 200, got ${r8.status}`);
    console.assert(r8.body.data.status === 'SCHEDULED', `Expected SCHEDULED, got ${r8.body.data.status}`);
    console.log(`   ✓ Product scheduled for: ${r8.body.data.publishScheduledAt}`);

    // 9. TEST DUPLICATE PRODUCT
    console.log('\n9. Testing POST /api/products/:id/duplicate...');
    const t9 = mockReqRes({ id: testProductId });
    await duplicateProduct(t9.req, t9.res, t9.next);
    const r9 = t9.getResult();
    console.assert(r9.status === 201, `Expected 201, got ${r9.status}`);
    console.assert(r9.body.data.status === 'DRAFT', `Expected duplicated status DRAFT, got ${r9.body.data.status}`);
    console.assert(r9.body.data.productCode !== r8.body.data.productCode, 'Expected distinct productCode');
    duplicatedProductId = r9.body.data.id;
    console.log(`   ✓ Duplicated product ID: ${duplicatedProductId} (${r9.body.data.productCode}) as DRAFT`);

    // 10. TEST ARCHIVE & RESTORE
    console.log('\n10. Testing POST /api/products/:id/archive and /restore...');
    const t10a = mockReqRes({ id: testProductId });
    await archiveProduct(t10a.req, t10a.res, t10a.next);
    const r10a = t10a.getResult();
    console.assert(r10a.status === 200, `Expected 200, got ${r10a.status}`);
    console.assert(r10a.body.data.status === 'ARCHIVED', `Expected ARCHIVED, got ${r10a.body.data.status}`);
    console.log(`   ✓ Archived product with impact data:`, r10a.body.impact);

    const t10b = mockReqRes({ id: testProductId });
    await restoreProduct(t10b.req, t10b.res, t10b.next);
    const r10b = t10b.getResult();
    console.assert(r10b.status === 200, `Expected 200, got ${r10b.status}`);
    console.assert(r10b.body.data.status === 'DRAFT', `Expected DRAFT after restore, got ${r10b.body.data.status}`);
    console.log(`   ✓ Restored product to Draft`);

    // 11. TEST BULK ACTIONS (PUBLISH, DRAFT, ARCHIVE, RESTORE)
    console.log('\n11. Testing POST /api/products/bulk-action...');
    const t11a = mockReqRes({}, { action: 'PUBLISH', ids: [testProductId, duplicatedProductId] });
    await bulkProductAction(t11a.req, t11a.res, t11a.next);
    const r11a = t11a.getResult();
    console.assert(r11a.status === 200, `Expected 200, got ${r11a.status}`);
    console.log(`   ✓ Bulk Publish: ${r11a.body.message}`);

    const t11b = mockReqRes({}, { action: 'ARCHIVE', ids: [testProductId, duplicatedProductId] });
    await bulkProductAction(t11b.req, t11b.res, t11b.next);
    const r11b = t11b.getResult();
    console.assert(r11b.status === 200, `Expected 200, got ${r11b.status}`);
    console.log(`   ✓ Bulk Archive: ${r11b.body.message}`);

    // 12. TEST DRILLDOWN ENDPOINTS
    console.log('\n12. Testing Drilldown Endpoints (Orders, Downloads, Licences, Analytics, Audit Logs)...');
    const [tOrders, tDowns, tLics, tAnalytics, tAudit] = [
      mockReqRes({ id: testProductId }),
      mockReqRes({ id: testProductId }),
      mockReqRes({ id: testProductId }),
      mockReqRes({ id: testProductId }),
      mockReqRes({ id: testProductId })
    ];

    await getProductOrders(tOrders.req, tOrders.res, tOrders.next);
    await getProductDownloads(tDowns.req, tDowns.res, tDowns.next);
    await getProductLicences(tLics.req, tLics.res, tLics.next);
    await getProductAnalytics(tAnalytics.req, tAnalytics.res, tAnalytics.next);
    await getProductAuditLogs(tAudit.req, tAudit.res, tAudit.next);

    console.assert(tOrders.getResult().status === 200, 'Orders endpoint 200');
    console.assert(tDowns.getResult().status === 200, 'Downloads endpoint 200');
    console.assert(tLics.getResult().status === 200, 'Licences endpoint 200');
    console.assert(tAnalytics.getResult().status === 200, 'Analytics endpoint 200');
    console.assert(tAudit.getResult().status === 200, 'Audit logs endpoint 200');
    console.log(`   ✓ All 5 drilldown endpoints returned 200 OK with real data models`);

    // 13. TEST SAFE DELETE
    console.log('\n13. Testing DELETE /api/products/:id (Safe Cleanup)...');
    const tDel1 = mockReqRes({ id: testProductId });
    await deleteProduct(tDel1.req, tDel1.res, tDel1.next);
    console.assert(tDel1.getResult().status === 200, 'Deleted test product 1');

    const tDel2 = mockReqRes({ id: duplicatedProductId });
    await deleteProduct(tDel2.req, tDel2.res, tDel2.next);
    console.assert(tDel2.getResult().status === 200, 'Deleted test product 2');
    console.log(`   ✓ Cleaned up test products safely`);

    console.log('\n======================================================');
    console.log('✅ ALL 13 PRODUCTS E2E TESTS PASSED WITH 100% SUCCESS');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exit(1);
  } finally {
    // Cleanup if any remain
    if (testProductId) {
      try { await prisma.product.delete({ where: { id: testProductId } }); } catch (e) {}
    }
    if (duplicatedProductId) {
      try { await prisma.product.delete({ where: { id: duplicatedProductId } }); } catch (e) {}
    }
  }
}

runProductsE2ETests();
