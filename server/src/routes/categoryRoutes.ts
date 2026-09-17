import { Router } from 'express';
import { 
  getCategories, 
  getAdminCategories,
  getCategoryById,
  getCategoryProductsList,
  createCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryTree,
  moveCategory,
  reorderCategories,
  mergeCategories,
  duplicateCategory,
  assignProductsToCategory,
  unassignProductFromCategory,
  getCategoryAnalytics,
  getCategoryRedirects,
  createCategoryRedirect,
  deleteCategoryRedirect,
  checkCategoryRedirect,
  getCategoryRules,
  createCategoryRule,
  previewCategoryRule,
  executeCategoryRule
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public Storefront Static Routes
router.get('/', getCategories);
router.get('/redirect-check', checkCategoryRedirect);

// Administrative Category Query, Analytics & Tree (Registered before dynamic :id)
router.get('/admin/all', authenticate, authorize('ADMIN'), getAdminCategories);
router.get('/tree', authenticate, authorize('ADMIN'), getCategoryTree);
router.get('/analytics/overview', authenticate, authorize('ADMIN'), getCategoryAnalytics);

// Redirects Management (Static routes before :id)
router.get('/redirects', authenticate, authorize('ADMIN'), getCategoryRedirects);
router.post('/redirects', authenticate, authorize('ADMIN'), createCategoryRedirect);
router.delete('/redirects/:id', authenticate, authorize('ADMIN'), deleteCategoryRedirect);

// Rules Engine (Static routes before :id)
router.get('/rules', authenticate, authorize('ADMIN'), getCategoryRules);
router.post('/rules', authenticate, authorize('ADMIN'), createCategoryRule);
router.post('/rules/preview', authenticate, authorize('ADMIN'), previewCategoryRule);
router.post('/rules/:id/execute', authenticate, authorize('ADMIN'), executeCategoryRule);

// Bulk Operations
router.post('/reorder', authenticate, authorize('ADMIN'), reorderCategories);
router.post('/merge', authenticate, authorize('ADMIN'), mergeCategories);
router.post('/', authenticate, authorize('ADMIN'), createCategory);

// Public / Single Category Operations (Dynamic :id after all static endpoints)
router.get('/:id', getCategoryById);
router.get('/:id/products', getCategoryProductsList);

// Admin Protected Mutations on Single Categories
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);
router.post('/:id/move', authenticate, authorize('ADMIN'), moveCategory);
router.post('/:id/duplicate', authenticate, authorize('ADMIN'), duplicateCategory);
router.post('/:id/assign-products', authenticate, authorize('ADMIN'), assignProductsToCategory);
router.delete('/:id/products/:productId', authenticate, authorize('ADMIN'), unassignProductFromCategory);

export default router;
