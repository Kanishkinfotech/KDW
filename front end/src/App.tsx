import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Bundles from './pages/Bundles';
import BundleDetails from './pages/BundleDetails';
import Support from './pages/Support';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaymentSuccess from './pages/PaymentSuccess';
import Dashboard from './pages/Dashboard';
import OrderTracking from './pages/OrderTracking';
import CartPage from './pages/Cart';
import WishlistPage from './pages/Wishlist';
import NotFound from './pages/NotFound';
import GenericPage from './pages/GenericPage';
import KnowledgeBase from './pages/KnowledgeBase';
import ArticleDetail from './pages/ArticleDetail';
import SubmitTicket from './pages/SubmitTicket';
import MyTickets from './pages/MyTickets';
import TicketDetails from './pages/TicketDetails';
import NewArrivals from './pages/NewArrivals';
import BestSellers from './pages/BestSellers';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import LicensePolicy from './pages/LicensePolicy';
import DigitalDelivery from './pages/DigitalDelivery';
import CookiePolicy from './pages/CookiePolicy';
import Security from './pages/Security';
import Accessibility from './pages/Accessibility';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Testimonials from './pages/Testimonials';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBundles from './pages/admin/AdminBundles';
import AdminBundleForm from './pages/admin/AdminBundleForm';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReports from './pages/admin/AdminReports';
import AdminPayments from './pages/admin/AdminPayments';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminOffers from './pages/admin/AdminOffers';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminSystemHealth from './pages/admin/AdminSystemHealth';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminMediaManager from './pages/admin/AdminMediaManager';
import AdminReviews from './pages/admin/AdminReviews';
import AdminDigitalDeliveries from './pages/admin/AdminDigitalDeliveries';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminRoles from './pages/admin/AdminRoles';
import AdminUsers from './pages/admin/AdminUsers';
import AdminShipping from './pages/admin/AdminShipping';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminDynamicView from './pages/admin/AdminDynamicView';
import AdminLogin from './pages/admin/AdminLogin';
import AdminSupportTickets from './pages/admin/AdminSupportTickets';
import AdminTags from './pages/admin/AdminTags';
import AdminAttributes from './pages/admin/AdminAttributes';
import AdminLicenceTypes from './pages/admin/AdminLicenceTypes';
import AdminProductFiles from './pages/admin/AdminProductFiles';
import AdminProductVersions from './pages/admin/AdminProductVersions';

// Download Management Module Pages
import AdminDownloadOverview from './pages/admin/downloads/AdminDownloadOverview';
import AdminEntitlements from './pages/admin/downloads/AdminEntitlements';
import AdminDownloadTokens from './pages/admin/downloads/AdminDownloadTokens';
import AdminDownloadActivity from './pages/admin/downloads/AdminDownloadActivity';
import AdminFailedDownloads from './pages/admin/downloads/AdminFailedDownloads';
import AdminExpiredAccess from './pages/admin/downloads/AdminExpiredAccess';
import AdminRevokedAccess from './pages/admin/downloads/AdminRevokedAccess';
import AdminProductFileHealth from './pages/admin/downloads/AdminProductFileHealth';
import AdminDownloadOverrides from './pages/admin/downloads/AdminDownloadOverrides';

// Reports & Analysis Master Module Pages
import CustomerReportPage from './pages/admin/reports/CustomerReportPage';
import CustomerLoginReportPage from './pages/admin/reports/CustomerLoginReportPage';
import CustomerBuyAnalysisPage from './pages/admin/reports/CustomerBuyAnalysisPage';
import CouponReportPage from './pages/admin/reports/CouponReportPage';
import DownloadReportPage from './pages/admin/reports/DownloadReportPage';
import AdminSalesReport from './pages/admin/reports/AdminSalesReport';
import AdminRevenueReport from './pages/admin/reports/AdminRevenueReport';
import AdminProductAnalysis from './pages/admin/reports/AdminProductAnalysis';
import AdminProductPerformance from './pages/admin/reports/AdminProductPerformance';
import AdminReviewReport from './pages/admin/reports/AdminReviewReport';
import AdminRefundReport from './pages/admin/reports/AdminRefundReport';
import AdminLicenceReport from './pages/admin/reports/AdminLicenceReport';
import AdminExportCenter from './pages/admin/reports/AdminExportCenter';

