import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';

import {
  getContentOverview,
  getContentHealthAlerts
} from '../controllers/content/contentOverviewController';

import {
  getPages,
  getPageById,
  createPage,
  updatePage,
  submitPageReview,
  publishPage,
  schedulePage,
  archivePage,
  restorePage,
  deletePage,
  getPageRevisions
} from '../controllers/content/pageController';

import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  publishBlog,
  scheduleBlog,
  archiveBlog,
  toggleFeaturedPost,
  getBlogCategories,
  createBlogCategory,
  deleteBlogCategory,
  getBlogTags,
  createBlogTag,
  getBlogAuthors,
  createBlogAuthor,
  getBlogAnalytics
} from '../controllers/content/blogController';

import {
  getFaqs,
  createFaq,
  updateFaq,
  markFaqOutdated,
  deleteFaq,
  voteFaq
} from '../controllers/content/faqController';

import {
  getBanners,
  createBanner,
  updateBanner,
  setBannerStatus,
  deleteBanner,
  getBannerAnalytics
} from '../controllers/content/bannerController';

import {
  getFeedback,
  getFeedbackById,
  createFeedback,
  assignFeedback,
  overridePriority,
  replyFeedback,
  resolveFeedback,
  moderateReview
} from '../controllers/content/feedbackController';

import {
  getMedia,
  createMediaRecord,
  updateMediaMetadata,
  deleteMedia
} from '../controllers/content/mediaController';

import {
  getNavigationMenus,
  getMenuByLocation,
  createNavigationMenu,
  updateNavigationMenu,
  deleteNavigationMenu
} from '../controllers/content/navigationMenuController';

import {
  getRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  resolveRedirect
} from '../controllers/content/redirectController';

import {
  getSeoAuditReport,
  validateStructuredData
} from '../controllers/content/seoController';

import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../controllers/content/templateController';

import {
  getDrafts,
  getScheduledContent,
  runScheduledPublisherNow,
  getApprovalQueue,
  approveContent,
  rejectContent,
  getRevisions,
  restoreRevision
} from '../controllers/content/workflowController';

import {
  getContentAnalytics
} from '../controllers/content/contentAnalyticsController';

const router = Router();

// Protect all admin content routes
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR', 'STORE_MANAGER', 'REVIEW_MODERATOR'));

// 1. Overview & Health
router.get('/overview', getContentOverview);
router.get('/health-alerts', getContentHealthAlerts);

// 2. Pages
router.get('/pages', getPages);
router.post('/pages', createPage);
router.get('/pages/:id', getPageById);
router.patch('/pages/:id', updatePage);
router.post('/pages/:id/submit-review', submitPageReview);
router.post('/pages/:id/publish', publishPage);
router.post('/pages/:id/schedule', schedulePage);
router.post('/pages/:id/archive', archivePage);
router.post('/pages/:id/restore', restorePage);
router.delete('/pages/:id', deletePage);
router.get('/pages/:id/revisions', getPageRevisions);

// 3. Blogs
router.get('/blogs', getBlogs);
router.post('/blogs', createBlog);
router.get('/blogs/categories', getBlogCategories);
router.post('/blogs/categories', createBlogCategory);
router.delete('/blogs/categories/:id', deleteBlogCategory);
router.get('/blogs/tags', getBlogTags);
router.post('/blogs/tags', createBlogTag);
router.get('/blogs/authors', getBlogAuthors);
router.post('/blogs/authors', createBlogAuthor);
router.get('/blogs/:id', getBlogById);
router.patch('/blogs/:id', updateBlog);
router.post('/blogs/:id/publish', publishBlog);
router.post('/blogs/:id/schedule', scheduleBlog);
router.post('/blogs/:id/archive', archiveBlog);
router.post('/blogs/:id/featured', toggleFeaturedPost);
router.get('/blogs/:id/analytics', getBlogAnalytics);

// 4. FAQs
router.get('/faqs', getFaqs);
router.post('/faqs', createFaq);
router.patch('/faqs/:id', updateFaq);
router.post('/faqs/:id/mark-outdated', markFaqOutdated);
router.delete('/faqs/:id', deleteFaq);
router.post('/faqs/:id/vote', voteFaq);

// 5. Banners
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.patch('/banners/:id', updateBanner);
router.post('/banners/:id/status', setBannerStatus);
router.delete('/banners/:id', deleteBanner);
router.get('/banners/:id/analytics', getBannerAnalytics);

// 6. Customer Feedback
router.get('/feedback', getFeedback);
router.get('/feedback/:id', getFeedbackById);
router.post('/feedback', createFeedback);
router.post('/feedback/:id/assign', assignFeedback);
router.post('/feedback/:id/override-priority', overridePriority);
router.post('/feedback/:id/reply', replyFeedback);
router.post('/feedback/:id/resolve', resolveFeedback);
router.post('/feedback/:id/moderate-review', moderateReview);

// 7. Media Library
router.get('/media', getMedia);
router.post('/media', createMediaRecord);
router.patch('/media/:id', updateMediaMetadata);
router.delete('/media/:id', deleteMedia);

// 8. Navigation Menus
router.get('/navigation', getNavigationMenus);
router.get('/navigation/location/:location', getMenuByLocation);
router.post('/navigation', createNavigationMenu);
router.patch('/navigation/:id', updateNavigationMenu);
router.delete('/navigation/:id', deleteNavigationMenu);

// 9. Redirects
router.get('/redirects', getRedirects);
router.post('/redirects', createRedirect);
router.patch('/redirects/:id', updateRedirect);
router.delete('/redirects/:id', deleteRedirect);
router.get('/redirects/resolve', resolveRedirect);

// 10. SEO Settings & Audits
router.get('/seo/audit', getSeoAuditReport);
router.post('/seo/validate', validateStructuredData);

// 11. Content Templates
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.patch('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

// 12. Workflow & Revisions
router.get('/drafts', getDrafts);
router.get('/scheduled', getScheduledContent);
router.post('/scheduled/run-now', runScheduledPublisherNow);
router.get('/approval-queue', getApprovalQueue);
router.post('/approval-queue/approve', approveContent);
router.post('/approval-queue/reject', rejectContent);
router.get('/revisions', getRevisions);
router.post('/revisions/:id/restore', restoreRevision);

// 13. Content Analytics
router.get('/analytics', getContentAnalytics);

export default router;
