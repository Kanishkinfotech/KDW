import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Layers, 
  Tag, 
  ShoppingBag, 
  Users, 
  PhoneCall, 
  BarChart3 
} from 'lucide-react';

export default function QuickActionsBar() {
  const actions = [
    { label: 'Add Product', href: '/admin/products/new', icon: PlusCircle, primary: true },
    { label: 'Create Bundle', href: '/admin/bundles/new', icon: Layers },
    { label: 'Create Coupon', href: '/admin/coupons', icon: Tag },
    { label: 'View Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Support Queue', href: '/admin/support/tickets', icon: PhoneCall },
    { label: 'Sales Reports', href: '/admin/reports/sales', icon: BarChart3 },
  ];

  return (
    <div className="kdw-card p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            WORKFLOW LAUNCHPAD
          </span>
          <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
            Quick Actions
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              to={act.href}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold font-sans transition-all kdw-button-press shadow-2xs ${
                act.primary
                  ? 'bg-[#5b21b6] hover:bg-[#6d28d9] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${act.primary ? 'text-white' : 'text-[#5b21b6]'}`} />
              <span>{act.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
