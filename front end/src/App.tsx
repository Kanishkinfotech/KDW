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
import Freebies from './pages/Freebies';
import CheckoutPage from './pages/CheckoutPage';
import BestSellers from './pages/BestSellers';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import LicensePolicy from './pages/LicensePolicy';
import LicenseVerificationPage from './pages/LicenseVerificationPage';
import DigitalDelivery from './pages/DigitalDelivery';
import CookiePolicy from './pages/CookiePolicy';
import Security from './pages/Security';
import Accessibility from './pages/Accessibility';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Testimonials from './pages/Testimonials';
import AffiliatePage from './pages/AffiliatePage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
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
import AdminErrorLogs from './pages/admin/AdminErrorLogs';
import AdminKnowledgeBase from './pages/admin/AdminKnowledgeBase';
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
import AdminTickets from './pages/admin/AdminTickets';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';
import AdminAttributes from './pages/admin/AdminAttributes';
import AdminLicenceTypes from './pages/admin/AdminLicenceTypes';
import AdminProductFiles from './pages/admin/AdminProductFiles';
import AdminProductVersions from './pages/admin/AdminProductVersions';

// Download Management Module Pages
import AdminDownloadOverview from './pages/admin/downloads/AdminDownloadOverview';
import AdminFileStorage from './pages/admin/downloads/AdminFileStorage';
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
import AppearanceSettingsPage from './pages/admin/settings/AppearanceSettingsPage';
import StoreSettingsPage from './pages/admin/settings/StoreSettingsPage';
import CurrencyTaxSettingsPage from './pages/admin/settings/CurrencyTaxSettingsPage';
import CheckoutSettingsPage from './pages/admin/settings/CheckoutSettingsPage';
import DownloadSettingsPage from './pages/admin/settings/DownloadSettingsPage';
import SecuritySettingsPage from './pages/admin/settings/SecuritySettingsPage';
import PrivacySettingsPage from './pages/admin/settings/PrivacySettingsPage';
import LegalDocumentsPage from './pages/admin/settings/LegalDocumentsPage';
import SettingsAuditHistoryPage from './pages/admin/settings/SettingsAuditHistoryPage';

// Master Dedicated Integrations Module Pages
import PaymentGatewayIntegrationPage from './pages/admin/integrations/PaymentGatewayIntegrationPage';
import EmailIntegrationPage from './pages/admin/integrations/EmailIntegrationPage';
import WhatsAppIntegrationPage from './pages/admin/integrations/WhatsAppIntegrationPage';

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

// Standalone Webhooks Page (Automation removed)
import WebhooksPage from './pages/admin/automation/WebhooksPage';

import ScrollToTop from './components/ScrollToTop';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { setGlobalCurrencyConfig } from './utils/currency';
import axios from 'axios';


