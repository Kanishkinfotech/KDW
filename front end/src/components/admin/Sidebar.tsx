import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Package, FolderTree, Layers, 
  ShoppingCart, Users, CreditCard, Ticket, Megaphone,
  Star, Download, LineChart, FileText, LifeBuoy, Bell, 
  Plug, Settings, Activity, Database, ShieldCheck, 
  Cpu, Webhook, LogOut, ChevronLeft, ChevronRight, X, HardDrive,
  PlusCircle, Clock, AlertCircle, CheckCircle2, Calendar, Archive, Tag as TagIcon, GitBranch
} from 'lucide-react';

const clsx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    group: 'Main',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
    ]
  },
  {
    group: 'Products',
    items: [
      { name: 'All Products', href: '/admin/products', icon: Package, exact: true },
      { name: 'Add Product', href: '/admin/products/new', icon: PlusCircle },
      { name: 'Drafts', href: '/admin/products?status=draft', icon: Clock },
      { name: 'Pending Review', href: '/admin/products?status=pending_review', icon: AlertCircle },
      { name: 'Published', href: '/admin/products?status=published', icon: CheckCircle2 },
      { name: 'Scheduled', href: '/admin/products?status=scheduled', icon: Calendar },
      { name: 'Archived', href: '/admin/products?status=archived', icon: Archive },
    ]
  },
  {
    group: 'Catalog',
    items: [
      { name: 'Categories', href: '/admin/categories', icon: FolderTree },
      { name: 'Tags', href: '/admin/tags', icon: TagIcon },
      { name: 'Bundles', href: '/admin/bundles', icon: Layers },
      { name: 'Product Files', href: '/admin/product-files', icon: HardDrive },
      { name: 'Product Versions', href: '/admin/product-versions', icon: GitBranch },
      { name: 'Licence Types', href: '/admin/licence-types', icon: ShieldCheck },
      { name: 'Attributes', href: '/admin/attributes', icon: Cpu },
    ]
  },
  {
    group: 'Sales & Fulfillment',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Payments', href: '/admin/payments', icon: CreditCard },
      { name: 'Coupons & Offers', href: '/admin/coupons', icon: Ticket },
    ]
  },
  {
    group: 'Engagement & Fulfillment',
    items: [
      { name: 'Marketing Campaigns', href: '/admin/campaigns', icon: Megaphone },
      { name: 'Review Management', href: '/admin/reviews', icon: Star },
      { name: 'Download Management', href: '/admin/downloads', icon: Download },
      { name: 'Reports & Analytics', href: '/admin/analytics', icon: LineChart },
      { name: 'Content', href: '/admin/content', icon: FileText },
      { name: 'Support', href: '/admin/support-page', icon: LifeBuoy },
      { name: 'Mail / Notifications', href: '/admin/notifications', icon: Bell },
    ]
  },
  {
    group: 'Administration & System',
    items: [
      { name: 'Integrations', href: '/admin/integrations', icon: Plug },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'System', href: '/admin/health', icon: Activity },
      { name: 'Cache', href: '/admin/cache', icon: Database },
      { name: 'Admin Users & Staff', href: '/admin/users', icon: ShieldCheck },
      { name: 'Automation', href: '/admin/automation', icon: Cpu },
      { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
    ]
  }
];

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const isLinkActive = (href: string, exact?: boolean) => {
    if (href === '/admin/dashboard' || href === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={clsx(
        'fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out',
        isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
        isCollapsed ? 'md:w-20' : 'md:w-64'
      )}>
        {/* Brand & Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0 bg-slate-950/40">
          <Link 
            to="/admin/dashboard" 
            onClick={onCloseMobile}
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/25 shrink-0 group-hover:scale-105 transition-transform">
              K
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-base tracking-tight truncate">KDW Admin</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Digital World</span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {group.group}
                </h3>
              )}
              {group.items.map((item) => {
                const active = isLinkActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.name : undefined}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium group relative',
                      isCollapsed ? 'justify-center' : '',
                      active 
                        ? 'bg-primary text-white font-bold shadow-lg shadow-primary/25' 
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    )}
                  >
                    <Icon 
                      size={19} 
                      className={clsx(
                        'shrink-0 transition-transform duration-150 group-hover:scale-110',
                        active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )} 
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}

                    {/* Active Pip indicator on collapsed */}
                    {isCollapsed && active && (
                      <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Profile / Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <button 
            onClick={logout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-sm font-medium w-full text-left',
              isCollapsed ? 'justify-center' : ''
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

 
