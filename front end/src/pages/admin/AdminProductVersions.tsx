import { useState, useEffect } from 'react';
import { Activity, Plus, Search, GitBranch, CheckCircle2, Clock, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminProductVersions() {
  const [versions, setVersions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [versionNumber, setVersionNumber] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products/versions');
      if (res.data.success) {
        setVersions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchVersions();
    fetchProducts();
  }, []);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !versionNumber.trim()) {
      toast.error('Select a product and enter a version number');
      return;
    }

    try {
      setIsCreating(true);
      const res = await axios.post('/api/products/versions', {
        productId: selectedProduct,
        versionNumber: versionNumber.trim(),
        releaseNotes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(`Version ${versionNumber} published`);
        setVersionNumber('');
        setReleaseNotes('');
        fetchVersions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create version');
    } finally {
      setIsCreating(false);
    }
  };

  const productMap = new Map(products.map(p => [p.id, p.name || p.title]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <GitBranch className="text-primary" size={26} />
            Product Versions & Release Updates
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage semantic releases, changelogs, and update entitlements for digital assets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs h-fit space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Publish New Version
          </h3>
          <form onSubmit={handleCreateVersion} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.title} ({p.version || 'v1.0.0'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Version Number
              </label>
              <input
                type="text"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="e.g. v1.1.0 or v2.0.0"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Release Notes / Changelog
              </label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Describe new features, template updates, or bug fixes..."
                rows={3}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !selectedProduct || !versionNumber.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? 'Publishing...' : 'Publish Version Release'}
            </button>
          </form>
        </div>

        {/* Versions Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <h3 className="text-sm font-bold text-slate-900">Historical Release Log</h3>
            <span className="text-xs font-bold text-slate-500">{versions.length} Version Releases</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Version</th>
                  <th className="px-6 py-3.5">Release Notes</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      Loading release log...
                    </td>
                  </tr>
                ) : versions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No versions recorded yet. Publish your first release on the left.
                    </td>
                  </tr>
                ) : (
                  versions.map((ver) => (
                    <tr key={ver.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {productMap.get(ver.productId) || ver.productId}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-primary text-xs">
                        {ver.versionNumber}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate">
                        {ver.releaseNotes || 'No notes provided'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(ver.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          {ver.status || 'PUBLISHED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
