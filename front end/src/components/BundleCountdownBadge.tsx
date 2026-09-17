import React, { useState, useEffect } from 'react';
import { Clock, Zap, AlertCircle } from 'lucide-react';
import { formatTimeRemaining } from '../utils/bundlePricing';

interface BundleCountdownBadgeProps {
  offerEndAt?: string | null;
  offerStartAt?: string | null;
  className?: string;
  variant?: 'badge' | 'banner' | 'card' | 'pill';
  onExpire?: () => void;
}

export default function BundleCountdownBadge({
  offerEndAt,
  offerStartAt,
  className = '',
  variant = 'badge',
  onExpire
}: BundleCountdownBadgeProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!offerEndAt) return;
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);
      if (offerEndAt && current > new Date(offerEndAt)) {
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [offerEndAt, onExpire]);

  if (!offerEndAt) return null;

  const endDate = new Date(offerEndAt);
  const diffMs = endDate.getTime() - now.getTime();
  const isExpired = diffMs <= 0;

  if (isExpired) {
    if (variant === 'banner') {
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-mono font-bold border border-slate-200 ${className}`}>
          <AlertCircle size={14} className="text-slate-400" />
          <span>Limited Time Deal Expired</span>
        </div>
      );
    }
    return null;
  }

  const { days, hours, minutes, seconds, formatted } = formatTimeRemaining(diffMs);

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-200 text-[10px] font-mono font-bold tracking-tight shadow-2xs ${className}`}>
        <Zap size={12} className="text-rose-600 fill-rose-600 animate-pulse shrink-0" />
        <span>Ends in: {formatted}</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Zap size={18} className="text-yellow-300 fill-yellow-300 animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-1.5">
              <span>Limited Time Special Bundle Deal</span>
            </div>
            <div className="text-xs text-white/90">
              Special offer pricing ends strictly at the deadline.
            </div>
          </div>
        </div>

        {/* Live Timer Boxes */}
        <div className="flex items-center gap-1.5 font-mono text-center shrink-0">
          {days > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20">
              <span className="block text-sm font-black text-white">{days}</span>
              <span className="block text-[8px] uppercase tracking-wider text-white/70">Days</span>
            </div>
          )}
          <div className="px-2.5 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20">
            <span className="block text-sm font-black text-white">{String(hours).padStart(2, '0')}</span>
            <span className="block text-[8px] uppercase tracking-wider text-white/70">Hours</span>
          </div>
          <span className="text-white/80 font-bold">:</span>
          <div className="px-2.5 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20">
            <span className="block text-sm font-black text-white">{String(minutes).padStart(2, '0')}</span>
            <span className="block text-[8px] uppercase tracking-wider text-white/70">Mins</span>
          </div>
          <span className="text-white/80 font-bold">:</span>
          <div className="px-2.5 py-1.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20">
            <span className="block text-sm font-black text-white text-yellow-300">{String(seconds).padStart(2, '0')}</span>
            <span className="block text-[8px] uppercase tracking-wider text-white/70">Secs</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: 'badge' or 'card'
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-xs border border-white/20 ${className}`}>
      <Clock size={11} className="shrink-0 animate-pulse text-yellow-300" />
      <span>Ends in {formatted}</span>
    </div>
  );
}
