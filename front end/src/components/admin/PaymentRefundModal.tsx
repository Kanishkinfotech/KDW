import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

interface PaymentRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
  onRefundSuccess: () => void;
}

export const PaymentRefundModal: React.FC<PaymentRefundModalProps> = ({
  isOpen,
  onClose,
  payment,
  onRefundSuccess
}) => {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [accessRevoked, setAccessRevoked] = useState<boolean>(true);
  const [licenceRevoked, setLicenceRevoked] = useState<boolean>(true);
  const [isFullRefund, setIsFullRefund] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen || !payment) return null;

  const capturedAmount = payment.amount || 0;
  const alreadyRefunded = payment.refundedAmount || 0;
  const remainingRefundable = Math.max(0, capturedAmount - alreadyRefunded);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund.');
      return;
    }

    const refundAmount = isFullRefund ? remainingRefundable : parseFloat(amount);

    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.error('Please enter a valid refund amount.');
      return;
    }

    if (refundAmount > remainingRefundable + 0.01) {
      toast.error(`Refund amount cannot exceed remaining balance (${formatCurrency(remainingRefundable)}).`);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/admin/payments/refunds', {
        paymentId: payment.id,
        amount: isFullRefund ? undefined : refundAmount,
        reason: reason.trim(),
        accessRevoked,
        licenceRevoked
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Refund processed successfully!');
        onRefundSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
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
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Issue Refund</h3>
              <p className="text-xs text-slate-400">Order: {payment.order?.orderNumber || payment.orderId}</p>
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
          
          {/* Balance Context Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div>
              <p className="text-xs text-slate-500 font-medium">Original Paid</p>
              <p className="text-sm font-bold text-slate-900">{formatCurrency(capturedAmount)}</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Already Refunded</p>
              <p className="text-sm font-bold text-rose-600">{formatCurrency(alreadyRefunded)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Refundable Balance</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(remainingRefundable)}</p>
            </div>
          </div>

          {/* Refund Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Refund Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setIsFullRefund(true); setAmount(''); }}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  isFullRefund
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Full Refund ({formatCurrency(remainingRefundable)})
              </button>
              <button
                type="button"
                onClick={() => setIsFullRefund(false)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  !isFullRefund
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Partial Refund
              </button>
            </div>
          </div>

          {/* Custom Partial Amount */}
          {!isFullRefund && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Partial Refund Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={remainingRefundable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max ${remainingRefundable}`}
                  required
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Refund Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reason / Customer Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Accidental duplicate order, customer request within 24h, defective file..."
              required
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Digital Access Policy Controls */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <ShieldAlert size={16} />
              <span>Digital Entitlement & Policy Actions</span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accessRevoked}
                  onChange={(e) => setAccessRevoked(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Revoke digital download entitlements immediately</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={licenceRevoked}
                  onChange={(e) => setLicenceRevoked(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Deactivate and revoke issued licence keys</span>
              </label>
            </div>
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
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Execute Refund
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
