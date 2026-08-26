import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Package, FolderTree, Layers, 
  ShoppingCart, Users, CreditCard, Ticket, Megaphone,
  Star, Download, LineChart, FileText, LifeBuoy, Bell, Plug, Settings, Activity, Database, ShieldCheck,
  PlusCircle, Clock, AlertCircle, CheckCircle2, Calendar, Archive, Tag as TagIcon, GitBranch, Flame,
  KeyRound, ShoppingBag, HardDrive, X, Cpu, Webhook, ChevronLeft, ChevronRight, LogOut,
  BookOpen, HelpCircle, Image as ImageIcon, MessageSquare, FolderOpen, Menu, ArrowRightLeft, Search,
  LayoutTemplate, FileEdit, CheckSquare, History, BarChart3,
  DollarSign, Lock, Mail, Store, ArrowDownToLine,
  AlertTriangle, AlertOctagon, PauseCircle, Globe, Radio, Shield, Zap
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
    ]
  },
  {
    group: 'Bundles & Packages',
    items: [
      { name: 'All Bundles', href: '/admin/bundles', icon: Layers, exact: true },
    ]
  },
  {
    group: 'Catalog & Structure',
    items: [
      { name: 'Categories', href: '/admin/categories', icon: FolderTree },
      { name: 'Product Files', href: '/admin/product-files', icon: HardDrive },
      { name: 'Licence Types', href: '/admin/licence-types', icon: ShieldCheck },
    ]
  },
  {
    group: 'Sales & Fulfillment',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Digital Deliveries', href: '/admin/digital-deliveries', icon: HardDrive },
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Payments', href: '/admin/payments', icon: CreditCard },
      { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
      { name: 'Offers & Promotions', href: '/admin/offers', icon: Flame },
    ]
  },
  {
    group: 'Download Management',
    items: [
      { name: 'Overview', href: '/admin/downloads', icon: LayoutDashboard, exact: true },
      { name: 'Entitlements', href: '/admin/downloads/entitlements', icon: ShieldCheck },
      { name: 'Tokens', href: '/admin/downloads/tokens', icon: TagIcon },
      { name: 'Activity', href: '/admin/downloads/activity', icon: Clock },
      { name: 'Failed Downloads', href: '/admin/downloads/failed', icon: AlertCircle },
      { name: 'Expired Access', href: '/admin/downloads/expired', icon: Archive },
      { name: 'Revoked Access', href: '/admin/downloads/revoked', icon: X },
      { name: 'Product Files', href: '/admin/downloads/product-files', icon: HardDrive },
      { name: 'Overrides', href: '/admin/downloads/overrides', icon: GitBranch },
    ]
  },
  {
    group: 'Reports & Analysis',
    items: [
      { name: 'Customer Report', href: '/admin/reports/customers', icon: Users },
      { name: 'Customer Login Report', href: '/admin/reports/logins', icon: KeyRound },
      { name: 'Customer Buy Analysis', href: '/admin/reports/buy-analysis', icon: ShoppingBag },
      { name: 'Coupon Report', href: '/admin/reports/coupons', icon: Ticket },
      { name: 'Download Report', href: '/admin/reports/downloads', icon: Download },
      { name: 'Sales & Revenue', href: '/admin/reports/sales', icon: LineChart },
      { name: 'Product Performance', href: '/admin/reports/product-performance', icon: Package },
      { name: 'Export Center', href: '/admin/reports/export-center', icon: FileText },
    ]
  },
  {
    group: 'Content Management',
    items: [
      { name: 'Overview', href: '/admin/content/overview', icon: LayoutDashboard },
      { name: 'Pages', href: '/admin/content/pages', icon: FileText },
      { name: 'Blogs', href: '/admin/content/blogs', icon: BookOpen },
      { name: 'FAQs', href: '/admin/content/faqs', icon: HelpCircle },
      { name: 'Banners', href: '/admin/content/banners', icon: ImageIcon },
      { name: 'Customer Feedback', href: '/admin/content/feedback', icon: MessageSquare },
      { name: 'Media Library', href: '/admin/content/media', icon: FolderOpen },
      { name: 'Navigation Menus', href: '/admin/content/navigation', icon: Menu },
      { name: 'Redirects', href: '/admin/content/redirects', icon: ArrowRightLeft },
      { name: 'SEO Settings', href: '/admin/content/seo', icon: Search },
      { name: 'Content Templates', href: '/admin/content/templates', icon: LayoutTemplate },
      { name: 'Drafts', href: '/admin/content/drafts', icon: FileEdit },
      { name: 'Scheduled Content', href: '/admin/content/scheduled', icon: Clock },
      { name: 'Approval Queue', href: '/admin/content/approval-queue', icon: CheckSquare },
      { name: 'Revisions', href: '/admin/content/revisions', icon: History },
      { name: 'Content Analytics', href: '/admin/content/analytics', icon: BarChart3 },
    ]
  },
  {
    group: 'Support & Help Desk',
    items: [
      { name: 'Overview', href: '/admin/support/overview', icon: LayoutDashboard },
      { name: 'All Tickets', href: '/admin/support/tickets', icon: Ticket, exact: true },
      { name: 'New Tickets', href: '/admin/support/new-tickets', icon: PlusCircle },
      { name: 'My Tickets', href: '/admin/support/my-assigned-tickets', icon: Users },
      { name: 'Unassigned', href: '/admin/support/unassigned', icon: AlertCircle },
      { name: 'High-Priority', href: '/admin/support/high-priority', icon: Flame },
      { name: 'Overdue (SLA)', href: '/admin/support/overdue', icon: Clock },
      { name: 'Download Issues', href: '/admin/support/download-issues', icon: Download },
      { name: 'Licence Issues', href: '/admin/support/licence-issues', icon: KeyRound },
      { name: 'Refund Requests', href: '/admin/support/refund-requests', icon: ArrowRightLeft },
      { name: 'Payment Queries', href: '/admin/support/payment-queries', icon: CreditCard },
      { name: 'Product Questions', href: '/admin/support/product-questions', icon: HelpCircle },
      { name: 'Contact Queries', href: '/admin/support/contact-queries', icon: MessageSquare },
      { name: 'Customer Requests', href: '/admin/support/customer-requests', icon: Users },
      { name: 'Escalated', href: '/admin/support/escalated', icon: AlertCircle },
      { name: 'Resolved', href: '/admin/support/resolved', icon: CheckCircle2 },
      { name: 'Closed', href: '/admin/support/closed', icon: Archive },
      { name: 'Canned Responses', href: '/admin/support/canned-responses', icon: FileEdit },
      { name: 'SLA Settings', href: '/admin/support/sla-settings', icon: Settings },
      { name: 'CSAT', href: '/admin/support/satisfaction', icon: Star },
      { name: 'Support Reports', href: '/admin/support/reports', icon: BarChart3 },
    ]
  },
  {
    group: 'Engagement & Marketing',
    items: [
      { name: 'Marketing Campaigns', href: '/admin/campaigns', icon: Megaphone },
      { name: 'Reviews & Ratings', href: '/admin/reviews', icon: Star },
      { name: 'Mail / Notifications', href: '/admin/notifications', icon: Bell },
    ]
  },
  {
    group: 'Settings & Configuration',
    items: [
      { name: 'Settings Dashboard', href: '/admin/settings/dashboard', icon: Settings },
      { name: 'General Settings', href: '/admin/settings/general', icon: Store },
      { name: 'Storefront', href: '/admin/settings/store', icon: Store },
      { name: 'Currency & Tax', href: '/admin/settings/currency-tax', icon: DollarSign },
      { name: 'Checkout & Payments', href: '/admin/settings/checkout', icon: CreditCard },
      { name: 'Downloads & Delivery', href: '/admin/settings/downloads', icon: ArrowDownToLine },
      { name: 'Email Provider', href: '/admin/settings/email', icon: Mail },
      { name: 'Security & Access', href: '/admin/settings/security', icon: ShieldCheck },
      { name: 'Privacy & GDPR', href: '/admin/settings/privacy', icon: Lock },
      { name: 'Legal Documents', href: '/admin/settings/legal-documents', icon: FileText },
      { name: 'Audit History', href: '/admin/settings/audit', icon: History },
    ]
  },
  {
    group: 'Cache Management',
    items: [
      { name: 'Cache Overview', href: '/admin/cache/overview', icon: Database },
      { name: 'Temporary Data', href: '/admin/cache/temporary-data', icon: Layers },
      { name: 'Cache Keys', href: '/admin/cache/keys', icon: KeyRound },
      { name: 'Namespaces', href: '/admin/cache/namespaces', icon: FolderOpen },
      { name: 'Statistics', href: '/admin/cache/statistics', icon: BarChart3 },
      { name: 'Invalidation', href: '/admin/cache/invalidation', icon: Flame },
      { name: 'Warming', href: '/admin/cache/warming', icon: Flame },
      { name: 'Maintenance', href: '/admin/cache/maintenance', icon: Cpu },
      { name: 'Failed Jobs', href: '/admin/cache/failed-jobs', icon: AlertTriangle },
      { name: 'Cache Audit', href: '/admin/cache/audit', icon: History },
    ]
  },
  {
    group: 'Users & Staff Governance',
    items: [
      { name: 'Admin Users', href: '/admin/users/admin-users', icon: Users },
      { name: 'Staff Profiles', href: '/admin/users/staff', icon: ShieldCheck },
      { name: 'Roles', href: '/admin/users/roles', icon: KeyRound },
      { name: 'Permissions', href: '/admin/users/permissions', icon: Lock },
      { name: 'Teams & Depts', href: '/admin/users/teams', icon: Layers },
      { name: 'Invitations', href: '/admin/users/invitations', icon: Mail },
      { name: 'Active Sessions', href: '/admin/users/sessions', icon: Shield },
      { name: 'Activity Logs', href: '/admin/users/activity-logs', icon: Activity },
      { name: 'Access Reviews', href: '/admin/users/access-reviews', icon: CheckCircle2 },
      { name: 'Suspended Users', href: '/admin/users/suspended', icon: AlertOctagon },
      { name: 'User Settings', href: '/admin/users/settings', icon: Settings },
    ]
  },
  {
    group: 'Automation & Workflows',
    items: [
      { name: 'Automation Overview', href: '/admin/automation/overview', icon: Zap },
      { name: 'Order Rules', href: '/admin/automation/orders', icon: ShoppingCart },
      { name: 'Email Automation', href: '/admin/automation/emails', icon: Mail },
      { name: 'Customer Rules', href: '/admin/automation/customers', icon: Users },
      { name: 'Download Rules', href: '/admin/automation/downloads', icon: Download },
      { name: 'Licence Rules', href: '/admin/automation/licences', icon: KeyRound },
      { name: 'Workflow Builder', href: '/admin/automation/builder', icon: GitBranch },
      { name: 'Templates (14)', href: '/admin/automation/templates', icon: Layers },
      { name: 'Webhooks', href: '/admin/automation/webhooks', icon: Webhook },
      { name: 'Workflow Runs', href: '/admin/automation/runs', icon: Activity },
      { name: 'Failed Jobs', href: '/admin/automation/failed-jobs', icon: AlertTriangle },
      { name: 'Dead-Letter (DLQ)', href: '/admin/automation/dead-letter', icon: Flame },
      { name: 'Schedules', href: '/admin/automation/schedules', icon: Calendar },
      { name: 'Automation Settings', href: '/admin/automation/settings', icon: Settings },
    ]
  },
  {
    group: 'System & Infrastructure',
    items: [
      { name: 'System Dashboard', href: '/admin/system/dashboard', icon: Activity },
      { name: 'System Health', href: '/admin/system/health', icon: Activity },
      { name: 'Error Logs', href: '/admin/system/errors', icon: AlertTriangle },
      { name: 'Login Logs', href: '/admin/system/logins', icon: Shield },
      { name: 'Audit Logs', href: '/admin/system/audit-logs', icon: FileText },
      { name: 'API Logs', href: '/admin/system/api-logs', icon: Globe },
      { name: 'Webhook Logs', href: '/admin/system/webhook-logs', icon: Radio },
      { name: 'Background Jobs', href: '/admin/system/jobs', icon: Cpu },
      { name: 'Backups & Recovery', href: '/admin/system/backups', icon: Database },
      { name: 'Maintenance Mode', href: '/admin/system/maintenance', icon: PauseCircle },
      { name: 'Incidents', href: '/admin/system/incidents', icon: AlertOctagon },
      { name: 'Monitoring Alerts', href: '/admin/system/alerts', icon: Bell },
      { name: 'System Reports', href: '/admin/system/reports', icon: BarChart3 },
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

 