// Content Management Master Module Pages
import ContentOverviewPage from './pages/admin/content/ContentOverviewPage';
import ContentPagesPage from './pages/admin/content/ContentPagesPage';
import PageEditorPage from './pages/admin/content/PageEditorPage';
import ContentBlogsPage from './pages/admin/content/ContentBlogsPage';
import BlogEditorPage from './pages/admin/content/BlogEditorPage';
import ContentFaqsPage from './pages/admin/content/ContentFaqsPage';
import ContentBannersPage from './pages/admin/content/ContentBannersPage';
import ContentFeedbackPage from './pages/admin/content/ContentFeedbackPage';
import ContentMediaLibraryPage from './pages/admin/content/ContentMediaLibraryPage';
import ContentNavigationPage from './pages/admin/content/ContentNavigationPage';
import ContentRedirectsPage from './pages/admin/content/ContentRedirectsPage';
import ContentSeoPage from './pages/admin/content/ContentSeoPage';
import ContentTemplatesPage from './pages/admin/content/ContentTemplatesPage';
import ContentDraftsPage from './pages/admin/content/ContentDraftsPage';
import ContentScheduledPage from './pages/admin/content/ContentScheduledPage';
import ContentApprovalQueuePage from './pages/admin/content/ContentApprovalQueuePage';
import ContentRevisionsPage from './pages/admin/content/ContentRevisionsPage';
import ContentAnalyticsPage from './pages/admin/content/ContentAnalyticsPage';
import StorefrontPageView from './pages/StorefrontPageView';

// Support & Help Desk Master Module Pages
import SupportOverviewPage from './pages/admin/support/SupportOverviewPage';
import SupportTicketsListPage from './pages/admin/support/SupportTicketsListPage';
import TicketDetailPage from './pages/admin/support/TicketDetailPage';
import CustomerRequestsPage from './pages/admin/support/CustomerRequestsPage';
import CannedResponsesPage from './pages/admin/support/CannedResponsesPage';
import SlaSettingsPage from './pages/admin/support/SlaSettingsPage';
import CustomerSatisfactionPage from './pages/admin/support/CustomerSatisfactionPage';
import SupportReportsPage from './pages/admin/support/SupportReportsPage';
import SupportHubPage from './pages/support/SupportHubPage';
import ContactSupportPage from './pages/support/ContactSupportPage';
import CustomerMyTicketsPage from './pages/support/CustomerMyTicketsPage';
import CustomerTicketDetailPage from './pages/support/CustomerTicketDetailPage';

// Master Settings & Configuration Module Pages
import SettingsDashboardPage from './pages/admin/settings/SettingsDashboardPage';
import GeneralSettingsPage from './pages/admin/settings/GeneralSettingsPage';
import StoreSettingsPage from './pages/admin/settings/StoreSettingsPage';
import CurrencyTaxSettingsPage from './pages/admin/settings/CurrencyTaxSettingsPage';
import CheckoutSettingsPage from './pages/admin/settings/CheckoutSettingsPage';
import DownloadSettingsPage from './pages/admin/settings/DownloadSettingsPage';
import EmailSettingsPage from './pages/admin/settings/EmailSettingsPage';
import SecuritySettingsPage from './pages/admin/settings/SecuritySettingsPage';
import PrivacySettingsPage from './pages/admin/settings/PrivacySettingsPage';
import LegalDocumentsPage from './pages/admin/settings/LegalDocumentsPage';
import SettingsAuditHistoryPage from './pages/admin/settings/SettingsAuditHistoryPage';

// Master System & Infrastructure Module Pages
import SystemDashboardPage from './pages/admin/system/SystemDashboardPage';
import SystemHealthPage from './pages/admin/system/SystemHealthPage';
import SystemErrorsPage from './pages/admin/system/SystemErrorsPage';
import SystemLoginsPage from './pages/admin/system/SystemLoginsPage';
import SystemAuditLogsPage from './pages/admin/system/SystemAuditLogsPage';
import SystemApiLogsPage from './pages/admin/system/SystemApiLogsPage';
import SystemWebhookLogsPage from './pages/admin/system/SystemWebhookLogsPage';
import SystemJobsPage from './pages/admin/system/SystemJobsPage';
import SystemBackupsPage from './pages/admin/system/SystemBackupsPage';
import SystemMaintenancePage from './pages/admin/system/SystemMaintenancePage';
import SystemIncidentsPage from './pages/admin/system/SystemIncidentsPage';
import SystemAlertsPage from './pages/admin/system/SystemAlertsPage';
import SystemReportsPage from './pages/admin/system/SystemReportsPage';

