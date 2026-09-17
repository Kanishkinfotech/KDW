import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAdminRole } from '../utils/authRoles';
import { ShieldAlert, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import SEO from '../components/SEO';

export default function AdminRoute() {
  const { user, isAuthenticated, authState, logout } = useAuth();
  const location = useLocation();

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#5b21b6] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 font-sans">Verifying administrative security...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  const isAuthorizedAdmin = hasAdminRole(user.role);

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center p-6 text-[#171325] font-sans">
        <SEO title="403 Forbidden | KDW Admin" description="Restricted administrative access." />
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#e2e8f0] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-rose-600">
              403 FORBIDDEN
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
              Administrator access required
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
              Your account (<span className="font-mono text-slate-700">{user.email}</span>) is assigned standard customer permissions and does not have administrative privileges.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/admin/login"
              onClick={async () => {
                await logout();
              }}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans tracking-wide uppercase transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out & Open Admin Login</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans tracking-wide uppercase transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
