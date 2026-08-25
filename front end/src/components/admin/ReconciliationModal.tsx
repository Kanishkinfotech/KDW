import React, { useState } from 'react';
import { X, CheckCircle, RefreshCw, Scale, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onResolved: () => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  onClose,
  record,
  onResolved
}) => {
  const [differenceReason, setDifferenceReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!differenceReason.trim()) {
      toast.error('Please specify a justification reason for manual resolution.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`/api/admin/payments/reconciliation/${record.id}/resolve`, {
        differenceReason: differenceReason.trim(),
        notes: notes.trim()
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Reconciliation discrepancy resolved!');
        onResolved();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve reconciliation record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manual Reconciliation</h3>
              <p className="text-xs text-slate-400">Record ID: {record.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <p className="text-xs font-semibold text-slate-500">Expected Internal Amount</p>
              <p className="text-base font-bold text-slate-900">{formatCurrency(record.expectedAmount)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Actual Gateway Amount</p>
              <p className="text-base font-bold text-indigo-600">{formatCurrency(record.actualAmount)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Discrepancy Justification Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={differenceReason}
              onChange={(e) => setDifferenceReason(e.target.value)}
              placeholder="e.g., Currency FX variance, Gateway fee deduction, Offline adjustment"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Internal Audit Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide references, ticket IDs, or accounting notes..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Warning Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
            <p>
              Manual reconciliation overrides automated status checks and logs an irreversible entry into the financial audit registry.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Mark as Resolved
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
