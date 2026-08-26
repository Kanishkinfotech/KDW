import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';

// Master Controllers
import {
  getCustomerOverview,
  getNewCustomers,
  getReturningCustomers,
  getGuestCustomers,
  getCustomerValue,
  getCustomerRetention,
  getCustomerSegments,
  getCustomerProductOwnership,
  getCustomerRefunds,
  getCustomerDownloads
} from '../controllers/reports/customerReportController';

import {
  getLoginOverview,
  getSuccessfulLogins,
  getFailedLogins,
  getPasswordResets,
  getEmailVerifications,
  getActiveSessions,
  revokeActiveSession,
  getGuestClaims,
  getSuspiciousActivity,
  updateSecurityEventStatus
} from '../controllers/reports/customerLoginReportController';

import {
  getPurchaseOverview,
  getFirstPurchaseAnalysis,
  getRepeatPurchaseAnalysis,
  getProductAffinity,
  getBundleAdoption,
  getPurchaseTiming,
  getGuestVsAccountBuying,
  getCustomerJourney
} from '../controllers/reports/customerBuyAnalysisController';

import {
  getCouponOverview,
  getCouponUsage,
  getCouponRevenue,
  getCouponCustomers,
  getCouponProducts,
  getCouponAbuse
} from '../controllers/reports/couponReportController';

import {
  getDownloadOverview,
  getDownloadsByProduct,
  getDownloadsByVersion,
  getGuestDownloads
} from '../controllers/reports/downloadReportController';

import {
  getReportAlerts,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert
} from '../controllers/reports/reportAlertsController';

import {
  getCustomerMasterDetail
} from '../controllers/reports/customerMasterDrawerController';

import {
  getSalesReport,
  getRevenueReport,
  getProductAnalysisReport,
  getProductPerformanceReport,
  getDownloadReport,
  getReviewReport,
  getRefundReport,
  getCustomerReport,
  getLicenceReport,
  getExportJobs,
  createExportJob,
  getDataQualityHealth
} from '../controllers/adminReportsController';

const router = Router();

// Protect all reports admin routes
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'STAFF', 'ANALYST', 'STORE_MANAGER'));

// ============================================================================
// 1. CUSTOMER REPORT (11 Sub-Modules)
// ============================================================================
router.get('/customers/overview', getCustomerOverview);
router.get('/customers/new', getNewCustomers);
router.get('/customers/returning', getReturningCustomers);
router.get('/customers/guests', getGuestCustomers);
router.get('/customers/value', getCustomerValue);
router.get('/customers/retention', getCustomerRetention);
router.get('/customers/segments', getCustomerSegments);
router.get('/customers/ownership', getCustomerProductOwnership);
router.get('/customers/refunds', getCustomerRefunds);
router.get('/customers/downloads', getCustomerDownloads);
router.get('/customers/360/:id', getCustomerMasterDetail);

// ============================================================================
// 2. CUSTOMER LOGIN REPORT (9 Sub-Modules)
// ============================================================================
router.get('/logins/overview', getLoginOverview);
router.get('/logins/successful', getSuccessfulLogins);
router.get('/logins/failed', getFailedLogins);
router.get('/logins/password-resets', getPasswordResets);
router.get('/logins/email-verification', getEmailVerifications);
router.get('/logins/active-sessions', getActiveSessions);
router.post('/logins/active-sessions/:id/revoke', revokeActiveSession);
router.get('/logins/guest-claims', getGuestClaims);
router.get('/logins/suspicious', getSuspiciousActivity);
router.post('/logins/suspicious/:id/status', updateSecurityEventStatus);

// ============================================================================
// 3. CUSTOMER BUY ANALYSIS (10 Sub-Modules)
// ============================================================================
router.get('/buy-analysis/overview', getPurchaseOverview);
router.get('/buy-analysis/first-purchase', getFirstPurchaseAnalysis);
router.get('/buy-analysis/repeat-purchase', getRepeatPurchaseAnalysis);
router.get('/buy-analysis/product-affinity', getProductAffinity);
router.get('/buy-analysis/bundle-adoption', getBundleAdoption);
router.get('/buy-analysis/purchase-timing', getPurchaseTiming);
router.get('/buy-analysis/guest-vs-account', getGuestVsAccountBuying);
router.get('/buy-analysis/customer-journey', getCustomerJourney);

// ============================================================================
// 4. COUPON REPORT (8 Sub-Modules)
// ============================================================================
router.get('/coupons/overview', getCouponOverview);
router.get('/coupons/usage', getCouponUsage);
router.get('/coupons/revenue', getCouponRevenue);
router.get('/coupons/customers', getCouponCustomers);
router.get('/coupons/products', getCouponProducts);
router.get('/coupons/abuse', getCouponAbuse);

// ============================================================================
// 5. DOWNLOAD REPORT (10 Sub-Modules)
// ============================================================================
router.get('/downloads/overview', getDownloadOverview);
router.get('/downloads/by-product', getDownloadsByProduct);
router.get('/downloads/by-version', getDownloadsByVersion);
router.get('/downloads/guests', getGuestDownloads);

// ============================================================================
// 6. REPORT ALERTS TRIAGE
// ============================================================================
router.get('/alerts', getReportAlerts);
router.post('/alerts/:id/acknowledge', acknowledgeAlert);
router.post('/alerts/:id/resolve', resolveAlert);
router.post('/alerts/:id/dismiss', dismissAlert);

// ============================================================================
// 7. EXISTING HIGH-LEVEL FINANCIAL & GENERAL REPORTS
// ============================================================================
router.get('/sales', getSalesReport);
router.get('/revenue', getRevenueReport);
router.get('/product-analysis', getProductAnalysisReport);
router.get('/product-performance', getProductPerformanceReport);
router.get('/downloads', getDownloadReport);
router.get('/reviews', getReviewReport);
router.get('/refunds', getRefundReport);
router.get('/customers', getCustomerReport);
router.get('/licences', getLicenceReport);
router.get('/exports', getExportJobs);
router.post('/exports/generate', createExportJob);
router.get('/data-quality', getDataQualityHealth);

export default router;
