import React, { useState } from 'react';
import { X, ShieldAlert, Download, CheckCircle, RefreshCw, FileText, Send, User, ShoppingBag, Lock, Activity } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

interface DisputeEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: any;
  onEvidenceSubmitted: () => void;
}

export const DisputeEvidenceModal: React.FC<DisputeEvidenceModalProps> = ({
  isOpen,
  onClose,
  dispute,
  onEvidenceSubmitted
}) => {
  const [evidenceData, setEvidenceData] = useState<any>(dispute?.evidenceData || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !dispute) return null;

  const handleGeneratePacket = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/payments/disputes/${dispute.id}/evidence`);
      if (res.data.success) {
        setEvidenceData(res.data.evidencePacket);
        toast.success('Evidence packet compiled successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assemble evidence packet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvidence = async () => {
    try {
      setSubmitting(true);
      const res = await axios.post(`/api/admin/payments/disputes/${dispute.id}/submit-evidence`);
      if (res.data.success) {
        toast.success(res.data.message || 'Evidence submitted to Razorpay!');
        onEvidenceSubmitted();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit dispute evidence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evidenceData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dispute_evidence_${dispute.razorpayDisputeId || dispute.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Dispute Evidence Dossier</h3>
              <p className="text-xs text-slate-400">Dispute ID: {dispute.razorpayDisputeId || dispute.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* Dispute Context Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Disputed Amount</p>
              <p className="text-lg font-black text-amber-900">{formatCurrency(dispute.amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Current Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200/70 text-amber-900">
                {dispute.status}
              </span>
            </div>
          </div>

          {!evidenceData ? (
            <div className="text-center py-10 space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <FileText className="mx-auto text-slate-400" size={36} />
              <div>
                <p className="text-sm font-bold text-slate-700">No Evidence Packet Generated Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Click below to compile all digital proof: customer logs, invoice, IP timestamps, and downloads.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePacket}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {loading ? 'Compiling Packet...' : 'Auto-Assemble Evidence Packet'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Evidence Sections */}
              <div className="space-y-3 text-xs">
                
                {/* 1. Customer Verification */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <User size={14} className="text-indigo-600" />
                    <span>Customer & Identity Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <p><span className="font-semibold">Name:</span> {evidenceData.customer?.name}</p>
                    <p><span className="font-semibold">Email:</span> {evidenceData.customer?.email}</p>
                    <p><span className="font-semibold">Phone:</span> {evidenceData.customer?.phone || 'N/A'}</p>
                    <p><span className="font-semibold">Account Verified:</span> {evidenceData.customer?.accountVerified ? 'Yes (Email)' : 'Guest Checkout'}</p>
                  </div>
                </div>

                {/* 2. Order & Payment Proof */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShoppingBag size={14} className="text-emerald-600" />
                    <span>Order & Gateway Transaction</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <p><span className="font-semibold">Order:</span> {evidenceData.transaction?.kdwOrderNumber}</p>
                    <p><span className="font-semibold">Razorpay ID:</span> {evidenceData.transaction?.razorpayPaymentId}</p>
                    <p><span className="font-semibold">Signature Verified:</span> {evidenceData.transaction?.signatureVerified ? 'Yes (HMAC-SHA256)' : 'No'}</p>
                    <p><span className="font-semibold">Paid Amount:</span> {formatCurrency(evidenceData.transaction?.amount)}</p>
                  </div>
                </div>

                {/* 3. Access & Download Logs */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Activity size={14} className="text-sky-600" />
                    <span>Proof of Digital Consumption & Licences</span>
                  </div>
                  <div className="text-slate-600 space-y-1">
                    <p><span className="font-semibold">Download Attempts Logged:</span> {evidenceData.proofOfAccess?.downloadAttemptsCount || 0}</p>
                    <p><span className="font-semibold">Issued Licences:</span> {evidenceData.proofOfAccess?.licenceKeysIssued?.length || 0}</p>
                    <p><span className="font-semibold">Delivery Email Status:</span> {evidenceData.digitalDelivery?.emailDeliveryStatus}</p>
                  </div>
                </div>

                {/* 4. Terms Snapshot */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Lock size={14} className="text-purple-600" />
                    <span>Checkout Terms & Refund Policy</span>
                  </div>
                  <p className="text-slate-600 italic">
                    "{evidenceData.termsAndPolicy?.refundPolicy}"
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div>
            {evidenceData && (
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                Export Evidence JSON
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSubmitEvidence}
              disabled={submitting || !evidenceData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Submitting to Gateway...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Submit Evidence to Gateway
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
