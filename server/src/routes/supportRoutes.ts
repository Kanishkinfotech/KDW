import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { 
  createTicket, getMyTickets, getAllTickets, updateTicketStatus, 
  getFAQs, getTicketDetails, addMessage, deleteMessage,
  getSupportCategories, getSupportArticles, getArticleBySlug, voteArticle, searchSupport
} from '../controllers/supportController';

const router = express.Router();

router.get('/search', searchSupport);
router.get('/faqs', getFAQs);
router.get('/categories', getSupportCategories);
router.get('/articles', getSupportArticles);
router.get('/articles/:slug', getArticleBySlug);
router.post('/articles/:id/vote', voteArticle);

router.post('/tickets', authenticate, createTicket);
router.get('/tickets/my', authenticate, getMyTickets);
router.get('/tickets/:id', authenticate, getTicketDetails);
router.post('/tickets/:id/messages', authenticate, addMessage);

router.get('/admin/tickets', authenticate, authorize('ADMIN', 'STAFF'), getAllTickets);
router.patch('/admin/tickets/:id/status', authenticate, authorize('ADMIN', 'STAFF'), updateTicketStatus);
router.delete('/admin/messages/:id', authenticate, authorize('ADMIN', 'STAFF'), deleteMessage);

export default router;
