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
          <Route path="/support" element={<Support />} />
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
          <Route path="/support/my-tickets" element={<Navigate to="/contact" replace />} />
          <Route path="/support/my-tickets/:id" element={<TicketDetails />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Company & Legal Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
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
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="health" element={<AdminSystemHealth />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="media" element={<AdminMediaManager />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<Navigate to="/admin" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="shipping" element={<AdminShipping />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="support" element={<Navigate to="/admin/support-page" replace />} />
          <Route path="tickets" element={<Navigate to="/admin/support-page" replace />} />
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
