import { Router } from 'express';
import { verifyLicenceKey, getLicenceByKey, resendVerificationEmail } from '../controllers/licenceVerificationController';

const router = Router();

// Public License Verification & Deliverables Unlock endpoints
router.post('/verify', verifyLicenceKey);
router.get('/verify/:key', getLicenceByKey);
router.post('/resend-email', resendVerificationEmail);

export default router;
