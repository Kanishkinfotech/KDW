import express from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware';

// Controllers
import {
  getTickets,
  getTicketById,
  createTicket,
  replyTicket,
  addInternalNote,
  assignTicket,
  updateTicketStatus,
  updateTicketPriority,
  escalateTicket,
  bulkUpdateTickets,
  deleteTicket
} from '../controllers/support/supportTicketController';

import {
  resendDownloadLink,
  resetDownloadLimit,
  extendDownloadExpiry,
  resendLicence,
  resetLicenceActivation,
  requestFinanceReview,
  approveRefund,
  rejectRefund
} from '../controllers/support/supportContextActionsController';

import {
  getCustomerRequests,
  verifyCustomerRequest,
  completeCustomerRequest,
  rejectCustomerRequest,
  replyCustomerRequest
} from '../controllers/support/customerRequestController';

import {
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse
} from '../controllers/support/cannedResponseController';

import { getSupportOverview } from '../controllers/support/supportOverviewController';

import {
  getSupportOverviewReport,
  getProductSupportReport,
  getAgentPerformanceReport,
  getRefundsReport,
  getSatisfactionReport
} from '../controllers/support/supportReportsController';

import {
  submitContactQuery,
  getCustomerTickets,
  getCustomerTicketDetail,
  submitSatisfactionSurvey,
  selfServiceOrderStatus,
  getCustomerSupportRequests
} from '../controllers/support/storefrontSupportController';

import {
  getSupportCategories,
  getSupportArticles,
  getArticleBySlug,
  voteArticle,
  getFAQs,
  searchSupport
} from '../controllers/supportController';

const router = express.Router();

// Staff Roles
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STORE_MANAGER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'CATALOG_MANAGER'];

// ==========================================
// 1. ADMIN SUPPORT WORKSPACE ROUTES
// ==========================================

// Dashboard & Overview
router.get(['/overview', '/admin/overview'], authenticate, authorize(...STAFF_ROLES), getSupportOverview);

// Ticket Management (Admin)
router.get(['/tickets', '/admin/tickets'], authenticate, authorize(...STAFF_ROLES), getTickets);
router.post(['/tickets', '/admin/tickets'], authenticate, authorize(...STAFF_ROLES), createTicket);
router.get(['/tickets/:id', '/admin/tickets/:id'], authenticate, authorize(...STAFF_ROLES), getTicketById);
router.post('/admin/tickets/:id/reply', authenticate, authorize(...STAFF_ROLES), replyTicket);
router.post(['/tickets/:id/note', '/admin/tickets/:id/note'], authenticate, authorize(...STAFF_ROLES), addInternalNote);
router.post(['/tickets/:id/assign', '/admin/tickets/:id/assign'], authenticate, authorize(...STAFF_ROLES), assignTicket);
router.patch(['/tickets/:id/status', '/admin/tickets/:id/status'], authenticate, authorize(...STAFF_ROLES), updateTicketStatus);
router.patch(['/tickets/:id/priority', '/admin/tickets/:id/priority'], authenticate, authorize(...STAFF_ROLES), updateTicketPriority);
router.post(['/tickets/:id/escalate', '/admin/tickets/:id/escalate'], authenticate, authorize(...STAFF_ROLES), escalateTicket);
router.post(['/tickets/bulk', '/admin/tickets/bulk'], authenticate, authorize(...STAFF_ROLES), bulkUpdateTickets);
router.delete(['/tickets/:id', '/admin/tickets/:id'], authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deleteTicket);

// Context Actions (Download, Licence, Refund)
router.post(['/download/resend-link', '/admin/download/resend-link'], authenticate, authorize(...STAFF_ROLES), resendDownloadLink);
router.post(['/download/reset-limit', '/admin/download/reset-limit'], authenticate, authorize(...STAFF_ROLES), resetDownloadLimit);
router.post(['/download/extend-expiry', '/admin/download/extend-expiry'], authenticate, authorize(...STAFF_ROLES), extendDownloadExpiry);

