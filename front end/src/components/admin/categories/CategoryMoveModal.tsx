import { useState } from 'react';
import { X, MoveRight, AlertTriangle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CategoryMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: any;
  categories: any[];
  onSuccess: () => void;
}

export default function CategoryMoveModal({
  isOpen,
  onClose,
  category,
  categories,
  onSuccess
}: CategoryMoveModalProps) {
  const [newParentId, setNewParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !category) return null;

  const validParents = categories.filter(c => c.id !== category.id && c.parentId !== category.id);

  const handleMove = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.post(`/api/categories/${category.id}/move`, {
        newParentId: newParentId && newParentId !== 'root' ? newParentId : null
      }, { headers });

      if (res.data.success) {
        toast.success(res.data.message || 'Category moved successfully');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to move category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900">
        <div className="p-4 px-6 bg-[#0B1120] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MoveRight className="text-amber-400" size={18} />
            <h3 className="text-sm font-black text-white">Move Category Position</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 font-semibold block">Moving Category:</span>
            <span className="font-bold text-slate-900 text-sm">{category.name}</span>
            <span className="font-mono text-slate-400 block text-[11px]">Current Path: /categories/{category.slug}</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select New Parent Category</label>
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="root">Root Category (Level 1 - Top Level)</option>
              {validParents.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.parentId ? '(Subcategory)' : '(Root)'}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Automatic 301 Redirect Protection</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Moving this category will automatically update breadcrumbs and create a permanent 301 SEO redirect for old links.
            </p>
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
            onClick={handleMove}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20"
          >
            {isSubmitting ? 'Moving...' : 'Confirm Move'}
          </button>
        </div>
      </div>
    </div>
  );
}
