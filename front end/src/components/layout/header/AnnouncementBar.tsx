import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  const { activeCoupons } = useStore();
  const [isVisible, setIsVisible] = useState(true);
  const [bestCoupon, setBestCoupon] = useState<any>(null);

  useEffect(() => {
    // Check if dismissed previously
    const dismissed = sessionStorage.getItem('announcement_dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      return;
    }

    if (activeCoupons && activeCoupons.length > 0) {
      // Find a valid coupon
      const validCoupon = activeCoupons.find(c => {
        if (c.expiryDate && new Date(c.expiryDate) < new Date()) return false;
        if (c.usageLimit && c.usedCount >= c.usageLimit) return false;
        return true;
      });
      setBestCoupon(validCoupon || null);
    }
  }, [activeCoupons]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('announcement_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-2 relative z-50 text-sm font-medium transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">
        <div className="flex items-center gap-2 text-center">
          {bestCoupon ? (
            <>
              <Tag size={16} className="text-primary hidden sm:block" />
              <span>
                🔥 Launch Sale — Save {bestCoupon.discountType === 'PERCENTAGE' ? `${bestCoupon.discountValue}%` : `₹${bestCoupon.discountValue}`} on selected products
              </span>
              <Link to="/categories/all-products" className="underline underline-offset-2 hover:text-primary transition-colors font-bold ml-1">
                Shop Now →
              </Link>
            </>
          ) : (
            <>
              <span>✨ Premium Digital Products • Instant Access • Secure Payments</span>
              <Link to="/categories/all-products" className="underline underline-offset-2 hover:text-primary transition-colors font-bold ml-2">
                Explore →
              </Link>
            </>
          )}
        </div>
        
        <button 
          onClick={handleDismiss}
          className="absolute right-0 p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Dismiss announcement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
