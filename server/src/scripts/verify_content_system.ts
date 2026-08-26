import 'dotenv/config';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';

const adminToken = jwt.sign(
  { id: 'master-admin-test', role: 'SUPER_ADMIN', email: 'admin@kanishkdigitalworld.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

interface TestResult {
  name: string;
  endpoint: string;
  status: 'PASS' | 'FAIL';
  statusCode: number;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  endpoint: string,
  method: string = 'GET',
  body?: any,
  isPublic: boolean = false
) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (!isPublic) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const options: RequestInit = {
      method,
      headers
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    let json: any = {};
    try {
      json = await res.json();
    } catch (e) {
      // no-op
    }

    const pass = res.status >= 200 && res.status < 300 && (json.success !== false);
    results.push({
      name,
      endpoint,
      status: pass ? 'PASS' : 'FAIL',
      statusCode: res.status,
      details: pass ? (json.count !== undefined ? `${json.count} items` : 'OK') : json.message
    });

    return json;
  } catch (error: any) {
    results.push({
      name,
      endpoint,
      status: 'FAIL',
      statusCode: 500,
      details: error.message
    });
    return null;
  }
}

async function verifyAll() {
  console.log('====================================================');
  console.log('VERIFYING COMPLETE KDW CONTENT MANAGEMENT SYSTEM');
  console.log('====================================================\n');

  // 1. Overview & Health
  await runTest('Content Overview KPIs', '/api/admin/content/overview');
  await runTest('Content Health Alerts', '/api/admin/content/health-alerts');

  // 2. Pages
  await runTest('Get Pages List', '/api/admin/content/pages');
  const createdPage = await runTest('Create Page Draft', '/api/admin/content/pages', 'POST', {
    title: 'Automated Test Information Page',
    slug: `test-page-${Date.now()}`,
    summary: 'Automated verification test page',
    template: 'STANDARD',
    contentJson: [{ type: 'hero', title: 'Test', subtitle: 'Automated' }]
  });

  if (createdPage?.page?.id) {
    const pageId = createdPage.page.id;
    await runTest('Update Page Content', `/api/admin/content/pages/${pageId}`, 'PATCH', {
      summary: 'Updated summary content'
    });
    await runTest('Submit Page Review', `/api/admin/content/pages/${pageId}/submit-review`, 'POST');
    await runTest('Publish Page', `/api/admin/content/pages/${pageId}/publish`, 'POST');
    await runTest('Get Page Revisions', `/api/admin/content/pages/${pageId}/revisions`);
  }

  // 3. Blogs
  await runTest('Get Blogs List', '/api/admin/content/blogs');
  await runTest('Get Blog Categories', '/api/admin/content/blogs/categories');
  await runTest('Get Blog Tags', '/api/admin/content/blogs/tags');
  await runTest('Get Blog Authors', '/api/admin/content/blogs/authors');

  // 4. FAQs
  await runTest('Get FAQs List', '/api/admin/content/faqs');
  const createdFaq = await runTest('Create FAQ', '/api/admin/content/faqs', 'POST', {
    question: `Automated Test Question ${Date.now()}?`,
    answer: 'Automated test answer for integration verification.',
    scopeType: 'GLOBAL'
  });

  // 5. Banners
  await runTest('Get Banners List', '/api/admin/content/banners');
  await runTest('Create Banner', '/api/admin/content/banners', 'POST', {
    name: `Test Campaign Banner ${Date.now()}`,
    placement: 'HOMEPAGE_HERO',
    desktopImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    altText: 'Promotional test banner'
  });

  // 6. Feedback
  await runTest('Get Customer Feedback', '/api/admin/content/feedback');
  await runTest('Create Feedback Record', '/api/admin/content/feedback', 'POST', {
    customerName: 'Test Buyer',
    customerEmail: 'buyer@test.com',
    title: 'Verification Feedback',
    message: 'Testing feedback submission endpoint'
  });

  // 7. Media Library & Deletion Safety
  await runTest('Get Media Assets', '/api/admin/content/media');
  const createdMedia = await runTest('Register Media Asset', '/api/admin/content/media', 'POST', {
    fileName: `test_image_${Date.now()}.jpg`,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    altText: 'Test Media'
  });
  if (createdMedia?.media?.id) {
    await runTest('Safe Delete Unused Media', `/api/admin/content/media/${createdMedia.media.id}`, 'DELETE');
  }

  // 8. Navigation
  await runTest('Get Navigation Menus', '/api/admin/content/navigation');

  // 9. Redirects
  await runTest('Get Redirects List', '/api/admin/content/redirects');
  const createdRedirect = await runTest('Create Redirect Rule', '/api/admin/content/redirects', 'POST', {
    oldPath: `/legacy/path-${Date.now()}`,
    newPath: '/pages/about-us',
    redirectType: '301'
  });

  // 10. SEO
  await runTest('SEO Audit Report', '/api/admin/content/seo/audit');
  await runTest('Validate Structured Data', '/api/admin/content/seo/validate', 'POST', {
    schemaType: 'Article',
    data: { headline: 'Test Guide', author: 'Author', datePublished: '2026-01-01' }
  });

  // 11. Templates
  await runTest('Get Templates List', '/api/admin/content/templates');

  // 12. Workflow & Revisions
  await runTest('Get Unified Drafts', '/api/admin/content/drafts');
  await runTest('Get Scheduled Content', '/api/admin/content/scheduled');
  await runTest('Trigger Scheduled Publisher Daemon', '/api/admin/content/scheduled/run-now', 'POST');
  await runTest('Get Approval Queue', '/api/admin/content/approval-queue');
  await runTest('Get Revisions List', '/api/admin/content/revisions');

  // 13. Content Analytics
  await runTest('Get Content Analytics', '/api/admin/content/analytics');

  // 14. Storefront Public APIs
  await runTest('Storefront Page Delivery', '/api/content/pages/privacy-policy', 'GET', undefined, true);
  await runTest('Storefront Blogs Delivery', '/api/content/blogs', 'GET', undefined, true);
  await runTest('Storefront FAQs Delivery', '/api/content/faqs', 'GET', undefined, true);
  await runTest('Storefront Banners Delivery', '/api/content/banners/placement/HOMEPAGE_HERO', 'GET', undefined, true);
  await runTest('Storefront Redirect Resolver', '/api/content/redirects/resolve?path=/legal/privacy', 'GET', undefined, true);

  // Summary
  console.log('\n====================================================');
  console.log('RESULTS SUMMARY:');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`${icon} [${r.status}] (${r.statusCode}) ${r.name.padEnd(40)} -> ${r.endpoint} (${r.details})`);
    if (r.status === 'PASS') passed++;
    else failed++;
  }

  console.log(`\nTOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

verifyAll().catch(console.error);