// Master Cache Management Pages
import CacheOverviewPage from './pages/admin/cache/CacheOverviewPage';
import TemporaryDataPage from './pages/admin/cache/TemporaryDataPage';
import CacheKeysPage from './pages/admin/cache/CacheKeysPage';
import CacheNamespacesPage from './pages/admin/cache/CacheNamespacesPage';
import CacheStatisticsPage from './pages/admin/cache/CacheStatisticsPage';
import CacheInvalidationPage from './pages/admin/cache/CacheInvalidationPage';
import CacheWarmingPage from './pages/admin/cache/CacheWarmingPage';
import CacheMaintenancePage from './pages/admin/cache/CacheMaintenancePage';
import CacheFailedJobsPage from './pages/admin/cache/CacheFailedJobsPage';
import CacheAuditPage from './pages/admin/cache/CacheAuditPage';

// Master Users, Staff & Governance Pages
import AdminUsersListPage from './pages/admin/users/AdminUsersListPage';
import StaffListPage from './pages/admin/users/StaffListPage';
import RolesListPage from './pages/admin/users/RolesListPage';
import PermissionsListPage from './pages/admin/users/PermissionsListPage';
import TeamsListPage from './pages/admin/users/TeamsListPage';
import InvitationsPage from './pages/admin/users/InvitationsPage';
import SessionsPage from './pages/admin/users/SessionsPage';
import ActivityLogsPage from './pages/admin/users/ActivityLogsPage';
import AccessReviewsPage from './pages/admin/users/AccessReviewsPage';
import SuspendedUsersPage from './pages/admin/users/SuspendedUsersPage';
import UserSettingsPage from './pages/admin/users/UserSettingsPage';

// Master Automation & Workflow Engine Pages
import AutomationOverviewPage from './pages/admin/automation/AutomationOverviewPage';
import OrderAutomationPage from './pages/admin/automation/OrderAutomationPage';
import EmailAutomationPage from './pages/admin/automation/EmailAutomationPage';
import CustomerAutomationPage from './pages/admin/automation/CustomerAutomationPage';
import DownloadAutomationPage from './pages/admin/automation/DownloadAutomationPage';
import LicenceAutomationPage from './pages/admin/automation/LicenceAutomationPage';
import WorkflowBuilderPage from './pages/admin/automation/WorkflowBuilderPage';
import WorkflowTemplatesPage from './pages/admin/automation/WorkflowTemplatesPage';
import WorkflowRunsPage from './pages/admin/automation/WorkflowRunsPage';
import WorkflowRunDetailPage from './pages/admin/automation/WorkflowRunDetailPage';
import FailedJobsPage from './pages/admin/automation/FailedJobsPage';
import DeadLetterQueuePage from './pages/admin/automation/DeadLetterQueuePage';
import WebhooksPage from './pages/admin/automation/WebhooksPage';
import SchedulesPage from './pages/admin/automation/SchedulesPage';
import AutomationSettingsPage from './pages/admin/automation/AutomationSettingsPage';

import ScrollToTop from './components/ScrollToTop';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import axios from 'axios';

