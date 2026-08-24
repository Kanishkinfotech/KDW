import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SEO from '../SEO';
import { useAuth } from '../../context/AuthContext';
import AdminLogin from '../../pages/admin/AdminLogin';

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

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  if (!isAuthenticated || !hasSession) {
    return <AdminLogin />;
  }

  const role = (user && user.role) ? String(user.role).toLowerCase() : '';
  if (role !== 'admin' && role !== 'super_admin') {
    // If they are logged in as a customer but trying to access admin, show them the admin login page
    return <AdminLogin />;
  }

  return (
    <div className="flex h-screen bg-slate-100/60 overflow-hidden font-sans text-slate-900">
      <SEO title="Admin Dashboard | KDW" description="Kanishk Digital World Admin Control Center" />
      
      {/* Dark KDW Sidebar with Collapsible & Drawer support */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={handleCloseMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Topbar 
          onToggleCollapse={handleToggleCollapse}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
