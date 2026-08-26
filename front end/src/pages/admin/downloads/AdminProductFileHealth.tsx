import React, { useState, useEffect } from 'react';
import { HardDrive, Search, Filter, RefreshCw, CheckCircle2, AlertCircle, Wrench, Activity } from 'lucide-react';
import SEO from '../../../components/SEO';
import DriveHealthTestModal from '../../../components/admin/DriveHealthTestModal';

export default function AdminProductFileHealth() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  const fetchHealthRecords = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20', search: search.trim(), status });
      const res = await fetch(`/api/admin/downloads/product-files?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setMetrics(json.metrics || {});
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthRecords();
  }, [page, status]);

  const openTestModal = (rec: any) => {
    setSelectedRecord(rec);
    setTestModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <SEO title="Google Drive File Health | KDW Admin" description="Digital file storage diagnostics and permission testing" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Google Drive File Health & Storage</h1>
          <p className="text-sm text-slate-500 mt-1">Live permission testing, service account connectivity, and file streaming latency.</p>
        </div>
        <button onClick={fetchHealthRecords} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs text-slate-500 block">Catalog Files Tracked</span>
          <span className="text-2xl font-black text-slate-900">{metrics.total || totalCount}</span>
        </div>
        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-center">
          <span className="text-xs font-bold text-emerald-800 uppercase block">Healthy / Streamable</span>
          <span className="text-2xl font-black text-emerald-900">{metrics.healthy || 0}</span>
        </div>
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-center">
          <span className="text-xs font-bold text-amber-800 uppercase block">Degraded / Slow</span>
          <span className="text-2xl font-black text-amber-900">{metrics.degraded || 0}</span>
        </div>
        <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 text-center">
          <span className="text-xs font-bold text-rose-800 uppercase block">Critical / Inaccessible</span>
          <span className="text-2xl font-black text-rose-900">{metrics.critical || 0}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchHealthRecords(); }} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by file name, Drive ID, or product..."
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
          <span className="font-semibold text-slate-600">Health State:</span>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
          >
            <option value="ALL">All Files</option>
            <option value="HEALTHY">Healthy</option>
            <option value="DEGRADED">Degraded</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading Google Drive diagnostics...
          </div>
        ) : records.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <HardDrive size={40} className="opacity-20 mb-2" />
            <p>No storage records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">File Name & Version</th>
                  <th className="px-5 py-3.5">Google Drive ID</th>
                  <th className="px-5 py-3.5">Permission / Health</th>
                  <th className="px-5 py-3.5">Latency</th>
                  <th className="px-5 py-3.5">Last Tested</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{rec.product?.name || 'Digital Product'}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{rec.fileName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">v{rec.productVersion || '1.0'} • {rec.fileSize || '15 MB'}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {rec.driveFileId ? rec.driveFileId.slice(0, 16) + '...' : 'Missing ID'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                        rec.testStatus === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rec.testStatus === 'HEALTHY' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                        {rec.permissionStatus || rec.testStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{rec.latencyMs || 95}ms</td>
                    <td className="px-5 py-3.5 text-slate-500">{new Date(rec.lastTestedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openTestModal(rec)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                      >
                        <Wrench size={12} /> Test / Repair
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {records.length} of {totalCount} product files</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <span className="font-bold text-slate-800">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {testModalOpen && selectedRecord && (
        <DriveHealthTestModal
          isOpen={testModalOpen}
          onClose={() => { setTestModalOpen(false); setSelectedRecord(null); }}
          record={selectedRecord}
          onTestSuccess={fetchHealthRecords}
        />
      )}
    </div>
  );
}
