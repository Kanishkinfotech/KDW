import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SEO from '../SEO';
import { useAuth } from '../../context/AuthContext';
import { hasAdminRole } from '../../utils/authRoles';
import AdminLogin from '../../pages/admin/AdminLogin';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuth();

  const [hasSession, setHasSession] = useState(() => sessionStorage.getItem('admin_session') === 'true');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('kdw_admin_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setHasSession(sessionStorage.getItem('admin_session') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('admin_session_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('admin_session_updated', handleStorageChange);
    };
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('kdw_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (!isAuthenticated || !hasSession) {
    return <AdminLogin />;
  }

  const hasAdminAccess = hasAdminRole(user?.role);
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center p-6 text-[#171325] font-sans">
        <SEO title="Administrator Access Required | KDW" description="Restricted administrative area." />
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#e2e8f0] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-rose-600">
              ROLE RESTRICTION
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
              Administrator access required
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
              Your current account (<span className="font-mono text-slate-700">{user?.email}</span>) is assigned standard customer permissions and does not have administrative access.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans tracking-wide uppercase transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fcfbf9] overflow-hidden font-sans text-[#171325]">
      <SEO title="KDW Administration" description="Kanishk Digital World Admin Workspace" />
      
      {/* Dark near-black KDW Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fcfbf9]">
        <Topbar 
          onToggleCollapse={handleToggleCollapse}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Spacious Off-White Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#fcfbf9] p-4 sm:p-6 lg:p-8 custom-scrollbar w-full">
          <div className="w-full space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
