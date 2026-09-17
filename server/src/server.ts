import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { RetentionService } from './services/retentionService';
import { cacheService } from './controllers/admin/cacheService';
import { OfferService } from './services/offerService';
import { CouponService } from './services/couponService';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  RetentionService.startDailyRetentionSchedule();
  cacheService.autoInitializeFromDatabase();
  OfferService.startOfferScheduler();
  CouponService.startCouponScheduler();
});

