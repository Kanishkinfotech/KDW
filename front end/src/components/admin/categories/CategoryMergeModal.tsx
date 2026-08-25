import { useState } from 'react';
import { X, GitMerge, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CategoryMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCategory: any;
  categories: any[];
  onSuccess: () => void;
}

export default function CategoryMergeModal({
  isOpen,
  onClose,
  sourceCategory,
  categories,
  onSuccess
}: CategoryMergeModalProps) {
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sourceCategory) return null;

  const validTargets = categories.filter(c => c.id !== sourceCategory.id);

  const handleMerge = async () => {
    if (!targetCategoryId) {
      toast.error('Please select a target category');
      return;
    }

    if (!window.confirm(`Are you sure you want to merge "${sourceCategory.name}" into the target category? All products and subcategories will be migrated.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.post('/api/categories/merge', {
        sourceCategoryId: sourceCategory.id,
        targetCategoryId,
        createRedirect: true
      }, { headers });

      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to merge categories');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900">
        <div className="p-4 px-6 bg-[#0B1120] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitMerge className="text-purple-400" size={18} />
            <h3 className="text-sm font-black text-white">Merge Categories</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
            <span className="text-purple-700 font-semibold block">Source Category (To be merged):</span>
            <span className="font-bold text-slate-900 text-sm">{sourceCategory.name}</span>
            <span className="font-mono text-purple-600 block text-[11px]">
              {sourceCategory.productCount || 0} products will be migrated
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Target Destination Category</label>
            <select
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="">-- Choose Target Category --</option>
              {validTargets.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.productCount || 0} products)</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 space-y-1.5">
            <span className="font-bold block">Transactional Execution Summary:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>Reassigns all active & draft products to target.</li>
              <li>Re-parents child subcategories.</li>
              <li>Creates automatic 301 SEO redirect for URLs.</li>
              <li>Archives source category safely.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={isSubmitting || !targetCategoryId}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-600/20"
          >
            {isSubmitting ? 'Merging...' : 'Execute Merge'}
          </button>
        </div>
      </div>
    </div>
  );
}