export default function App() {
  const { fetchProducts, fetchCategories, fetchBundles, fetchSupportCategories, fetchSupportArticles, fetchCoupons, fetchTestimonials } = useStore();
  
  useEffect(() => {
    // Synchronize store-wide currency configuration from live settings
    axios.get('/api/settings/public')
      .then(res => {
        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          setGlobalCurrencyConfig({
            currency: d.currency || 'INR',
            symbol: d.currency_symbol || '₹',
            symbolPosition: d.symbol_position || 'BEFORE',
            decimalPlaces: d.decimal_places !== undefined ? Number(d.decimal_places) : 0
          });
        }
      })
      .catch(() => {});

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
          <Route path="/freebies/:id" element={<ProductDetails />} />
          <Route path="/templates/:id" element={<ProductDetails />} />
          <Route path="/courses/:id" element={<ProductDetails />} />
          <Route path="/downloads/:id" element={<ProductDetails />} />
          <Route path="/item/:id" element={<ProductDetails />} />
          <Route path="/items/:id" element={<ProductDetails />} />
          <Route path="/resources/:id" element={<ProductDetails />} />
          <Route path="/ebooks/:id" element={<ProductDetails />} />
          <Route path="/tools/:id" element={<ProductDetails />} />
          <Route path="/presets/:id" element={<ProductDetails />} />
          <Route path="/products/new" element={<NewArrivals />} />
          <Route path="/freebies" element={<Freebies />} />
          <Route path="/bundles" element={<Bundles />} />
          <Route path="/bundles/:id" element={<BundleDetails />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-success/:orderId" element={<PaymentSuccess />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/order-success/:orderId" element={<PaymentSuccess />} />
          <Route path="/order-success" element={<PaymentSuccess />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/sign-in" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/sign-up" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route path="/support" element={<SupportHubPage />} />
          <Route path="/support-hub" element={<SupportHubPage />} />
          <Route path="/support/contact" element={<ContactSupportPage />} />
          <Route path="/support/new-ticket" element={<ContactSupportPage />} />
          <Route path="/support/tickets" element={<CustomerMyTicketsPage />} />
          <Route path="/support/my-tickets" element={<CustomerMyTicketsPage />} />
          <Route path="/support/tickets/:id" element={<CustomerTicketDetailPage />} />
          <Route path="/support/my-tickets/:id" element={<CustomerTicketDetailPage />} />
          <Route path="/support/articles" element={<KnowledgeBase />} />
          <Route path="/support/articles/:slug" element={<ArticleDetail />} />
          <Route path="/support/category/:slug" element={<KnowledgeBase />} />
          <Route path="/support/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/support/knowledge-base/category/:slug" element={<KnowledgeBase />} />
          <Route path="/support/knowledge-base/article/:slug" element={<ArticleDetail />} />
          <Route path="/docs" element={<KnowledgeBase />} />
          <Route path="/docs/category/:slug" element={<KnowledgeBase />} />
          <Route path="/docs/:slug" element={<ArticleDetail />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Company & Legal Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/license" element={<LicensePolicy />} />
          <Route path="/license-policy" element={<LicensePolicy />} />
          <Route path="/verify-license" element={<LicenseVerificationPage />} />
          <Route path="/verify-licence" element={<LicenseVerificationPage />} />
          <Route path="/licenses/verify" element={<LicenseVerificationPage />} />
          <Route path="/licences/verify" element={<LicenseVerificationPage />} />
          <Route path="/digital-delivery" element={<DigitalDelivery />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/category/:categorySlug" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/pages/:slug" element={<StorefrontPageView />} />
          <Route path="/affiliate" element={<Navigate to="/" replace />} />
          
          {/* Automatically Generated Footer Pages */}
          {[
            '/gift-cards', '/careers', '/press', '/partners', '/roadmap'
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

        {/* Protected Admin Hierarchy */}
        <Route element={<AdminRoute />}>
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
          <Route path="orders/all" element={<AdminOrders defaultView="all" />} />
          <Route path="orders/new" element={<AdminOrders defaultView="new" />} />
          <Route path="orders/pending" element={<AdminOrders defaultView="pending" />} />
          <Route path="orders/completed" element={<AdminOrders defaultView="completed" />} />
          <Route path="orders/failed" element={<AdminOrders defaultView="failed" />} />
          <Route path="orders/cancelled" element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders/awaiting_fulfilment" element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders/awaiting-fulfilment" element={<Navigate to="/admin/orders" replace />} />
          <Route path="orders/refunded" element={<AdminOrders defaultView="refunded" />} />
          <Route path="orders/without_access" element={<AdminOrders defaultView="without_access" />} />
          <Route path="orders/without-access" element={<AdminOrders defaultView="without_access" />} />
          <Route path="digital-deliveries" element={<AdminDigitalDeliveries />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/new" element={<AdminCategories />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<Navigate to="/admin/reports/sales" replace />} />
          
          {/* Download Management Routes */}
          <Route path="downloads" element={<AdminDownloadOverview />} />
          <Route path="downloads/files" element={<AdminFileStorage />} />
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

          {/* Content & Knowledge Base Routes */}
          <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
          <Route path="content/knowledge-base" element={<AdminKnowledgeBase />} />
          <Route path="content" element={<AdminKnowledgeBase />} />
          <Route path="content/overview" element={<AdminKnowledgeBase />} />
          <Route path="content/pages" element={<ContentPagesPage />} />
          <Route path="content/pages/new" element={<PageEditorPage />} />
          <Route path="content/pages/:id/edit" element={<PageEditorPage />} />
          <Route path="content/blogs" element={<ContentBlogsPage />} />
          <Route path="content/blogs/new" element={<BlogEditorPage />} />
          <Route path="content/blogs/:id/edit" element={<BlogEditorPage />} />
          <Route path="articles" element={<ContentBlogsPage />} />
          <Route path="articles/new" element={<BlogEditorPage />} />
          <Route path="articles/:id/edit" element={<BlogEditorPage />} />
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

          <Route path="reviews" element={<AdminReviews />} />
          <Route path="reviews/ratings" element={<AdminReviews />} />
          <Route path="reviews/pending" element={<AdminReviews />} />
          <Route path="reviews/reported" element={<AdminReviews />} />

          <Route path="payments" element={<AdminPayments />} />
          <Route path="payments/transactions" element={<AdminPayments />} />
          <Route path="payments/successful" element={<AdminPayments />} />
          <Route path="payments/failed" element={<AdminPayments />} />
          <Route path="payments/refunds" element={<AdminRefundReport />} />
          <Route path="payments/gateway" element={<AdminPayments />} />
          <Route path="payments/settings" element={<AdminPayments />} />

          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="campaigns/email" element={<AdminCampaigns />} />
          <Route path="campaigns/whatsapp" element={<AdminCampaigns />} />
          
          <Route path="health" element={<AdminSystemHealth />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="media" element={<AdminMediaManager />} />
          {/* Dedicated Master Integrations Module Routes */}
          <Route path="integrations" element={<Navigate to="/admin/integrations/payment-gateway" replace />} />
          <Route path="integrations/payment-gateway" element={<PaymentGatewayIntegrationPage />} />
          <Route path="integrations/email-smtp" element={<EmailIntegrationPage />} />
          <Route path="integrations/whatsapp-api" element={<WhatsAppIntegrationPage />} />

          {/* Legacy integration redirect routes to prevent dead links */}
          <Route path="settings/integrations" element={<Navigate to="/admin/integrations/payment-gateway" replace />} />
          <Route path="settings/email" element={<Navigate to="/admin/integrations/email-smtp" replace />} />
          <Route path="settings/whatsapp" element={<Navigate to="/admin/integrations/whatsapp-api" replace />} />

          {/* Complete Settings & Configuration Master Routes */}
          <Route path="settings" element={<Navigate to="/admin/settings/general" replace />} />
          <Route path="settings/dashboard" element={<Navigate to="/admin/settings/general" replace />} />
          <Route path="settings/general" element={<GeneralSettingsPage />} />
          <Route path="settings/appearance" element={<Navigate to="/admin/settings/store" replace />} />
          <Route path="settings/store" element={<StoreSettingsPage />} />
          <Route path="settings/currency-tax" element={<CurrencyTaxSettingsPage />} />
          <Route path="settings/checkout" element={<CheckoutSettingsPage />} />
          <Route path="settings/downloads" element={<Navigate to="/admin/settings/store" replace />} />
          <Route path="settings/security" element={<SecuritySettingsPage />} />
          <Route path="settings/privacy" element={<PrivacySettingsPage />} />
          <Route path="settings/legal-documents" element={<LegalDocumentsPage />} />

          {/* Complete System & Infrastructure Master Routes */}
          <Route path="system" element={<Navigate to="/admin/system/health" replace />} />
          <Route path="system/dashboard" element={<Navigate to="/admin/system/health" replace />} />
          <Route path="system/health" element={<SystemHealthPage />} />
          <Route path="system/errors" element={<AdminErrorLogs />} />
          <Route path="system/errors/:subqueue" element={<AdminErrorLogs />} />
          <Route path="system/error-logs" element={<AdminErrorLogs />} />
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
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/admin-users" element={<AdminUsers />} />
          <Route path="users/staff" element={<AdminUsers />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="users/roles" element={<AdminRoles />} />
          <Route path="users/permissions" element={<AdminRoles />} />
          <Route path="users/teams" element={<TeamsListPage />} />
          <Route path="users/invitations" element={<InvitationsPage />} />
          <Route path="users/sessions" element={<SessionsPage />} />
          <Route path="users/activity-logs" element={<ActivityLogsPage />} />
          <Route path="users/access-reviews" element={<AccessReviewsPage />} />
          <Route path="users/suspended" element={<SuspendedUsersPage />} />
          <Route path="users/settings" element={<UserSettingsPage />} />

          {/* Standalone Webhooks Route (Automation removed) */}
          <Route path="webhooks" element={<WebhooksPage />} />
          <Route path="automation" element={<Navigate to="/admin/webhooks" replace />} />
          <Route path="automation/*" element={<Navigate to="/admin/webhooks" replace />} />

          <Route path="shipping" element={<AdminShipping />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="notifications/mail" element={<AdminNotifications />} />
          <Route path="notifications/customer" element={<AdminNotifications />} />
          <Route path="notifications/admin" element={<AdminNotifications />} />
          <Route path="notifications/templates" element={<AdminNotifications />} />
          
          {/* Complete Support & Help Desk Master Routes */}
          <Route path="support" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/overview" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/tickets" element={<SupportTicketsListPage />} />
          <Route path="support/tickets/:id" element={<TicketDetailPage />} />
          <Route path="support/customer-requests" element={<CustomerRequestsPage />} />
          <Route path="support/refund-requests" element={<SupportTicketsListPage presetFilter={{ type: 'REFUND_REQUEST', title: 'Refund Requests', subtitle: 'Customer purchase refund and return requests under policy evaluation.' }} />} />
          <Route path="support/contact-queries" element={<SupportTicketsListPage presetFilter={{ type: 'CONTACT_QUERY', title: 'Contact & Queries', subtitle: 'General customer inquiries, partnerships, and technical questions.' }} />} />
          
          {/* Legacy Support Redirects */}
          <Route path="support/new-tickets" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/my-tickets" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/unassigned" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/overdue" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/canned-responses" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/sla-settings" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/satisfaction" element={<Navigate to="/admin/support/tickets" replace />} />
          <Route path="support/reports" element={<Navigate to="/admin/support/tickets" replace />} />

          <Route path="support-page" element={<AdminSupportPage />} />
          <Route path="roles" element={<AdminRoles />} />
          
          {/* Admin Support Tickets Module Routes */}
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="tickets/:id" element={<AdminTicketDetail />} />
          
          {/* Admin System & Error Logs Direct Routes */}
          <Route path="error-logs" element={<AdminErrorLogs />} />
          <Route path="errors" element={<AdminErrorLogs />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="health" element={<AdminSystemHealth />} />
          <Route path="system-health" element={<AdminSystemHealth />} />
          
          {/* Dynamic Catch-All for all other sidebar routes (Inventory, Shipping, Users, etc.) */}
          <Route path=":section" element={<AdminDynamicView />} />
        </Route>
      </Route>
        
      {/* Global Catch-All for 404s */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
