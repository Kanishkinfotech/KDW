import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Layers, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Tag, 
  Megaphone, 
  Star, 
  Download, 
  BarChart3, 
  FileText, 
  PhoneCall, 
  Bell, 
  Radio, 
  Settings, 
  Cpu, 
  Database, 
  UserCheck, 
  Zap, 
  Webhook, 
  LogOut, 
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export interface NavSubItem {
  label: string;
  href: string;
  exact?: boolean;
}

export interface NavMainItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  subOptions?: NavSubItem[];
}

export const PRIMARY_ADMIN_NAVIGATION: NavMainItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    subOptions: [
      { label: 'All Products', href: '/admin/products' },
      { label: 'Add Products', href: '/admin/products/new' }
    ]
  },
  {
    id: 'category',
    label: 'Category',
    href: '/admin/categories',
    icon: FolderTree,
    subOptions: [
      { label: 'All Categories', href: '/admin/categories' },
      { label: 'Add Category', href: '/admin/categories?action=add' }
    ]
  },
  {
    id: 'product-bundle',
    label: 'Product Bundle',
    href: '/admin/bundles',
    icon: Layers,
    subOptions: [
      { label: 'All Bundles', href: '/admin/bundles' },
      { label: 'Add Bundle', href: '/admin/bundles/new' }
    ]
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingBag,
    subOptions: [
      { label: 'All Orders', href: '/admin/orders', exact: true },
      { label: 'New Orders', href: '/admin/orders/new' },
      { label: 'Pending Orders', href: '/admin/orders/pending' },
      { label: 'Completed Orders', href: '/admin/orders/completed' },
      { label: 'Failed Orders', href: '/admin/orders/failed' }
    ]
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    subOptions: [
      { label: 'All Customers', href: '/admin/customers' },
      { label: 'Customer Details', href: '/admin/customers?view=details' },
      { label: 'Purchase History', href: '/admin/customers?view=purchases' },
      { label: 'Download History', href: '/admin/customers?view=downloads' },
      { label: 'Blocked Users', href: '/admin/customers?view=blocked' }
    ]
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: CreditCard,
    subOptions: [
      { label: 'Transactions', href: '/admin/payments?tab=transactions' },
      { label: 'Successful Payments', href: '/admin/payments?tab=successful' },
      { label: 'Failed Payments', href: '/admin/payments?tab=failed' },
      { label: 'Refund Payments', href: '/admin/payments?tab=refunds' },
      { label: 'Payment Gateway', href: '/admin/payments?tab=settings' },
      { label: 'Reconciliation', href: '/admin/payments?tab=reconciliation' }
    ]
  },
  {
    id: 'coupons',
    label: 'Coupons & Offers',
    icon: Tag,
    subOptions: [
      { label: 'All Products Offers', href: '/admin/offers?tab=ALL' },
      { label: 'Active Offers', href: '/admin/offers?tab=ACTIVE' },
      { label: 'Scheduled Offers', href: '/admin/offers?tab=SCHEDULED' },
      { label: 'Bundle Offers', href: '/admin/offers?tab=BUNDLE_OFFERS' },
      { label: 'Coupons', href: '/admin/coupons' }
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing Campaigns',
    icon: Megaphone,
    subOptions: [
      { label: 'Email Marketing', href: '/admin/campaigns/email' },
      { label: 'WhatsApp Marketing', href: '/admin/campaigns/whatsapp' }
    ]
  },
  {
    id: 'reviews',
    label: 'Review Management',
    icon: Star,
    subOptions: [
      { label: 'Product Reviews', href: '/admin/reviews' },
      { label: 'Ratings', href: '/admin/reviews/ratings' },
      { label: 'Pending Reviews', href: '/admin/reviews/pending' },
      { label: 'Reported Reviews', href: '/admin/reviews/reported' }
    ]
  },
  {
    id: 'downloads',
    label: 'Download Management',
    icon: Download,
    subOptions: [
      { label: 'Download Overview', href: '/admin/downloads' },
      { label: 'File Storage & Uploads', href: '/admin/downloads/files' },
      { label: 'Tracking & Logs', href: '/admin/downloads/activity' },
      { label: 'Permissions & Limits', href: '/admin/downloads/overrides' },
      { label: 'Security Tokens', href: '/admin/downloads/tokens' },
      { label: 'Storage Diagnostics', href: '/admin/downloads/product-files' }
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    subOptions: [
      { label: 'Sales Report', href: '/admin/reports/sales' },
      { label: 'Revenue Report', href: '/admin/reports/revenue' },
      { label: 'Product Performance', href: '/admin/reports/product-performance' },
      { label: 'Customers Report', href: '/admin/reports/customers' },
      { label: 'Customer Login', href: '/admin/reports/logins' },
      { label: 'Customer Buys', href: '/admin/reports/buy-analysis' },
      { label: 'Download Report', href: '/admin/reports/downloads' },
      { label: 'Coupon Report', href: '/admin/reports/coupons' }
    ]
  },
  {
    id: 'content',
    label: 'Content & Articles',
    icon: BookOpen,
    href: '/admin/content/blogs',
    subOptions: [
      { label: 'Articles & Journal', href: '/admin/content/blogs' },
      { label: 'Add Article', href: '/admin/content/blogs/new' },
      { label: 'Knowledge Base', href: '/admin/knowledge-base' },
      { label: 'Pages', href: '/admin/content/pages' },
      { label: 'Banners', href: '/admin/content/banners' },
      { label: 'FAQs', href: '/admin/content/faqs' }
    ]
  },
  {
    id: 'support',
    label: 'Support Management',
    icon: PhoneCall,
    href: '/admin/support/tickets',
    subOptions: [
      { label: 'Support Tickets', href: '/admin/support/tickets' },
      { label: 'Customer Requests', href: '/admin/support/customer-requests' },
      { label: 'Refund Requests', href: '/admin/support/refund-requests' },
      { label: 'Contact & Queries', href: '/admin/support/contact-queries' }
    ]
  },
  {
    id: 'main-menu',
    label: 'Main Menu',
    icon: Bell,
    subOptions: [
      { label: 'Mail Notification', href: '/admin/notifications/mail' },
      { label: 'Customer Notification', href: '/admin/notifications/customer' },
      { label: 'Admin Notification', href: '/admin/notifications/admin' },
      { label: 'Notification Template', href: '/admin/notifications/templates' }
    ]
  },
  {
    id: 'integration',
    label: 'Integration',
    icon: Radio,
    href: '/admin/integrations/email-smtp',
    subOptions: [
      { label: 'Email SMTP', href: '/admin/integrations/email-smtp' },
      { label: 'WhatsApp API', href: '/admin/integrations/whatsapp-api' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    subOptions: [
      { label: 'General Settings', href: '/admin/settings/general' },
      { label: 'Store Settings', href: '/admin/settings/store' },
      { label: 'Currency & Tax', href: '/admin/settings/currency-tax' },
      { label: 'Checkout Settings', href: '/admin/settings/checkout' },
      { label: 'Security', href: '/admin/settings/security' },
      { label: 'Privacy', href: '/admin/settings/privacy' },
      { label: 'Terms & Conditions', href: '/admin/settings/legal-documents' }
    ]
  },
  {
    id: 'system',
    label: 'System',
    icon: Cpu,
    subOptions: [
      { label: 'System Health', href: '/admin/system/health' },
      { label: 'Error Logs', href: '/admin/system/errors' },
      { label: 'API Logs', href: '/admin/system/api-logs' },
      { label: 'Login Logs', href: '/admin/system/logins' },
      { label: 'Backup', href: '/admin/system/backups' }
    ]
  },
  {
    id: 'cache',
    label: 'Cache',
    icon: Database,
    subOptions: [
      { label: 'Cache Overview', href: '/admin/cache/overview' },
      { label: 'Temporary Data', href: '/admin/cache/temporary-data' },
      { label: 'Maintenance', href: '/admin/cache/maintenance' },
      { label: 'Statistics', href: '/admin/cache/statistics' }
    ]
  },
  {
    id: 'users-staff',
    label: 'Users & Staff',
    icon: UserCheck,
    subOptions: [
      { label: 'Admin Users & Staff', href: '/admin/users' },
      { label: 'Roles & Permissions', href: '/admin/users/roles' },
      { label: 'Activity Logs', href: '/admin/users/activity-logs' }
    ]
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    href: '/admin/webhooks',
    icon: Webhook
  }
];

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const { user, logout } = useAuth();

  const adminName = user?.name || 'Administrator';
  const adminRole = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : (user?.role || 'Admin');

  // Track expanded menu items (open active item by default)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const isSubActive = (subHref: string, allSubOptions?: NavSubItem[]) => {
    // Special order subOptions handling for query params (e.g. ?status=COMPLETED or ?view=completed)
    if (location.pathname === '/admin/orders') {
      const sp = new URLSearchParams(location.search);
      const statusParam = (sp.get('status') || sp.get('view') || '').toUpperCase();
      if (statusParam) {
        if (subHref === '/admin/orders/completed' && (statusParam === 'COMPLETED' || statusParam === 'PAID')) return true;
        if (subHref === '/admin/orders/new' && statusParam === 'NEW') return true;
        if (subHref === '/admin/orders/pending' && (statusParam === 'PENDING' || statusParam === 'PENDING_PAYMENT')) return true;
        if (subHref === '/admin/orders/failed' && statusParam === 'FAILED') return true;
        if (subHref === '/admin/orders') return false;
      } else if (subHref === '/admin/orders') {
        return true;
      }
    }

    if (location.pathname === '/admin/customers') {
      const sp = new URLSearchParams(location.search);
      const viewParam = (sp.get('view') || '').toLowerCase();
      const statusParam = (sp.get('status') || '').toUpperCase();
      if (viewParam === 'details') {
        if (subHref === '/admin/customers?view=details') return true;
        if (subHref === '/admin/customers') return false;
      }
      if (viewParam === 'purchases' || viewParam === 'purchase-history') {
        if (subHref.includes('view=purchases') || subHref.includes('view=purchase-history')) return true;
        if (subHref === '/admin/customers') return false;
      }
      if (viewParam === 'downloads' || viewParam === 'download-history') {
        if (subHref.includes('view=downloads') || subHref.includes('view=download-history')) return true;
        if (subHref === '/admin/customers') return false;
      }
      if (viewParam === 'blocked' || statusParam === 'BLOCKED') {
        if (subHref.includes('view=blocked') || subHref.includes('status=BLOCKED')) return true;
        if (subHref === '/admin/customers') return false;
      }
      if ((!viewParam || viewParam === 'all') && !statusParam && subHref === '/admin/customers') {
        return true;
      }
    }

    // Specific payment sub-option matching
    if (location.pathname.startsWith('/admin/payments') || location.pathname === '/admin/reports/refunds') {
      const sp = new URLSearchParams(location.search);
      const tabParam = sp.get('tab');
      const statusParam = sp.get('status')?.toUpperCase();
      const path = location.pathname.toLowerCase();

      if (subHref.includes('tab=successful') || subHref.includes('status=SUCCESSFUL')) {
        return tabParam === 'successful' || statusParam === 'SUCCESSFUL' || statusParam === 'CAPTURED' || path.endsWith('/payments/successful');
      }
      if (subHref.includes('tab=failed') || subHref.includes('status=FAILED')) {
        return tabParam === 'failed' || statusParam === 'FAILED' || path.endsWith('/payments/failed');
      }
      if (subHref.includes('tab=refunds') || subHref === '/admin/reports/refunds' || subHref.endsWith('/payments/refunds')) {
        return tabParam === 'refunds' || path === '/admin/reports/refunds' || path.endsWith('/payments/refunds');
      }
      if (subHref.includes('tab=settings') || subHref.endsWith('/payments/gateway')) {
        return tabParam === 'settings' || path.endsWith('/payments/gateway');
      }
      if (subHref.includes('tab=transactions') || subHref === '/admin/payments') {
        return (
          tabParam === 'transactions' ||
          path.endsWith('/payments/transactions') ||
          (!tabParam && !statusParam && path === '/admin/payments') ||
          tabParam === 'overview'
        );
      }
    }

    // Specific coupons & offers sub-option matching
    if (location.pathname.startsWith('/admin/offers')) {
      const sp = new URLSearchParams(location.search);
      const tabParam = (sp.get('tab') || 'ALL').toUpperCase();

      if (subHref.includes('tab=ACTIVE')) return tabParam === 'ACTIVE';
      if (subHref.includes('tab=SCHEDULED')) return tabParam === 'SCHEDULED';
      if (subHref.includes('tab=BUNDLE_OFFERS')) return tabParam === 'BUNDLE_OFFERS';
      if (subHref.includes('tab=ALL') || subHref === '/admin/offers') {
        return tabParam === 'ALL' || !sp.get('tab');
      }
    }

    // Specific marketing sub-option matching
    if (location.pathname.startsWith('/admin/campaigns')) {
      if (location.pathname === '/admin/campaigns/whatsapp') {
        return subHref === '/admin/campaigns/whatsapp';
      }
      if (location.pathname === '/admin/campaigns/email' || location.pathname === '/admin/campaigns') {
        return subHref === '/admin/campaigns/email';
      }
    }

    // 1. If subHref has query params (e.g. ?action=add, ?status=PENDING)
    if (subHref.includes('?')) {
      return currentPath === subHref;
    }

    // 2. If current URL has query params, but this subHref has none,
    // don't mark active if another sibling subOption matches the query param exactly
    if (location.search && allSubOptions) {
      const hasExactQueryMatch = allSubOptions.some(sub => sub.href === currentPath);
      if (hasExactQueryMatch) {
        return false;
      }
    }

    // 3. Exact pathname match
    if (location.pathname === subHref) {
      return true;
    }

    // 4. If current URL is an exact match for another subOption in the same group, this one is not active
    if (allSubOptions) {
      const hasSiblingExactMatch = allSubOptions.some(sub => {
        const [siblingPath] = sub.href.split('?');
        return location.pathname === siblingPath;
      });
      if (hasSiblingExactMatch) {
        return false;
      }
    }

    // 5. Nested paths (e.g. /admin/products/edit/:id or /admin/bundles/edit/:id)
    if (location.pathname.startsWith(subHref + '/')) {
      // If another sibling has a longer / more specific prefix match, yield to it
      if (allSubOptions) {
        const otherMoreSpecific = allSubOptions.some(
          sub => sub.href !== subHref && location.pathname.startsWith(sub.href.split('?')[0] + '/') && sub.href.length > subHref.length
        );
        if (otherMoreSpecific) return false;
      }
      return true;
    }

    // 6. Support sub-route fallback to 'All Tickets' (e.g. /admin/support/download-issues, /admin/support/tickets/:id)
    if (subHref === '/admin/support/tickets' && (location.pathname.startsWith('/admin/support/') || location.pathname === '/admin/support')) {
      if (allSubOptions) {
        const siblingMatches = allSubOptions.some(sub => {
          if (sub.href === subHref) return false;
          const [siblingPath] = sub.href.split('?');
          return location.pathname === siblingPath || location.pathname.startsWith(siblingPath + '/');
        });
        if (siblingMatches) return false;
      }
      return true;
    }

    // Support users-staff aliases
    if ((subHref === '/admin/users' || subHref === '/admin/users/admin-users') && (location.pathname === '/admin/users' || location.pathname === '/admin/users/staff' || location.pathname === '/admin/users/admin-users')) {
      return true;
    }
    if ((subHref === '/admin/users/roles' || subHref === '/admin/roles') && (location.pathname === '/admin/users/roles' || location.pathname === '/admin/users/permissions' || location.pathname === '/admin/roles')) {
      return true;
    }

    return false;
  };

  const isMainActive = (item: NavMainItem) => {
    if (item.href) {
      if (item.href === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) {
        return true;
      }
      return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    }
    if (item.subOptions) {
      if (item.id === 'support' && (location.pathname.startsWith('/admin/support') || location.pathname === '/admin/support-page')) {
        return true;
      }
      return item.subOptions.some(sub => isSubActive(sub.href, item.subOptions));
    }
    return false;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    // Determine which item should be open based on current path
    const nextExpanded: Record<string, boolean> = {};
    PRIMARY_ADMIN_NAVIGATION.forEach(item => {
      if (item.subOptions) {
        const hasActiveChild = item.subOptions.some(sub => isSubActive(sub.href, item.subOptions));
        const isSupportParent = item.id === 'support' && (location.pathname.startsWith('/admin/support') || location.pathname === '/admin/support-page');
        if (hasActiveChild || isSupportParent) {
          nextExpanded[item.id] = true;
        }
      }
    });
    setExpandedItems(prev => ({ ...prev, ...nextExpanded }));
  }, [location.pathname, location.search]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#f0f7ff] text-slate-800 border-r border-sky-200/80 select-none">
      
      {/* 1. Header / KDW Admin Branding (Light Blue Mode) */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-sky-200/80 bg-sky-100/90">
        <Link 
          to="/admin/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 flex items-center justify-center font-serif font-bold text-white text-base shadow-xs group-hover:scale-105 transition-transform shrink-0">
            K
          </div>
          {!isCollapsed && (
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-slate-900 text-sm">KDW</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-600 text-white">
                  ADMIN
                </span>
              </div>
              <span className="text-[9px] font-sans font-bold tracking-widest text-sky-800 uppercase mt-0.5">
                CONTROL CENTER
              </span>
            </div>
          )}
        </Link>
        {isMobileOpen && (
          <button 
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-sky-200/60 transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. Navigation Items (Exact 22 Options Hierarchy in Light Blue Mode) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {PRIMARY_ADMIN_NAVIGATION.map((item) => {
          const Icon = item.icon;
          const hasSub = Boolean(item.subOptions && item.subOptions.length > 0);
          const isExpanded = Boolean(expandedItems[item.id]);
          const active = isMainActive(item);

          return (
            <div key={item.id} className="space-y-0.5">
              {hasSub ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-sky-200/90 text-blue-950 font-semibold shadow-2xs'
                        : 'text-slate-700 hover:text-blue-900 hover:bg-sky-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-500'}`} />
                      {!isCollapsed && (
                        <span className="truncate text-left">{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className="shrink-0 text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Sub-options tree */}
                  {!isCollapsed && isExpanded && item.subOptions && (
                    <div className="mt-1 ml-4 pl-3 border-l border-sky-200 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {item.subOptions.map((sub, sIdx) => {
                        const subActive = isSubActive(sub.href, item.subOptions);
                        return (
                          <Link
                            key={sIdx}
                            to={sub.href}
                            onClick={onCloseMobile}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11.5px] transition-colors ${
                              subActive
                                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-blue-900 hover:bg-sky-100/60'
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                            {subActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href || '/admin/dashboard'}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:text-blue-900 hover:bg-sky-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Footer / Administrator Identity */}
      <div className="p-3 border-t border-sky-200/80 bg-sky-100/80">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-200 border border-sky-300 flex items-center justify-center text-xs font-bold text-blue-800 shrink-0">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-900 truncate max-w-[120px]">
                  {adminName}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {adminRole}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            title="Sign out of Admin"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-sky-200/60 transition-colors focus:outline-none"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Permanent / Expandable Sidebar */}
      <aside 
        className={`hidden md:flex flex-col shrink-0 h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[276px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile} 
          />
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
