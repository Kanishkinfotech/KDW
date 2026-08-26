import { Router } from 'express';
import {
  getStorefrontPage,
  getStorefrontBlogs,
  getStorefrontBlogBySlug,
  getStorefrontFaqs,
  getStorefrontBanners,
  trackBannerClick
} from '../controllers/content/storefrontContentController';
import { getMenuByLocation } from '../controllers/content/navigationMenuController';
import { resolveRedirect } from '../controllers/content/redirectController';

const router = Router();

// Public Storefront Endpoints
router.get('/pages/:slug', getStorefrontPage);
router.get('/blogs', getStorefrontBlogs);
router.get('/blogs/:slug', getStorefrontBlogBySlug);
router.get('/faqs', getStorefrontFaqs);
router.get('/banners/placement/:placement', getStorefrontBanners);
router.post('/banners/:id/click', trackBannerClick);
router.get('/navigation/:location', getMenuByLocation);
router.get('/redirects/resolve', resolveRedirect);

export default router;
