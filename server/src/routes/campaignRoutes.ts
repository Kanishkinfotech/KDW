import { Router } from 'express';
import {
  getAdminCampaigns,
  getAdminCampaignById,
  createAdminCampaign,
  updateAdminCampaign,
  sendTestCampaign,
  approveCampaign,
  launchCampaign,
  getAudiencePreview,
  trackCampaignOpen,
  trackCampaignClick,
  exportCampaignsCSV,
  getCampaignRecipients,
  pauseCampaign,
  resumeCampaign,
  deleteAdminCampaign
} from '../controllers/campaignController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public Tracking Endpoints (No Auth Required)
router.get('/track/open/:recipientId', trackCampaignOpen);
router.get('/track/click/:recipientId', trackCampaignClick);

// Admin Routes (Authenticated & Authorized)
router.use(authenticate, authorize('ADMIN'));

// Static Admin Routes (Must precede dynamic /:id parameter)
router.get('/export', exportCampaignsCSV);
router.get('/audience-preview', getAudiencePreview);
router.get('/', getAdminCampaigns);
router.post('/', createAdminCampaign);

// Dynamic Parameter Routes
router.get('/:id/recipients', getCampaignRecipients);
router.get('/:id', getAdminCampaignById);
router.put('/:id', updateAdminCampaign);
router.delete('/:id', deleteAdminCampaign);
router.post('/:id/test', sendTestCampaign);
router.post('/:id/approve', approveCampaign);
router.post('/:id/send', launchCampaign);
router.post('/:id/launch', launchCampaign);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/resume', resumeCampaign);

export default router;
