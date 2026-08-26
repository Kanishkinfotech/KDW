import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';

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
  bulkUpdateTickets
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
  rejectCustomerRequest
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
  selfServiceOrderStatus
} from '../controllers/support/storefrontSupportController';

const router = express.Router();

// Staff Roles
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STORE_MANAGER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'CATALOG_MANAGER'];

// ==========================================
// 1. ADMIN SUPPORT WORKSPACE ROUTES
// ==========================================

// Dashboard & Overview
router.get('/admin/overview', authenticate, authorize(...STAFF_ROLES), getSupportOverview);

// Ticket Management
router.get('/admin/tickets', authenticate, authorize(...STAFF_ROLES), getTickets);
router.post('/admin/tickets', authenticate, authorize(...STAFF_ROLES), createTicket);
router.get('/admin/tickets/:id', authenticate, authorize(...STAFF_ROLES), getTicketById);
router.post('/admin/tickets/:id/reply', authenticate, authorize(...STAFF_ROLES), replyTicket);
router.post('/admin/tickets/:id/note', authenticate, authorize(...STAFF_ROLES), addInternalNote);
router.post('/admin/tickets/:id/assign', authenticate, authorize(...STAFF_ROLES), assignTicket);
router.patch('/admin/tickets/:id/status', authenticate, authorize(...STAFF_ROLES), updateTicketStatus);
router.patch('/admin/tickets/:id/priority', authenticate, authorize(...STAFF_ROLES), updateTicketPriority);
router.post('/admin/tickets/:id/escalate', authenticate, authorize(...STAFF_ROLES), escalateTicket);
router.post('/admin/tickets/bulk', authenticate, authorize(...STAFF_ROLES), bulkUpdateTickets);

// Context Actions (Download, Licence, Refund)
router.post('/admin/download/resend-link', authenticate, authorize(...STAFF_ROLES), resendDownloadLink);
router.post('/admin/download/reset-limit', authenticate, authorize(...STAFF_ROLES), resetDownloadLimit);
router.post('/admin/download/extend-expiry', authenticate, authorize(...STAFF_ROLES), extendDownloadExpiry);

router.post('/admin/licence/resend', authenticate, authorize(...STAFF_ROLES), resendLicence);
router.post('/admin/licence/reset-activation', authenticate, authorize(...STAFF_ROLES), resetLicenceActivation);

router.post('/admin/refund/request-review', authenticate, authorize(...STAFF_ROLES), requestFinanceReview);
router.post('/admin/refund/approve', authenticate, authorize(...STAFF_ROLES), approveRefund);
router.post('/admin/refund/reject', authenticate, authorize(...STAFF_ROLES), rejectRefund);

// Customer Requests (GDPR, Data Export, Deletion)
router.get('/admin/customer-requests', authenticate, authorize(...STAFF_ROLES), getCustomerRequests);
router.post('/admin/customer-requests/:id/verify', authenticate, authorize(...STAFF_ROLES), verifyCustomerRequest);
router.post('/admin/customer-requests/:id/complete', authenticate, authorize(...STAFF_ROLES), completeCustomerRequest);
router.post('/admin/customer-requests/:id/reject', authenticate, authorize(...STAFF_ROLES), rejectCustomerRequest);

// Canned Responses
router.get('/admin/canned-responses', authenticate, authorize(...STAFF_ROLES), getCannedResponses);
router.post('/admin/canned-responses', authenticate, authorize(...STAFF_ROLES), createCannedResponse);
router.patch('/admin/canned-responses/:id', authenticate, authorize(...STAFF_ROLES), updateCannedResponse);
router.delete('/admin/canned-responses/:id', authenticate, authorize(...STAFF_ROLES), deleteCannedResponse);

// Support Reports & Analytics
router.get('/admin/reports/overview', authenticate, authorize(...STAFF_ROLES), getSupportOverviewReport);
router.get('/admin/reports/by-product', authenticate, authorize(...STAFF_ROLES), getProductSupportReport);
router.get('/admin/reports/agent-performance', authenticate, authorize(...STAFF_ROLES), getAgentPerformanceReport);
router.get('/admin/reports/refunds', authenticate, authorize(...STAFF_ROLES), getRefundsReport);
router.get('/admin/reports/satisfaction', authenticate, authorize(...STAFF_ROLES), getSatisfactionReport);

// ==========================================
// 2. STOREFRONT & CUSTOMER PORTAL ROUTES
// ==========================================

router.post('/contact', submitContactQuery);
router.post('/self-service/order-status', selfServiceOrderStatus);
router.get('/my-tickets', authenticate, getCustomerTickets);
router.get('/tickets/:id', authenticate, getCustomerTicketDetail);
router.post('/tickets/:id/reply', authenticate, replyTicket);
router.post('/satisfaction', authenticate, submitSatisfactionSurvey);

export default router;
