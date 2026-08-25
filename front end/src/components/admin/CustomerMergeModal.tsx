import { useState } from 'react';
import { X, GitMerge, AlertTriangle, Check, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CustomerMergeModalProps {
  initialMasterId?: string;
  initialDuplicateId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerMergeModal({
  initialMasterId = '',
  initialDuplicateId = '',
  onClose,
  onSuccess
}: CustomerMergeModalProps) {
  const [masterId, setMasterId] = useState(initialMasterId);
  const [duplicateId, setDuplicateId] = useState(initialDuplicateId);
  const [reason, setReason] = useState('Customer has multiple guest/account profiles with matching verified email.');
  const [loading, setLoading] = useState(false);

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterId.trim() || !duplicateId.trim()) {
      toast.error('Both Master and Duplicate Customer IDs are required.');
      return;
    }
    if (masterId.trim() === duplicateId.trim()) {
      toast.error('Master and Duplicate IDs cannot be identical.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/customers/merge', {
        masterCustomerId: masterId.trim(),
        duplicateCustomerId: duplicateId.trim(),
        reason: reason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Customers successfully merged!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Customer merge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <GitMerge className="text-primary" size={20} />
            Atomic Customer Merge
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            Important Merge Safeguards
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            All orders, entitlements, licences, download logs, support tickets, and consents from the <strong>Duplicate Record</strong> will be transactionally moved into the <strong>Master Record</strong>. The duplicate record will be marked as merged and anonymized.
          </p>
        </div>

        <form onSubmit={handleMerge} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Master Customer ID or Code (Target Record to Retain)
            </label>
            <input
              type="text"
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              placeholder="e.g. CUST-20260826-XXXXX or UUID"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="flex items-center justify-center my-1 text-slate-400">
            <ArrowRight size={18} className="rotate-90 sm:rotate-0" />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Duplicate Customer ID or Code (Record to Merge & Retire)
            </label>
            <input
              type="text"
              value={duplicateId}
              onChange={(e) => setDuplicateId(e.target.value)}
              placeholder="e.g. CUST-20260826-YYYYY or UUID"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Merge Justification / Audit Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              <GitMerge size={14} />
              {loading ? 'Merging Transactionally...' : 'Confirm & Execute Merge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