// Global Axios Interceptor to handle expired/invalid tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default function App() {
  const { fetchProducts, fetchCategories, fetchBundles, fetchSupportCategories, fetchSupportArticles, fetchCoupons, fetchTestimonials } = useStore();
  
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBundles();
    fetchSupportCategories();
    fetchSupportArticles();
    fetchCoupons();
    fetchTestimonials();
  }, [fetchProducts, fetchCategories, fetchBundles, fetchSupportCategories, fetchSupportArticles, fetchCoupons, fetchTestimonials]);

  // Global Image Fallback Safety Net (Phase 8 & 23)
  useEffect(() => {
    const handleGlobalImageError = (e: ErrorEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        
        // If it already failed and we set the data-no-fallback attribute, don't loop
        if (img.getAttribute('data-no-fallback') === 'true') {
          return;
        }

        // If it's already showing the generic fallback, don't loop
        if (img.src.includes('image-unavailable')) {
          return;
        }

        // Apply generic fallback
        img.src = '/images/fallback/image-unavailable.png';
        img.setAttribute('data-no-fallback', 'true');
      }
    };

    // Must use capture phase to catch non-bubbling error events from images
    window.addEventListener('error', handleGlobalImageError, true);
    return () => window.removeEventListener('error', handleGlobalImageError, true);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" />
      <Routes>
        {/* Public Marketplace Layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          
          {/* Category & Subcategory Shop Routes */}
          <Route path="/categories/all-products" element={<Shop />} />
          <Route path="/categories/:categorySlug" element={<Shop />} />
          <Route path="/categories/:categorySlug/:subcategorySlug" element={<Shop />} />
          <Route path="/category/:categorySlug" element={<Shop />} />
          <Route path="/category/:categorySlug/:subcategorySlug" element={<Shop />} />
          
          {/* Direct support for /shop and category query params */}
          <Route path="/shop" element={<Shop />} />
          
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/bundles" element={<Bundles />} />
          <Route path="/bundles/:id" element={<BundleDetails />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/best-sellers" element={<BestSellers />} />
          <Route path="/support" element={<SupportHubPage />} />
          <Route path="/support-hub" element={<SupportHubPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Navigate to="/cart" replace />} />
          <Route path="/payment-success/:orderId" element={<PaymentSuccess />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Unified Support Hub & Knowledge Base Routes */}
          <Route path="/docs" element={<Navigate to="/support" replace />} />
          <Route path="/docs/category/:slug" element={<KnowledgeBase />} />
          <Route path="/docs/:slug" element={<ArticleDetail />} />
          
          <Route path="/support/knowledge-base" element={<Navigate to="/support" replace />} />
          <Route path="/support/knowledge-base/category/:slug" element={<KnowledgeBase />} />
          <Route path="/support/knowledge-base/article/:slug" element={<ArticleDetail />} />
          <Route path="/support/ticket" element={<Navigate to="/contact" replace />} />
          <Route path="/support/my-tickets" element={<CustomerMyTicketsPage />} />
          <Route path="/support/my-tickets/:id" element={<CustomerTicketDetailPage />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Company & Legal Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactSupportPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/license-policy" element={<LicensePolicy />} />
          <Route path="/digital-delivery" element={<DigitalDelivery />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/pages/:slug" element={<StorefrontPageView />} />
          
          {/* Automatically Generated Footer Pages */}
          {[
            '/gift-cards', '/affiliate', '/careers', '/press', '/partners', '/roadmap'
          ].map(path => (
            <Route key={path} path={path} element={<GenericPage />} />
          ))}
          
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<Dashboard />} />
            <Route path="/account/*" element={<Dashboard />} />
            <Route path="/account/order/:id" element={<OrderTracking />} />
            <Route path="/dashboard" element={<Navigate to="/account" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/account" replace />} />
          </Route>
          
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Isolated Admin Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/edit/:id" element={<AdminProductForm />} />
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="tags" element={<AdminTags />} />
          <Route path="attributes" element={<AdminAttributes />} />
          <Route path="licence-types" element={<AdminLicenceTypes />} />
          <Route path="licences" element={<AdminLicenceTypes />} />
          <Route path="product-files" element={<AdminProductFiles />} />
          <Route path="product-versions" element={<AdminProductVersions />} />
          <Route path="bundles" element={<AdminBundles />} />
          <Route path="bundles/new" element={<AdminBundleForm />} />
          <Route path="bundles/edit/:id" element={<AdminBundleForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="digital-deliveries" element={<AdminDigitalDeliveries />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<Navigate to="/admin/reports/sales" replace />} />
          
          {/* Download Management Routes */}
          <Route path="downloads" element={<AdminDownloadOverview />} />
          <Route path="downloads/entitlements" element={<AdminEntitlements />} />
          <Route path="downloads/tokens" element={<AdminDownloadTokens />} />
          <Route path="downloads/activity" element={<AdminDownloadActivity />} />
          <Route path="downloads/failed" element={<AdminFailedDownloads />} />
          <Route path="downloads/expired" element={<AdminExpiredAccess />} />
          <Route path="downloads/revoked" element={<AdminRevokedAccess />} />
          <Route path="downloads/product-files" element={<AdminProductFileHealth />} />
          <Route path="downloads/overrides" element={<AdminDownloadOverrides />} />

          {/* Reports & Analysis Master Routes */}
          <Route path="reports/customers" element={<CustomerReportPage />} />
          <Route path="reports/logins" element={<CustomerLoginReportPage />} />
          <Route path="reports/buy-analysis" element={<CustomerBuyAnalysisPage />} />
          <Route path="reports/coupons" element={<CouponReportPage />} />
          <Route path="reports/downloads" element={<DownloadReportPage />} />
          <Route path="reports/sales" element={<AdminSalesReport />} />
          <Route path="reports/revenue" element={<AdminRevenueReport />} />
          <Route path="reports/product-analysis" element={<AdminProductAnalysis />} />
          <Route path="reports/product-performance" element={<AdminProductPerformance />} />
          <Route path="reports/reviews" element={<AdminReviewReport />} />
          <Route path="reports/refunds" element={<AdminRefundReport />} />
          <Route path="reports/licences" element={<AdminLicenceReport />} />
          <Route path="reports/export-center" element={<AdminExportCenter />} />

          {/* Content Management Master Routes */}
          <Route path="content" element={<Navigate to="/admin/content/overview" replace />} />
          <Route path="content/overview" element={<ContentOverviewPage />} />
          <Route path="content/pages" element={<ContentPagesPage />} />
          <Route path="content/pages/new" element={<PageEditorPage />} />
          <Route path="content/pages/:id/edit" element={<PageEditorPage />} />
          <Route path="content/blogs" element={<ContentBlogsPage />} />
          <Route path="content/blogs/new" element={<BlogEditorPage />} />
          <Route path="content/blogs/:id/edit" element={<BlogEditorPage />} />
          <Route path="content/faqs" element={<ContentFaqsPage />} />
          <Route path="content/banners" element={<ContentBannersPage />} />
          <Route path="content/feedback" element={<ContentFeedbackPage />} />
          <Route path="content/media" element={<ContentMediaLibraryPage />} />
          <Route path="content/navigation" element={<ContentNavigationPage />} />
          <Route path="content/redirects" element={<ContentRedirectsPage />} />
          <Route path="content/seo" element={<ContentSeoPage />} />
          <Route path="content/templates" element={<ContentTemplatesPage />} />
          <Route path="content/drafts" element={<ContentDraftsPage />} />
          <Route path="content/scheduled" element={<ContentScheduledPage />} />
          <Route path="content/approval-queue" element={<ContentApprovalQueuePage />} />
          <Route path="content/revisions" element={<ContentRevisionsPage />} />
          <Route path="content/analytics" element={<ContentAnalyticsPage />} />

          <Route path="payments" element={<AdminPayments />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="health" element={<AdminSystemHealth />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="media" element={<AdminMediaManager />} />
          {/* Complete Settings & Configuration Master Routes */}
          <Route path="settings" element={<Navigate to="/admin/settings/dashboard" replace />} />
          <Route path="settings/dashboard" element={<SettingsDashboardPage />} />
          <Route path="settings/general" element={<GeneralSettingsPage />} />
          <Route path="settings/store" element={<StoreSettingsPage />} />
          <Route path="settings/currency-tax" element={<CurrencyTaxSettingsPage />} />
          <Route path="settings/checkout" element={<CheckoutSettingsPage />} />
          <Route path="settings/downloads" element={<DownloadSettingsPage />} />
          <Route path="settings/email" element={<EmailSettingsPage />} />
          <Route path="settings/security" element={<SecuritySettingsPage />} />
          <Route path="settings/privacy" element={<PrivacySettingsPage />} />
          <Route path="settings/legal-documents" element={<LegalDocumentsPage />} />
          <Route path="settings/audit" element={<SettingsAuditHistoryPage />} />

          {/* Complete System & Infrastructure Master Routes */}
          <Route path="system" element={<Navigate to="/admin/system/dashboard" replace />} />
          <Route path="system/dashboard" element={<SystemDashboardPage />} />
          <Route path="system/health" element={<SystemHealthPage />} />
          <Route path="system/errors" element={<SystemErrorsPage />} />
          <Route path="system/errors/:subqueue" element={<SystemErrorsPage />} />
          <Route path="system/logins" element={<SystemLoginsPage />} />
          <Route path="system/audit-logs" element={<SystemAuditLogsPage />} />
          <Route path="system/api-logs" element={<SystemApiLogsPage />} />
          <Route path="system/webhook-logs" element={<SystemWebhookLogsPage />} />
          <Route path="system/jobs" element={<SystemJobsPage />} />
          <Route path="system/backups" element={<SystemBackupsPage />} />
          <Route path="system/maintenance" element={<SystemMaintenancePage />} />
          <Route path="system/incidents" element={<SystemIncidentsPage />} />
          <Route path="system/alerts" element={<SystemAlertsPage />} />
          <Route path="system/reports" element={<SystemReportsPage />} />

          {/* Complete Cache Management Master Routes */}
          <Route path="cache" element={<Navigate to="/admin/cache/overview" replace />} />
          <Route path="cache/overview" element={<CacheOverviewPage />} />
          <Route path="cache/temporary-data" element={<TemporaryDataPage />} />
          <Route path="cache/keys" element={<CacheKeysPage />} />
          <Route path="cache/namespaces" element={<CacheNamespacesPage />} />
          <Route path="cache/statistics" element={<CacheStatisticsPage />} />
          <Route path="cache/invalidation" element={<CacheInvalidationPage />} />
          <Route path="cache/warming" element={<CacheWarmingPage />} />
          <Route path="cache/maintenance" element={<CacheMaintenancePage />} />
          <Route path="cache/failed-jobs" element={<CacheFailedJobsPage />} />
          <Route path="cache/audit" element={<CacheAuditPage />} />

          {/* Complete Users, Staff & Governance Master Routes */}
          <Route path="users" element={<Navigate to="/admin/users/admin-users" replace />} />
          <Route path="users/admin-users" element={<AdminUsersListPage />} />
          <Route path="users/staff" element={<StaffListPage />} />
          <Route path="users/roles" element={<RolesListPage />} />
          <Route path="roles" element={<Navigate to="/admin/users/roles" replace />} />
          <Route path="users/permissions" element={<PermissionsListPage />} />
          <Route path="users/teams" element={<TeamsListPage />} />
          <Route path="users/invitations" element={<InvitationsPage />} />
          <Route path="users/sessions" element={<SessionsPage />} />
          <Route path="users/activity-logs" element={<ActivityLogsPage />} />
          <Route path="users/access-reviews" element={<AccessReviewsPage />} />
          <Route path="users/suspended" element={<SuspendedUsersPage />} />
          <Route path="users/settings" element={<UserSettingsPage />} />

          {/* Complete Automation & Workflow Engine Master Routes */}
          <Route path="automation" element={<Navigate to="/admin/automation/overview" replace />} />
          <Route path="automation/overview" element={<AutomationOverviewPage />} />
          <Route path="automation/orders" element={<OrderAutomationPage />} />
          <Route path="automation/emails" element={<EmailAutomationPage />} />
          <Route path="automation/customers" element={<CustomerAutomationPage />} />
          <Route path="automation/downloads" element={<DownloadAutomationPage />} />
          <Route path="automation/licences" element={<LicenceAutomationPage />} />
          <Route path="automation/builder" element={<WorkflowBuilderPage />} />
          <Route path="automation/templates" element={<WorkflowTemplatesPage />} />
          <Route path="automation/runs" element={<WorkflowRunsPage />} />
          <Route path="automation/runs/:id" element={<WorkflowRunDetailPage />} />
          <Route path="automation/failed-jobs" element={<FailedJobsPage />} />
          <Route path="automation/dead-letter" element={<DeadLetterQueuePage />} />
          <Route path="automation/webhooks" element={<WebhooksPage />} />
          <Route path="automation/schedules" element={<SchedulesPage />} />
          <Route path="automation/settings" element={<AutomationSettingsPage />} />

          <Route path="shipping" element={<AdminShipping />} />
          <Route path="notifications" element={<AdminNotifications />} />
          
          {/* Complete Support & Help Desk Master Routes */}
          <Route path="support" element={<Navigate to="/admin/support/overview" replace />} />
          <Route path="support/overview" element={<SupportOverviewPage />} />
          <Route path="support/tickets" element={<SupportTicketsListPage />} />
          <Route path="support/tickets/:id" element={<TicketDetailPage />} />
          <Route path="support/new-tickets" element={<SupportTicketsListPage presetFilter={{ status: 'NEW', title: 'New Incidents Queue', subtitle: 'Triage and assign newly submitted tickets.' }} />} />
          <Route path="support/my-tickets" element={<SupportTicketsListPage presetFilter={{ title: 'My Assigned Tickets', subtitle: 'Tickets assigned directly to you.' }} />} />
          <Route path="support/my-assigned-tickets" element={<SupportTicketsListPage presetFilter={{ title: 'My Assigned Tickets', subtitle: 'Tickets assigned directly to you.' }} />} />
          <Route path="support/unassigned" element={<SupportTicketsListPage presetFilter={{ unassignedOnly: true, title: 'Unassigned Incidents Queue', subtitle: 'Tickets awaiting staff assignment.' }} />} />
          <Route path="support/high-priority" element={<SupportTicketsListPage presetFilter={{ priority: 'HIGH', title: 'High-Priority Incidents', subtitle: 'Urgent issues requiring accelerated response.' }} />} />
          <Route path="support/overdue" element={<SupportTicketsListPage presetFilter={{ overdueOnly: true, title: 'SLA Overdue Incidents', subtitle: 'Tickets with breached first-response or resolution targets.' }} />} />
          <Route path="support/download-issues" element={<SupportTicketsListPage presetFilter={{ type: 'DOWNLOAD_ISSUE', title: 'Download & Fulfillment Issues', subtitle: 'Google Drive permission errors and token expiry issues.' }} />} />
          <Route path="support/licence-issues" element={<SupportTicketsListPage presetFilter={{ type: 'LICENCE_ISSUE', title: 'Licence & Activation Issues', subtitle: 'Machine migrations and activation limits.' }} />} />
          <Route path="support/refund-requests" element={<SupportTicketsListPage presetFilter={{ type: 'REFUND_REQUEST', title: 'Refund Requests Queue', subtitle: 'Reversal requests under policy evaluation.' }} />} />
          <Route path="support/payment-queries" element={<SupportTicketsListPage presetFilter={{ type: 'PAYMENT_QUERY', title: 'Payment & Invoicing Queries', subtitle: 'Payment gateway failures and duplicate charges.' }} />} />
          <Route path="support/product-questions" element={<SupportTicketsListPage presetFilter={{ type: 'PRODUCT_QUESTION', title: 'Pre-sale & Technical Questions', subtitle: 'Compatibility and version questions.' }} />} />
          <Route path="support/contact-queries" element={<SupportTicketsListPage presetFilter={{ type: 'CONTACT_QUERY', title: 'Contact Queries Queue', subtitle: 'General and partnership questions.' }} />} />
          <Route path="support/customer-requests" element={<CustomerRequestsPage />} />
          <Route path="support/escalated" element={<SupportTicketsListPage presetFilter={{ status: 'ESCALATED', title: 'Escalated Incidents', subtitle: 'Tickets escalated to management or engineering.' }} />} />
          <Route path="support/resolved" element={<SupportTicketsListPage presetFilter={{ status: 'RESOLVED', title: 'Resolved Incidents', subtitle: 'Successfully resolved customer tickets.' }} />} />
          <Route path="support/closed" element={<SupportTicketsListPage presetFilter={{ status: 'CLOSED', title: 'Closed Tickets Archive', subtitle: 'Archived customer support tickets.' }} />} />
          <Route path="support/canned-responses" element={<CannedResponsesPage />} />
          <Route path="support/sla-settings" element={<SlaSettingsPage />} />
          <Route path="support/satisfaction" element={<CustomerSatisfactionPage />} />
          <Route path="support/reports" element={<SupportReportsPage />} />

          <Route path="support-page" element={<AdminSupportPage />} />
          <Route path="roles" element={<AdminRoles />} />
          
          {/* Dynamic Catch-All for all other sidebar routes (Inventory, Shipping, Users, etc.) */}
          <Route path=":section" element={<AdminDynamicView />} />
        </Route>
        
        {/* Global Catch-All for 404s */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
