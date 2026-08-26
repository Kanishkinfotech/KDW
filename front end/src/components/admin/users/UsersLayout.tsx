import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  KeyRound,
  Lock,
  Layers,
  Mail,
  Smartphone,
  Activity,
  UserCheck,
  UserX,
  Settings,
  RefreshCw
} from 'lucide-react';

interface UsersLayoutProps {
  children?: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const UsersLayout: React.FC<UsersLayoutProps> = ({ children, onRefresh, isLoading }) => {
  const navItems = [
    { name: 'Admin Users', href: '/admin/users/admin-users', icon: Users },
    { name: 'Staff Profiles', href: '/admin/users/staff', icon: ShieldCheck },
    { name: 'Roles', href: '/admin/users/roles', icon: KeyRound },
    { name: 'Permissions', href: '/admin/users/permissions', icon: Lock },
    { name: 'Teams & Depts', href: '/admin/users/teams', icon: Layers },
    { name: 'Invitations', href: '/admin/users/invitations', icon: Mail },
    { name: 'Active Sessions', href: '/admin/users/sessions', icon: Smartphone },
    { name: 'Activity Logs', href: '/admin/users/activity-logs', icon: Activity },
    { name: 'Access Reviews', href: '/admin/users/access-reviews', icon: UserCheck },
    { name: 'Suspended Users', href: '/admin/users/suspended', icon: UserX },
    { name: 'User Settings', href: '/admin/users/settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              RBAC & Zero-Trust Governance Active
            </span>
            <span className="text-xs text-slate-400">Least-Privilege Scopes Enforced</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Users, Staff & Access Governance
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Admin personnel, staff profiles, 10 default roles, granular scoped permissions, invitations, and active sessions.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            Refresh Directory
          </button>
        )}
      </div>

      {/* Navigation Submenu Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {children}
    </div>
  );
};
export default UsersLayout;
