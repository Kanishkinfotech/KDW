import React, { useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, DollarSign, ShieldAlert, CheckCircle } from 'lucide-react';
import SEO from '../../../components/SEO';
import StatCard from '../../../components/admin/StatCard';
import ReportFilterBar from '../../../components/admin/ReportFilterBar';
import { formatCurrency } from '../../../utils/currency';

export default function AdminRefundReport() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/refunds?range=${range}`);
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
    fetchRefunds();
  }, [range]);

  const kpis = data?.kpis || {};
  const reasons = data?.reasons || [];
  const refunds = data?.refunds || [];

  return (
    <div className="space-y-6">
      <SEO title="Refund & Chargeback Analysis | KDW Admin" description="Refund reasons, impact percentages, and digital access revocation" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Refund & Dispute Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Audit of refund requests, financial impact rates, and automated entitlement revocation links.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        onRefresh={fetchRefunds}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Refund Value"
          value={formatCurrency(kpis.refundValue || 0)}
          icon={DollarSign}
          description={`${kpis.refundsCompleted || 0} refunds successfully credited`}
        />
        <StatCard
          title="Refund Impact Rate"
          value={`${kpis.refundImpactPercent || 0}%`}
          icon={AlertCircle}
          description="Percentage of gross revenue returned"
        />
        <StatCard
          title="Refund Requests Processed"
          value={kpis.refundRequests?.toString() || '0'}
          icon={RotateCcw}
          description={`${kpis.refundsApproved || 0} approved • ${kpis.refundsFailed || 0} failed`}
        />
        <StatCard
          title="Pending Entitlement Revocations"
          value={kpis.pendingAccessRevocations?.toString() || '0'}
          icon={ShieldAlert}
          description="Refunded orders awaiting license revocation"
        />
      </div>

      {/* Reasons Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-1">Top Refund Reasons</h3>
          <p className="text-xs text-slate-500 mb-4">Customer stated refund causes</p>

          <div className="space-y-3">
            {reasons.map((r: any, i: number) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{r.reason}</span>
                  <span className="text-[11px] text-slate-400">{r.count} incidents</span>
                </div>
                <span className="text-xs font-black text-rose-600">{formatCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Refund Records Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-1">Recent Refund Transactions</h3>
          <p className="text-xs text-slate-500 mb-4">Reconciled refunds and entitlement revocations</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Customer / Order</th>
                  <th className="p-2.5">Amount</th>
                  <th className="p-2.5">Access Revoked</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((ref: any) => (
                  <tr key={ref.id}>
                    <td className="p-2.5 text-slate-500">{new Date(ref.createdAt).toLocaleDateString()}</td>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{ref.order?.customer?.email || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400">{ref.order?.orderNumber}</div>
                    </td>
                    <td className="p-2.5 font-bold text-rose-600">{formatCurrency(ref.amount)}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ref.accessRevoked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ref.accessRevoked ? 'REVOKED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">{ref.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
