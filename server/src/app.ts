import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { csrfProtection } from './middleware/authMiddleware';

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
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

// Apply CSRF protection to all API routes
app.use('/api', csrfProtection);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponRoutes);

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
