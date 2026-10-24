import { useState, useEffect } from 'react';
import {
  Package,
  Download,
  FileText,
  Key,
  Settings,
  LogOut,
  Edit2,
  ShieldAlert,
  LayoutDashboard,
  Search,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  CheckCircle,
  LifeBuoy,
  Users,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Tag,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Star
} from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { paymentApi, type RefundItem } from '../services/paymentApi';
import ReviewSubmissionModal from '../components/product/ReviewSubmissionModal';
import { couponsApi } from '../api/coupons.api';

export default function Dashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getActiveTab = () => {
    const path = location.pathname.replace(/\/$/, '');
    if (path === '/account/overview') return 'overview';
    if (path === '/account/coupons' || path === '/account/my-coupons') return 'coupons';
    if (path === '/account/library' || path === '/account/products') return 'library';
    if (path === '/account/orders' || path === '/account/invoices') return 'orders';
    if (path === '/account/downloads') return 'downloads';
    if (path === '/account/licenses' || path === '/account/licence') return 'licenses';
    if (path === '/account/refunds' || path === '/account/refund') return 'refunds';
    if (path === '/account/profile' || path === '/account/settings') return 'profile';
    if (path === '/account' || path === '/dashboard') {
      const rawTab = searchParams.get('tab');
      if (rawTab) {
        if (rawTab === 'coupons' || rawTab === 'my-coupons') return 'coupons';
        if (rawTab === 'purchases' || rawTab === 'library') return 'library';
        if (rawTab === 'invoices' || rawTab === 'orders') return 'orders';
        if (rawTab === 'refunds' || rawTab === 'refund') return 'refunds';
        if (rawTab === 'settings' || rawTab === 'profile') return 'profile';
        return rawTab;
      }
      return 'overview';
    }
    return 'overview';
  };

  const activeTab = getActiveTab();

  const { logout, user, authState, login } = useAuth();
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [errorPurchases, setErrorPurchases] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);

  // Customer Refunds state
  const [customerRefunds, setCustomerRefunds] = useState<RefundItem[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState('Accidental purchase');
  const [refundNote, setRefundNote] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedResourceModal, setSelectedResourceModal] = useState<any | null>(null);
  const [reviewProduct, setReviewProduct] = useState<any | null>(null);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Customer Coupons state
  const [customerCoupons, setCustomerCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  const fetchCustomerCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await couponsApi.getMyCoupons({
        customerId: user?.id,
        email: user?.email
      });
      if (res && res.success) {
        setCustomerCoupons(res.coupons || res.data || []);
      }
    } catch (err) {
      console.error('Failed to load customer coupons via couponsApi, trying direct axios:', err);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const fallbackRes = await axios.get('/api/coupons/my-coupons', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: {
            customerId: user?.id,
            email: user?.email
          }
        });
        if (fallbackRes.data?.success) {
          setCustomerCoupons(fallbackRes.data.coupons || fallbackRes.data.data || []);
        }
      } catch (fallbackErr) {
        console.error('Failed to load customer coupons via fallback:', fallbackErr);
      }
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCouponId(null), 3000);
  };

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileMobile(user.mobile || '');
    }
  }, [user]);

  const fetchCustomerRefunds = async () => {
    setLoadingRefunds(true);
    try {
      const data = await paymentApi.getCustomerRefunds();
      if (data?.success) {
        setCustomerRefunds(data.refunds || []);
      }
    } catch (err) {
      console.error('Failed to load customer refunds', err);
    } finally {
      setLoadingRefunds(false);
    }
  };

  const handleOpenRefundModal = (item: any) => {
    setSelectedOrderForRefund(item);
    setRefundReason('Defective / Broken download file');
    setRefundNote('');
    setRefundModalOpen(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRefund) return;

    if (!selectedOrderForRefund.orderId && !selectedOrderForRefund.id) {
      toast.error('Order reference is missing for this item.');
      return;
    }

    if (!refundNote || !refundNote.trim()) {
      toast.error('Please provide an explanation / note for the administrator. It is mandatory.');
      return;
    }

    setSubmittingRefund(true);
    try {
      const targetOrderId = selectedOrderForRefund.orderId || selectedOrderForRefund.id;
      const res = await paymentApi.submitRefundRequest({
        orderId: targetOrderId,
        reason: refundReason,
        note: refundNote,
        productName: selectedOrderForRefund.name || selectedOrderForRefund.productName
      });

      if (res?.success) {
        toast.success(res.message || 'Refund request submitted for administrator review.');
        setRefundModalOpen(false);
        setSelectedOrderForRefund(null);
        fetchCustomerRefunds();
        fetchPurchases();
      } else {
        toast.error(res?.message || 'Failed to submit refund request.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting refund request.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  useEffect(() => {
    if (authState === 'unauthenticated') {
      navigate('/login', { replace: true });
    }
  }, [authState, navigate]);

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    setErrorPurchases(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/purchases', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data?.success) {
        setPurchases(response.data.purchases || []);
      } else {
        throw new Error(response.data?.message || 'Error fetching purchases');
      }
    } catch (err: any) {
      setErrorPurchases(err.response?.data?.message || 'Unable to load your library and purchases.');
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'library' || activeTab === 'overview' || activeTab === 'downloads' || activeTab === 'licenses' || activeTab === 'refunds') && authState === 'authenticated') {
      fetchPurchases();
    }
  }, [activeTab, authState]);

  useEffect(() => {
    if ((activeTab === 'refunds' || activeTab === 'overview') && authState === 'authenticated') {
      fetchCustomerRefunds();
    }
  }, [activeTab, authState]);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    setErrorInvoices(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/purchases/invoices', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data?.success) {
        setInvoices(response.data.invoices || []);
      } else {
        throw new Error(response.data?.message || 'Error fetching invoices');
      }
    } catch (err: any) {
      setErrorInvoices(err.response?.data?.message || 'Unable to load your invoices.');
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'orders' || activeTab === 'overview') && authState === 'authenticated') {
      fetchInvoices();
    }
  }, [activeTab, authState]);

  // Sync and fetch active coupons automatically on load or tab switch
  useEffect(() => {
    if (activeTab === 'coupons' || activeTab === 'overview') {
      fetchCustomerCoupons();
    }
  }, [activeTab, user?.id, user?.email]);

  // Initial mount auto-sync for Overview available coupons count
  useEffect(() => {
    fetchCustomerCoupons();
  }, [user?.id, user?.email]);

  const handleDownload = async (productId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/purchases/${productId}/download-token`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data?.success && response.data.data?.downloadUrl) {
        window.open(response.data.data.downloadUrl, '_blank');
      } else {
        toast.error(response.data?.message || 'Failed to generate download link');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred while generating download link');
    }
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber?: string) => {
    try {
      toast.loading('Preparing invoice PDF...', { id: 'inv-dl' });
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/purchases/invoices/${orderId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KDW-Invoice-${orderNumber || orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully!', { id: 'inv-dl' });
    } catch (err: any) {
      toast.error('Failed to download invoice PDF', { id: 'inv-dl' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/auth/profile', {
        name: profileName,
        mobile: profileMobile
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data?.success) {
        toast.success('Profile updated successfully');
        if (login && user) {
          login({ ...user, ...(response.data.user || { name: profileName, mobile: profileMobile }) });
        }
      } else {
        toast.error(response.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An error occurred while updating profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'overview') {
      navigate('/account');
    } else {
      navigate(`/account/${tabId}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'coupons', name: 'My Coupons', icon: Tag },
    { id: 'library', name: 'My Library', icon: Package },
    { id: 'orders', name: 'Orders & Invoices', icon: FileText },
    { id: 'downloads', name: 'Downloads', icon: Download },
    { id: 'licenses', name: 'Licenses', icon: Key },
    { id: 'refunds', name: 'Refunds', icon: RotateCcw },
    { id: 'profile', name: 'Profile Settings', icon: Settings },
  ];

  const filteredLibrary = purchases.filter(p => {
    if (!librarySearch.trim()) return true;
    const q = librarySearch.toLowerCase();
    return (p.name && p.name.toLowerCase().includes(q)) ||
           (p.orderNumber && p.orderNumber.toLowerCase().includes(q)) ||
           (p.type && p.type.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50 font-sans">
      <SEO title="Customer Account Dashboard | KDW" description="Manage your digital products, library, orders, downloads, and refunds." />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="md:sticky top-24 bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
            
            {/* User Profile Header */}
            <div className="hidden md:flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md shadow-primary/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex overflow-x-auto md:flex-col gap-1.5 md:mb-8 pb-2 md:pb-0 hide-scrollbar -mx-2 px-2 md:mx-0 md:px-0">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${activeTab === tab.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} aria-hidden="true" />
                  <span className="whitespace-nowrap">{tab.name}</span>
                </button>
              ))}
            </nav>
            
            <button onClick={handleLogout} className="hidden md:flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-danger hover:bg-danger/10 transition-colors">
              <LogOut size={18} aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 text-slate-900 p-8 rounded-3xl relative overflow-hidden shadow-xs">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {user?.name || 'Customer'}!</h1>
                <p className="text-slate-600 text-sm max-w-xl">
                  Access your purchased digital products, manage your orders, download assets, and track refunds all in one place.
                </p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div 
                  onClick={() => handleTabChange('coupons')}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-500 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Tag size={24} />
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{customerCoupons.length}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Coupons</div>
                </div>

                <div 
                  onClick={() => handleTabChange('library')}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                      <Package size={24} />
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{purchases.length}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Owned Digital Products</div>
                </div>

                <div 
                  onClick={() => handleTabChange('orders')}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-accent transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-accent/10 text-accent rounded-2xl group-hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-accent transition-colors" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{invoices.length}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orders & Invoices</div>
                </div>

                <div 
                  onClick={() => handleTabChange('refunds')}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-500 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <RotateCcw size={24} />
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{customerRefunds.length}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Refund Requests</div>
                </div>
              </div>

              {/* Recent Library Items */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Recent Digital Products</h3>
                  <button onClick={() => handleTabChange('library')} className="text-sm font-bold text-primary hover:underline">
                    View All Library ({purchases.length})
                  </button>
                </div>

                {loadingPurchases ? (
                  <div className="py-8 text-center text-slate-400">Loading digital assets...</div>
                ) : purchases.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 mb-4">You haven't claimed or purchased any digital products yet.</p>
                    <Link to="/categories/all-products" className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl inline-block">
                      Browse Shop
                    </Link>
                  </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {purchases.slice(0, 4).map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => handleTabChange('library')}
                          className="p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all flex items-center gap-4 bg-slate-50/50 cursor-pointer group"
                        >
                          <img src={p.image || 'https://placehold.co/100x100?text=KDW'} alt={p.name} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate text-sm mb-1">{p.name}</h4>
                            <div className="text-xs text-slate-500">Purchased {new Date(p.purchasedAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MY COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Tag className="w-8 h-8 text-indigo-600" />
                    My Coupons & Exclusive Vouchers
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    All available promotional coupons created for you. Copy and apply them instantly at checkout.
                  </p>
                </div>
                <button
                  onClick={fetchCustomerCoupons}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs self-start md:self-auto cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Refresh Coupons
                </button>
              </div>

              {loadingCoupons ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-500 text-sm font-medium">Checking available vouchers & welcome offers...</p>
                </div>
              ) : customerCoupons.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Tag size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Coupons Available</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
                    There are currently no active promotional vouchers. New coupons created in the admin panel will automatically appear right here!
                  </p>
                  <Link to="/categories/all-products" className="px-6 py-3 bg-primary text-white font-bold rounded-xl inline-block hover:bg-primary-dark transition-colors text-sm">
                    Browse All Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {customerCoupons.map(coupon => {
                    const isCopied = copiedCouponId === coupon.id;
                    const isEligible = coupon.isEligible !== false;
                    const isFirstOrder = coupon.isFirstOrder || coupon.discountType === 'FIRST_ORDER';

                    return (
                      <div
                        key={coupon.id}
                        className={`relative rounded-3xl border transition-all p-6 bg-white overflow-hidden shadow-sm flex flex-col justify-between ${
                          !isEligible
                            ? 'border-slate-200 opacity-75 bg-slate-50/70'
                            : isFirstOrder
                            ? 'border-amber-300 ring-2 ring-amber-400/20 hover:shadow-md'
                            : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        {/* Decorative Gradient Background Notch */}
                        <div
                          className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12 ${
                            isFirstOrder ? 'bg-amber-200/40' : 'bg-indigo-100/60'
                          }`}
                        />

                        <div>
                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {/* Duration Badge */}
                            {coupon.isPermanent ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle className="w-3 h-3" /> Permanent / No Expiration
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  coupon.durationBadge?.includes('Week')
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : coupon.durationBadge?.includes('Month')
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {coupon.durationLabel || coupon.durationBadge}
                              </span>
                            )}

                            {/* First Order Tag */}
                            {isFirstOrder && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
                                <Sparkles className="w-3 h-3" /> First-Order Exclusive
                              </span>
                            )}
                          </div>

                          {/* Discount Amount & Title */}
                          <div className="flex items-baseline gap-3 mb-1">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                              {coupon.formattedDiscount || `${coupon.discountValue}% OFF`}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-800 text-base mb-1">
                            {coupon.internalName || coupon.code}
                          </h3>

                          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            {coupon.description || 'Valid on all eligible products and bundles in store.'}
                          </p>
                        </div>

                        <div>
                          {/* Voucher Code Box */}
                          <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex items-center justify-between gap-3 mb-4">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coupon Code</div>
                              <span className="font-mono font-black text-lg text-indigo-700 tracking-wider select-all">
                                {coupon.code}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyCode(coupon.code, coupon.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Copy Code
                                </>
                              )}
                            </button>
                          </div>

                          {/* Conditions & Actions Footer */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="text-slate-500">
                              {coupon.minOrderValue > 0 ? (
                                <span>Min spend: <strong className="text-slate-800">₹{coupon.minOrderValue}</strong></span>
                              ) : (
                                <span className="text-emerald-600 font-medium">No minimum spend required</span>
                              )}
                              {coupon.maxDiscountAmount && (
                                <span className="ml-2 text-slate-400">&bull; Max ₹{coupon.maxDiscountAmount}</span>
                              )}
                            </div>

                            {/* Eligibility Tag or Shop CTA */}
                            {isEligible ? (
                              <Link
                                to="/categories/all-products"
                                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                              >
                                Shop & Apply <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <span className="font-semibold text-rose-600 text-[11px] bg-rose-50 px-2.5 py-1 rounded-lg">
                                {coupon.ineligibilityReason || 'Not eligible for current account'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY LIBRARY (DIGITAL PRODUCT OWNERSHIP) */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Library</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Your digital product collection. Access your files, links, and updates anytime.
                  </p>
                </div>
                
                {/* Search in Library */}
                <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={librarySearch}
                    onChange={e => setLibrarySearch(e.target.value)}
                    placeholder="Search my library..."
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {loadingPurchases ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse flex gap-6">
                      <div className="w-32 aspect-video bg-slate-200 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : errorPurchases ? (
                <div className="p-8 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100">
                  {errorPurchases}
                  <button onClick={fetchPurchases} className="mt-4 px-6 py-2 bg-red-600 text-white font-bold rounded-xl text-sm block mx-auto">
                    Retry
                  </button>
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No owned products found.</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    {librarySearch ? "No products in your library match your search term." : "You haven't purchased or claimed any digital products yet."}
                  </p>
                  <Link to="/categories/all-products" className="px-6 py-3 bg-primary text-white font-bold rounded-xl inline-block hover:bg-primary-dark transition-colors">
                    Explore Marketplace
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredLibrary.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center gap-6">
                      <img 
                        src={item.image || 'https://placehold.co/400x300?text=KDW+Product'} 
                        alt={item.name} 
                        className="w-full md:w-40 aspect-video object-cover rounded-2xl shrink-0" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                          <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-md">
                            {item.type || 'DIGITAL PRODUCT'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-3">
                          Order <span className="font-mono text-slate-700">{item.orderNumber || 'COMPLETED'}</span> &bull; Access Granted: {new Date(item.purchasedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle2 size={14} /> Active License
                          </span>
                          <span>Version {item.version || '1.0.0'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                        <button 
                          onClick={() => setReviewProduct({ id: item.productId, title: item.name, coverImage: item.image })}
                          className="px-6 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-sm rounded-2xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Star size={16} className="fill-amber-400 text-amber-500" /> Rate & Review
                        </button>
                        <Link 
                          to={`/support/ticket`}
                          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all text-center flex items-center justify-center gap-2"
                        >
                          <LifeBuoy size={16} /> Get Support
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS & INVOICES */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Orders & Invoices</h1>
                <p className="text-slate-500 text-sm mt-1">Transaction history and official invoices for your account.</p>
              </div>

              {loadingInvoices ? (
                <div className="py-8 text-center text-slate-400">Loading orders...</div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <FileText size={32} className="mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No orders recorded.</h3>
                  <p className="text-slate-500 mb-6">Your complete order history will appear here once an order is placed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map(inv => (
                    <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-lg mb-1">Order #{inv.orderNumber}</div>
                        <div className="text-sm text-slate-500">{inv.date} &bull; Paid via Razorpay/UPI</div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900">{formatCurrency(inv.amount)}</div>
                          <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full uppercase">
                            {inv.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDownloadInvoice(inv.id, inv.orderNumber)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Download size={14} /> Download Invoice
                          </button>
                          <Link 
                            to={`/contact?orderId=${inv.id}`}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                          >
                            <LifeBuoy size={14} /> Need Help?
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Downloads</h1>
                <p className="text-slate-500 text-sm mt-1">Direct access links to all downloadable digital resources.</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Resource</th>
                      <th className="px-6 py-4">Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                          No downloadable assets found in your account.
                        </td>
                      </tr>
                    ) : (
                      purchases.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                          <td className="px-6 py-4">{new Date(p.purchasedAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: LICENSES */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Licenses</h1>
                <p className="text-slate-500 text-sm mt-1">Official usage rights and personal licenses for your acquired products.</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                {loadingPurchases ? (
                  <div className="py-8 text-center text-slate-400">Loading licenses...</div>
                ) : purchases.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No active licenses found in your account.</div>
                ) : (
                  purchases.map(p => (
                    <div key={p.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md uppercase border ${p.downloadAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {p.downloadAvailable ? 'ACTIVE LICENSE' : 'REVOKED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Order <span className="font-mono text-slate-700">{p.orderNumber || 'COMPLETED'}</span> &bull; Issued {new Date(p.purchasedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-600 font-medium mt-2">
                          Personal License &bull; Lifetime personal use allowed.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const key = p.licenceKey || p.licenseKey || (p.orderNumber ? `KDW-PERS-${p.orderNumber.replace(/[^A-Z0-9]/gi, '')}-${(p.productId || 'ASSET').substring(0, 8).toUpperCase()}` : `KDW-PERS-${p.id}`);
                          return (
                            <>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(key)
                                    .then(() => toast.success('License key copied to clipboard!'))
                                    .catch(() => toast.error('Unable to copy license key.'));
                                }}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-sans rounded-xl transition-colors flex items-center gap-1.5"
                              >
                                <Key size={14} /> Copy Key
                              </button>
                              <Link 
                                to={`/verify-license?key=${encodeURIComponent(key)}`}
                                className="px-4 py-2 bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Download size={14} /> Verify &amp; Unlock
                              </Link>
                              <Link 
                                to={`/contact?orderId=${p.orderId || ''}`}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                              >
                                <LifeBuoy size={14} /> License Help
                              </Link>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: REFUNDS */}
          {activeTab === 'refunds' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <RotateCcw size={22} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Refunds &amp; Cancellations</h1>
                  </div>
                  <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">
                    Request refunds for eligible purchased digital products. All requests are securely recorded and manually reviewed by our compliance team before funds are returned to your original payment method.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
                  <ShieldCheck size={28} className="text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Protected Transactions</p>
                    <p className="text-slate-500">Verified digital orders only</p>
                  </div>
                </div>
              </div>

              {/* Notice Banner for Declined/Cancelled Refunds */}
              {customerRefunds.some(r => r.status === 'REJECTED') && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-900 animate-in fade-in">
                  <div className="p-1 bg-rose-100 rounded-lg text-rose-700 shrink-0 mt-0.5">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-sm text-rose-900">Notice: Refund Request Declined / Cancelled</p>
                    {customerRefunds.filter(r => r.status === 'REJECTED').map(rej => (
                      <p key={rej.id} className="text-rose-800 leading-relaxed">
                        Your refund request for order <span className="font-mono font-bold">#{rej.order?.orderNumber || rej.orderId?.slice(0, 8)}</span> was declined by compliance.
                        {rej.rejectionReason && (
                          <span className="font-semibold block mt-0.5">Decision Note: &ldquo;{rej.rejectionReason}&rdquo;</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 1: Eligible Verified Purchases */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Eligible Purchased Products</h2>
                    <p className="text-xs text-slate-500">Select a verified purchased item to submit a refund request with your reason.</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {purchases.filter(p => p.downloadAvailable && p.status === 'PAID').length} Eligible
                  </span>
                </div>

                {loadingPurchases ? (
                  <div className="py-10 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <RotateCcw className="animate-spin mx-auto text-primary mb-2" size={24} />
                    Loading verified purchases...
                  </div>
                ) : purchases.filter(p => p.downloadAvailable && p.status === 'PAID').length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                    <Package size={32} className="mx-auto text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">No products currently eligible for refund</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Only verified, completed purchases with active access can be submitted for refund review.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {purchases.filter(p => p.downloadAvailable && p.status === 'PAID').map((item) => {
                      const hasActiveRefund = customerRefunds.some(
                        r => r.orderId === (item.orderId || item.id) && (r.status === 'PENDING_APPROVAL' || r.status === 'REQUESTED')
                      );
                      const isCompletedRefund = customerRefunds.some(
                        r => r.orderId === (item.orderId || item.id) && r.status === 'COMPLETED'
                      );

                      return (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 transition-all">
                          <div className="flex items-start gap-4">
                            <img 
                              src={item.image || 'https://placehold.co/200x200?text=Product'} 
                              alt={item.name} 
                              className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-900 text-sm truncate">{item.name}</h3>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                                  {item.type || 'PRODUCT'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                Order: <span className="font-mono text-slate-700">{item.orderNumber || 'COMPLETED'}</span>
                              </p>
                              <p className="text-xs font-black text-slate-900 mt-1">
                                {formatCurrency(item.amount || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500">
                              Purchased {new Date(item.purchasedAt).toLocaleDateString()}
                            </span>

                            {hasActiveRefund ? (
                              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                                <Clock size={13} /> Under Admin Review
                              </span>
                            ) : isCompletedRefund ? (
                              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                                <CheckCircle size={13} /> Refunded
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenRefundModal(item)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <RotateCcw size={13} /> Request Refund
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Submitted Refund History & Status */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Submitted Refund Requests</h2>
                    <p className="text-xs text-slate-500">Real-time status of your refund requests submitted for manual verification.</p>
                  </div>
                  <button
                    onClick={fetchCustomerRefunds}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={13} /> Refresh
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  {loadingRefunds ? (
                    <div className="py-12 text-center text-slate-400">
                      <RotateCcw className="animate-spin mx-auto text-primary mb-2" size={24} />
                      Loading refund requests...
                    </div>
                  ) : customerRefunds.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <RotateCcw size={22} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No refund requests submitted</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        If you ever encounter an issue with an eligible digital item, select it above to send a refund request.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-5">Order / Request ID</th>
                            <th className="py-3 px-5">Product Details</th>
                            <th className="py-3 px-5">Refund Amount</th>
                            <th className="py-3 px-5">Reason &amp; Notes</th>
                            <th className="py-3 px-5">Date Submitted</th>
                            <th className="py-3 px-5 text-right">Review Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerRefunds.map((ref) => {
                            const firstItem = ref.order?.items?.[0];
                            const prodName = firstItem?.product?.name || firstItem?.bundle?.title || 'Digital Product';
                            
                            return (
                              <tr key={ref.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-4 px-5">
                                  <div className="font-mono font-bold text-slate-900">
                                    #{ref.order?.orderNumber || ref.orderId?.slice(0, 8)}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    ID: {ref.id.slice(0, 10)}...
                                  </div>
                                </td>
                                <td className="py-4 px-5">
                                  <div className="font-semibold text-slate-900 max-w-xs truncate">{prodName}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {ref.order?.items?.length || 1} item(s) in order
                                  </div>
                                </td>
                                <td className="py-4 px-5 font-black text-slate-900 text-sm">
                                  {formatCurrency(ref.amount)}
                                </td>
                                <td className="py-4 px-5 max-w-sm">
                                  <div className="text-slate-800 font-medium line-clamp-2">{ref.reason || 'No reason provided'}</div>
                                  {ref.status === 'REJECTED' && ref.rejectionReason && (
                                    <div className="mt-1 p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px]">
                                      <span className="font-bold">Admin response:</span> {ref.rejectionReason}
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                                  {new Date(ref.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-5 text-right whitespace-nowrap">
                                  {ref.status === 'PENDING_APPROVAL' || ref.status === 'REQUESTED' ? (
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full inline-flex items-center gap-1">
                                      <Clock size={12} /> Pending Review
                                    </span>
                                  ) : ref.status === 'COMPLETED' ? (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full inline-flex items-center gap-1">
                                      <CheckCircle size={12} /> Approved &amp; Refunded
                                    </span>
                                  ) : ref.status === 'REJECTED' ? (
                                    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full inline-flex items-center gap-1">
                                      <XCircle size={12} /> Request Declined
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                                      {ref.status}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* TAB 6: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your personal details and account information.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={e => setProfileName(e.target.value)} 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue={user?.email || ''} 
                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-slate-500 cursor-not-allowed" 
                        disabled 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
                      <input 
                        type="text" 
                        value={profileMobile} 
                        onChange={e => setProfileMobile(e.target.value)} 
                        placeholder="Optional" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary" 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isUpdatingProfile} 
                    className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CUSTOMER REFUND REQUEST MODAL */}
      {refundModalOpen && selectedOrderForRefund && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Request Refund</h3>
                  <p className="text-xs text-slate-500">Order #{selectedOrderForRefund.orderNumber || 'COMPLETED'}</p>
                </div>
              </div>
              <button
                onClick={() => { setRefundModalOpen(false); setSelectedOrderForRefund(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Product Summary */}
            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <img
                src={selectedOrderForRefund.image || 'https://placehold.co/100x100?text=KDW'}
                alt={selectedOrderForRefund.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate">{selectedOrderForRefund.name}</h4>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-slate-500">Refund Amount:</span>
                  <span className="font-black text-slate-900">{formatCurrency(selectedOrderForRefund.amount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Refund Reason Form */}
            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Reason for Refund *
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="Accidental duplicate purchase">Accidental duplicate purchase</option>
                  <option value="Defective / Broken download file">Defective / Broken download file</option>
                  <option value="Product not as described">Product not as described</option>
                  <option value="License key / Activation failure">License key / Activation failure</option>
                  <option value="Compatibility issues with my system">Compatibility issues with my system</option>
                  <option value="Billing error or incorrect charge">Billing error or incorrect charge</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Explanation / Note for Administrator <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Please provide a detailed explanation of why you are requesting a refund (mandatory for administrator review)..."
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <span className="text-rose-500 font-bold">*</span> Mandatory: Detailed explanation helps our compliance team process your claim quickly.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs leading-relaxed flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Important:</strong> Upon refund approval, your digital license key and download entitlements will be immediately revoked.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setRefundModalOpen(false); setSelectedOrderForRefund(null); }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund || !refundNote.trim()}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingRefund ? (
                    <>
                      <RotateCcw className="animate-spin" size={14} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      Submit Refund Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Review Submission Modal for Owned Products */}
      {reviewProduct && (
        <ReviewSubmissionModal
          isOpen={Boolean(reviewProduct)}
          onClose={() => setReviewProduct(null)}
          product={reviewProduct}
          onSuccess={() => {
            toast.success('Your review has been submitted and synced with the review desk!');
            setReviewProduct(null);
          }}
        />
      )}
    </div>
  );
}
