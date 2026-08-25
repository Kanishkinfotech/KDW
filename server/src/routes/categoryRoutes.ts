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
  getCategoryRules,
  createCategoryRule,
  previewCategoryRule,
  executeCategoryRule
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public Storefront Routes
router.get('/', getCategories);

// Admin Category Routes
router.use(authenticate, authorize('ADMIN'));

// Administrative Category Query & Tree
router.get('/admin/all', getAdminCategories);
router.get('/tree', getCategoryTree);
router.get('/analytics/overview', getCategoryAnalytics);

// Redirects Management
router.get('/redirects', getCategoryRedirects);
router.post('/redirects', createCategoryRedirect);
router.delete('/redirects/:id', deleteCategoryRedirect);

// Rules Engine
router.get('/rules', getCategoryRules);
router.post('/rules', createCategoryRule);
router.post('/rules/preview', previewCategoryRule);
router.post('/rules/:id/execute', executeCategoryRule);

// Bulk Operations
router.post('/reorder', reorderCategories);
router.post('/merge', mergeCategories);

// Single Category Operations
router.get('/:id', getCategoryById);
router.get('/:id/products', getCategoryProductsList);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.post('/:id/move', moveCategory);
router.post('/:id/duplicate', duplicateCategory);
router.post('/:id/assign-products', assignProductsToCategory);
router.delete('/:id/products/:productId', unassignProductFromCategory);

export default router;
