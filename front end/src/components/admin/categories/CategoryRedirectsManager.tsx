import { useState, useEffect } from 'react';
import { Shuffle, Plus, Trash2, ArrowRight, Check, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function CategoryRedirectsManager() {
  const [redirects, setRedirects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [oldPath, setOldPath] = useState('');
  const [newPath, setNewPath] = useState('');
  const [reason, setReason] = useState('');

  const fetchRedirects = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await axios.get('/api/categories/redirects', { headers });
      if (res.data.success) {
        setRedirects(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const handleCreate = async () => {
    if (!oldPath || !newPath) {
      toast.error('Old path and New path are required');
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.post('/api/categories/redirects', {
        oldPath,
        newPath,
        reason: reason || 'Category URL restructuring'
      }, { headers });

      toast.success('301 Redirect created');
      setOldPath('');
      setNewPath('');
      setReason('');
      fetchRedirects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create redirect');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.delete(`/api/categories/redirects/${id}`, { headers });
      toast.success('Redirect removed');
      fetchRedirects();
    } catch (err: any) {
      toast.error('Failed to delete redirect');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Redirect Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Category URL 301 Redirects</h3>
          <p className="text-xs text-slate-500">Prevent 404 broken links when category paths or slugs are moved or merged.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Old Path (From)</label>
            <input
              type="text"
              value={oldPath}
              onChange={(e) => setOldPath(e.target.value)}
              placeholder="/categories/old-category"
              className="w-full p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Path (To)</label>
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="/categories/new-category"
              className="w-full p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCreate}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
            >
              <Plus size={14} /> Add 301 Redirect
            </button>
          </div>
        </div>
      </div>

      {/* Redirects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
              <th className="p-3.5 pl-4">Old Path (Source)</th>
              <th className="p-3.5">New Path (Target)</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Reason</th>
              <th className="p-3.5 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Loading redirects...</td>
              </tr>
            ) : redirects.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No redirects configured yet.</td>
              </tr>
            ) : (
              redirects.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">{r.oldPath}</td>
                  <td className="p-3.5 font-mono text-emerald-700 flex items-center gap-1.5">
                    <ArrowRight size={13} className="text-slate-400" />
                    <span>{r.newPath}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {r.redirectType}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{r.reason || 'N/A'}</td>
                  <td className="p-3.5 pr-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
