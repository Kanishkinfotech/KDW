import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowDownRight, ArrowUpRight, DollarSign, RefreshCw, ShieldCheck } from 'lucide-react';
import SEO from '../../../components/SEO';
import StatCard from '../../../components/admin/StatCard';
import ReportFilterBar from '../../../components/admin/ReportFilterBar';
import { formatCurrency } from '../../../utils/currency';

export default function AdminRevenueReport() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/revenue?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [range]);

  const kpis = data?.kpis || {};
  const waterfall = data?.waterfall || [];
  const paymentMethods = data?.paymentMethods || [];

  return (
    <div className="space-y-6">
      <SEO title="Revenue & Waterfall Report | KDW Admin" description="Financial reconciliation, gateway fees, and net operating revenue" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Revenue Waterfall & Settlement Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">Exact deduction waterfall from gross captured payments through fees, refunds, and taxes.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        onRefresh={fetchRevenue}
        metadata={data?.metadata}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Captured Volume"
          value={formatCurrency(kpis.grossCaptured || 0)}
          icon={DollarSign}
          description="Total settled customer payments"
        />
        <StatCard
          title="Net Operating Revenue"
          value={formatCurrency(kpis.netOperatingRevenue || 0)}
          icon={CreditCard}
          description="Realized operating funds after fees & refunds"
        />
        <StatCard
          title="Gateway Processing Fees"
          value={formatCurrency(kpis.gatewayFees || 0)}
          icon={CreditCard}
          description="Razorpay interchange & merchant charges"
        />
        <StatCard
          title="Settlement Transferred"
          value={formatCurrency(kpis.settlementTransferred || 0)}
          icon={ShieldCheck}
          description="Bank transfers disbursed to KDW account"
        />
      </div>

      {/* Financial Waterfall Diagram */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-1">Financial Reconciliation Waterfall</h3>
        <p className="text-xs text-slate-500 mb-6">Step-by-step economics of captured funds</p>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading waterfall...
          </div>
        ) : (
          <div className="space-y-4">
            {waterfall.map((step: any, idx: number) => {
              const isTotal = step.type === 'total';
              const isNegative = step.type === 'negative';
              const isNeutral = step.type === 'neutral';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isTotal ? 'bg-slate-900 text-white border-slate-900 shadow-md' :
                    (isNegative ? 'bg-rose-50/60 text-slate-800 border-rose-100' :
                    (isNeutral ? 'bg-amber-50/60 text-slate-800 border-amber-100' : 'bg-emerald-50/60 text-slate-800 border-emerald-100'))
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                      isTotal ? 'bg-white/20 text-white' : (isNegative ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className={`font-bold text-sm block ${isTotal ? 'text-white' : 'text-slate-900'}`}>{step.step}</span>
                      <span className={`text-[11px] ${isTotal ? 'text-slate-300' : 'text-slate-500'}`}>
                        {isNegative ? 'Subtracted from captured volume' : (isTotal ? 'Final Operating Bottomline' : 'Financial component')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-black ${
                      isTotal ? 'text-emerald-400' : (isNegative ? 'text-rose-600' : 'text-slate-900')
                    }`}>
                      {isNegative ? `-${formatCurrency(step.amount)}` : formatCurrency(step.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Method Volume */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-1">Revenue by Payment Method</h3>
        <p className="text-xs text-slate-500 mb-4">Channel volume breakdown across UPI, Cards, and Netbanking</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {paymentMethods.map((pm: any, i: number) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-slate-900">{pm.method}</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{pm.sharePercent}%</span>
              </div>
              <div className="text-lg font-black text-slate-900">{formatCurrency(pm.volume)}</div>
              <div className="text-[11px] text-slate-500 mt-1">{pm.count} transactions completed</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
