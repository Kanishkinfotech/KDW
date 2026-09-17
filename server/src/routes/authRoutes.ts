import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, logout, getMe, updateProfile } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { authenticate } from '../middleware/authMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 500,
  message: { success: false, message: 'Too many accounts created from this IP, please try again after an hour' }
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 500,
  message: { success: false, message: 'Too many password reset requests from this IP, please try again after an hour' }
});

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password/:token', resetLimiter, resetPassword);
router.post('/reset-password', resetLimiter, resetPassword);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
