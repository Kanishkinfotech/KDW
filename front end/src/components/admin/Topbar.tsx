import { 
  Bell, 
  Package, 
  User, 
  Menu, 
  ExternalLink, 
  Shield, 
  LogOut, 
  Settings, 
  Activity, 
  KeyRound 
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState<any[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(true);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifsMenuRef = useRef<HTMLDivElement>(null);

  // Click Outside Dismissal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifsMenuRef.current && !notifsMenuRef.current.contains(e.target as Node)) {
        setShowNotifsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifsDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifs(res.data.data);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setNotifsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem('admin_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('admin_session_updated'));
    navigate('/admin/login');
  };

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
    if (path.startsWith('/admin/analytics') || path.startsWith('/admin/reports')) return 'Reports & Analytics';
    if (path.startsWith('/admin/content')) return 'Content';
    if (path.startsWith('/admin/support')) return 'Support Desk';
    if (path.startsWith('/admin/notifications')) return 'Mail & Notifications';
    if (path.startsWith('/admin/settings')) return 'Settings';
    if (path.startsWith('/admin/health') || path.startsWith('/admin/system')) return 'System Health';
    if (path.startsWith('/admin/users')) return 'Users & Staff';
    if (path.startsWith('/admin/automation')) return 'Workflow Automation';
    if (path.startsWith('/admin/cache')) return 'Cache Management';
    return 'Admin Control Center';
  };

  const adminName = user?.name || 'Administrator';
  const adminRole = user?.role ? (user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role) : 'Store Admin';

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open Sidebar"
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <Menu size={20} />
        </button>

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

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* View Store (Opens real customer storefront in a new tab) */}
        <Link 
          to="/" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#5b21b6] transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/60"
        >
          <span>View Store</span>
          <ExternalLink size={13} />
        </Link>
        
        <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>
        
        {/* Notifications Dropdown */}
        <div ref={notifsMenuRef} className="relative">
          <button 
            onClick={() => setShowNotifsDropdown(prev => !prev)}
            aria-label="Notifications"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative focus:outline-none"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>
          
          {showNotifsDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-sans">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifsLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
                ) : notifs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No recent notifications</div>
                ) : (
                  notifs.slice(0, 5).map(n => (
                    <Link 
                      key={n.id} 
                      to={n.link || '/admin/notifications'} 
                      onClick={() => setShowNotifsDropdown(false)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex gap-3 ${!n.isRead ? 'bg-[#5b21b6]/5' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${n.type?.toLowerCase() === 'order' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#ede9fe] text-[#5b21b6]'}`}>
                        {n.type?.toLowerCase() === 'order' ? <Package size={14} /> : <User size={14} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
                          {n.title || n.type}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/50">
                <Link 
                  to="/admin/notifications" 
                  onClick={() => setShowNotifsDropdown(false)}
                  className="text-xs font-bold text-[#5b21b6] hover:underline"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin Account Menu */}
        <div ref={profileMenuRef} className="relative">
          <button 
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-2.5 pl-1.5 sm:pl-2 sm:border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-xl transition-colors focus:outline-none"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {adminName}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">
                {adminRole}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </button>

          {/* Account Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 py-2">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="font-bold text-xs text-slate-900 truncate">{adminName}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{user?.email || 'admin@kanishkdigital.com'}</div>
                <span className="inline-block mt-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5b21b6]/10 text-[#5b21b6]">
                  {adminRole}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/users/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  to="/admin/users/roles"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <KeyRound size={14} className="text-slate-400" />
                  <span>Role & Permissions</span>
                </Link>

                <Link
                  to="/admin/users/sessions"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Shield size={14} className="text-slate-400" />
                  <span>Active Sessions</span>
                </Link>

                <Link
                  to="/admin/users/activity-logs"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Activity size={14} className="text-slate-400" />
                  <span>Activity Logs</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
