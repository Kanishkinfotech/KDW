import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getCacheOverview,
  getCacheKeys,
  getCacheNamespaces,
  getInvalidationEvents,
  retryInvalidationEvent,
  clearSingleKey,
  clearNamespace,
  clearAllCache,
  warmCache,
  runCacheMaintenance,
  getMaintenanceLogs
} from '../controllers/admin/cacheController';

const router = express.Router();

// Apply auth & admin authorization
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'DEVELOPER_OPS'));

// Routes
router.get('/overview', getCacheOverview);
router.get('/keys', getCacheKeys);
router.get('/namespaces', getCacheNamespaces);
router.get('/invalidation-events', getInvalidationEvents);
router.post('/invalidation-events/:id/retry', retryInvalidationEvent);
router.post('/clear-key', clearSingleKey);
router.post('/clear-namespace', clearNamespace);
router.post('/clear-all', clearAllCache);
router.post('/warm', warmCache);
router.post('/maintenance', runCacheMaintenance);
router.get('/maintenance-logs', getMaintenanceLogs);

export default router;
