import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export type OverrideType =
  | 'EXTEND_ACCESS'
  | 'RESET_DOWNLOAD_COUNT'
  | 'REVOKE_ACCESS'
  | 'RESTORE_ACCESS'
  | 'ASSIGN_NEW_VERSION'
  | 'CHANGE_DOWNLOAD_LIMIT'
  | 'GENERATE_TOKEN';

interface OverrideActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string; extraData?: any }) => Promise<void>;
  title: string;
  actionType: OverrideType;
  entityName: string;
  currentValue?: string | number | null;
  proposedValue?: string | number | null;
  isDestructive?: boolean;
}

export default function OverrideActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  actionType,
  entityName,
  currentValue,
  proposedValue,
  isDestructive = false
}: OverrideActionModalProps) {
  const [reason, setReason] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory administrative reason for this action.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm({
        reason: reason.trim(),
        extraData: customInput.trim() ? customInput.trim() : proposedValue
      });
      setReason('');
      setCustomInput('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to process override. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${isDestructive ? 'bg-rose-50/70 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
              {isDestructive ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDestructive ? 'text-rose-950' : 'text-slate-900'}`}>{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Target: <strong className="font-semibold text-slate-700">{entityName}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Diff / Value Comparison */}
          {(currentValue !== undefined || proposedValue !== undefined) && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Current State:</span>
                <span className="font-bold text-slate-800 text-sm">{currentValue ?? 'N/A'}</span>
              </div>
              <div className="text-slate-400 font-bold">➔</div>
              <div className="text-right">
                <span className="text-slate-500 block">Proposed State:</span>
                <span className="font-bold text-blue-600 text-sm">{proposedValue ?? (customInput || 'Modified')}</span>
              </div>
            </div>
          )}

          {/* Dynamic input for custom dates or values */}
          {actionType === 'EXTEND_ACCESS' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Expiry Date *</label>
              <input
                type="date"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {actionType === 'ASSIGN_NEW_VERSION' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Version Number *</label>
              <input
                type="text"
                placeholder="e.g. 2.0.0"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Mandatory Reason Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrative Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear justification for this action. This will be permanently written to the audit log."
              required
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">This operation will be logged with your administrator identity and timestamp.</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-primary hover:bg-primary/90 shadow-primary/20'
              } disabled:opacity-50`}
            >
              {loading ? 'Processing...' : (isDestructive ? 'Confirm & Revoke' : 'Confirm Action')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
