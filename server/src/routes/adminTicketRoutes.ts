import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getTickets,
  getTicketStats,
  getAgents,
  getTicketById,
  replyTicket,
  updateStatus,
  updatePriority,
  assignTicket
} from '../controllers/adminTicketController';

const router = express.Router();

const STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'STAFF',
  'STORE_MANAGER',
  'SUPPORT_AGENT',
  'FINANCE_MANAGER',
  'CATALOG_MANAGER',
  'MANAGER',
  'super_admin',
  'admin',
  'staff',
  'manager',
  'support_agent'
];

// All admin ticket endpoints require authentication and admin/staff privileges
router.use(authenticate, authorize(...STAFF_ROLES));

// Specific static sub-paths before dynamic :id route
router.get('/stats', getTicketStats);
router.get('/agents', getAgents);

// Collection root
router.get('/', getTickets);

// Resource operations by ticket ID
router.get('/:id', getTicketById);
router.post('/:id/reply', replyTicket);
router.patch('/:id/status', updateStatus);
router.patch('/:id/priority', updatePriority);
router.patch('/:id/assign', assignTicket);

export default router;
