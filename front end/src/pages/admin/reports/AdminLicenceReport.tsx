import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Key, CheckCircle, Clock, XCircle } from 'lucide-react';
import SEO from '../../../components/SEO';
import StatCard from '../../../components/admin/StatCard';

export default function AdminLicenceReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLicences = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ status: statusFilter, search: search.trim() });
      const res = await fetch(`/api/admin/reports/licences?${query.toString()}`);
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
    fetchLicences();
  }, [statusFilter]);

  const kpis = data?.kpis || {};
  const licences = data?.licences || [];

  return (
    <div className="space-y-6">
      <SEO title="Licence & Key Analytics | KDW Admin" description="Software licence issuance, activations, and expiration monitoring" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Software Licence & Activation Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Lifecycle registry of issued digital licence keys, activations, revocations, and expiry terms.</p>
        </div>
        <button onClick={fetchLicences} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Keys Issued"
          value={kpis.totalIssued?.toLocaleString() || '0'}
          icon={Key}
          description="Issued against completed purchases"
        />
        <StatCard
          title="Active Licences"
          value={kpis.active?.toLocaleString() || '0'}
          icon={CheckCircle}
          description="Valid & authorized in circulation"
        />
        <StatCard
          title="Expired Licences"
          value={kpis.expired?.toString() || '0'}
          icon={Clock}
          description="Term expired without renewal"
        />
        <StatCard
          title="Revoked Keys"
          value={kpis.revoked?.toString() || '0'}
          icon={XCircle}
          description="Invalidated due to refund or fraud"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchLicences(); }} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by masked key or order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
          <Filter size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading licence ledger...
          </div>
        ) : licences.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <ShieldCheck size={40} className="opacity-20 mb-2" />
            <p>No licences found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Licence Key (Masked)</th>
                  <th className="px-5 py-3.5">Licence Type</th>
                  <th className="px-5 py-3.5">Customer / Order</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Issued At</th>
                  <th className="px-5 py-3.5 text-right">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {licences.map((lic: any) => (
                  <tr key={lic.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {lic.keyMasked || 'XXXX-XXXX-XXXX'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {lic.licenceType || 'STANDARD'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{lic.order?.customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400">Order #{lic.order?.orderNumber}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        lic.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        (lic.status === 'REVOKED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700')
                      }`}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{new Date(lic.issuedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600">
                      {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : 'Perpetual / Lifetime'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
