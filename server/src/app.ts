import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { csrfProtection } from './middleware/authMiddleware';

const app = express();

// Middleware
app.use(express.json({
  limit: '50mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan('dev'));

// Routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminPaymentRoutes from './routes/adminPaymentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';
import bundleRoutes from './routes/bundleRoutes';
import reviewRoutes from './routes/reviewRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import supportRoutes from './routes/supportRoutes';
import uploadRoutes from './routes/uploadRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import settingsRoutes from './routes/settingsRoutes';
import couponRoutes from './routes/couponRoutes';
import offerRoutes from './routes/offerRoutes';
import campaignRoutes from './routes/campaignRoutes';
import digitalDeliveryRoutes from './routes/digitalDeliveryRoutes';
import orderRoutes from './routes/orderRoutes';
import customerRoutes from './routes/customerRoutes';
import accountCustomerRoutes from './routes/accountCustomerRoutes';
import adminDownloadManagementRoutes from './routes/adminDownloadManagementRoutes';
import adminReportsRoutes from './routes/adminReportsRoutes';
import contentRoutes from './routes/contentRoutes';
import systemRoutes from './routes/systemRoutes';
import storefrontContentRoutes from './routes/storefrontContentRoutes';
import cacheRoutes from './routes/cacheRoutes';
import userStaffRoutes from './routes/userStaffRoutes';
import automationRoutes from './routes/automationRoutes';
import { handleIncomingWebhook } from './controllers/automation/automationWebhookController';

// Apply CSRF protection to all API routes
app.use('/api', csrfProtection);

app.use('/api/admin/cache', cacheRoutes);
app.use('/api/admin/users', userStaffRoutes);
app.use('/api/admin/content', contentRoutes);
app.use('/api/content', storefrontContentRoutes);
app.use('/api/admin/downloads', adminDownloadManagementRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/account', accountCustomerRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/admin/offers', offerRoutes);
app.use('/api/admin/campaigns', campaignRoutes);
app.use('/api/admin/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/digital-delivery', digitalDeliveryRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/support', supportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/admin/system', systemRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin/automation', automationRoutes);
app.post('/api/webhooks/:provider', handleIncomingWebhook);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'KDW Backend is running' });
});

// Serve static frontend in production
const frontendDistPath = path.join(__dirname, '../../front end/dist');
app.use(express.static(frontendDistPath));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/uploads')) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
  next();
});



// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
