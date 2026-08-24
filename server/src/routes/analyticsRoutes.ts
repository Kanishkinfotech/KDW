import express from 'express';
import { getDashboardAnalytics, getDailyRevenue, getTopProducts, getRevenueChart, getRecentOrders, getNotifications, getReports, getInventoryAlerts } from '../controllers/analyticsController';

const router = express.Router();

router.get('/dashboard', getDashboardAnalytics);
router.get('/daily-revenue', getDailyRevenue);
router.get('/top-products', getTopProducts);
router.get('/revenue-chart', getRevenueChart);
router.get('/recent-orders', getRecentOrders);
router.get('/inventory-alerts', getInventoryAlerts);
router.get('/notifications', getNotifications);
router.get('/reports', getReports);

export default router;
