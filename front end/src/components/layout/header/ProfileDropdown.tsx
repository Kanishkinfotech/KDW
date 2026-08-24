import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LayoutDashboard, ShoppingBag, FileText, Download, Key, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileDropdown() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  if (!user || !isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          to="/login" 
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
        >
          Sign In
        </Link>
        <Link 
          to="/register" 
          className="text-sm font-semibold bg-white text-slate-900 px-5 py-2.5 rounded-full hover:bg-slate-100 transition-all shadow-sm active:scale-95"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">{user.name}</span>
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-inner">
          {initial}
        </div>
        <ChevronDown size={14} className={`text-slate-600 mr-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <p className="font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
            </div>

            <div className="p-2">
              <DropdownLink to="/account" icon={LayoutDashboard} label="Account Overview" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/library" icon={ShoppingBag} label="My Library" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/orders" icon={FileText} label="Orders & Invoices" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/downloads" icon={Download} label="Downloads" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/licenses" icon={Key} label="Licenses" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/support" icon={Key} label="Support Requests" onClick={() => setIsOpen(false)} />
              
              <div className="h-px bg-slate-100 my-2 mx-2"></div>
              
              <DropdownLink to="/account/profile" icon={Settings} label="Profile & Settings" onClick={() => setIsOpen(false)} />
              
              <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-xl transition-colors font-medium mt-1"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownLink({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors font-medium"
    >
      <Icon size={16} className="text-slate-600" /> {label}
    </Link>
  );
}
