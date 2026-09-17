import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getContentOverview,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} from '../controllers/adminContentController';
import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  markFaqOutdated
} from '../controllers/content/faqController';

const router = Router();

const CONTENT_STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'SUPPORT',
  'SUPPORT_AGENT',
  'MARKETING',
  'STAFF',
  'STORE_MANAGER',
  'CONTENT_EDITOR'
];

// All admin content routes require authentication and staff/marketing/admin authorization
router.use(authenticate);
router.use(authorize(...CONTENT_STAFF_ROLES));

// 1. Overview
router.get('/overview', getContentOverview);

// 2. Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// 3. Articles
router.get('/articles', getArticles);
router.get('/articles/:id', getArticleById);
router.post('/articles', createArticle);
router.patch('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);

// 4. FAQs
router.get('/faqs', getFaqs);
router.post('/faqs', createFaq);
router.patch('/faqs/:id', updateFaq);
router.post('/faqs/:id/mark-outdated', markFaqOutdated);
router.delete('/faqs/:id', deleteFaq);

export default router;
