import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  LayoutDashboard, ShoppingBag, FileText, Download, Key, 
  Settings, LogOut, ChevronDown, Heart, HelpCircle, User
} from 'lucide-react';
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
      <div className="flex items-center gap-2.5">
        <Link 
          to="/login" 
          className="text-xs font-bold text-slate-300 hover:text-white transition-colors px-3 py-2"
        >
          Sign In
        </Link>
        <Link 
          to="/register" 
          className="text-xs font-black bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
        >
          <User size={13} />
          <span>Sign Up</span>
        </Link>
      </div>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 p-1.5 pl-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isOpen ? 'ring-2 ring-primary/30 border-primary/50' : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex flex-col text-left hidden sm:block leading-tight">
          <span className="text-xs font-bold text-white max-w-[110px] truncate">{user.name}</span>
          <span className="text-[10px] text-slate-400 font-medium">My Account</span>
        </div>
        
        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs shadow-inner shrink-0">
          {initial}
        </div>
        
        <ChevronDown size={13} className={`text-slate-400 mr-1 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-light' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right text-slate-900"
          >
            {/* Header / User Info */}
            <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-xs truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-0.5">
              <DropdownLink to="/account" icon={LayoutDashboard} label="Overview" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/library" icon={ShoppingBag} label="My Library" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/orders" icon={FileText} label="Orders & Invoices" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/downloads" icon={Download} label="Downloads" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/licenses" icon={Key} label="Licenses" onClick={() => setIsOpen(false)} />
              <DropdownLink to="/account/support" icon={HelpCircle} label="Contact Support" onClick={() => setIsOpen(false)} />
              
              <div className="h-px bg-slate-100 my-1.5 mx-2"></div>
              
              <DropdownLink to="/account/profile" icon={Settings} label="Profile Settings" onClick={() => setIsOpen(false)} />
              
              <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold mt-1 cursor-pointer"
              >
                <LogOut size={15} /> <span>Sign Out</span>
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
      className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors font-bold"
    >
      <Icon size={15} className="text-slate-400 group-hover:text-primary" /> 
      <span>{label}</span>
    </Link>
  );
}

