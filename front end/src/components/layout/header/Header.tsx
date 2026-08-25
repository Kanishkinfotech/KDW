import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Heart, ShoppingCart, Sparkles, Flame, HelpCircle, Package, ArrowRight } from 'lucide-react';
import AllCategoriesDropdown from './AllCategoriesDropdown';
import ProfileDropdown from './ProfileDropdown';
import MobileMenu from './MobileMenu';
import AllSidebarDrawer from './AllSidebarDrawer';
import SearchBar from './SearchBar';
import { useStore } from '../../../store/useStore';

export default function Header() {
  const { cart, wishlist } = useStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAllSidebarOpen, setIsAllSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 shadow-md">
        
        {/* ======================================================== */}
        {/* ROW 1 — PRIMARY HEADER (Dark Navy #0B1120)                */}
        {/* ======================================================== */}
        <div className="bg-[#0B1120] text-white border-b border-slate-800/80">
          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
            
            {/* LEFT: KDW Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0 select-none">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-purple-800 flex items-center justify-center font-black text-white text-xl shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
                K
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-white text-base leading-none tracking-tight group-hover:text-primary-light transition-colors">
                  Kanishk Digital World
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Digital Store & Assets
                </div>
              </div>
            </Link>

            {/* CENTER / LEFT: [ All Categories ▼ ] + [ Search for products... ] [ Search ] */}
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-4xl ml-2">
              <AllCategoriesDropdown variant="primary" />
              <div className="flex-1">
                <SearchBar variant="header" />
              </div>
            </div>

            {/* RIGHT: [ Returns & Orders ] [ Cart + Count ] [ Wishlist ] [ Profile / Account ] */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Returns & Orders Link */}
              <Link 
                to="/account/orders"
                className="hidden md:flex flex-col text-left px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer leading-tight"
                aria-label="Returns and Orders"
              >
                <span className="text-[10px] text-slate-400 font-medium">Returns</span>
                <span className="text-xs font-bold text-white">& Orders</span>
              </Link>

              {/* Wishlist Link */}
              <Link 
                to="/wishlist"
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all text-xs font-bold relative cursor-pointer"
                aria-label="Wishlist"
              >
                <Heart size={16} className={`text-slate-300 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="hidden xl:inline">Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              
              {/* Cart Link */}
              <Link 
                to="/cart"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all text-xs font-bold relative cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingCart size={16} className="text-primary-light" />
                <span className="hidden sm:inline">Cart</span>
                {cart.length > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {cart.length}
                  </span>
                ) : (
                  <span className="min-w-[18px] h-[18px] px-1 bg-slate-700 text-slate-300 text-[10px] font-black rounded-full flex items-center justify-center">
                    0
                  </span>
                )}
              </Link>

              <div className="h-6 w-px bg-slate-800 hidden sm:block mx-0.5"></div>
              
              {/* User Avatar & Profile Dropdown */}
              <ProfileDropdown />

              {/* Mobile Menu Toggle */}
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95 cursor-pointer"
                aria-label="Open mobile menu"
              >
                <Menu size={22} />
              </button>
            </div>

          </div>

          {/* Mobile Search Bar for small screens */}
          <div className="md:hidden px-4 pb-2.5">
            <SearchBar variant="header" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* ROW 2 — SECONDARY NAVIGATION (Dark Navy #070C18)           */}
        {/* ======================================================== */}
        <div className="bg-[#070C18] text-slate-300 text-xs border-b border-slate-800/80">
          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-2 flex items-center justify-between overflow-x-auto gap-4 custom-scrollbar whitespace-nowrap">
            
            {/* LEFT: ☰ All + Secondary Navigation Links */}
            <div className="flex items-center gap-1 sm:gap-2 font-bold">
              {/* ☰ All Navigation Button (Opens Amazon-Style Left Sidebar Drawer) */}
              <button
                type="button"
                onClick={() => setIsAllSidebarOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-slate-800/80 transition-colors cursor-pointer select-none border border-transparent hover:border-slate-700 active:scale-95 shrink-0"
                aria-label="Open all navigation sidebar"
              >
                <Menu size={16} className="text-white" />
                <span className="font-extrabold text-white text-[13px] tracking-tight">All</span>
              </button>

              <span className="text-slate-700 hidden sm:inline">|</span>

              <NavLink to="/bundles" label="Bundles" currentPath={location.pathname} />
              <NavLink to="/categories/templates" label="Templates" currentPath={location.pathname} />
              <NavLink to="/categories/graphics" label="Graphics" currentPath={location.pathname} />
              <NavLink to="/categories/ui-kits" label="UI Kits" currentPath={location.pathname} />
              <NavLink to="/categories/plugins" label="Plugins" currentPath={location.pathname} />
              <NavLink to="/categories/resources" label="Resources" currentPath={location.pathname} />

              {/* New Arrivals with [NEW] badge */}
              <Link 
                to="/new-arrivals"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  location.pathname === '/new-arrivals'
                    ? 'text-primary-light bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles size={13} className="text-purple-400" />
                <span>New Arrivals</span>
                <span className="px-1.5 py-0.2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black uppercase rounded shadow-xs">
                  NEW
                </span>
              </Link>

              {/* Deals with [HOT] badge */}
              <Link 
                to="/best-sellers"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  location.pathname === '/best-sellers'
                    ? 'text-amber-400 bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Flame size={13} className="text-amber-500" />
                <span>Deals</span>
                <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase rounded shadow-xs">
                  HOT
                </span>
              </Link>
            </div>

            {/* RIGHT: Support + Track Order */}
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 shrink-0">
              <Link 
                to="/support" 
                className="hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60"
              >
                <HelpCircle size={13} className="text-slate-400" />
                <span>Support</span>
              </Link>
              <span className="text-slate-700">•</span>
              <Link 
                to="/account/orders" 
                className="hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60"
              >
                <Package size={13} className="text-slate-400" />
                <span>Track Order</span>
              </Link>
            </div>

          </div>
        </div>

      </header>
      
      {/* Amazon-Style Slide-out Left Sidebar Drawer triggered by ☰ All */}
      <AllSidebarDrawer isOpen={isAllSidebarOpen} onClose={() => setIsAllSidebarOpen(false)} />

      {/* Mobile Drawer Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Spacer to offset fixed two-row header */}
      <div className="h-[96px] sm:h-[98px]"></div>
    </>
  );
}

function NavLink({ to, label, currentPath }: { to: string; label: string; currentPath: string }) {
  const isActive = currentPath === to || (to !== '/' && currentPath.startsWith(to));
  return (
    <Link 
      to={to} 
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        isActive 
          ? 'text-primary-light bg-slate-800/80 shadow-xs' 
          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
      }`}
    >
      {label}
    </Link>
  );
}