router.post(['/licence/resend', '/admin/licence/resend'], authenticate, authorize(...STAFF_ROLES), resendLicence);
router.post(['/licence/reset-activation', '/admin/licence/reset-activation'], authenticate, authorize(...STAFF_ROLES), resetLicenceActivation);

router.post(['/refund/request-review', '/admin/refund/request-review'], authenticate, authorize(...STAFF_ROLES), requestFinanceReview);
router.post(['/refund/approve', '/admin/refund/approve'], authenticate, authorize(...STAFF_ROLES), approveRefund);
router.post(['/refund/reject', '/admin/refund/reject'], authenticate, authorize(...STAFF_ROLES), rejectRefund);

// Customer Requests (GDPR, Data Export, Deletion, Support Inquiries)
router.get(['/customer-requests', '/admin/customer-requests'], authenticate, authorize(...STAFF_ROLES), getCustomerRequests);
router.post(['/customer-requests/:id/verify', '/admin/customer-requests/:id/verify'], authenticate, authorize(...STAFF_ROLES), verifyCustomerRequest);
router.post(['/customer-requests/:id/complete', '/admin/customer-requests/:id/complete'], authenticate, authorize(...STAFF_ROLES), completeCustomerRequest);
router.post(['/customer-requests/:id/reject', '/admin/customer-requests/:id/reject'], authenticate, authorize(...STAFF_ROLES), rejectCustomerRequest);
router.post(['/customer-requests/:id/reply', '/admin/customer-requests/:id/reply'], authenticate, authorize(...STAFF_ROLES), replyCustomerRequest);

// Canned Responses
router.get(['/canned-responses', '/admin/canned-responses'], authenticate, authorize(...STAFF_ROLES), getCannedResponses);
router.post(['/canned-responses', '/admin/canned-responses'], authenticate, authorize(...STAFF_ROLES), createCannedResponse);
router.patch(['/canned-responses/:id', '/admin/canned-responses/:id'], authenticate, authorize(...STAFF_ROLES), updateCannedResponse);
router.delete(['/canned-responses/:id', '/admin/canned-responses/:id'], authenticate, authorize(...STAFF_ROLES), deleteCannedResponse);

// Support Reports & Analytics
router.get(['/reports/overview', '/admin/reports/overview'], authenticate, authorize(...STAFF_ROLES), getSupportOverviewReport);
router.get(['/reports/by-product', '/admin/reports/by-product'], authenticate, authorize(...STAFF_ROLES), getProductSupportReport);
router.get(['/reports/agent-performance', '/admin/reports/agent-performance'], authenticate, authorize(...STAFF_ROLES), getAgentPerformanceReport);
router.get(['/reports/refunds', '/admin/reports/refunds'], authenticate, authorize(...STAFF_ROLES), getRefundsReport);
router.get(['/reports/satisfaction', '/admin/reports/satisfaction'], authenticate, authorize(...STAFF_ROLES), getSatisfactionReport);

// ==========================================
// 2. STOREFRONT & CUSTOMER PORTAL ROUTES
// ==========================================

router.post('/contact', optionalAuthenticate, submitContactQuery);
router.get(['/my-requests', '/my-inquiries'], optionalAuthenticate, getCustomerSupportRequests);
router.post('/self-service/order-status', selfServiceOrderStatus);
router.get(['/my-tickets', '/tickets/my'], authenticate, getCustomerTickets);
router.get('/tickets/:id', optionalAuthenticate, getCustomerTicketDetail);
router.post('/tickets/:id/reply', optionalAuthenticate, replyTicket);
router.post('/satisfaction', optionalAuthenticate, submitSatisfactionSurvey);

// 3. Knowledge Base & Documentation Public Storefront
router.get(['/categories', '/categories/all'], getSupportCategories);
router.get('/articles', getSupportArticles);
router.get('/articles/:slug', getArticleBySlug);
router.post('/articles/:id/vote', voteArticle);
router.get(['/faqs', '/faq'], getFAQs);
router.get('/search', searchSupport);

export default router;
