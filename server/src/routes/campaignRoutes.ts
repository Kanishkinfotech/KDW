import { Router } from 'express';
import {
  getAdminCampaigns,
  getAdminCampaignById,
  createAdminCampaign,
  updateAdminCampaign,
  sendTestCampaign,
  approveCampaign,
  launchCampaign,
  getAudiencePreview
} from '../controllers/campaignController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Admin Routes
router.use(authenticate, authorize('ADMIN'));
router.get('/', getAdminCampaigns);
router.post('/', createAdminCampaign);
router.get('/audience-preview', getAudiencePreview);
router.get('/:id', getAdminCampaignById);
router.put('/:id', updateAdminCampaign);
router.post('/:id/test', sendTestCampaign);
router.post('/:id/approve', approveCampaign);
router.post('/:id/send', launchCampaign);

export default router;
