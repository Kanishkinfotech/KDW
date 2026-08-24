import { useState, useEffect } from 'react';
import { Package, Download, FileText, Key, Settings, LogOut, Edit2, ShieldAlert, LayoutDashboard, MessageSquare, Search, ExternalLink, ChevronRight, CheckCircle2, LifeBuoy } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { toast } from 'react-hot-toast';
import axios from 'axios';

export default function Dashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getActiveTab = () => {
    const path = location.pathname.replace(/\/$/, '');
    if (path === '/account/library') return 'library';
    if (path === '/account/orders') return 'orders';
    if (path === '/account/downloads') return 'downloads';
    if (path === '/account/licenses') return 'licenses';
    if (path === '/account/support' || path === '/account/tickets') return 'tickets';
    if (path === '/account/profile' || path === '/account/settings') return 'profile';
    if (path === '/account' || path === '/dashboard') {
      const rawTab = searchParams.get('tab');
      if (rawTab) {
        if (rawTab === 'purchases') return 'library';
        if (rawTab === 'invoices') return 'orders';
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

  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedResourceModal, setSelectedResourceModal] = useState<any | null>(null);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileMobile(user.mobile || '');
    }
  }, [user]);

  useEffect(() => {
    if (authState === 'unauthenticated') {
      navigate('/login', { replace: true });
    }
  }, [authState, navigate]);

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    setErrorPurchases(null);
    try {
      const response = await fetch('/api/purchases', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      if (data.success) {
        setPurchases(data.purchases);
      } else {
        throw new Error(data.message || 'Error fetching purchases');
      }
    } catch (err) {
      setErrorPurchases('Unable to load your library and purchases.');
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'library' || activeTab === 'overview' || activeTab === 'downloads' || activeTab === 'licenses') && authState === 'authenticated') {
      fetchPurchases();
    }
  }, [activeTab, authState]);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    setErrorInvoices(null);
    try {
      const response = await fetch('/api/purchases/invoices', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
      } else {
        throw new Error(data.message || 'Error fetching invoices');
      }
    } catch (err) {
      setErrorInvoices('Unable to load your invoices.');
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'orders' || activeTab === 'overview') && authState === 'authenticated') {
      fetchInvoices();
    }
  }, [activeTab, authState]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await axios.get('/api/support/tickets/my');
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'tickets' || activeTab === 'overview') && authState === 'authenticated') {
      fetchTickets();
    }
  }, [activeTab, authState]);

  const handleDownload = async (productId: string) => {
    try {
      const response = await fetch(`/api/purchases/${productId}/download-token`);
      const data = await response.json();
      if (data.success && data.data.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank');
      } else {
        toast.error(data.message || 'Failed to generate download link');
      }
    } catch (error) {
      toast.error('An error occurred while generating download link');
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    window.open(`/api/purchases/invoices/${orderId}/download`, '_blank');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, mobile: profileMobile })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Profile updated successfully');
        login({ ...user, ...data.user });
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('An error occurred while updating profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'overview') {
      navigate('/account');
    } else if (tabId === 'tickets') {
      navigate('/account/support');
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
    { id: 'library', name: 'My Library', icon: Package },
    { id: 'orders', name: 'Orders & Invoices', icon: FileText },
    { id: 'downloads', name: 'Downloads', icon: Download },
    { id: 'licenses', name: 'Licenses', icon: Key },
    { id: 'tickets', name: 'Contact Support', icon: MessageSquare },
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
      <SEO title="Customer Account Dashboard | KDW" description="Manage your digital products, library, orders, downloads and support tickets." />
      
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
              <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <h1 className="text-3xl font-black mb-2">Welcome back, {user?.name || 'Customer'}!</h1>
                <p className="text-slate-400 text-sm max-w-xl">
                  Access your purchased digital products, manage your orders, download assets, and submit support requests all in one place.
                </p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                  onClick={() => handleTabChange('tickets')}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <MessageSquare size={24} />
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{tickets.length}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Support Requests</div>
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
                      <div key={p.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all flex items-center gap-4 bg-slate-50/50">
                        <img src={p.image || 'https://placehold.co/100x100?text=KDW'} alt={p.name} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-slate-900 truncate text-sm mb-1">{p.name}</h4>
                          <div className="text-xs text-slate-500">Purchased {new Date(p.purchasedAt).toLocaleDateString()}</div>
                        </div>
                        <button 
                          onClick={() => handleDownload(p.productId)}
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors shrink-0"
                        >
                          Access
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                        {item.downloadAvailable && (
                          <button 
                            onClick={() => handleDownload(item.productId)}
                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Download size={16} /> Access Product
                          </button>
                        )}
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
                            onClick={() => handleDownloadInvoice(inv.id)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
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
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                          No downloadable assets found in your account.
                        </td>
                      </tr>
                    ) : (
                      purchases.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                          <td className="px-6 py-4">{new Date(p.purchasedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDownload(p.productId)}
                              className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-colors inline-flex items-center gap-1"
                            >
                              <Download size={14} /> Download
                            </button>
                          </td>
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
                <p className="text-slate-500 text-sm mt-1">Official usage rights and commercial licenses for your acquired products.</p>
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
                          Standard Commercial License &bull; Unlimited personal & client projects allowed.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          to={`/contact?orderId=${p.orderId || ''}`}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <LifeBuoy size={14} /> License Help
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SUPPORT REQUESTS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact Support</h1>
                  <p className="text-slate-500 text-sm mt-1">Track and reply to support inquiries submitted to our team.</p>
                </div>
                <Link to="/contact" className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20">
                  Contact Us
                </Link>
              </div>

              {loadingTickets ? (
                <div className="py-8 text-center text-slate-400">Loading support messages...</div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <MessageSquare size={32} className="mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No support messages yet.</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">Have a question or need assistance with a digital product? Contact our team.</p>
                  <Link to="/contact" className="px-6 py-3 bg-primary text-white font-bold rounded-xl inline-block">
                    Contact Us
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(t => (
                    <Link 
                      key={t.id} 
                      to={`/support/my-tickets/${t.id}`}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-primary transition-all block group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-primary">{t.ticketNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${t.status === 'Open' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                          {t.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-2">{t.subject}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-4">
                        <span>Category: {t.category}</span>
                        <span>Updated: {new Date(t.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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
    </div>
  );
}
