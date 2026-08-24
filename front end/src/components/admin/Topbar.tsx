import { Bell, Package, User, Menu, Search, ExternalLink, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export interface TopbarProps {
  onToggleMobileSidebar?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export default function Topbar({
  onToggleMobileSidebar,
  onToggleCollapse,
  isCollapsed = false
}: TopbarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ customers: any[]; orders: any[]; products: any[]; bundles?: any[]; categories?: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await axios.get(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
          setSearchResults(res.data.data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/admin/notifications', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
          setNotifs(res.data.data);
        }
      } catch (err) {
        // Silent fail for topbar
      } finally {
        setNotifsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') return 'Dashboard';
    if (path.startsWith('/admin/products')) return 'Products';
    if (path.startsWith('/admin/categories')) return 'Categories';
    if (path.startsWith('/admin/bundles')) return 'Product Bundles';
    if (path.startsWith('/admin/orders')) return 'Orders';
    if (path.startsWith('/admin/customers')) return 'Customers';
    if (path.startsWith('/admin/payments')) return 'Payments';
    if (path.startsWith('/admin/coupons')) return 'Coupons & Offers';
    if (path.startsWith('/admin/campaigns')) return 'Marketing Campaigns';
    if (path.startsWith('/admin/reviews')) return 'Review Management';
    if (path.startsWith('/admin/downloads')) return 'Download Management';
    if (path.startsWith('/admin/analytics')) return 'Reports & Analytics';
    if (path.startsWith('/admin/content')) return 'Content';
    if (path.startsWith('/admin/support')) return 'Support';
    if (path.startsWith('/admin/notifications')) return 'Mail & Notifications';
    if (path.startsWith('/admin/settings')) return 'Settings';
    if (path.startsWith('/admin/health')) return 'System Health';
    if (path.startsWith('/admin/users')) return 'Admin Users & Staff';
    return 'Admin Control Center';
  };

  const adminName = user?.name || 'Administrator';
  const adminRole = user?.role ? (user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role) : 'Store Admin';

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open Sidebar"
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          aria-label="Toggle Sidebar"
          className="hidden md:flex p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <Menu size={19} />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden lg:flex flex-1 max-w-md mx-6 relative">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults) setShowSearchDropdown(true); }}
            placeholder="Search orders, products, customers..."
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Global Search Dropdown Menu */}
        {showSearchDropdown && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 max-h-96 overflow-y-auto">
            {/* Orders Group */}
            {searchResults.orders && searchResults.orders.length > 0 && (
              <div className="p-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 px-1">Orders</span>
                <div className="space-y-1">
                  {searchResults.orders.map((o: any) => (
                    <Link
                      key={o.id}
                      to={`/admin/orders`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors group"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-primary block">{o.orderNumber}</span>
                        <span className="text-slate-600 text-[11px] truncate block">{o.customerName}</span>
                      </div>
                      <span className="font-black text-slate-900 text-xs">₹{o.amount}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Customers Group */}
            {searchResults.customers && searchResults.customers.length > 0 && (
              <div className="p-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 px-1">Customers</span>
                <div className="space-y-1">
                  {searchResults.customers.map((c: any) => (
                    <Link
                      key={c.id}
                      to={`/admin/customers`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-slate-500 text-[11px] block">{c.email}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Customer</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products Group */}
            {searchResults.products && searchResults.products.length > 0 && (
              <div className="p-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 px-1">Products</span>
                <div className="space-y-1">
                  {searchResults.products.map((p: any) => (
                    <Link
                      key={p.id}
                      to={`/admin/products`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">{p.name}</span>
                        <span className="text-slate-500 text-[11px] block">{p.category?.name || 'Digital Kit'}</span>
                      </div>
                      <span className="font-black text-emerald-600 text-xs">₹{p.price}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Bundles Group */}
            {searchResults.bundles && searchResults.bundles.length > 0 && (
              <div className="p-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 px-1">Bundles</span>
                <div className="space-y-1">
                  {searchResults.bundles.map((b: any) => (
                    <Link
                      key={b.id}
                      to={`/admin/bundles`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">{b.title}</span>
                        <span className="text-slate-500 text-[11px] block">{b.itemsIncluded} items included</span>
                      </div>
                      <span className="font-black text-indigo-600 text-xs">₹{b.price}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Group */}
            {searchResults.categories && searchResults.categories.length > 0 && (
              <div className="p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 px-1">Categories</span>
                <div className="space-y-1">
                  {searchResults.categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      to={`/admin/categories`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{cat.name}</span>
                        <span className="text-slate-500 text-[11px] block">{cat.type}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cat.type}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {searchResults.orders?.length === 0 && searchResults.customers?.length === 0 && searchResults.products?.length === 0 && (!searchResults.bundles || searchResults.bundles.length === 0) && (!searchResults.categories || searchResults.categories.length === 0) && (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching results found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* View Live Store */}
        <Link 
          to="/" 
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <span>View Store</span>
          <ExternalLink size={13} />
        </Link>
        
        <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>
        
        {/* Notifications Dropdown */}
        <div className="relative group/notif">
          <button 
            aria-label="Notifications"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 hidden group-hover/notif:block group-focus-within/notif:block animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
              <NotificationsDropdown notifs={notifs} loading={notifsLoading} />
            </div>
            <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/50">
              <Link to="/admin/notifications" className="text-xs font-bold text-primary hover:underline">
                View All Notifications
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Profile */}
        <Link 
          to="/admin/users" 
          className="flex items-center gap-2.5 pl-1.5 sm:pl-2 sm:border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-xl transition-colors"
        >
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
              {adminName}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {adminRole}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
}

function NotificationsDropdown({ notifs, loading }: { notifs: any[], loading: boolean }) {
  if (loading) return <div className="p-4 text-center text-xs text-slate-500">Loading notifications...</div>;
  if (!notifs.length) return <div className="p-4 text-center text-xs text-slate-500">No recent notifications</div>;

  return (
    <div className="flex flex-col">
      {notifs.slice(0, 5).map(n => (
        <Link 
          key={n.id} 
          to={n.link || '/admin/notifications'} 
          className={`p-3.5 hover:bg-slate-50 transition-colors flex gap-3 ${!n.isRead ? 'bg-primary/5' : ''}`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${n.type?.toLowerCase() === 'order' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
            {n.type?.toLowerCase() === 'order' ? <Package size={14} /> : <User size={14} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
              {n.title || n.type}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
            <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

