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
    { name: 'Admin Users & Staff', href: '/admin/users/admin-users', icon: Users },
    { name: 'Roles & Permissions', href: '/admin/users/roles', icon: KeyRound },
    { name: 'Activity Logs', href: '/admin/users/activity-logs', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl p-6 shadow-xs text-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              RBAC & Zero-Trust Governance Active
            </span>
            <span className="text-xs text-slate-500 font-medium">Least-Privilege Scopes Enforced</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Users, Staff & Access Governance
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Admin personnel, staff directory, 3 roles (Super Admin, Admin, Inventory Manager), and audit logging.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start md:self-auto px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200 shadow-2xs flex items-center gap-2 cursor-pointer"
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
