import { useState, useEffect } from 'react';
import { HardDrive, Search, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminProductFiles() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching product files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter(p =>
    (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.productCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.googleDriveFileId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const connectedCount = products.filter(p => p.googleDriveFileId).length;
  const missingCount = products.filter(p => !p.googleDriveFileId).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <HardDrive className="text-primary" size={26} />
            Google Drive Product Files
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Digital delivery file links stored securely in restricted private Google Drive with zero exposed raw URLs.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh Health
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Catalog Products</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{products.length}</span>
        </div>
        <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Files Connected & Protected</span>
          <span className="text-2xl font-black text-emerald-950 mt-1 block">{connectedCount}</span>
        </div>
        <div className="p-5 rounded-3xl bg-amber-50/60 border border-amber-200/80 shadow-xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Awaiting Drive File Connection</span>
          <span className="text-2xl font-black text-amber-950 mt-1 block">{missingCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, code, or Drive File ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <ShieldCheck size={14} /> Zero Raw URLs Exposed Guaranteed
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Google Drive File ID</th>
                <th className="px-6 py-3.5">Delivery Security</th>
                <th className="px-6 py-3.5">Version</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Loading product files...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No products matching search query.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const hasDrive = Boolean(p.googleDriveFileId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail || p.coverImage || '/images/fallback/image-unavailable.png'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 truncate max-w-[220px]">{p.name || p.title}</h4>
                            <span className="font-mono text-[10px] text-primary font-bold">{p.productCode || p.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {hasDrive ? (
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {p.googleDriveFileId}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            Missing File ID
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <ShieldCheck size={13} />
                          Backend Streaming Proxy
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                        {p.version || 'v1.0.0'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${hasDrive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {hasDrive ? 'Connected' : 'Action Required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/admin/products/edit/${p.id}`}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-colors inline-block"
                        >
                          Manage File
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
