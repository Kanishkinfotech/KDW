import React, { useState, useEffect } from 'react';
import { Users, Search, CheckCircle2, XCircle, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { SupportLayout } from '../../../components/admin/support/SupportLayout';
import { SupportStatusBadge } from '../../../components/admin/support/SupportStatusBadge';

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);

      const res = await fetch(`/api/admin/support/customer-requests?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setRequests(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/support/customer-requests/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verificationMethod: 'LOGIN_CONFIRMED' })
      });
      const json = await res.json();
      if (json.success) fetchRequests();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id: string, requestType: string) => {
    const actionTaken = prompt(`Enter fulfillment note for ${requestType}:`) || 'Fulfilled as requested';
    try {
      const res = await fetch(`/api/admin/support/customer-requests/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ actionTaken })
      });
      const json = await res.json();
      if (json.success) fetchRequests();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Mandatory rejection reason:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/admin/support/customer-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (json.success) fetchRequests();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SupportLayout
      title="Customer Account & Data Requests"
      subtitle="Fulfill GDPR personal data exports, account deletions, email changes, and guest order claims."
      onRefresh={fetchRequests}
      isLoading={loading}
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Request Type</th>
              <th className="py-3.5 px-4">Identity Verification</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Requested Date</th>
              <th className="py-3.5 px-4 text-right">Fulfillment Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No customer requests pending.
                </td>
              </tr>
            ) : (
              requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div>{r.customer?.name || 'Customer'}</div>
                    <div className="text-[11px] font-normal text-slate-400">{r.customer?.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {r.requestType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {r.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <SupportStatusBadge status={r.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(r.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {r.verificationStatus !== 'VERIFIED' && (
                      <button
                        onClick={() => handleVerify(r.id)}
                        className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
                      >
                        Verify Identity
                      </button>
                    )}

                    {r.status !== 'COMPLETED' && r.status !== 'REJECTED' && (
                      <>
                        <button
                          onClick={() => handleComplete(r.id, r.requestType)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SupportLayout>
  );
}
