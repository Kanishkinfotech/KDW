import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Heart, ShoppingCart } from 'lucide-react';
import Navigation from './Navigation';
import ProfileDropdown from './ProfileDropdown';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import { useStore } from '../../../store/useStore';

export default function Header() {
  const { cart, wishlist } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scrolled state for background styling
      setIsScrolled(currentScrollY > 20);

      // Handle hide/show on scroll
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY && !isScrollingDown) {
          setIsScrollingDown(true); // Scrolling down - hide header
        } else if (currentScrollY < lastScrollY && isScrollingDown) {
          setIsScrollingDown(false); // Scrolling up - show header
        }
      } else {
        setIsScrollingDown(false); // Always show near top
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isScrollingDown]);

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ease-in-out ${isScrollingDown ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className={`transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm py-3' : 'bg-white/95 backdrop-blur-lg border-b border-slate-200 py-4'}`}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8 h-full">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0 z-50">
              <div className={`flex items-center justify-center font-black text-slate-900 bg-white rounded-xl transition-all duration-300 shadow-sm group-hover:shadow-md group-active:scale-95 ${isScrolled ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-2xl'}`}>
                K
              </div>
              <div className="hidden sm:block">
                <div className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
                  Kanishk Digital World
                </div>
              </div>
            </Link>

            {/* Desktop Navigation & Search */}
            <div className="hidden lg:flex items-center justify-between flex-1 gap-6 ml-6">
              <Navigation />
              <div className="w-full max-w-md">
                <SearchBar />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Link 
                to="/wishlist"
                className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              
              <Link 
                to="/cart"
                className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {cart.length}
                  </span>
                )}
              </Link>

              <div className="h-6 w-px bg-slate-200 hidden lg:block mx-1"></div>
              
              <ProfileDropdown />

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
                aria-label="Open mobile menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-[76px]"></div>
    </>
  );
}
